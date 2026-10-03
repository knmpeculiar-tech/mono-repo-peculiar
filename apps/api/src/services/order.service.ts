import crypto from "node:crypto";
import type { Prisma } from "../../prisma/generated/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { razorpay } from "../lib/razorpay";
import { HttpError } from "../middleware/errorHandler";
import { variantDisplayName } from "./product.service";
import type { CreateOrderInput } from "../validators/order.validator";

const ORDER_INCLUDE = { items: true, payments: true } as const;

function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PEC-${datePart}-${randomPart}`;
}

// Restocks every item on an order and moves it to a terminal status. Used
// both when a Razorpay order can't be created (compensate immediately) and
// when an admin cancels an order that was never shipped.
async function restockAndSetStatus(orderId: string, status: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.update({ where: { id: orderId }, data: { status } });
  });
}

export async function createOrder(input: CreateOrderInput, profileId: string) {
  const variantIds = [...new Set(input.items.map((item) => item.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true, product: { isActive: true } },
    include: { product: true, sizeOption: true, packOption: true },
  });
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  for (const item of input.items) {
    if (!variantById.has(item.variantId)) {
      throw new HttpError(400, `Variant ${item.variantId} is not available`);
    }
  }

  // Stock is decremented with a conditional `WHERE stock >= quantity` inside
  // this transaction, so two concurrent checkouts for the last unit can
  // never both succeed — one gets a 409, the DB is the source of truth, not
  // a value read earlier in JS.
  const order = await prisma.$transaction(async (tx) => {
    let subtotalInPaise = 0;
    const itemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

    for (const item of input.items) {
      const variant = variantById.get(item.variantId)!;
      const variantName = variantDisplayName(variant);
      const decremented = await tx.productVariant.updateMany({
        where: { id: variant.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (decremented.count === 0) {
        throw new HttpError(409, `Insufficient stock for ${variantName}`);
      }

      const totalPriceInPaise = variant.priceInPaise * item.quantity;
      subtotalInPaise += totalPriceInPaise;
      itemsData.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantName,
        sku: variant.sku,
        quantity: item.quantity,
        unitPriceInPaise: variant.priceInPaise,
        totalPriceInPaise,
      });
    }

    // Flat free shipping for now — no shipping-cost rules have been
    // specified. See docs/decisions.md.
    const shippingInPaise = 0;
    const totalInPaise = subtotalInPaise + shippingInPaise;

    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        profileId,
        subtotalInPaise,
        shippingInPaise,
        totalInPaise,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        items: { create: itemsData },
      },
      include: ORDER_INCLUDE,
    });
  });

  try {
    // PAYMENTS_MOCK skips the real Razorpay API call entirely (dev/test only
    // — see docs/decisions.md) so checkout works without a real Razorpay
    // account. The mock id is never mistakable for a real one.
    const providerOrderId = env.PAYMENTS_MOCK
      ? `mock_order_${order.id}`
      : (
          await razorpay.orders.create({
            amount: order.totalInPaise,
            currency: "INR",
            receipt: order.orderNumber,
          })
        ).id;
    await prisma.payment.create({
      data: {
        orderId: order.id,
        providerOrderId,
        amountInPaise: order.totalInPaise,
        status: "created",
      },
    });
    return await getOrderById(order.id);
  } catch {
    // The DB order + stock decrement already committed. Since Razorpay
    // couldn't be initiated, this order can never be paid — restock rather
    // than hold inventory hostage, and surface a clean error to the client.
    await restockAndSetStatus(order.id, "cancelled");
    throw new HttpError(502, "Could not initiate payment, please try again");
  }
}

export function listOrdersForProfile(profileId: string) {
  return prisma.order.findMany({
    where: { profileId },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export function listAllOrders(status?: string) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export function getOrderById(id: string) {
  return prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
}

// Idempotent: called from a payment webhook/callback, which may deliver the
// same event more than once. A duplicate call for an order that already
// moved past 'pending' is a silent no-op, never an error.
export async function markOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "pending") {
    return;
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: "confirmed" } });
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function updateOrderStatus(orderId: string, nextStatus: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new HttpError(409, `Cannot move an order from ${order.status} to ${nextStatus}`);
  }

  if (nextStatus === "cancelled") {
    await restockAndSetStatus(orderId, "cancelled");
    return getOrderById(orderId);
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
    include: ORDER_INCLUDE,
  });
}

const COMMUNICATION_COLUMN = {
  confirmation: "confirmationMsgSentAt",
  dispatch: "dispatchMsgSentAt",
  delivery: "deliveryMsgSentAt",
} as const;

export type CommunicationField = keyof typeof COMMUNICATION_COLUMN;

// Independent of status (see docs/decisions.md) — sent: false clears it back
// to null rather than deleting anything, for correcting a misclick.
export async function updateOrderCommunication(
  orderId: string,
  field: CommunicationField,
  sent: boolean,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  const column = COMMUNICATION_COLUMN[field];
  return prisma.order.update({
    where: { id: orderId },
    data: { [column]: sent ? new Date() : null },
    include: ORDER_INCLUDE,
  });
}

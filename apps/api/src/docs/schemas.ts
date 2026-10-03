import { z } from "zod";
import { registry } from "./registry";

// Output shapes only (what services return), kept separate from the request
// validators in src/validators/ — those describe input, these describe
// what a client actually gets back.

export const ProductImageSchema = registry.register(
  "ProductImage",
  z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    storagePath: z.string(),
    altText: z.string().nullable(),
    sortOrder: z.number().int(),
    isPrimary: z.boolean(),
    createdAt: z.string().datetime(),
  }),
);

export const ProductVariantSchema = registry.register(
  "ProductVariant",
  z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    sizeOptionId: z.string().uuid(),
    packOptionId: z.string().uuid(),
    name: z.string().openapi({
      description: 'Computed display label: "{size} - {containerType} ({padsPerPack} pads)"',
    }),
    size: z.string().openapi({ description: "The linked size option's name" }),
    containerType: z.string().openapi({ description: "The linked pack option's name" }),
    padsPerPack: z.number().int(),
    sku: z.string(),
    priceInPaise: z.number().int().openapi({ description: "Selling price — what checkout charges" }),
    mrpInPaise: z.number().int().openapi({
      description: "Higher 'normal' price shown struck through; never charged. Always >= priceInPaise",
    }),
    stock: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const optionCount = z.object({
  _count: z.object({
    variants: z.number().int().openapi({
      description: "Variants using this option, archived ones included — delete is blocked while > 0",
    }),
  }),
});

export const SizeOptionSchema = registry.register(
  "SizeOption",
  z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      sortOrder: z.number().int(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .merge(optionCount.partial()),
);

export const PackOptionSchema = registry.register(
  "PackOption",
  z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      padsPerPack: z.number().int(),
      sortOrder: z.number().int(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .merge(optionCount.partial()),
);

export const ProductSchema = registry.register(
  "Product",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    variants: z.array(ProductVariantSchema).optional(),
    images: z.array(ProductImageSchema).optional(),
  }),
);

export const OrderItemSchema = registry.register(
  "OrderItem",
  z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    variantId: z.string().uuid(),
    productName: z.string().openapi({ description: "Snapshotted at purchase time" }),
    variantName: z.string().openapi({ description: "Snapshotted at purchase time" }),
    sku: z.string(),
    quantity: z.number().int(),
    unitPriceInPaise: z.number().int(),
    totalPriceInPaise: z.number().int(),
    createdAt: z.string().datetime(),
  }),
);

export const PaymentSchema = registry.register(
  "Payment",
  z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    provider: z.string(),
    providerOrderId: z.string().nullable(),
    providerPaymentId: z.string().nullable(),
    amountInPaise: z.number().int(),
    status: z.enum(["created", "pending", "paid", "failed", "refunded"]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

export const OrderSchema = registry.register(
  "Order",
  z.object({
    id: z.string().uuid(),
    orderNumber: z.string(),
    profileId: z
      .string()
      .uuid()
      .nullable()
      .openapi({ description: "Null only on orders placed before sign-in was required" }),
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
    customerName: z.string(),
    customerEmail: z.string().nullable(),
    customerPhone: z.string(),
    shippingAddress: z.record(z.unknown()),
    subtotalInPaise: z.number().int(),
    shippingInPaise: z.number().int(),
    totalInPaise: z.number().int(),
    confirmationMsgSentAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ description: "Set when the admin marks the WhatsApp confirmation message sent" }),
    dispatchMsgSentAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ description: "Set when the admin marks the WhatsApp dispatch message sent" }),
    deliveryMsgSentAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ description: "Set when the admin marks the WhatsApp delivery message sent" }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    items: z.array(OrderItemSchema),
    payments: z.array(PaymentSchema),
  }),
);

export const ReviewSchema = registry.register(
  "Review",
  z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    authorName: z.string(),
    rating: z.number().int().min(1).max(5),
    title: z.string(),
    body: z.string(),
    isPublished: z.boolean(),
    imagePaths: z.array(z.string()).openapi({ description: "Supabase Storage paths, max 4" }),
    videoPaths: z.array(z.string()).openapi({ description: "Supabase Storage paths, max 2" }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

export const BlogPostSchema = registry.register(
  "BlogPost",
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().nullable(),
    content: z.string(),
    coverImageUrl: z.string().nullable(),
    metaTitle: z.string().nullable(),
    metaDescription: z.string().nullable(),
    isPublished: z.boolean(),
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

export const ProfileSchema = registry.register(
  "Profile",
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string().nullable(),
    phone: z.string().nullable(),
    role: z.enum(["CUSTOMER", "ADMIN"]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

export const AdminUserListItemSchema = registry.register(
  "AdminUserListItem",
  ProfileSchema.extend({
    orderCount: z.number().int(),
  }),
);

export const AdminUserDetailSchema = registry.register(
  "AdminUserDetail",
  ProfileSchema.extend({
    orders: z.array(OrderSchema),
  }),
);

export const StatsSchema = registry.register(
  "Stats",
  z.object({
    totalOrders: z.number().int(),
    totalRevenueInPaise: z.number().int(),
    newCustomers: z.number().int(),
    totalCustomersAllTime: z.number().int(),
    ordersByStatus: z.record(z.string(), z.number().int()),
    dailySeries: z.array(
      z.object({
        date: z.string().openapi({ description: "YYYY-MM-DD" }),
        orders: z.number().int(),
        revenueInPaise: z.number().int(),
      }),
    ),
  }),
);

export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({ error: z.string() }),
);

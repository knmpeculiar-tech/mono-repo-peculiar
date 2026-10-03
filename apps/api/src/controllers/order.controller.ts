import type { NextFunction, Request, Response } from "express";
import { runIdempotentOperation } from "../lib/idempotency";
import { HttpError } from "../middleware/errorHandler";
import * as orderService from "../services/order.service";
import { orderStatusFilterSchema } from "../validators/order.validator";

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey) {
      throw new HttpError(400, "Idempotency-Key header is required");
    }

    const { status, body } = await runIdempotentOperation(
      idempotencyKey,
      "create_order",
      req.body,
      async () => {
        const order = await orderService.createOrder(req.body, req.profile!.id);
        return { status: 201, body: order };
      },
    );
    res.status(status).json(body);
  } catch (err) {
    next(err);
  }
}

export async function listMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.listOrdersForProfile(req.profile!.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// Order lookup by id is restricted to the logged-in owner or an admin.
export async function getMyOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order || order.profileId !== req.profile!.id) {
      throw new HttpError(404, "Order not found");
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function listOrdersAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = orderStatusFilterSchema.safeParse(req.query.status);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid status filter");
    }
    const orders = await orderService.listAllOrders(parsed.data);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getOrderAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      throw new HttpError(404, "Order not found");
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderCommunication(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.updateOrderCommunication(
      req.params.id,
      req.body.field,
      req.body.sent,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

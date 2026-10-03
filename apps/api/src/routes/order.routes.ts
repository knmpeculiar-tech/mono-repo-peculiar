import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createOrderSchema,
  updateOrderCommunicationSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator";

export const orderRouter = Router();

// Sign-in required — every order is tied to a real account so order history
// always works later. Guest checkout was removed after it turned out to be
// a dead end for order tracking; see docs/decisions.md.
orderRouter.post("/", requireAuth, validateBody(createOrderSchema), orderController.createOrder);
orderRouter.get("/", requireAuth, orderController.listMyOrders);
orderRouter.get("/:id", requireAuth, orderController.getMyOrder);

// Mounted under /api/admin/orders, behind requireAuth + requireAdmin (see routes/index.ts).
export const adminOrderRouter = Router();

adminOrderRouter.get("/", orderController.listOrdersAdmin);
adminOrderRouter.get("/:id", orderController.getOrderAdmin);
adminOrderRouter.patch(
  "/:id/status",
  validateBody(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);
adminOrderRouter.patch(
  "/:id/communication",
  validateBody(updateOrderCommunicationSchema),
  orderController.updateOrderCommunication,
);

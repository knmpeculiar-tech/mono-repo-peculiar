import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { getMe } from "../controllers/profile.controller";
import { getOverviewStats } from "../controllers/stats.controller";
import { adminBlogRouter, blogRouter } from "./blog.routes";
import { docsRouter } from "./docs.routes";
import { healthRouter } from "./health.routes";
import { adminPackRouter, adminSizeRouter } from "./option.routes";
import { adminOrderRouter, orderRouter } from "./order.routes";
import { paymentRouter } from "./payment.routes";
import { adminProductRouter, productRouter } from "./product.routes";
import { adminReviewRouter, reviewRouter } from "./review.routes";
import { adminUserRouter } from "./user.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/docs", docsRouter);

// Public storefront
apiRouter.use("/products", productRouter);
apiRouter.use("/", reviewRouter); // nested at /products/:productId/reviews
apiRouter.use("/blog", blogRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);

// Admin dashboard — every route here requires a logged-in admin.
const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/me", getMe); // lets the frontend confirm "am I actually an admin" before rendering the dashboard
adminRouter.get("/stats", getOverviewStats);
adminRouter.use("/products", adminProductRouter);
adminRouter.use("/sizes", adminSizeRouter);
adminRouter.use("/packs", adminPackRouter);
adminRouter.use("/reviews", adminReviewRouter);
adminRouter.use("/blog", adminBlogRouter);
adminRouter.use("/orders", adminOrderRouter);
adminRouter.use("/users", adminUserRouter);
apiRouter.use("/admin", adminRouter);

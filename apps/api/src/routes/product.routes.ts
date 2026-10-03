import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { validateBody } from "../middleware/validate";
import {
  createImageSchema,
  createProductSchema,
  setVariantsSchema,
  updateImageSchema,
  updateProductSchema,
} from "../validators/product.validator";

export const productRouter = Router();

productRouter.get("/", productController.listProducts);
productRouter.get("/:slug", productController.getProductBySlug);

// Mounted under /api/admin/products, behind requireAuth + requireAdmin (see routes/index.ts).
export const adminProductRouter = Router();

adminProductRouter.get("/", productController.listProductsAdmin);
adminProductRouter.get("/:id", productController.getProductAdmin);
adminProductRouter.post("/", validateBody(createProductSchema), productController.createProduct);
adminProductRouter.patch(
  "/:id",
  validateBody(updateProductSchema),
  productController.updateProduct,
);
adminProductRouter.delete("/:id", productController.archiveProduct);

adminProductRouter.put(
  "/:id/variants",
  validateBody(setVariantsSchema),
  productController.setVariants,
);

adminProductRouter.post(
  "/:id/images",
  validateBody(createImageSchema),
  productController.addImage,
);
adminProductRouter.patch(
  "/images/:imageId",
  validateBody(updateImageSchema),
  productController.updateImage,
);
adminProductRouter.delete("/images/:imageId", productController.deleteImage);

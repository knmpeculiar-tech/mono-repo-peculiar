import { Router } from "express";
import * as optionController from "../controllers/option.controller";
import { validateBody } from "../middleware/validate";
import {
  createPackOptionSchema,
  createSizeOptionSchema,
  updatePackOptionSchema,
  updateSizeOptionSchema,
} from "../validators/option.validator";

// Mounted under /api/admin/sizes and /api/admin/packs, behind requireAuth +
// requireAdmin (see routes/index.ts). No public routes: the storefront gets
// size/pack names already flattened onto each variant.
export const adminSizeRouter = Router();

adminSizeRouter.get("/", optionController.listSizes);
adminSizeRouter.post("/", validateBody(createSizeOptionSchema), optionController.createSize);
adminSizeRouter.patch("/:id", validateBody(updateSizeOptionSchema), optionController.updateSize);
adminSizeRouter.delete("/:id", optionController.deleteSize);

export const adminPackRouter = Router();

adminPackRouter.get("/", optionController.listPacks);
adminPackRouter.post("/", validateBody(createPackOptionSchema), optionController.createPack);
adminPackRouter.patch("/:id", validateBody(updatePackOptionSchema), optionController.updatePack);
adminPackRouter.delete("/:id", optionController.deletePack);

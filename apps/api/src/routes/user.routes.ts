import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { validateBody } from "../middleware/validate";
import { createUserSchema } from "../validators/user.validator";

// Mounted under /api/admin/users, behind requireAuth + requireAdmin (see routes/index.ts).
export const adminUserRouter = Router();

adminUserRouter.get("/", userController.listUsers);
adminUserRouter.get("/:id", userController.getUser);
adminUserRouter.post("/", validateBody(createUserSchema), userController.createUser);
adminUserRouter.delete("/:id", userController.deleteUser);

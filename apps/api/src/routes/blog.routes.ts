import { Router } from "express";
import * as blogController from "../controllers/blog.controller";
import { validateBody } from "../middleware/validate";
import { createBlogPostSchema, updateBlogPostSchema } from "../validators/blog.validator";

export const blogRouter = Router();

blogRouter.get("/", blogController.listPosts);
blogRouter.get("/:slug", blogController.getPostBySlug);

// Mounted under /api/admin/blog, behind requireAuth + requireAdmin (see routes/index.ts).
export const adminBlogRouter = Router();

adminBlogRouter.get("/", blogController.listPostsAdmin);
adminBlogRouter.get("/:id", blogController.getPostAdmin);
adminBlogRouter.post("/", validateBody(createBlogPostSchema), blogController.createPost);
adminBlogRouter.patch("/:id", validateBody(updateBlogPostSchema), blogController.updatePost);
adminBlogRouter.delete("/:id", blogController.deletePost);

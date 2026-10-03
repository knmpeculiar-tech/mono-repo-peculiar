import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler";
import * as blogService from "../services/blog.service";

export async function listPosts(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await blogService.listPublishedPosts());
  } catch (err) {
    next(err);
  }
}

export async function getPostBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.getPublishedPostBySlug(req.params.slug);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function listPostsAdmin(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await blogService.listAllPosts());
  } catch (err) {
    next(err);
  }
}

export async function getPostAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.getPostById(req.params.id);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.createPost(req.body);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.updatePost(req.params.id, req.body);
    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    await blogService.deletePost(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

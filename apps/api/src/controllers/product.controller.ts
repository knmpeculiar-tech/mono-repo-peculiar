import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler";
import * as productService from "../services/product.service";

export async function listProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const products = await productService.listPublicProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getPublicProductBySlug(req.params.slug);
    if (!product) {
      throw new HttpError(404, "Product not found");
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function listProductsAdmin(_req: Request, res: Response, next: NextFunction) {
  try {
    const products = await productService.listAdminProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getProductAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getAdminProductById(req.params.id);
    if (!product) {
      throw new HttpError(404, "Product not found");
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function archiveProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.archiveProduct(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function setVariants(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.setProductVariants(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function addImage(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await productService.addImage(req.params.id, req.body);
    res.status(201).json(image);
  } catch (err) {
    next(err);
  }
}

export async function updateImage(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await productService.updateImage(req.params.imageId, req.body);
    res.json(image);
  } catch (err) {
    next(err);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteImage(req.params.imageId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

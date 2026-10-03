import type { NextFunction, Request, Response } from "express";
import * as optionService from "../services/option.service";

export async function listSizes(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await optionService.listSizeOptions());
  } catch (err) {
    next(err);
  }
}

export async function createSize(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await optionService.createSizeOption(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateSize(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await optionService.updateSizeOption(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteSize(req: Request, res: Response, next: NextFunction) {
  try {
    await optionService.deleteSizeOption(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listPacks(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await optionService.listPackOptions());
  } catch (err) {
    next(err);
  }
}

export async function createPack(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await optionService.createPackOption(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updatePack(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await optionService.updatePackOption(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deletePack(req: Request, res: Response, next: NextFunction) {
  try {
    await optionService.deletePackOption(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

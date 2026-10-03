import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler";
import * as userService from "../services/user.service";

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.listUsers();
    res.json(
      users.map(({ _count, ...profile }) => ({ ...profile, orderCount: _count.orders })),
    );
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.deleteUser(req.params.id, req.profile!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

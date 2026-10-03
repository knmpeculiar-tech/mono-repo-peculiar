import { verifyCredentials } from "@supabase/server/core";
import type { NextFunction, Request, Response } from "express";
import type { Profile } from "../../prisma/generated/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "./errorHandler";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      profile?: Profile;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

// Verifies the JWT locally against the project's JWKS (cached in memory
// after the first fetch — no network round trip to Supabase per request,
// unlike calling supabase.auth.getUser()) and ensures a matching
// public.profiles row exists, since Supabase owns auth.users and we don't
// get a row there automatically. See docs/decisions.md.
async function verifyAndLoadProfile(token: string): Promise<Profile> {
  const { data: auth, error } = await verifyCredentials({ token, apikey: null }, { auth: "user" });
  if (error || !auth.userClaims?.email) {
    throw new HttpError(error?.status ?? 401, error?.message ?? "Invalid or expired session");
  }

  const { id, email } = auth.userClaims;

  return prisma.profile.upsert({
    where: { id },
    update: {},
    create: { id, email },
  });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new HttpError(401, "Authentication required");
    }
    req.profile = await verifyAndLoadProfile(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.profile) {
    next(new HttpError(401, "Authentication required"));
    return;
  }
  if (req.profile.role !== "ADMIN") {
    next(new HttpError(403, "Admin access required"));
    return;
  }
  next();
}

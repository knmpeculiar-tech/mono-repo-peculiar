import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../prisma/generated/client";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function fromPrismaError(err: Prisma.PrismaClientKnownRequestError): HttpError {
  switch (err.code) {
    case "P2002": {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return new HttpError(409, `A record with this ${target} already exists`);
    }
    case "P2025":
      return new HttpError(404, "Not found");
    case "P2003":
      return new HttpError(409, "This action conflicts with related records");
    case "P2023":
      // Every id column in this schema is Postgres `uuid` — a malformed id
      // anywhere (a route param, an item in a request body) fails the type
      // cast at the DB, not a "no rows" miss. Treat it as the 400 it really
      // is, not a 500 — this covers every id-bearing route uniformly rather
      // than requiring a .uuid() validator on each one individually.
      return new HttpError(400, "Invalid id format");
    default:
      return new HttpError(500, "Database error");
  }
}

// Deliberately typed with unused params (_req, _next) so Express recognizes
// this as an error-handling middleware by its 4-argument arity.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const httpError = fromPrismaError(err);
    if (httpError.statusCode >= 500) {
      // Only the well-understood codes (P2002/P2025/P2003) map to a clean
      // 4xx without detail loss — anything else lands here as a genuine
      // unknown, and swallowing it without a log makes real bugs invisible.
      console.error(err.code, err.message, err.meta);
    }
    res.status(httpError.statusCode).json({ error: httpError.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

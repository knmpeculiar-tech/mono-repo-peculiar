import crypto from "node:crypto";
import { Prisma } from "../../prisma/generated/client";
import { HttpError } from "../middleware/errorHandler";
import { prisma } from "./prisma";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

interface OperationResult<T> {
  status: number;
  body: T;
}

// Generic idempotency for any write endpoint (backed by the shared
// `idempotency_keys` table, not something specific to orders). A caller
// supplies a key; this claims it atomically via the DB unique constraint,
// runs `fn` exactly once for that key, and caches the outcome — including a
// thrown HttpError — so a retried request with the same key+payload replays
// the original response instead of repeating the operation. A key reused
// with a *different* payload is rejected as a caller error, not silently
// executed twice under one key.
export async function runIdempotentOperation<T>(
  key: string,
  operation: string,
  payload: unknown,
  fn: () => Promise<OperationResult<T>>,
): Promise<OperationResult<T>> {
  const requestHash = hashPayload(payload);

  let claimed = true;
  try {
    await prisma.idempotencyKey.create({
      data: { key, operation, requestHash, expiresAt: new Date(Date.now() + DEFAULT_TTL_MS) },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      claimed = false;
    } else {
      throw err;
    }
  }

  if (!claimed) {
    const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
    if (!existing || existing.requestHash !== requestHash) {
      throw new HttpError(409, "Idempotency-Key was already used with a different request");
    }
    if (existing.responseBody === null) {
      throw new HttpError(409, "Request already in progress, please retry shortly");
    }
    return { status: existing.responseStatus ?? 200, body: existing.responseBody as T };
  }

  try {
    const result = await fn();
    await prisma.idempotencyKey.update({
      where: { key },
      data: { responseStatus: result.status, responseBody: result.body as Prisma.InputJsonValue },
    });
    return result;
  } catch (err) {
    if (err instanceof HttpError) {
      // Cache the error outcome too — a retry with the same key+payload
      // should see the same result, not a fresh attempt.
      await prisma.idempotencyKey.update({
        where: { key },
        data: { responseStatus: err.statusCode, responseBody: { error: err.message } },
      });
      throw err;
    }
    // Unexpected failure: release the claim so a retry can genuinely
    // re-attempt instead of being stuck replaying "in progress" forever.
    await prisma.idempotencyKey.delete({ where: { key } }).catch(() => {});
    throw err;
  }
}

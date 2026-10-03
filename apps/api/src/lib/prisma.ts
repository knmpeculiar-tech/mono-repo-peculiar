// Generated with a custom `output` (see prisma/schema.prisma) rather than
// into node_modules, so it doesn't depend on pnpm's symlinked layout.
import { PrismaClient } from "../../prisma/generated/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// Reuse a single PrismaClient across hot reloads in dev to avoid exhausting
// the Postgres connection pool.
export const prisma = globalThis.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

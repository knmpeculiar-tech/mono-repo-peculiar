import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase";
import { HttpError } from "../middleware/errorHandler";
import type { CreateUserInput } from "../validators/user.validator";

const ORDER_INCLUDE = { items: true, payments: true } as const;

export function listUsers() {
  return prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
}

export function getUserById(id: string) {
  return prisma.profile.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: ORDER_INCLUDE } },
  });
}

export async function createUser(input: CreateUserInput) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    // Supabase's own error (e.g. "email already registered") is the most
    // useful message to surface; 409 is the closest matching HTTP semantics.
    throw new HttpError(409, error?.message ?? "Could not create the account");
  }

  return prisma.profile.create({
    data: {
      id: data.user.id,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
    },
  });
}

// Deletes the Supabase Auth user directly; the DB cascades to the profiles
// row and sets orders.profile_id to null on any of their past orders (their
// order history stays, just detached) — confirmed live, see docs/decisions.md.
export async function deleteUser(targetId: string, requestingProfileId: string) {
  if (targetId === requestingProfileId) {
    throw new HttpError(400, "You can't delete your own account");
  }

  const target = await prisma.profile.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new HttpError(404, "User not found");
  }

  if (target.role === "ADMIN") {
    const adminCount = await prisma.profile.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new HttpError(409, "Can't delete the last remaining admin account");
    }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);
  if (error) {
    throw new HttpError(502, error.message);
  }
}

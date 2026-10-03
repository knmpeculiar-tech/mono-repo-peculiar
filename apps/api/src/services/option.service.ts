import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import type {
  CreatePackOptionInput,
  CreateSizeOptionInput,
  UpdatePackOptionInput,
  UpdateSizeOptionInput,
} from "../validators/option.validator";

// The DB unique index is case-sensitive; this stops "medium" being added
// next to "Medium", which would look like a duplicate to the admin.
async function assertSizeNameFree(name: string, exceptId?: string) {
  const clash = await prisma.sizeOption.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      NOT: exceptId ? { id: exceptId } : undefined,
    },
  });
  if (clash) throw new HttpError(409, `A size named "${clash.name}" already exists`);
}

async function assertPackNameFree(name: string, exceptId?: string) {
  const clash = await prisma.packOption.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      NOT: exceptId ? { id: exceptId } : undefined,
    },
  });
  if (clash) throw new HttpError(409, `A pack named "${clash.name}" already exists`);
}

// variantCount includes archived variants: those still pin the option (they
// back past orders), so the admin UI can explain why delete is blocked.
export function listSizeOptions() {
  return prisma.sizeOption.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { variants: true } } },
  });
}

export async function createSizeOption(input: CreateSizeOptionInput) {
  await assertSizeNameFree(input.name);
  return prisma.sizeOption.create({ data: input });
}

export async function updateSizeOption(id: string, input: UpdateSizeOptionInput) {
  if (input.name) await assertSizeNameFree(input.name, id);
  return prisma.sizeOption.update({ where: { id }, data: input });
}

export async function deleteSizeOption(id: string) {
  const used = await prisma.productVariant.count({ where: { sizeOptionId: id } });
  if (used > 0) {
    throw new HttpError(
      409,
      `This size is used by ${used} variant(s), including archived ones kept for order ` +
        "history, so it can't be deleted. Untick it on the product instead.",
    );
  }
  await prisma.sizeOption.delete({ where: { id } });
}

export function listPackOptions() {
  return prisma.packOption.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { variants: true } } },
  });
}

export async function createPackOption(input: CreatePackOptionInput) {
  await assertPackNameFree(input.name);
  return prisma.packOption.create({ data: input });
}

export async function updatePackOption(id: string, input: UpdatePackOptionInput) {
  if (input.name) await assertPackNameFree(input.name, id);
  return prisma.packOption.update({ where: { id }, data: input });
}

export async function deletePackOption(id: string) {
  const used = await prisma.productVariant.count({ where: { packOptionId: id } });
  if (used > 0) {
    throw new HttpError(
      409,
      `This pack is used by ${used} variant(s), including archived ones kept for order ` +
        "history, so it can't be deleted. Untick it on the product instead.",
    );
  }
  await prisma.packOption.delete({ where: { id } });
}

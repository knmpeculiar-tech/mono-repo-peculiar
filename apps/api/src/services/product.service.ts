import type { PackOption, Prisma, ProductVariant, SizeOption } from "../../prisma/generated/client";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase";
import { HttpError } from "../middleware/errorHandler";
import type {
  CreateImageInput,
  CreateProductInput,
  SetVariantsInput,
  UpdateImageInput,
  UpdateProductInput,
} from "../validators/product.validator";

const MAX_IMAGES_PER_PRODUCT = 4;
// Must match the bucket apps/web uploads to (lib/storage.ts).
const PRODUCT_IMAGES_BUCKET = "product-images";

// Sizes/packs are listed in the admin's chosen order, so the storefront's
// pills come out as e.g. Small, Medium, Large rather than creation order.
const VARIANT_QUERY = {
  include: { sizeOption: true, packOption: true },
  orderBy: [{ sizeOption: { sortOrder: "asc" } }, { packOption: { sortOrder: "asc" } }],
} satisfies Prisma.ProductVariantFindManyArgs;

const PUBLIC_INCLUDE = {
  variants: { ...VARIANT_QUERY, where: { isActive: true } },
  images: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

const ADMIN_INCLUDE = {
  variants: VARIANT_QUERY,
  images: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

type VariantWithOptions = ProductVariant & { sizeOption: SizeOption; packOption: PackOption };

export function variantDisplayName(variant: { sizeOption: SizeOption; packOption: PackOption }) {
  const { sizeOption, packOption } = variant;
  return `${sizeOption.name} - ${packOption.name} (${packOption.padsPerPack} pads)`;
}

// Flattens the option relations into the shape the storefront and admin
// already consume (size/containerType/name as plain strings).
function toVariantResponse(variant: VariantWithOptions) {
  const { sizeOption, packOption, ...rest } = variant;
  return {
    ...rest,
    name: variantDisplayName(variant),
    size: sizeOption.name,
    containerType: packOption.name,
    padsPerPack: packOption.padsPerPack,
  };
}

function toProductResponse<T extends { variants: VariantWithOptions[] }>(product: T) {
  return { ...product, variants: product.variants.map(toVariantResponse) };
}

export async function listPublicProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: PUBLIC_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return products.map(toProductResponse);
}

export async function getPublicProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: PUBLIC_INCLUDE,
  });
  return product && toProductResponse(product);
}

export async function listAdminProducts() {
  const products = await prisma.product.findMany({
    include: ADMIN_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return products.map(toProductResponse);
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: ADMIN_INCLUDE,
  });
  return product && toProductResponse(product);
}

export function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return prisma.product.update({ where: { id }, data: input });
}

// Soft delete only: variants are referenced by historical OrderItems, so a
// hard delete would either fail (FK restrict) or destroy order history.
// Hiding via isActive is reversible and keeps past orders intact.
export function archiveProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

// Replaces the product's whole size x pack grid in one transaction: listed
// combinations are created or updated (and un-archived); existing ones not
// listed are archived, never deleted, since past orders reference them.
export async function setProductVariants(productId: string, input: SetVariantsInput) {
  const sizeIds = [...new Set(input.variants.map((row) => row.sizeOptionId))];
  const packIds = [...new Set(input.variants.map((row) => row.packOptionId))];

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const [sizeCount, packCount] = await Promise.all([
      tx.sizeOption.count({ where: { id: { in: sizeIds } } }),
      tx.packOption.count({ where: { id: { in: packIds } } }),
    ]);
    if (sizeCount !== sizeIds.length || packCount !== packIds.length) {
      throw new HttpError(400, "Unknown size or pack — it may have been deleted, reload and retry");
    }

    const existing = await tx.productVariant.findMany({ where: { productId } });
    const comboKey = (v: { sizeOptionId: string; packOptionId: string }) =>
      `${v.sizeOptionId}:${v.packOptionId}`;
    const existingByCombo = new Map(existing.map((v) => [comboKey(v), v]));

    // Archive dropped combinations first, so a SKU moved from a dropped
    // combination to a new one doesn't collide with itself.
    const listedCombos = new Set(input.variants.map(comboKey));
    for (const variant of existing) {
      if (!listedCombos.has(comboKey(variant)) && variant.isActive) {
        await tx.productVariant.update({ where: { id: variant.id }, data: { isActive: false } });
      }
    }

    for (const row of input.variants) {
      const match = existingByCombo.get(comboKey(row));
      if (match) {
        await tx.productVariant.update({
          where: { id: match.id },
          data: {
            sku: row.sku,
            priceInPaise: row.priceInPaise,
            mrpInPaise: row.mrpInPaise,
            isActive: true,
            ...(row.stock !== undefined ? { stock: row.stock } : {}),
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            sizeOptionId: row.sizeOptionId,
            packOptionId: row.packOptionId,
            sku: row.sku,
            priceInPaise: row.priceInPaise,
            mrpInPaise: row.mrpInPaise,
            stock: row.stock ?? 0,
          },
        });
      }
    }
  });

  return getAdminProductById(productId);
}

// Client-side enforces the same cap on the file picker — this is the real
// boundary (a second admin tab, or a client bug, can't bypass it).
export async function addImage(productId: string, input: CreateImageInput) {
  const existingCount = await prisma.productImage.count({ where: { productId } });
  if (existingCount >= MAX_IMAGES_PER_PRODUCT) {
    throw new HttpError(409, `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images`);
  }
  return prisma.productImage.create({ data: { ...input, productId } });
}

export function updateImage(imageId: string, input: UpdateImageInput) {
  return prisma.productImage.update({ where: { id: imageId }, data: input });
}

// The row goes first: that's what the storefront reads, so it's what has to
// succeed. The Storage file is cleanup — if removing it fails, the image is
// already gone from the site and an orphaned file is harmless, so log it
// rather than failing a delete the admin already sees as done.
export async function deleteImage(imageId: string) {
  const image = await prisma.productImage.delete({ where: { id: imageId } });
  const { error } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([image.storagePath]);
  if (error) {
    console.error(`Deleted image ${imageId} but couldn't remove ${image.storagePath}:`, error);
  }
  return image;
}

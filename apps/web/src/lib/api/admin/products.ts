import type { Product, ProductImage } from "@/types/api";
import { apiFetch } from "@/lib/api/client";

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
}
export type UpdateProductInput = Partial<CreateProductInput> & { isActive?: boolean };

export interface VariantRowInput {
  sizeOptionId: string;
  packOptionId: string;
  sku: string;
  priceInPaise: number;
  mrpInPaise: number;
  /** Omit to leave an existing variant's stock as-is (see the API's setVariantsSchema). */
  stock?: number;
}

export interface CreateImageInput {
  storagePath: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}
export type UpdateImageInput = Partial<CreateImageInput>;

export function listAdminProducts(accessToken?: string | null) {
  return apiFetch<Product[]>("/admin/products", { accessToken });
}

export function getAdminProduct(id: string, accessToken?: string | null) {
  return apiFetch<Product>(`/admin/products/${id}`, { accessToken });
}

export function createProduct(input: CreateProductInput, accessToken?: string | null) {
  return apiFetch<Product>("/admin/products", { method: "POST", body: input, accessToken });
}

export function updateProduct(id: string, input: UpdateProductInput, accessToken?: string | null) {
  return apiFetch<Product>(`/admin/products/${id}`, { method: "PATCH", body: input, accessToken });
}

export function archiveProduct(id: string, accessToken?: string | null) {
  return apiFetch<Product>(`/admin/products/${id}`, { method: "DELETE", accessToken });
}

// Replaces the whole size x pack grid: listed combinations go live, any
// existing variant not listed is archived.
export function setVariants(
  productId: string,
  variants: VariantRowInput[],
  accessToken?: string | null,
) {
  return apiFetch<Product>(`/admin/products/${productId}/variants`, {
    method: "PUT",
    body: { variants },
    accessToken,
  });
}

export function addImage(productId: string, input: CreateImageInput, accessToken?: string | null) {
  return apiFetch<ProductImage>(`/admin/products/${productId}/images`, {
    method: "POST",
    body: input,
    accessToken,
  });
}

export function updateImage(imageId: string, input: UpdateImageInput, accessToken?: string | null) {
  return apiFetch<ProductImage>(`/admin/products/images/${imageId}`, {
    method: "PATCH",
    body: input,
    accessToken,
  });
}

export function deleteImage(imageId: string, accessToken?: string | null) {
  return apiFetch<void>(`/admin/products/images/${imageId}`, { method: "DELETE", accessToken });
}

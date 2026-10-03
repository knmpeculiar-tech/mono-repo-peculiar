import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Resolves a Supabase Storage object path (ProductImage.storagePath from the
// API) to a public URL. The bucket is public (created by the api's
// 20260928110000_product_images_bucket migration).
export function resolveStorageUrl(storagePath: string, bucket = "product-images"): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

// Uploads a product image from the admin dashboard and returns the
// storagePath to register via POST /admin/products/:id/images. Client-side
// only (uses the browser Supabase client, which carries the admin's own
// session — a Storage policy only lets admins upload, so a customer's session
// is rejected here even though they're signed in; see docs/decisions.md).
export async function uploadProductImage(file: File, productId: string, bucket = "product-images") {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const path = `${productId}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) {
    throw new Error(error.message);
  }
  return path;
}

// Uploads a review's image/video from the admin dashboard and returns the
// storagePath to include directly in POST/PATCH /admin/reviews (imagePaths /
// videoPaths are plain array fields, not a nested resource, so there's no
// separate "register" call the way product images have). Reuses the
// "product-images" bucket under a reviews/ prefix rather than asking for a
// second bucket — see docs/decisions.md. `token` is a client-generated id
// (the review's real id once it exists, or a draft uuid before it does).
export async function uploadReviewMedia(
  file: File,
  token: string,
  kind: "images" | "videos",
  bucket = "product-images",
) {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const path = `reviews/${token}/${kind}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) {
    throw new Error(error.message);
  }
  return path;
}

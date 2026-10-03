"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api/client";
import { addImage, createProduct, updateProduct } from "@/lib/api/admin/products";
import { uploadProductImage } from "@/lib/storage";
import { productFormSchema } from "@/lib/validation/admin";
import type { Product } from "@/types/api";

const MAX_NEW_IMAGES = 4;

// The actual submit button lives in the page's AdminPageHeader (top-right,
// via a plain `<button form="product-form">` — no client state needed
// there); double-submit is guarded here with a ref instead.
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({
    type: "idle",
  });

  // Create-mode only — editing a product's images happens on the detail page's
  // ImagesPanel instead (append-more-later path, unaffected by this).
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    if (newImages.length + files.length > MAX_NEW_IMAGES) {
      setImageError(`You can attach at most ${MAX_NEW_IMAGES} images.`);
      return;
    }
    setImageError(null);
    setNewImages((prev) => [...prev, ...files]);
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  }

  // One object URL per selected file, recomputed only when the file list
  // itself changes (not on every keystroke elsewhere in the form) and
  // revoked on cleanup — createObjectURL inline in JSX would mint a new,
  // never-revoked URL on every render.
  const newImagePreviews = useMemo(() => newImages.map((file) => URL.createObjectURL(file)), [newImages]);
  useEffect(() => {
    return () => {
      for (const url of newImagePreviews) URL.revokeObjectURL(url);
    };
  }, [newImagePreviews]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmittingRef.current) return;

    const result = productFormSchema.safeParse({ name, slug, description, isActive });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    isSubmittingRef.current = true;
    setStatus({ type: "idle" });
    try {
      const input = {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || undefined,
      };
      if (product) {
        await updateProduct(product.id, { ...input, isActive: result.data.isActive });
        setStatus({ type: "success", message: "Saved." });
        router.refresh();
      } else {
        const created = await createProduct(input);
        for (let index = 0; index < newImages.length; index += 1) {
          const storagePath = await uploadProductImage(newImages[index], created.id);
          await addImage(created.id, { storagePath, sortOrder: index, isPrimary: index === 0 });
        }
        router.push(`/admin/products/${created.id}`);
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong.",
      });
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="product-name" className="text-caption mb-1 block">
            Name
          </label>
          <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name ? <p className="text-danger text-caption mt-1">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="product-slug" className="text-caption mb-1 block">
            Slug
          </label>
          <Input id="product-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          {errors.slug ? <p className="text-danger text-caption mt-1">{errors.slug}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="product-description" className="text-caption mb-1 block">
            Description
          </label>
          <Textarea
            id="product-description"
            rows={4}
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {product ? (
          <div className="sm:col-span-2">
            <Checkbox
              id="product-isActive"
              label="Active (visible in the storefront)"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>
        ) : null}
      </div>

      {!product ? (
        <div className="border-border bg-surface rounded-lg border p-5">
          <label htmlFor="product-images" className="text-caption mb-1 block">
            Images (optional, up to {MAX_NEW_IMAGES})
          </label>
          <input
            id="product-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesSelected}
            disabled={newImages.length >= MAX_NEW_IMAGES}
            className="text-caption block"
          />
          {imageError ? <p className="text-danger text-caption mt-1">{imageError}</p> : null}
          {newImages.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {newImages.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative">
                  <Image
                    src={newImagePreviews[index]}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="border-border h-16 w-16 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="bg-danger text-danger-foreground absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {status.type === "success" ? <p className="text-success text-caption">{status.message}</p> : null}
      {status.type === "error" ? <p className="text-danger text-caption">{status.message}</p> : null}
    </form>
  );
}

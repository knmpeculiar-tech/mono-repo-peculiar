"use client";

import { errorMessage, useFormPending, useToast } from "@/components/admin/feedback/AdminFeedback";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaField } from "@/components/admin/MediaField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { addImage, createProduct, updateProduct } from "@/lib/api/admin/products";
import { uploadProductImage } from "@/lib/storage";
import { productFormSchema } from "@/lib/validation/admin";
import type { Product } from "@/types/api";

const MAX_NEW_IMAGES = 4;

// The Save button lives in the page header (SaveButton, form="product-form"); this
// form reports pending via useFormPending so that button shows progress, and
// results go to toasts. The ref still guards Enter-key double submits.
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const setPending = useFormPending("product-form");
  const toast = useToast();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create-mode only — editing a product's images happens on the detail page's
  // ImagesPanel instead (append-more-later path, unaffected by this).
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  function handleImagesSelected(files: File[]) {
    if (newImages.length + files.length > MAX_NEW_IMAGES) {
      setImageError(
        `You can attach at most ${MAX_NEW_IMAGES} images — ${MAX_NEW_IMAGES - newImages.length} more allowed.`,
      );
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
      toast.error("Fix the highlighted fields first.");
      return;
    }
    setErrors({});
    isSubmittingRef.current = true;
    setPending(true);
    try {
      const input = {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || undefined,
      };
      if (product) {
        await updateProduct(product.id, { ...input, isActive: result.data.isActive });
        toast.success("Product saved");
        router.refresh();
      } else {
        const created = await createProduct(input);
        for (let index = 0; index < newImages.length; index += 1) {
          const storagePath = await uploadProductImage(newImages[index], created.id);
          await addImage(created.id, { storagePath, sortOrder: index, isPrimary: index === 0 });
        }
        toast.success("Product created");
        router.push(`/admin/products/${created.id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save. Please try again."));
    } finally {
      isSubmittingRef.current = false;
      setPending(false);
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
          <MediaField
            label="Product photos"
            hint="Optional — you can also add them later. The first photo is the primary one. JPG, PNG or WebP."
            kind="image"
            max={MAX_NEW_IMAGES}
            error={imageError}
            onFilesSelected={handleImagesSelected}
            items={newImagePreviews.map((url, index) => ({
              key: url,
              src: url,
              removeLabel: `Remove photo ${index + 1}`,
              onRemove: () => removeNewImage(index),
            }))}
          />
        </div>
      ) : null}
    </form>
  );
}

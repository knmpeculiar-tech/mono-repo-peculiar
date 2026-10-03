"use client";

import Image from "next/image";
import { type ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { addImage, deleteImage, updateImage } from "@/lib/api/admin/products";
import { resolveStorageUrl, uploadProductImage } from "@/lib/storage";
import type { ProductImage } from "@/types/api";

export function ImagesPanel({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const storagePath = await uploadProductImage(file, productId);
      await addImage(productId, {
        storagePath,
        sortOrder: images.length,
        isPrimary: images.length === 0,
      });
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't upload the image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetPrimary(image: ProductImage) {
    try {
      await updateImage(image.id, { isPrimary: true });
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Couldn't update the image.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteImage(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Couldn't delete the image.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-3">Images</h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Uploading…" : "Upload image"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
      {errorMessage ? <p className="text-danger text-caption">{errorMessage}</p> : null}
      {images.length === 0 ? (
        <p className="text-caption">
          No images yet. This product falls back to a placeholder photo on the storefront until one
          is uploaded.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="border-border flex flex-col gap-2 rounded-lg border p-2">
              <div className="bg-surface-muted relative aspect-square overflow-hidden rounded-md">
                <Image
                  src={resolveStorageUrl(image.storagePath)}
                  alt={image.altText ?? ""}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              {image.isPrimary ? (
                <span className="text-caption text-brand font-medium">Primary</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(image)}
                  className="text-caption hover:text-brand text-left"
                >
                  Set as primary
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(image)}
                className="text-caption text-danger text-left"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete this image?">
        <p className="text-body mb-4">This can&apos;t be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

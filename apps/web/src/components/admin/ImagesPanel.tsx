"use client";

import Image from "next/image";
import { errorMessage, useToast } from "@/components/admin/feedback/AdminFeedback";
import { ConfirmDialog } from "@/components/admin/feedback/ConfirmDialog";
import { type ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { addImage, deleteImage, updateImage } from "@/lib/api/admin/products";
import { resolveStorageUrl, uploadProductImage } from "@/lib/storage";
import type { ProductImage } from "@/types/api";

export function ImagesPanel({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const storagePath = await uploadProductImage(file, productId);
      await addImage(productId, {
        storagePath,
        sortOrder: images.length,
        isPrimary: images.length === 0,
      });
      toast.success("Image uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload the image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetPrimary(image: ProductImage) {
    try {
      await updateImage(image.id, { isPrimary: true });
      toast.success("Main image updated");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the image."));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteImage(deleteTarget.id);
    router.refresh();
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
                  // Same fit as the storefront, so the admin sees what customers see.
                  className="object-contain"
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
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this image?"
        confirmLabel="Delete image"
        pendingLabel="Deleting…"
        successMessage="Image deleted"
        onConfirm={handleDelete}
      >
        This can&apos;t be undone.
      </ConfirmDialog>
    </div>
  );
}

"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api/client";
import { createReview, updateReview } from "@/lib/api/admin/reviews";
import { resolveStorageUrl, uploadReviewMedia } from "@/lib/storage";
import { reviewFormSchema } from "@/lib/validation/admin";
import type { Product, Review } from "@/types/api";

const MAX_IMAGES = 4;
const MAX_VIDEOS = 2;

// One object URL per file, recomputed only when the file list changes (not
// on every keystroke elsewhere in the form) and revoked on cleanup.
function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => {
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [urls]);
  return urls;
}

// The actual submit button lives in the page's AdminPageHeader (top-right,
// via a plain `<button form="review-form">` — no client state needed
// there); double-submit is guarded here with a ref instead.
export function ReviewForm({
  products,
  review,
}: {
  products: Pick<Product, "id" | "name">[];
  review?: Review;
}) {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const [productId, setProductId] = useState(review?.productId ?? products[0]?.id ?? "");
  const [authorName, setAuthorName] = useState(review?.authorName ?? "");
  const [rating, setRating] = useState(review ? String(review.rating) : "5");
  const [title, setTitle] = useState(review?.title ?? "");
  const [body, setBody] = useState(review?.body ?? "");
  const [isPublished, setIsPublished] = useState(review?.isPublished ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({
    type: "idle",
  });

  // The real review id once it exists (edit mode), or a draft id used purely
  // as a Storage folder token before the review is created — see
  // uploadReviewMedia in lib/storage.ts.
  const [uploadToken] = useState(() => review?.id ?? crypto.randomUUID());
  const [existingImagePaths, setExistingImagePaths] = useState(review?.imagePaths ?? []);
  const [existingVideoPaths, setExistingVideoPaths] = useState(review?.videoPaths ?? []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const newImagePreviews = useObjectUrls(newImageFiles);
  const newVideoPreviews = useObjectUrls(newVideoFiles);

  function handleFilesSelected(
    event: ChangeEvent<HTMLInputElement>,
    kind: "images" | "videos",
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    const existing = kind === "images" ? existingImagePaths.length : existingVideoPaths.length;
    const pending = kind === "images" ? newImageFiles.length : newVideoFiles.length;
    const max = kind === "images" ? MAX_IMAGES : MAX_VIDEOS;
    if (existing + pending + files.length > max) {
      setMediaError(`You can attach at most ${max} ${kind}.`);
      return;
    }
    setMediaError(null);
    if (kind === "images") {
      setNewImageFiles((prev) => [...prev, ...files]);
    } else {
      setNewVideoFiles((prev) => [...prev, ...files]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmittingRef.current) return;

    const result = reviewFormSchema.safeParse({
      productId,
      authorName,
      rating,
      title,
      body,
      isPublished,
    });
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
      const uploadedImagePaths = await Promise.all(
        newImageFiles.map((file) => uploadReviewMedia(file, uploadToken, "images")),
      );
      const uploadedVideoPaths = await Promise.all(
        newVideoFiles.map((file) => uploadReviewMedia(file, uploadToken, "videos")),
      );
      const payload = {
        ...result.data,
        imagePaths: [...existingImagePaths, ...uploadedImagePaths],
        videoPaths: [...existingVideoPaths, ...uploadedVideoPaths],
      };
      if (review) {
        await updateReview(review.id, payload);
        setExistingImagePaths(payload.imagePaths);
        setExistingVideoPaths(payload.videoPaths);
        setNewImageFiles([]);
        setNewVideoFiles([]);
        setStatus({ type: "success", message: "Saved." });
        router.refresh();
      } else {
        await createReview(payload);
        router.push("/admin/reviews");
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
    <form id="review-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="review-product" className="text-caption mb-1 block">
            Product
          </label>
          <Select id="review-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          {errors.productId ? <p className="text-danger text-caption mt-1">{errors.productId}</p> : null}
        </div>
        <div>
          <label htmlFor="review-rating" className="text-caption mb-1 block">
            Rating
          </label>
          <Select id="review-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value === 1 ? "" : "s"}
              </option>
            ))}
          </Select>
          {errors.rating ? <p className="text-danger text-caption mt-1">{errors.rating}</p> : null}
        </div>
        <div>
          <label htmlFor="review-author" className="text-caption mb-1 block">
            Author name
          </label>
          <Input id="review-author" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          {errors.authorName ? <p className="text-danger text-caption mt-1">{errors.authorName}</p> : null}
        </div>
        <div>
          <label htmlFor="review-title" className="text-caption mb-1 block">
            Title
          </label>
          <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          {errors.title ? <p className="text-danger text-caption mt-1">{errors.title}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="review-body" className="text-caption mb-1 block">
            Review text
          </label>
          <Textarea id="review-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          {errors.body ? <p className="text-danger text-caption mt-1">{errors.body}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <Checkbox
            id="review-isPublished"
            label="Published (visible on the product page)"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </div>
      </div>

      <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="review-images" className="text-caption mb-1 block">
            Images (optional, up to {MAX_IMAGES})
          </label>
          <input
            id="review-images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFilesSelected(e, "images")}
            disabled={existingImagePaths.length + newImageFiles.length >= MAX_IMAGES}
            className="text-caption block"
          />
          {(existingImagePaths.length > 0 || newImageFiles.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {existingImagePaths.map((path, index) => (
                <div key={path} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small admin-only thumbnail, not worth next/image's remote-pattern config for this */}
                  <img
                    src={resolveStorageUrl(path)}
                    alt=""
                    className="border-border h-16 w-16 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setExistingImagePaths((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Remove image ${index + 1}`}
                    className="bg-danger text-danger-foreground absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newImagePreviews.map((url, index) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image doesn't apply */}
                  <img src={url} alt="" className="border-border h-16 w-16 rounded-md border object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewImageFiles((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Remove new image ${index + 1}`}
                    className="bg-danger text-danger-foreground absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="review-videos" className="text-caption mb-1 block">
            Videos (optional, up to {MAX_VIDEOS})
          </label>
          <input
            id="review-videos"
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => handleFilesSelected(e, "videos")}
            disabled={existingVideoPaths.length + newVideoFiles.length >= MAX_VIDEOS}
            className="text-caption block"
          />
          {(existingVideoPaths.length > 0 || newVideoFiles.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {existingVideoPaths.map((path, index) => (
                <div key={path} className="relative">
                  <video src={resolveStorageUrl(path)} className="h-24 w-32 rounded-md" controls />
                  <button
                    type="button"
                    onClick={() => setExistingVideoPaths((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Remove video ${index + 1}`}
                    className="bg-danger text-danger-foreground absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newVideoPreviews.map((url, index) => (
                <div key={url} className="relative">
                  <video src={url} className="h-24 w-32 rounded-md" controls />
                  <button
                    type="button"
                    onClick={() => setNewVideoFiles((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Remove new video ${index + 1}`}
                    className="bg-danger text-danger-foreground absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {mediaError ? <p className="text-danger text-caption sm:col-span-2">{mediaError}</p> : null}
      </div>

      {status.type === "success" ? <p className="text-success text-caption">{status.message}</p> : null}
      {status.type === "error" ? <p className="text-danger text-caption">{status.message}</p> : null}
    </form>
  );
}

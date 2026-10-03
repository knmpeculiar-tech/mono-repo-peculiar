"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage, useFormPending, useToast } from "@/components/admin/feedback/AdminFeedback";
import { useRouter } from "next/navigation";
import { MediaField } from "@/components/admin/MediaField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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

// The Save button lives in the page header (SaveButton, form="review-form"); this
// form reports pending via useFormPending so that button shows progress, and
// results go to toasts. The ref still guards Enter-key double submits.
export function ReviewForm({
  products,
  review,
}: {
  products: Pick<Product, "id" | "name">[];
  review?: Review;
}) {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const setPending = useFormPending("review-form");
  const toast = useToast();
  const [productId, setProductId] = useState(review?.productId ?? products[0]?.id ?? "");
  const [authorName, setAuthorName] = useState(review?.authorName ?? "");
  const [rating, setRating] = useState(review ? String(review.rating) : "5");
  const [title, setTitle] = useState(review?.title ?? "");
  const [body, setBody] = useState(review?.body ?? "");
  const [isPublished, setIsPublished] = useState(review?.isPublished ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // The real review id once it exists (edit mode), or a draft id used purely
  // as a Storage folder token before the review is created — see
  // uploadReviewMedia in lib/storage.ts.
  const [uploadToken] = useState(() => review?.id ?? crypto.randomUUID());
  const [existingImagePaths, setExistingImagePaths] = useState(review?.imagePaths ?? []);
  const [existingVideoPaths, setExistingVideoPaths] = useState(review?.videoPaths ?? []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const newImagePreviews = useObjectUrls(newImageFiles);
  const newVideoPreviews = useObjectUrls(newVideoFiles);

  function handleFilesSelected(files: File[], kind: "images" | "videos") {
    const existing = kind === "images" ? existingImagePaths.length : existingVideoPaths.length;
    const pending = kind === "images" ? newImageFiles.length : newVideoFiles.length;
    const max = kind === "images" ? MAX_IMAGES : MAX_VIDEOS;
    const setError = kind === "images" ? setImageError : setVideoError;
    if (existing + pending + files.length > max) {
      setError(`You can attach at most ${max} ${kind} — ${max - existing - pending} more allowed.`);
      return;
    }
    setError(null);
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
      toast.error("Fix the highlighted fields first.");
      return;
    }
    setErrors({});
    isSubmittingRef.current = true;
    setPending(true);
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
        toast.success("Review saved");
        router.refresh();
      } else {
        await createReview(payload);
        toast.success("Review created");
        router.push("/admin/reviews");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save. Please try again."));
    } finally {
      isSubmittingRef.current = false;
      setPending(false);
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

      <div className="border-border bg-surface grid gap-8 rounded-lg border p-5 sm:grid-cols-2">
        <MediaField
          label="Photos"
          hint="Optional. JPG, PNG or WebP — click or drag files here."
          kind="image"
          max={MAX_IMAGES}
          error={imageError}
          onFilesSelected={(files) => handleFilesSelected(files, "images")}
          items={[
            ...existingImagePaths.map((path, index) => ({
              key: path,
              src: resolveStorageUrl(path),
              removeLabel: `Remove photo ${index + 1}`,
              onRemove: () => {
                setExistingImagePaths((prev) => prev.filter((_, i) => i !== index));
                setImageError(null);
              },
            })),
            ...newImagePreviews.map((url, index) => ({
              key: url,
              src: url,
              removeLabel: `Remove new photo ${index + 1}`,
              onRemove: () => {
                setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
                setImageError(null);
              },
            })),
          ]}
        />
        <MediaField
          label="Videos"
          hint="Optional. MP4 plays most reliably — click or drag files here."
          kind="video"
          max={MAX_VIDEOS}
          error={videoError}
          onFilesSelected={(files) => handleFilesSelected(files, "videos")}
          items={[
            ...existingVideoPaths.map((path, index) => ({
              key: path,
              src: resolveStorageUrl(path),
              removeLabel: `Remove video ${index + 1}`,
              onRemove: () => {
                setExistingVideoPaths((prev) => prev.filter((_, i) => i !== index));
                setVideoError(null);
              },
            })),
            ...newVideoPreviews.map((url, index) => ({
              key: url,
              src: url,
              removeLabel: `Remove new video ${index + 1}`,
              onRemove: () => {
                setNewVideoFiles((prev) => prev.filter((_, i) => i !== index));
                setVideoError(null);
              },
            })),
          ]}
        />
      </div>
    </form>
  );
}

-- Admin-authored reviews can now include photos/video (see docs/decisions.md).
-- Plain arrays of Supabase Storage paths, mirroring how ProductImage.storagePath
-- already stores a bare path string — no join table needed at this scale.
ALTER TABLE "reviews" ADD COLUMN "image_paths" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "reviews" ADD COLUMN "video_paths" TEXT[] NOT NULL DEFAULT '{}';

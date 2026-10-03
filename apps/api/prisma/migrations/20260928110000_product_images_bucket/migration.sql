-- Storage for product photos and review media (uploaded straight from the
-- admin dashboard's browser session — see apps/web/src/lib/storage.ts).
-- Previously created by hand in the dashboard; kept here so any new
-- environment gets it from `prisma migrate deploy`. See docs/decisions.md.

-- Public bucket: the storefront reads images via plain public URLs, so no
-- SELECT policy is needed. 20MB cap, images and video only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 20971520, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies run as the uploading user, who can't read public.profiles
-- (RLS on, no policies), so the admin check runs as SECURITY DEFINER. It lives
-- in a `private` schema so the Data API never exposes it as an RPC endpoint.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Uploads use upsert: false, so INSERT is the only write path needed.
-- Customers can't upload even though they're "authenticated".
DROP POLICY IF EXISTS "Admins can upload to product-images" ON storage.objects;
CREATE POLICY "Admins can upload to product-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (SELECT private.is_admin()));

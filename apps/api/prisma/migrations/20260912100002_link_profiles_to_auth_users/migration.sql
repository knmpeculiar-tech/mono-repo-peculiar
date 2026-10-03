-- Manual addition: ties profiles.id to Supabase's auth.users(id). Prisma
-- doesn't manage the auth schema, so this FK is hand-written here rather
-- than modeled in schema.prisma. See docs/decisions.md.
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;

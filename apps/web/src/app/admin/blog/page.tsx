import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogTable } from "@/components/admin/BlogTable";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAdminBlogPosts } from "@/lib/api/admin/blog";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const posts = await listAdminBlogPosts(session?.access_token);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Blog"
        actions={
          <Link href="/admin/blog/new" className={buttonClassName()}>
            New post
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Write your first post to start building the blog."
          action={
            <Link href="/admin/blog/new" className={buttonClassName()}>
              New post
            </Link>
          }
        />
      ) : (
        <BlogTable posts={posts} />
      )}
    </div>
  );
}

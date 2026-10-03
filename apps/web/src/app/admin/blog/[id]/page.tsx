import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SaveButton } from "@/components/admin/feedback/SaveButton";
import { BlogForm } from "@/components/admin/BlogForm";
import { ApiError } from "@/lib/api/client";
import { getAdminBlogPost } from "@/lib/api/admin/blog";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit post" };

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let post;
  try {
    post = await getAdminBlogPost(id, session?.access_token);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title="Edit post"
        backHref="/admin/blog"
        backLabel="Blog"
        actions={
          <SaveButton form="blog-form" pendingLabel="Saving…">
            Save changes
          </SaveButton>
        }
      />
      <BlogForm post={post} />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SaveButton } from "@/components/admin/feedback/SaveButton";
import { BlogForm } from "@/components/admin/BlogForm";

export const metadata: Metadata = { title: "New post" };

export default function NewBlogPostPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title="New post"
        backHref="/admin/blog"
        backLabel="Blog"
        actions={
          <SaveButton form="blog-form" pendingLabel="Creating…">
            Create post
          </SaveButton>
        }
      />
      <BlogForm />
    </div>
  );
}

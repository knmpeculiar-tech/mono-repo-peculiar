import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogForm } from "@/components/admin/BlogForm";
import { buttonClassName } from "@/components/ui/Button";

export const metadata: Metadata = { title: "New post" };

export default function NewBlogPostPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title="New post"
        backHref="/admin/blog"
        backLabel="Blog"
        actions={
          <button type="submit" form="blog-form" className={buttonClassName()}>
            Create post
          </button>
        }
      />
      <BlogForm />
    </div>
  );
}

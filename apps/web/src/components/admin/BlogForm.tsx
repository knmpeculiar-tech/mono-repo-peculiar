"use client";

import { type FormEvent, useRef, useState } from "react";
import { errorMessage, useFormPending, useToast } from "@/components/admin/feedback/AdminFeedback";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createBlogPost, updateBlogPost } from "@/lib/api/admin/blog";
import { blogFormSchema } from "@/lib/validation/admin";
import type { BlogPost } from "@/types/api";

// The Save button lives in the page header (SaveButton, form="blog-form"); this
// form reports pending via useFormPending so that button shows progress, and
// results go to toasts. The ref still guards Enter-key double submits.
export function BlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const setPending = useFormPending("blog-form");
  const toast = useToast();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [isPublished, setIsPublished] = useState(post?.isPublished ?? false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmittingRef.current) return;

    const result = blogFormSchema.safeParse({
      title,
      slug,
      excerpt,
      content,
      coverImageUrl,
      metaTitle,
      metaDescription,
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
    const input = {
      title: result.data.title,
      slug: result.data.slug,
      excerpt: result.data.excerpt || undefined,
      content: result.data.content,
      coverImageUrl: result.data.coverImageUrl || undefined,
      metaTitle: result.data.metaTitle || undefined,
      metaDescription: result.data.metaDescription || undefined,
      isPublished: result.data.isPublished,
    };
    try {
      if (post) {
        await updateBlogPost(post.id, input);
        toast.success("Post saved");
        router.refresh();
      } else {
        const created = await createBlogPost(input);
        toast.success("Post created");
        router.push(`/admin/blog/${created.id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save. Please try again."));
    } finally {
      isSubmittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form id="blog-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="blog-title" className="text-caption mb-1 block">
            Title
          </label>
          <Input id="blog-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          {errors.title ? <p className="text-danger text-caption mt-1">{errors.title}</p> : null}
        </div>
        <div>
          <label htmlFor="blog-slug" className="text-caption mb-1 block">
            Slug
          </label>
          <Input id="blog-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          {errors.slug ? <p className="text-danger text-caption mt-1">{errors.slug}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="blog-excerpt" className="text-caption mb-1 block">
            Excerpt
          </label>
          <Textarea
            id="blog-excerpt"
            rows={2}
            value={excerpt ?? ""}
            onChange={(e) => setExcerpt(e.target.value)}
          />
          {errors.excerpt ? <p className="text-danger text-caption mt-1">{errors.excerpt}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="blog-content" className="text-caption block">
              Content (Markdown)
            </label>
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="text-caption hover:text-brand"
            >
              {showPreview ? "Edit" : "Preview"}
            </button>
          </div>
          {showPreview ? (
            <div className="border-border prose prose-headings:font-display prose-headings:text-foreground prose-a:text-brand min-h-40 max-w-none rounded-md border p-3">
              <ReactMarkdown>{content || "*Nothing to preview yet.*"}</ReactMarkdown>
            </div>
          ) : (
            <Textarea
              id="blog-content"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}
          {errors.content ? <p className="text-danger text-caption mt-1">{errors.content}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <Checkbox
            id="blog-isPublished"
            label="Published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </div>
      </div>

      <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="blog-cover" className="text-caption mb-1 block">
            Cover image URL
          </label>
          <Input id="blog-cover" value={coverImageUrl ?? ""} onChange={(e) => setCoverImageUrl(e.target.value)} />
          {errors.coverImageUrl ? <p className="text-danger text-caption mt-1">{errors.coverImageUrl}</p> : null}
        </div>
        <div>
          <label htmlFor="blog-meta-title" className="text-caption mb-1 block">
            Meta title
          </label>
          <Input
            id="blog-meta-title"
            value={metaTitle ?? ""}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
          {errors.metaTitle ? <p className="text-danger text-caption mt-1">{errors.metaTitle}</p> : null}
        </div>
        <div>
          <label htmlFor="blog-meta-description" className="text-caption mb-1 block">
            Meta description
          </label>
          <Input
            id="blog-meta-description"
            value={metaDescription ?? ""}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
          {errors.metaDescription ? (
            <p className="text-danger text-caption mt-1">{errors.metaDescription}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

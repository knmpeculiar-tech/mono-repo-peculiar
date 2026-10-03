import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { listBlogPosts } from "@/lib/api/blog";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, guides, and updates from Peculiar.",
};

export default async function BlogIndexPage() {
  const posts = await listBlogPosts(revalidate);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-heading-1 mb-8">Blog</h1>

      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Check back soon." />
      ) : (
        <ul className="flex flex-col gap-8">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="text-heading-3 group-hover:text-brand">{post.title}</h2>
                {post.excerpt ? (
                  <p className="text-body text-muted-foreground mt-1">{post.excerpt}</p>
                ) : null}
                {post.publishedAt ? (
                  <p className="text-caption mt-2">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

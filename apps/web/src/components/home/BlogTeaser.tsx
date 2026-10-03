import Link from "next/link";
import type { BlogPost } from "@/types/api";

// Renders nothing when there are no posts — a homepage teaser section with
// an empty state of its own would just be clutter.
export function BlogTeaser({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">From the blog</p>
            <h2 className="text-heading-2">Guides &amp; updates</h2>
          </div>
          <Link
            href="/blog"
            className="text-brand hidden shrink-0 text-sm font-medium hover:underline sm:inline"
          >
            View all posts
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col gap-2">
              <h3 className="text-heading-3 group-hover:text-brand text-lg">{post.title}</h3>
              {post.excerpt ? (
                <p className="text-body text-muted-foreground text-sm">{post.excerpt}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

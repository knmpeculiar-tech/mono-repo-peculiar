import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BlogPostNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <EmptyState
        title="Post not found"
        description="This post may have been unpublished or moved."
        action={
          <Link href="/blog" className={buttonClassName()}>
            Back to blog
          </Link>
        }
      />
    </div>
  );
}

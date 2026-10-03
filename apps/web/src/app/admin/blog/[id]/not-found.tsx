import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BlogPostNotFound() {
  return (
    <EmptyState
      title="Post not found"
      action={
        <Link href="/admin/blog" className={buttonClassName()}>
          Back to blog
        </Link>
      }
    />
  );
}

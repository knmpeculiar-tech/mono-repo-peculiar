import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReviewNotFound() {
  return (
    <EmptyState
      title="Review not found"
      action={
        <Link href="/admin/reviews" className={buttonClassName()}>
          Back to reviews
        </Link>
      }
    />
  );
}

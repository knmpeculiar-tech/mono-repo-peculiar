import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <EmptyState
        title="Product not found"
        description="This product may have been removed or is no longer available."
        action={
          <Link href="/" className={buttonClassName()}>
            Browse products
          </Link>
        }
      />
    </div>
  );
}

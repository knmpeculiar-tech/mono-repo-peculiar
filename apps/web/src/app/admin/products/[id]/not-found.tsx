import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProductNotFound() {
  return (
    <EmptyState
      title="Product not found"
      description="It may have been removed."
      action={
        <Link href="/admin/products" className={buttonClassName()}>
          Back to products
        </Link>
      }
    />
  );
}

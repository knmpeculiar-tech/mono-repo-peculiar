import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function OrderNotFound() {
  return (
    <EmptyState
      title="Order not found"
      action={
        <Link href="/admin/orders" className={buttonClassName()}>
          Back to orders
        </Link>
      }
    />
  );
}

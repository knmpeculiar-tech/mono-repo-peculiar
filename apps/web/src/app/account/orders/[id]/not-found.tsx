import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function OrderNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        title="Order not found"
        description="This order doesn't exist or isn't associated with your account."
        action={
          <Link href="/account/orders" className={buttonClassName()}>
            Back to your orders
          </Link>
        }
      />
    </div>
  );
}

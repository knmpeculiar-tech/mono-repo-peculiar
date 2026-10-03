import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function UserNotFound() {
  return (
    <EmptyState
      title="User not found"
      action={
        <Link href="/admin/users" className={buttonClassName()}>
          Back to users
        </Link>
      }
    />
  );
}

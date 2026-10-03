"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/feedback/ConfirmDialog";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { deleteAdminUser } from "@/lib/api/admin/users";
import type { AdminUserDetail } from "@/types/api";

export function UserDeleteButton({ user }: { user: AdminUserDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    await deleteAdminUser(user.id);
    router.push("/admin/users");
  }

  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete user
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this user?"
        confirmLabel="Delete user"
        pendingLabel="Deleting…"
        successMessage="User deleted"
        onConfirm={handleDelete}
      >
        {user.email} will be permanently deleted.{" "}
          {user.orders.length > 0
            ? `Their ${user.orders.length} past order${
                user.orders.length === 1 ? "" : "s"
              } will stay on record but no longer be linked to an account.`
            : "They have no past orders."}
      </ConfirmDialog>
    </div>
  );
}

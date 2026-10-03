"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { deleteAdminUser } from "@/lib/api/admin/users";
import type { AdminUserDetail } from "@/types/api";

export function UserDeleteButton({ user }: { user: AdminUserDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    try {
      await deleteAdminUser(user.id);
      router.push("/admin/users");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Couldn't delete this user.");
      setOpen(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete user
      </Button>
      {errorMessage ? <p className="text-danger text-caption mt-2">{errorMessage}</p> : null}
      <Modal open={open} onClose={() => setOpen(false)} title="Delete this user?">
        <p className="text-body mb-4">
          {user.email} will be permanently deleted.{" "}
          {user.orders.length > 0
            ? `Their ${user.orders.length} past order${
                user.orders.length === 1 ? "" : "s"
              } will stay on record but no longer be linked to an account.`
            : "They have no past orders."}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

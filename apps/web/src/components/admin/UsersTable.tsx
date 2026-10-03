"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { ApiError } from "@/lib/api/client";
import { deleteAdminUser } from "@/lib/api/admin/users";
import { formatIST } from "@/lib/date";
import type { AdminUserListItem } from "@/types/api";

export function UsersTable({ users }: { users: AdminUserListItem[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAdminUser(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Couldn't delete this user.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMessage ? <p className="text-danger text-caption">{errorMessage}</p> : null}
      <Table>
        <Thead>
          <Tr>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Orders</Th>
            <Th>Joined</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.email}</Td>
              <Td>{user.fullName ?? "—"}</Td>
              <Td>
                <Badge variant={user.role === "ADMIN" ? "brand" : "neutral"}>{user.role}</Badge>
              </Td>
              <Td>{user.orderCount}</Td>
              <Td className="text-muted-foreground">{formatIST(user.createdAt)}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/users/${user.id}`} className="text-brand text-sm hover:underline">
                    View
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(user)}>
                    Delete
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete this user?">
        <p className="text-body mb-4">
          {deleteTarget
            ? `${deleteTarget.email} will be permanently deleted. ${
                deleteTarget.orderCount > 0
                  ? `Their ${deleteTarget.orderCount} past order${
                      deleteTarget.orderCount === 1 ? "" : "s"
                    } will stay on record but no longer be linked to an account.`
                  : "They have no past orders."
              }`
            : ""}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
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

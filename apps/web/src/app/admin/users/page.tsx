import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UsersTable } from "@/components/admin/UsersTable";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAdminUsers } from "@/lib/api/admin/users";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const users = await listAdminUsers(session?.access_token);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Users"
        actions={
          <Link href="/admin/users/new" className={buttonClassName()}>
            New user
          </Link>
        }
      />
      {users.length === 0 ? (
        <EmptyState
          title="No users yet"
          description="Create the first user account."
          action={
            <Link href="/admin/users/new" className={buttonClassName()}>
              New user
            </Link>
          }
        />
      ) : (
        <UsersTable users={users} />
      )}
    </div>
  );
}

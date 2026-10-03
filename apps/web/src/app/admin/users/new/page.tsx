import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SaveButton } from "@/components/admin/feedback/SaveButton";
import { UserForm } from "@/components/admin/UserForm";

export const metadata: Metadata = { title: "New user" };

export default function NewUserPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <AdminPageHeader
        title="New user"
        backHref="/admin/users"
        backLabel="Users"
        actions={
          <SaveButton form="user-form" pendingLabel="Creating…">
            Create user
          </SaveButton>
        }
      />
      <UserForm />
    </div>
  );
}

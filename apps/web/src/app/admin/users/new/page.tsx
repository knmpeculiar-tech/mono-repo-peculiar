import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserForm } from "@/components/admin/UserForm";
import { buttonClassName } from "@/components/ui/Button";

export const metadata: Metadata = { title: "New user" };

export default function NewUserPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <AdminPageHeader
        title="New user"
        backHref="/admin/users"
        backLabel="Users"
        actions={
          <button type="submit" form="user-form" className={buttonClassName()}>
            Create user
          </button>
        }
      />
      <UserForm />
    </div>
  );
}

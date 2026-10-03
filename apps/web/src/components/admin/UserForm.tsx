"use client";

import { type FormEvent, useRef, useState } from "react";
import { errorMessage, useFormPending, useToast } from "@/components/admin/feedback/AdminFeedback";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createAdminUser } from "@/lib/api/admin/users";
import type { Role } from "@/types/api";

// The Save button lives in the page header (SaveButton, form="user-form"); this
// form reports pending via useFormPending so that button shows progress, and
// results go to toasts. The ref still guards Enter-key double submits.
export function UserForm() {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const setPending = useFormPending("user-form");
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmittingRef.current) return;

    const fieldErrors: Record<string, string> = {};
    if (!email.trim()) fieldErrors.email = "Email is required";
    if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters";
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error("Fix the highlighted fields first.");
      return;
    }

    isSubmittingRef.current = true;
    setPending(true);
    setErrors({});
    try {
      const created = await createAdminUser({
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
      });
      toast.success("User created");
      router.push(`/admin/users/${created.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save. Please try again."));
    } finally {
      isSubmittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="user-email" className="text-caption mb-1 block">
            Email
          </label>
          <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email ? <p className="text-danger text-caption mt-1">{errors.email}</p> : null}
        </div>
        <div>
          <label htmlFor="user-password" className="text-caption mb-1 block">
            Password
          </label>
          <Input
            id="user-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password ? <p className="text-danger text-caption mt-1">{errors.password}</p> : null}
        </div>
        <div>
          <label htmlFor="user-role" className="text-caption mb-1 block">
            Role
          </label>
          <Select id="user-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
        <div>
          <label htmlFor="user-fullName" className="text-caption mb-1 block">
            Full name (optional)
          </label>
          <Input id="user-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="user-phone" className="text-caption mb-1 block">
            Phone (optional)
          </label>
          <Input id="user-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
    </form>
  );
}

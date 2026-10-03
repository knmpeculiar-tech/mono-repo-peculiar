import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ApiError } from "@/lib/api/client";
import { getAdminMe } from "@/lib/api/admin/me";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Peculiar Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Belt-and-suspenders with proxy.ts, which already redirects a request with
  // no session at all away from /admin/**.
  if (!session) {
    redirect("/login?next=/admin");
  }

  // The real authorization boundary is requireAdmin on the API — this call is
  // what surfaces a non-admin session to the UI, instead of letting the
  // dashboard shell flash before a later request 403s.
  let profile;
  try {
    profile = await getAdminMe(session.access_token);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect("/");
    }
    throw err;
  }

  return <AdminShell email={profile.email}>{children}</AdminShell>;
}

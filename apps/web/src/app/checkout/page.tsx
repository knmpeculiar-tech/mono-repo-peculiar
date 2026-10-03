import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Belt-and-suspenders with proxy.ts, which already redirects unauthenticated
  // requests away from /checkout — sign-in is required so every order is tied
  // to a real account (see docs/decisions.md).
  if (!session) {
    redirect("/login?next=/checkout");
  }

  return <CheckoutClient />;
}

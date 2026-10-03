"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STOREFRONT_TAG } from "./storefrontTag";

// Called after every admin change that customers can see. Storefront pages are
// cached (ISR) for speed; without this they'd keep showing the old data until
// their cache window ran out — and then once more while refreshing in the
// background. updateTag (not revalidateTag) *expires* the data, so the very
// next visit renders fresh instead of serving stale once more.
//
// Server Actions are public POST endpoints, so the caller must prove it's an
// admin: the API's /admin/me checks the session token against Supabase.
export async function refreshStorefront(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) return;

  updateTag(STOREFRONT_TAG);
  revalidatePath("/", "layout");
}

import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OptionListEditor } from "@/components/admin/OptionListEditor";
import { listPackOptions, listSizeOptions } from "@/lib/api/admin/options";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sizes & packs" };

export default async function AdminOptionsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const [sizes, packs] = await Promise.all([
    listSizeOptions(session?.access_token),
    listPackOptions(session?.access_token),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <div>
        <AdminPageHeader title="Sizes & packs" backHref="/admin/products" backLabel="Products" />
        <p className="text-caption -mt-3">
          The choices every product can be sold in. Renaming one updates it on every product. Each
          product picks which of these it offers on its own edit page. A size or pack that has ever
          been used can&apos;t be deleted (past orders refer to it), so untick it on the product
          instead.
        </p>
      </div>
      <OptionListEditor kind="size" options={sizes} />
      <OptionListEditor kind="pack" options={packs} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { ApiError } from "@/lib/api/client";
import { setVariants, type VariantRowInput } from "@/lib/api/admin/products";
import { discountPercent, parseRupeesToPaise } from "@/lib/money";
import { variantRowFormSchema } from "@/lib/validation/admin";
import type { PackOption, ProductVariant, SizeOption } from "@/types/api";

interface RowState {
  enabled: boolean;
  sku: string;
  price: string;
  mrp: string;
  stock: string;
  /** Stock as loaded — stock is only sent when the admin actually changed it. */
  loadedStock: number | null;
}

type RowErrors = Partial<Record<"sku" | "priceInPaise" | "mrpInPaise" | "stock", string>>;

const comboKey = (sizeId: string, packId: string) => `${sizeId}:${packId}`;

function suggestSku(productSlug: string, size: SizeOption, pack: PackOption) {
  return `${productSlug}-${size.name}-${pack.padsPerPack}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function paiseToRupees(paise: number) {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

function newRow(productSlug: string, size: SizeOption, pack: PackOption, enabled: boolean) {
  return {
    enabled,
    sku: suggestSku(productSlug, size, pack),
    price: "",
    mrp: "",
    stock: "0",
    loadedStock: null,
  };
}

// Saved variants fill their own rows. A combination of already-offered
// sizes/packs with no variant was deliberately left out (e.g. Large sold only
// as a Jumbo Pack), so it starts unticked — otherwise it would reappear as an
// empty ticked row blocking every save. Combinations revealed by ticking a
// new size/pack in this session fall through to rowFor()'s ticked default.
function initialRows(
  variants: ProductVariant[],
  productSlug: string,
  sizes: SizeOption[],
  packs: PackOption[],
): Record<string, RowState> {
  const rows: Record<string, RowState> = {};
  const liveSizes = liveOptionIds(variants, "sizeOptionId");
  const livePacks = liveOptionIds(variants, "packOptionId");
  for (const size of sizes.filter((s) => liveSizes.has(s.id))) {
    for (const pack of packs.filter((p) => livePacks.has(p.id))) {
      rows[comboKey(size.id, pack.id)] = newRow(productSlug, size, pack, false);
    }
  }
  for (const variant of variants) {
    rows[comboKey(variant.sizeOptionId, variant.packOptionId)] = {
      enabled: variant.isActive,
      sku: variant.sku,
      price: paiseToRupees(variant.priceInPaise),
      mrp: paiseToRupees(variant.mrpInPaise),
      stock: String(variant.stock),
      loadedStock: variant.stock,
    };
  }
  return rows;
}

// Offered sizes/packs are derived from which variants are live, so there's
// one source of truth — no separate "offered sizes" setting to drift.
function liveOptionIds(variants: ProductVariant[], key: "sizeOptionId" | "packOptionId") {
  return new Set(variants.filter((v) => v.isActive).map((v) => v[key]));
}

function rupeesPreview(value: string): number | null {
  try {
    return parseRupeesToPaise(value);
  } catch {
    return null;
  }
}

export function VariantsPanel({
  productId,
  productSlug,
  variants,
  sizes,
  packs,
}: {
  productId: string;
  productSlug: string;
  variants: ProductVariant[];
  sizes: SizeOption[];
  packs: PackOption[];
}) {
  const router = useRouter();
  const [savedVariants, setSavedVariants] = useState(variants);
  const [selectedSizes, setSelectedSizes] = useState(() => liveOptionIds(variants, "sizeOptionId"));
  const [selectedPacks, setSelectedPacks] = useState(() => liveOptionIds(variants, "packOptionId"));
  const [rows, setRows] = useState(() => initialRows(variants, productSlug, sizes, packs));
  const [errors, setErrors] = useState<Record<string, RowErrors>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  const visibleSizes = sizes.filter((size) => selectedSizes.has(size.id));
  const visiblePacks = packs.filter((pack) => selectedPacks.has(pack.id));
  const combos = visibleSizes.flatMap((size) => visiblePacks.map((pack) => ({ size, pack })));

  function rowFor(size: SizeOption, pack: PackOption): RowState {
    return rows[comboKey(size.id, pack.id)] ?? newRow(productSlug, size, pack, true);
  }

  function updateRow(size: SizeOption, pack: PackOption, patch: Partial<RowState>) {
    const key = comboKey(size.id, pack.id);
    setRows((current) => ({ ...current, [key]: { ...rowFor(size, pack), ...patch } }));
    setMessage(null);
  }

  function toggle(set: Set<string>, id: string, setter: (next: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
    setMessage(null);
  }

  const liveCombos = new Set(
    savedVariants.filter((v) => v.isActive).map((v) => comboKey(v.sizeOptionId, v.packOptionId)),
  );
  const enabledCombos = new Set(
    combos
      .filter(({ size, pack }) => rowFor(size, pack).enabled)
      .map(({ size, pack }) => comboKey(size.id, pack.id)),
  );
  const willHide = [...liveCombos].filter((key) => !enabledCombos.has(key)).length;

  async function handleSave() {
    if (isSubmitting) return;
    const payload: VariantRowInput[] = [];
    const nextErrors: Record<string, RowErrors> = {};

    for (const { size, pack } of combos) {
      const row = rowFor(size, pack);
      if (!row.enabled) continue;
      const key = comboKey(size.id, pack.id);
      const result = variantRowFormSchema.safeParse({
        sku: row.sku,
        priceInPaise: row.price,
        mrpInPaise: row.mrp,
        stock: row.stock,
      });
      if (!result.success) {
        const rowErrors: RowErrors = {};
        for (const issue of result.error.issues) {
          rowErrors[issue.path[0] as keyof RowErrors] ??= issue.message;
        }
        nextErrors[key] = rowErrors;
        continue;
      }
      const stockChanged = row.loadedStock === null || result.data.stock !== row.loadedStock;
      payload.push({
        sizeOptionId: size.id,
        packOptionId: pack.id,
        sku: result.data.sku,
        priceInPaise: result.data.priceInPaise,
        mrpInPaise: result.data.mrpInPaise,
        ...(stockChanged ? { stock: result.data.stock } : {}),
      });
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage({ kind: "error", text: "Fix the highlighted rows before saving." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const product = await setVariants(productId, payload);
      // Reset from what the server actually saved, so "loaded stock" is fresh.
      setSavedVariants(product.variants);
      setRows(initialRows(product.variants, productSlug, sizes, packs));
      setMessage({ kind: "success", text: "Sizes, packs and prices saved." });
      router.refresh();
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof ApiError ? err.message : "Couldn't save. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sizes.length === 0 || packs.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-heading-3">Sizes, packs &amp; prices</h2>
        <p className="text-caption">
          Add at least one size and one pack first, in{" "}
          <Link href="/admin/products/options" className="text-brand hover:underline">
            Sizes &amp; packs
          </Link>
          .
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-heading-3">Sizes, packs &amp; prices</h2>
        <Link href="/admin/products/options" className="text-caption text-brand hover:underline">
          Manage sizes &amp; packs
        </Link>
      </div>

      <div className="border-border grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-caption mb-2 font-semibold">Sizes to sell</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {sizes.map((size) => (
              <Checkbox
                key={size.id}
                id={`size-${size.id}`}
                label={size.name}
                checked={selectedSizes.has(size.id)}
                onChange={() => toggle(selectedSizes, size.id, setSelectedSizes)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-caption mb-2 font-semibold">Packs to sell</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {packs.map((pack) => (
              <Checkbox
                key={pack.id}
                id={`pack-${pack.id}`}
                label={`${pack.name} (${pack.padsPerPack} pads)`}
                checked={selectedPacks.has(pack.id)}
                onChange={() => toggle(selectedPacks, pack.id, setSelectedPacks)}
              />
            ))}
          </div>
        </fieldset>
      </div>

      {combos.length === 0 ? (
        <p className="text-caption">
          Tick at least one size and one pack to set prices. With nothing ticked, saving hides this
          product&apos;s variants from the store.
        </p>
      ) : (
        <>
          <p className="text-caption">
            <strong>Price</strong> is what the customer pays. <strong>MRP</strong> is the higher
            normal price, shown crossed out next to it — it&apos;s never charged. Untick a row to
            stop selling just that combination.
          </p>
          <Table>
            <Thead>
              <Tr>
                <Th className="w-10">
                  <span className="sr-only">Sell</span>
                </Th>
                <Th>Variant</Th>
                <Th>SKU</Th>
                <Th>MRP (₹)</Th>
                <Th>Price (₹)</Th>
                <Th>Stock</Th>
              </Tr>
            </Thead>
            <Tbody>
              {combos.map(({ size, pack }) => {
                const key = comboKey(size.id, pack.id);
                const row = rowFor(size, pack);
                const rowErrors = errors[key] ?? {};
                const price = rupeesPreview(row.price);
                const mrp = rupeesPreview(row.mrp);
                const percent = price !== null && mrp !== null ? discountPercent(price, mrp) : null;
                const label = `${size.name}, ${pack.name}`;
                return (
                  <Tr key={key} className={`[&>td]:align-top ${row.enabled ? "" : "opacity-50"}`}>
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Sell ${label}`}
                        checked={row.enabled}
                        onChange={(e) => updateRow(size, pack, { enabled: e.target.checked })}
                        className="border-border text-brand focus:ring-brand mt-3 h-4 w-4 rounded focus:ring-2"
                      />
                    </Td>
                    <Td className="pt-4 whitespace-nowrap">
                      <span className="font-medium">{size.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {pack.name} · {pack.padsPerPack} pads
                      </span>
                    </Td>
                    <Td className="min-w-60">
                      <Input
                        aria-label={`SKU for ${label}`}
                        value={row.sku}
                        disabled={!row.enabled}
                        onChange={(e) => updateRow(size, pack, { sku: e.target.value })}
                      />
                      <FieldError message={rowErrors.sku} />
                    </Td>
                    <Td className="min-w-24">
                      <Input
                        aria-label={`MRP for ${label}`}
                        inputMode="decimal"
                        placeholder={row.enabled ? "199" : undefined}
                        value={row.mrp}
                        disabled={!row.enabled}
                        onChange={(e) => updateRow(size, pack, { mrp: e.target.value })}
                      />
                      <FieldError message={rowErrors.mrpInPaise} />
                    </Td>
                    <Td className="min-w-24">
                      <Input
                        aria-label={`Price for ${label}`}
                        inputMode="decimal"
                        placeholder={row.enabled ? "149" : undefined}
                        value={row.price}
                        disabled={!row.enabled}
                        onChange={(e) => updateRow(size, pack, { price: e.target.value })}
                      />
                      <FieldError message={rowErrors.priceInPaise} />
                      {row.enabled && percent !== null ? (
                        <p className="text-success mt-1 text-xs">{percent}% off shown</p>
                      ) : null}
                    </Td>
                    <Td className="min-w-20">
                      <Input
                        aria-label={`Stock for ${label}`}
                        inputMode="numeric"
                        value={row.stock}
                        disabled={!row.enabled}
                        onChange={(e) => updateRow(size, pack, { stock: e.target.value })}
                      />
                      <FieldError message={rowErrors.stock} />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save sizes & prices"}
        </Button>
        {willHide > 0 ? (
          <p className="text-caption">
            Saving will hide {willHide} variant{willHide === 1 ? "" : "s"} currently on sale (kept
            for order history, can be re-ticked later).
          </p>
        ) : null}
        {message ? (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`text-caption ${message.kind === "error" ? "text-danger" : "text-success"}`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-danger mt-1 text-xs">{message}</p> : null;
}

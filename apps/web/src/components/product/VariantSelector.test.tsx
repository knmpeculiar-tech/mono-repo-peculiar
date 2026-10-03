import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider } from "@/lib/cart/CartProvider";
import type { ProductVariant } from "@/types/api";
import { VariantSelector } from "./VariantSelector";

function makeVariant(overrides: Partial<ProductVariant> & Pick<ProductVariant, "id">): ProductVariant {
  return {
    productId: "p1",
    sizeOptionId: "size-1",
    packOptionId: "pack-1",
    name: "Variant",
    size: "Medium",
    containerType: "Regular Pack",
    padsPerPack: 6,
    sku: overrides.id,
    priceInPaise: 25000,
    mrpInPaise: 25000,
    stock: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// A deliberately sparse grid — no cross combinations exist. This is exactly
// the shape that deadlocked the earlier "disable on cross-mismatch" design:
// both "Large" and "Jumbo Pack" would have been disabled from the initial
// Medium+Regular selection, with no way to reach Large+Jumbo at all.
const sparseVariants: ProductVariant[] = [
  makeVariant({ id: "v1", size: "Medium", containerType: "Regular Pack", priceInPaise: 25000 }),
  makeVariant({
    id: "v2",
    size: "Large",
    containerType: "Jumbo Pack",
    padsPerPack: 12,
    priceInPaise: 40000,
    mrpInPaise: 40000,
  }),
];

function renderSelector(variants: ProductVariant[]) {
  return render(
    <CartProvider>
      <VariantSelector productSlug="pads" productName="Pads" imageUrl={null} variants={variants} />
    </CartProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("VariantSelector", () => {
  it("resolves to the first variant on initial render", () => {
    renderSelector(sparseVariants);
    expect(screen.getByText("₹250")).toBeInTheDocument();
  });

  it("never disables a pill, even on a sparse grid (no deadlock)", () => {
    renderSelector(sparseVariants);
    expect(screen.getByRole("button", { name: "Large" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^Jumbo Pack/ })).toBeEnabled();
  });

  it("snaps the other axis to a valid pairing when the current combo doesn't exist", () => {
    renderSelector(sparseVariants);

    // From Medium+Regular, clicking "Large" has no Large+Regular variant —
    // containerType should snap to "Jumbo Pack" (the only pairing for Large)
    // instead of leaving an unresolved/dead-end combination.
    fireEvent.click(screen.getByRole("button", { name: "Large" }));

    expect(screen.getByRole("button", { name: "Large" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^Jumbo Pack/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("₹400")).toBeInTheDocument();
    expect(screen.queryByText(/isn't available/i)).not.toBeInTheDocument();
  });

  it("labels each pack with its pad count", () => {
    renderSelector(sparseVariants);
    expect(screen.getByRole("button", { name: "Regular Pack · 6 pads" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jumbo Pack · 12 pads" })).toBeInTheDocument();
  });

  it("shows the struck-through MRP and % off when the MRP is higher", () => {
    renderSelector([makeVariant({ id: "v1", priceInPaise: 14900, mrpInPaise: 19900 })]);
    expect(screen.getByText("₹149")).toBeInTheDocument();
    expect(screen.getByText("₹199").tagName).toBe("S");
    expect(screen.getByText("25% off")).toBeInTheDocument();
  });

  it("shows no discount when the MRP equals the price", () => {
    renderSelector([makeVariant({ id: "v1", priceInPaise: 14900, mrpInPaise: 14900 })]);
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });

  it("disables Add to cart when the resolved variant is out of stock", () => {
    renderSelector([makeVariant({ id: "v1", stock: 0 })]);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeDisabled();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("shows an unavailable message when there are no variants at all", () => {
    renderSelector([]);
    expect(screen.getByText("Currently unavailable.")).toBeInTheDocument();
  });
});

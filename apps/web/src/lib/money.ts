// Every amount from the API is an integer number of paise (1 INR = 100 paise) —
// never a float — to avoid rounding errors. This is the one place that formats
// it for display.

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPaise(paise: number): string {
  return inrFormatter.format(paise / 100);
}

// Inverse of the above, for admin price-input forms (e.g. "250.00" -> 25000).
// Rounds rather than truncates so a display-rounded round-trip (formatPaise ->
// re-parsed) can't silently drift a rupee down. Throws on anything that isn't
// a plain non-negative decimal — callers should validate before calling this,
// this is the parse step for an already-validated string.
export function parseRupeesToPaise(input: string): number {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid rupee amount: "${input}"`);
  }
  return Math.round(Number.parseFloat(trimmed) * 100);
}

// Whole-percent discount of the selling price against the MRP, or null when
// there's nothing to show. Floors rather than rounds so the badge never
// claims a bigger discount than the customer actually gets.
export function discountPercent(priceInPaise: number, mrpInPaise: number): number | null {
  if (mrpInPaise <= priceInPaise || mrpInPaise <= 0) return null;
  const percent = Math.floor(((mrpInPaise - priceInPaise) / mrpInPaise) * 100);
  return percent > 0 ? percent : null;
}

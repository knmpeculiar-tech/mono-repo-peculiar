import { discountPercent, formatPaise } from "@/lib/money";

// Selling price, with the MRP struck through and the % saved when the MRP is
// higher. Only the selling price is ever charged.
export function PriceTag({
  priceInPaise,
  mrpInPaise,
  prefix,
  size = "md",
}: {
  priceInPaise: number;
  mrpInPaise: number;
  prefix?: string;
  size?: "sm" | "md" | "lg";
}) {
  const percent = discountPercent(priceInPaise, mrpInPaise);
  const priceClass =
    size === "lg" ? "text-heading-3" : size === "md" ? "text-body font-medium" : "text-caption";

  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`text-foreground ${priceClass}`}>
        {prefix ? `${prefix} ` : null}
        {formatPaise(priceInPaise)}
      </span>
      {percent !== null ? (
        <>
          <span className="text-muted-foreground text-sm">
            <span className="sr-only">MRP </span>
            <s>{formatPaise(mrpInPaise)}</s>
          </span>
          <span className="text-success text-sm font-medium">{percent}% off</span>
        </>
      ) : null}
    </p>
  );
}

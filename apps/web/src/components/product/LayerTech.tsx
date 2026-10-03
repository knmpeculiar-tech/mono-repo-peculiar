"use client";

import { useState } from "react";

// Facts from the client's own product infographic (public/pad_tech.webp,
// public/inside.webp). Layer 4 reads "SAP paper" here, the industry term; the
// infographic's "Swap paper" was a typo, confirmed with the client.
const LAYERS = [
  { name: "Soft top sheet", detail: "Ultra-soft and breathable, gentle on skin." },
  { name: "Anti-anion chip", detail: "Releases negative ions for freshness and comfort." },
  { name: "Gel technology layer", detail: "Super-absorbent gel locks fluid in and prevents backflow." },
  { name: "SAP paper core", detail: "Super absorbent polymer core for quick absorption and even spread." },
  { name: "Breathable bottom layer", detail: "Lets air circulate so you stay dry and fresh." },
  { name: "Adhesive backing", detail: "Holds the pad securely in place all day." },
];

const SPECS = [
  { label: "Size", value: "Medium · 240 × 70 mm" },
  { label: "Build", value: "6 layers" },
  { label: "Fit", value: "Secure wings, no shifting" },
  { label: "Wrapping", value: "Each pad individually wrapped" },
];

// Isometric projection of a flat plate: pad length runs along one axis, width
// along the other. Patterns are defined flat and inherit the projection.
const ISO = "matrix(0.866 0.5 -0.866 0.5 0 0)";
const PLATE = { x: -110, y: -52, width: 220, height: 104, rx: 30 };
const CX = 232;
const TOP_Y = 92;
const GAP = 64;
const FILLS = [
  "url(#lt-top)",
  "url(#lt-anion)",
  "url(#lt-gel)",
  "url(#lt-core)",
  "url(#lt-bottom)",
  "url(#lt-backing)",
];

export function LayerTech() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section aria-labelledby="layer-tech-heading" className="border-border mt-16 border-t pt-12">
      <div className="max-w-2xl">
        <h2 id="layer-tech-heading" className="text-heading-2">
          What&apos;s inside every pad
        </h2>
        <p className="text-body text-muted-foreground mt-3">
          Six layers, each with one job: a soft top sheet, an anti-anion chip for freshness, and a
          gel and SAP core that locks fluid away.
        </p>
      </div>

      <div className="mt-10 grid items-center gap-10 md:grid-cols-2 md:gap-12">
        <figure className="bg-surface-muted rounded-2xl px-4 py-6">
          <svg viewBox="0 0 440 520" className="mx-auto w-full max-w-md" aria-hidden="true">
            <defs>
              <pattern id="lt-top" width="9" height="9" patternUnits="userSpaceOnUse">
                <rect width="9" height="9" fill="#ffffff" />
                <circle cx="4.5" cy="4.5" r="1.2" fill="#d8cfcb" />
              </pattern>
              <pattern id="lt-anion" width="11" height="11" patternUnits="userSpaceOnUse">
                <rect width="11" height="11" fill="#f6dee8" />
                <circle cx="5.5" cy="5.5" r="3.6" fill="#e3a3bd" />
                <circle cx="4.4" cy="4.3" r="1.1" fill="#fbeff4" />
              </pattern>
              <pattern id="lt-gel" width="13" height="13" patternUnits="userSpaceOnUse">
                <rect width="13" height="13" fill="#e2eef8" />
                <circle cx="6.5" cy="6.5" r="4.6" fill="#b4d1ec" />
                <circle cx="5" cy="5" r="1.4" fill="#f4f9fd" />
              </pattern>
              <pattern id="lt-core" width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" fill="#fcfbfa" />
                <path d="M0 0L12 12M12 0L0 12" stroke="#dfd6d1" strokeWidth="1" />
              </pattern>
              <pattern id="lt-bottom" width="7" height="7" patternUnits="userSpaceOnUse">
                <rect width="7" height="7" fill="#ffffff" />
                <circle cx="3.5" cy="3.5" r="0.8" fill="#e2dad6" />
              </pattern>
              <pattern id="lt-backing" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#f7f2ef" />
              </pattern>
            </defs>

            {/* Drawn bottom-up so upper layers overlap the ones beneath. */}
            {LAYERS.map((layer, index) => index)
              .reverse()
              .map((index) => {
                const y = TOP_Y + index * GAP;
                const isActive = active === index;
                const dimmed = active !== null && !isActive;
                return (
                  <g
                    key={index}
                    className="transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none"
                    style={{
                      opacity: dimmed ? 0.28 : 1,
                      transform: isActive ? "translateX(-16px)" : "translateX(0)",
                    }}
                  >
                    <g transform={`translate(${CX} ${y + 8})`}>
                      <rect {...PLATE} transform={ISO} fill="#ddd3ce" />
                    </g>
                    <g transform={`translate(${CX} ${y})`}>
                      <rect
                        {...PLATE}
                        transform={ISO}
                        fill={FILLS[index]}
                        stroke={isActive ? "#741c47" : "#e3dbd7"}
                        strokeWidth={isActive ? 2 : 1}
                        vectorEffect="non-scaling-stroke"
                      />
                      {index === 5 ? (
                        <rect x="-70" y="-14" width="140" height="28" rx="6" transform={ISO} fill="#e7ddd6" />
                      ) : null}
                    </g>
                    <g transform={`translate(${CX - 186} ${y - 2})`}>
                      <circle r="13" fill={isActive ? "#741c47" : "#ffffff"} stroke="#741c47" strokeWidth="1.5" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="13"
                        fontWeight="600"
                        fill={isActive ? "#ffffff" : "#741c47"}
                      >
                        {index + 1}
                      </text>
                    </g>
                  </g>
                );
              })}
          </svg>
          <figcaption className="sr-only">
            Exploded view of the six layers of a Peculiar pad, listed alongside.
          </figcaption>
        </figure>

        <div>
          <ol className="flex flex-col gap-1">
            {LAYERS.map((layer, index) => {
              const isActive = active === index;
              return (
                <li key={layer.name}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(isActive ? null : index)}
                    aria-pressed={isActive}
                    className={`flex w-full items-start gap-4 rounded-xl px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-surface-muted" : "hover:bg-surface-muted"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        isActive
                          ? "bg-brand border-brand text-brand-foreground"
                          : "border-brand text-brand"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-medium">{layer.name}</span>
                      <span className="text-caption block">{layer.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <dl className="border-border mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6">
            {SPECS.map((spec) => (
              <div key={spec.label}>
                <dt className="text-caption">{spec.label}</dt>
                <dd className="text-sm font-medium">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

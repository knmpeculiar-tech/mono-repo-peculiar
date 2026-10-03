// Claims shown to customers that the client has confirmed as true (2026-10-03).
// Every trust badge on the site reads from here, so a claim can't drift out of
// sync between pages — and nothing unconfirmed belongs in this file. Notably
// NOT confirmed (so never shown): a free-shipping threshold, "Made in India",
// certifications. See docs/decisions.md.
export const BRAND_FACTS = {
  packsSold: "18,000+",
  returnWindowDays: 7,
  discreetPackaging: true,
} as const;

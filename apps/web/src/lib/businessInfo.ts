// Every business and policy fact shown on the Contact and policy pages
// (Razorpay website verification + India's Consumer Protection (E-Commerce)
// Rules, 2020). These are legal commitments: only client-confirmed values
// belong here. A `null` field is simply left off the pages — never replaced by
// a placeholder or a guessed value. See docs/decisions.md.
export const BUSINESS = {
  brandName: "Peculiar",
  /** Registered proprietorship name, exactly as on GST/Udyam/shop registration. */
  legalName: null as string | null,
  /** Proprietor's full legal name (also the default Grievance Officer). */
  proprietorName: null as string | null,
  /** Full registered address, including PIN code. */
  address: null as string | null,
  gstin: null as string | null,

  email: "pkunjanand@gmail.com",
  /** Display form; `phoneHref` is the tel: link. */
  phone: "+91 77798 11264",
  phoneHref: "+917779811264",

  shipping: {
    coverage: "all of India",
    /** e.g. "1–2 business days". Null until confirmed. */
    dispatchTime: null as string | null,
    /** e.g. "3–7 business days". Null until confirmed. */
    deliveryTime: null as string | null,
  },

  /** Damaged, defective or wrong items must be reported within this many days of delivery. */
  issueReportDays: 7,

  /** Last time any policy text changed (shown on every policy page). */
  policiesUpdated: "13 October 2026",
} as const;

/** "Peculiar" plus the registered name when known, e.g. "Peculiar (a unit of XYZ Enterprises)". */
export function businessDisplayName() {
  return BUSINESS.legalName ? `${BUSINESS.brandName} (${BUSINESS.legalName})` : BUSINESS.brandName;
}

// Every business and policy fact shown on the Contact and policy pages
// (Razorpay website verification + India's Consumer Protection (E-Commerce)
// Rules, 2020). These are legal commitments: only client-confirmed values
// belong here. A `null` field is simply left off the pages — never replaced by
// a placeholder or a guessed value. See docs/decisions.md.
export const BUSINESS = {
  brandName: "Peculiar",
  /**
   * Registered trade name, if different from the brand. For a proprietorship
   * the legal name is the proprietor's own (below), so this stays null unless
   * the GST certificate shows a separate trade name.
   */
  legalName: null as string | null,
  /** Proprietor's full legal name (also the default Grievance Officer). */
  proprietorName: "Kripanand Prasad" as string | null,
  /** Full registered address, including PIN code. */
  address: "B-230, Mandawali, Delhi – 110092" as string | null,
  gstin: "07BIMPP4508F1Z5" as string | null,

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

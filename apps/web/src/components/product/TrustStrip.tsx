import { BoxIcon, LockIcon, RefreshIcon, TruckIcon } from "@/components/icons";
import { BRAND_FACTS } from "@/lib/brandFacts";

// "Buy with confidence" reassurances right under the buy buttons, where the
// decision happens. Only confirmed facts (lib/brandFacts.ts) or things the
// system itself guarantees (Razorpay checkout, account order tracking, the
// admin's WhatsApp updates) — never a claim we can't back up.
const ITEMS = [
  {
    icon: LockIcon,
    title: "Secure payments",
    detail: "UPI, cards & netbanking via Razorpay",
  },
  {
    icon: BoxIcon,
    title: "Discreet packaging",
    detail: "Plain outer box, each pad individually wrapped",
  },
  {
    icon: RefreshIcon,
    title: `${BRAND_FACTS.returnWindowDays}-day easy returns`,
    detail: `Return within ${BRAND_FACTS.returnWindowDays} days of delivery`,
  },
  {
    icon: TruckIcon,
    title: "Track every order",
    detail: "Live status in your account, updates on WhatsApp",
  },
];

export function TrustStrip() {
  return (
    <ul aria-label="Why it's safe to buy" className="border-border grid gap-x-6 gap-y-5 border-t pt-6 sm:grid-cols-2">
      {ITEMS.map(({ icon: Icon, title, detail }) => (
        <li key={title} className="flex items-start gap-3">
          <Icon className="text-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-caption">{detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

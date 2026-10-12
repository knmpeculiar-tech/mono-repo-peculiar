import { describe, expect, it } from "vitest";
import { dropPrivate } from "./SiteAnalytics";

const event = (url: string) => ({ type: "pageview" as const, url });

describe("dropPrivate", () => {
  it("keeps shopper pages, including checkout", () => {
    for (const path of ["/", "/products/peculiar-pads", "/blog/sizing", "/checkout", "/order-confirmation/abc"]) {
      expect(dropPrivate(event(`https://peculiars.in${path}`))).not.toBeNull();
    }
  });

  it("drops admin, account, auth callback and password reset pages", () => {
    for (const path of ["/admin", "/admin/orders/1", "/account/orders", "/auth/callback?code=secret", "/reset-password"]) {
      expect(dropPrivate(event(`https://peculiars.in${path}`))).toBeNull();
    }
  });

  it("doesn't drop pages that merely start with the same letters", () => {
    expect(dropPrivate(event("https://peculiars.in/administration-guide"))).not.toBeNull();
  });
});

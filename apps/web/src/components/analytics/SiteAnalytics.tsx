"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Pages that shouldn't be reported: the admin's own visits would inflate the
// shop's numbers, and account / auth-callback / password-reset URLs can carry
// one-time sign-in codes that must not leave the site.
const PRIVATE_PATHS = ["/admin", "/account", "/auth", "/reset-password"];

function isPrivate(url: string) {
  const { pathname } = new URL(url);
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function dropPrivate<T extends { url: string }>(event: T): T | null {
  return isPrivate(event.url) ? null : event;
}

// Vercel Web Analytics (cookieless visitor/page-view counts) and Speed
// Insights (real-visitor performance). Both only send data on Vercel
// deployments; locally they do nothing.
export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={(event: BeforeSendEvent) => dropPrivate(event)} />
      <SpeedInsights beforeSend={dropPrivate} />
    </>
  );
}

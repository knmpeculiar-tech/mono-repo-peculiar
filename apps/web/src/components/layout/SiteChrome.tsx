"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

// The admin dashboard has its own sidebar/topbar chrome (app/admin/layout.tsx)
// instead of the storefront Header/Footer — a pathname check here is a much
// smaller change than moving every existing route into a (storefront) route
// group for the same effect.
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

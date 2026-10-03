"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSignOutButton } from "./AdminSignOutButton";

const COLLAPSE_STORAGE_KEY = "peculiar-admin:nav-collapsed";

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 5h14l-1.2 9.4a1.5 1.5 0 0 1-1.5 1.3H5.7a1.5 1.5 0 0 1-1.5-1.3L3 5z" strokeLinejoin="round" />
      <path d="M6.5 5V4a3.5 3.5 0 0 1 7 0v1" strokeLinecap="round" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 6.5 10 3l7 3.5-7 3.5-7-3.5z" strokeLinejoin="round" />
      <path d="M3 6.5V14l7 3.5 7-3.5V6.5" strokeLinejoin="round" />
      <path d="M10 10v7.5" />
    </svg>
  );
}

function ReviewsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5z" strokeLinejoin="round" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M6.5 7.5h7M6.5 10.5h7M6.5 13.5h4" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7.5" cy="6.5" r="2.5" />
      <path d="M2.5 16c.6-3 2.5-4.5 5-4.5s4.4 1.5 5 4.5" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2" />
      <path d="M13 11.7c2 .2 3.4 1.6 3.9 4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d={direction === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}

function SiteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 3 3 8.5 10 14l7-5.5L10 3z" strokeLinejoin="round" />
      <path d="M4 11.5 10 16l6-4.5" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: OverviewIcon, exact: true },
  { href: "/admin/orders", label: "Orders", icon: OrdersIcon, exact: false },
  { href: "/admin/products", label: "Products", icon: ProductsIcon, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: ReviewsIcon, exact: false },
  { href: "/admin/blog", label: "Blog", icon: BlogIcon, exact: false },
  { href: "/admin/users", label: "Users", icon: UsersIcon, exact: false },
];

export function AdminNav({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // localStorage only exists client-side, so this can only run post-mount
    // — a deliberate one-time hydration read, not a render loop.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable (e.g. private browsing) — stay expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // Non-fatal — just won't persist across reloads.
      }
      return next;
    });
  }

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      ) : null}
      <nav
        aria-label="Admin"
        className={`border-border bg-surface fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r p-4 transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16 md:p-2" : "md:w-56"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/admin"
            className={`font-display text-foreground text-lg font-semibold ${collapsed ? "md:hidden" : ""}`}
          >
            Peculiar Admin
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="hover:bg-surface-muted rounded-md p-1 md:hidden"
          >
            <CloseIcon />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hover:bg-surface-muted hidden rounded-md p-1.5 md:block"
          >
            <ChevronIcon direction={collapsed ? "right" : "left"} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`text-body flex items-center gap-3 rounded-md px-3 py-2 ${
                  isActive ? "bg-brand-50 text-brand-800 font-medium" : "hover:bg-surface-muted"
                } ${collapsed ? "md:justify-center md:px-2" : ""}`}
              >
                <Icon />
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-border mt-auto flex flex-col gap-1 border-t pt-3">
          <Link
            href="/"
            title={collapsed ? "Back to site" : undefined}
            className={`text-caption hover:text-brand flex items-center gap-3 rounded-md px-3 py-2 ${
              collapsed ? "md:justify-center md:px-2" : ""
            }`}
          >
            <SiteIcon />
            <span className={collapsed ? "md:hidden" : ""}>Back to site</span>
          </Link>
          <AdminSignOutButton collapsed={collapsed} />
        </div>
      </nav>
    </>
  );
}

"use client";

import { type ReactNode, useState } from "react";
import { AdminNav } from "./AdminNav";

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
    </svg>
  );
}

// Owns the mobile drawer open/close state — the one bit of interactivity the
// server-rendered admin/layout.tsx (auth checks, fetches the profile) can't
// hold itself.
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AdminNav mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-surface flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="hover:bg-surface-muted -ml-1 rounded-md p-2 md:hidden"
          >
            <MenuIcon />
          </button>
          <p className="text-caption ml-auto truncate">Signed in as {email}</p>
        </header>
        <main className="min-w-0 flex-1 bg-background p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 3.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 13.5 16 10l-3.5-3.5M16 10H7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// `collapsed` mirrors AdminNav's icon-only desktop state — hides the label
// past the md breakpoint the same way every other sidebar item does.
export function AdminSignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/login");
      }}
      title={collapsed ? "Sign out" : undefined}
      className={`text-caption hover:text-brand flex w-full items-center gap-3 rounded-md px-3 py-2 ${
        collapsed ? "md:justify-center md:px-2" : ""
      }`}
    >
      <SignOutIcon />
      <span className={collapsed ? "md:hidden" : ""}>Sign out</span>
    </button>
  );
}

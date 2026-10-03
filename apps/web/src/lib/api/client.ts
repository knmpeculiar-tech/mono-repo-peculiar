import { refreshStorefront } from "@/lib/cache/refreshStorefront";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApiErrorBody } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  /**
   * Explicit bearer token — pass this from Server Components/Route Handlers,
   * which already have the session via lib/supabase/server.ts. Passing
   * `null` explicitly sends no auth header even if a browser session exists.
   * When omitted entirely (undefined), falls back to auto-detecting the
   * current session via the browser Supabase client (Client Component use).
   */
  accessToken?: string | null;
  /** Next.js fetch caching — only meaningful for GET requests. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
}

async function resolveAuthHeader(
  explicitToken: string | null | undefined,
): Promise<Record<string, string>> {
  if (explicitToken !== undefined) {
    return explicitToken ? { Authorization: `Bearer ${explicitToken}` } : {};
  }
  if (typeof window === "undefined") {
    // Server-side caller that didn't pass an explicit token — nothing to
    // attach. Fine for the public GET endpoints (products, blog) that call
    // apiFetch this way; anything requiring auth must pass accessToken
    // explicitly (see account/orders pages) or the API rejects the request.
    return {};
  }
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  Object.assign(headers, await resolveAuthHeader(options.accessToken));

  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache,
    next: options.next,
  });

  const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data as ApiErrorBody | null)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  if (options.method && options.method !== "GET" && affectsStorefront(path)) {
    // Awaited so the admin's own next page load already sees the change; a
    // failure here mustn't turn a successful save into an error.
    await refreshStorefront().catch((err: unknown) => {
      console.warn("Saved, but the storefront cache couldn't be refreshed", err);
    });
  }

  return data as T;
}

// Admin writes that change something customers see. Orders and users don't.
const STOREFRONT_ADMIN_PATHS = [
  "/admin/products",
  "/admin/sizes",
  "/admin/packs",
  "/admin/reviews",
  "/admin/blog",
];

function affectsStorefront(path: string) {
  return (
    typeof window !== "undefined" &&
    STOREFRONT_ADMIN_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  );
}

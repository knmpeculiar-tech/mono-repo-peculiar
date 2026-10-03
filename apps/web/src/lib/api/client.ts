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
  next?: { revalidate?: number | false };
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

  if (res.status === 204) {
    return undefined as T;
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data as ApiErrorBody | null)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

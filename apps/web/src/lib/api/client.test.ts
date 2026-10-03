import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshStorefront } from "@/lib/cache/refreshStorefront";
import { ApiError, apiFetch } from "./client";

// The real Server Action needs a Next.js request (cookies); here we only care
// whether apiFetch calls it, and that a failure can't break a save.
vi.mock("@/lib/cache/refreshStorefront", () => ({ refreshStorefront: vi.fn(async () => {}) }));

// No test relies on a real browser session — every call either passes an
// explicit accessToken or expects the "no session" fallback.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
    },
  }),
}));

function mockFetchOnce(body: unknown, status: number) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(refreshStorefront).mockClear();
  });

  it("sends no Authorization header when there is no session and no accessToken is given", async () => {
    const fetchMock = mockFetchOnce({ ok: true }, 200);

    await apiFetch("/products");

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("attaches an explicit accessToken as a bearer header", async () => {
    const fetchMock = mockFetchOnce([], 200);

    await apiFetch("/orders", { accessToken: "token-123" });

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(options.headers.Authorization).toBe("Bearer token-123");
  });

  it("sends no Authorization header when accessToken is explicitly null", async () => {
    const fetchMock = mockFetchOnce([], 200);

    await apiFetch("/products", { accessToken: null });

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("attaches the Idempotency-Key header when provided", async () => {
    const fetchMock = mockFetchOnce({}, 201);

    await apiFetch("/orders", { method: "POST", idempotencyKey: "key-1", accessToken: null });

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(options.headers["Idempotency-Key"]).toBe("key-1");
  });

  it("throws ApiError with the server's message and status on failure", async () => {
    mockFetchOnce({ error: "Insufficient stock" }, 409);

    const promise = apiFetch("/orders", { accessToken: null });
    await expect(promise).rejects.toThrow("Insufficient stock");
    await promise.catch((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(409);
    });
  });

  it("returns undefined for a 204 No Content response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/admin/reviews/1", { method: "DELETE", accessToken: null });
    expect(result).toBeUndefined();
  });

  it("refreshes the storefront cache after an admin write customers can see", async () => {
    mockFetchOnce({ id: "p1" }, 200);
    await apiFetch("/admin/products/p1", { method: "PATCH", body: { name: "New" } });
    expect(refreshStorefront).toHaveBeenCalledTimes(1);
  });

  it("refreshes after a 204 delete too (e.g. removing a product image)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await apiFetch("/admin/products/images/i1", { method: "DELETE" });
    expect(refreshStorefront).toHaveBeenCalledTimes(1);
  });

  it("doesn't refresh for reads, failed writes, or admin areas customers never see", async () => {
    mockFetchOnce([], 200);
    await apiFetch("/admin/products");
    mockFetchOnce({ status: "shipped" }, 200);
    await apiFetch("/admin/orders/o1/status", { method: "PATCH", body: { status: "shipped" } });
    mockFetchOnce({ error: "Invalid" }, 400);
    await expect(apiFetch("/admin/blog", { method: "POST", body: {} })).rejects.toThrow("Invalid");
    expect(refreshStorefront).not.toHaveBeenCalled();
  });

  it("still returns the saved data when the cache refresh itself fails", async () => {
    vi.mocked(refreshStorefront).mockRejectedValueOnce(new Error("no request scope"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetchOnce({ id: "r1" }, 201);
    await expect(apiFetch("/admin/reviews", { method: "POST", body: {} })).resolves.toEqual({ id: "r1" });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "../api/client";

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns response immediately if status is not 401", async () => {
    const response = new Response(JSON.stringify({ ok: true }), { status: 200 });

    globalThis.fetch = vi.fn().mockResolvedValue(response);

    const result = await apiFetch("/test", { accessToken: "token" });

    expect(result.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries request after refresh when first response is 401", async () => {
    const first = new Response(null, { status: 401 });
    const second = new Response(JSON.stringify({ ok: true }), { status: 200 });

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    localStorage.setItem("access_token", "new-token");

    const refresh = vi.fn().mockResolvedValue(true);

    const result = await apiFetch("/test", { accessToken: "old-token" }, refresh);

    expect(refresh).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(200);
  });

  it("does not retry if refresh fails", async () => {
    const first = new Response(null, { status: 401 });

    globalThis.fetch = vi.fn().mockResolvedValue(first);

    const refresh = vi.fn().mockResolvedValue(false);

    const result = await apiFetch("/test", { accessToken: "old-token" }, refresh);

    expect(refresh).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(401);
  });
});
import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/client";
afterEach(() => vi.unstubAllGlobals());
describe("API adapter", () => {
  it("validates real response envelopes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ data: { name: "Peetop" } })),
        ),
    );
    expect(
      (await api("site-settings", z.object({ name: z.string() }))).data.name,
    ).toBe("Peetop");
  });
  it("rejects malformed success data instead of fabricating fallback records", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ data: { name: 3 } }))),
    );
    await expect(api("products", z.array(z.unknown()))).rejects.toMatchObject({
      status: 502,
    });
  });
  it("preserves safe backend field errors and request ID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request",
              details: [{ path: "email", message: "Invalid email" }],
            },
            requestId: "request-123",
          }),
          { status: 400 },
        ),
      ),
    );
    await expect(api("contact-inquiries", z.unknown())).rejects.toMatchObject({
      status: 400,
      details: [{ path: "email", message: "Invalid email" }],
      requestId: "request-123",
    });
  });
  it("fails clearly on network outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(api("products", z.unknown())).rejects.toBeInstanceOf(ApiError);
  });
});

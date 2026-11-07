import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { adminApi } from "@/lib/api/admin";
afterEach(() => vi.unstubAllGlobals());
describe("Concurrent admin refresh", () => {
  it("rotates once for simultaneous 401 responses and retries each request once", async () => {
    const counts = new Map<string, number>();
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const path = String(input);
      counts.set(path, (counts.get(path) ?? 0) + 1);
      if (path.endsWith("/admin/auth/refresh"))
        return new Response(
          JSON.stringify({
            data: {
              user: {
                id: "00000000-0000-4000-8000-000000000001",
                email: "admin@example.test",
                displayName: "Admin",
                role: "SUPER_ADMIN",
                status: "ACTIVE",
              },
            },
          }),
        );
      if (counts.get(path) === 1)
        return new Response(
          JSON.stringify({
            error: { code: "HTTP_401", message: "Unauthorized" },
          }),
          { status: 401 },
        );
      return new Response(JSON.stringify({ data: [] }));
    });
    vi.stubGlobal("fetch", fetcher);
    await Promise.all([
      adminApi("admin/products", z.array(z.unknown())),
      adminApi("admin/categories", z.array(z.unknown())),
    ]);
    expect(counts.get("/api/backend/admin/auth/refresh")).toBe(1);
    expect(counts.get("/api/backend/admin/products")).toBe(2);
    expect(counts.get("/api/backend/admin/categories")).toBe(2);
  });
});

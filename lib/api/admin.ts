"use client";
import { z } from "zod";
import { api, ApiError } from "./client";
import { adminSchema } from "./contracts";
let refreshing: Promise<unknown> | null = null;
export function refreshSession() {
  if (!refreshing)
    refreshing = api("admin/auth/refresh", z.object({ user: adminSchema }), {
      method: "POST",
    }).finally(() => {
      refreshing = null;
    });
  return refreshing;
}
export async function adminApi<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
) {
  try {
    return await api(path, schema, options);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      path.startsWith("admin/auth/")
    )
      throw error;
    try {
      await refreshSession();
      return await api(path, schema, options);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401)
        window.dispatchEvent(new Event("ptc:session-expired"));
      throw retryError;
    }
  }
}
export const rowSchema = z.record(z.string(), z.unknown());
export type Row = z.infer<typeof rowSchema>;
export function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

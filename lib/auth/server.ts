import "server-only";
import { serverEnv } from "../env";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { adminSchema } from "@/lib/api/contracts";
export async function currentAdmin() {
  const token = (await cookies()).get("ptc_access")?.value;
  if (!token) return null;
  try {
    return (
      await api(
        "admin/auth/me",
        adminSchema,
        { headers: { Authorization: `Bearer ${token}` } },
        serverEnv.API_INTERNAL_URL,
      )
    ).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

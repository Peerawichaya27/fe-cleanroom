import { requireAdmin } from "@/lib/auth/server";
import { AdminShell } from "@/components/admin/shell";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}

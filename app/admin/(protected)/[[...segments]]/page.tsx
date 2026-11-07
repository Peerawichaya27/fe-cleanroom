import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { Dashboard } from "@/components/admin/dashboard";
import { ResourceList } from "@/components/admin/resource-list";
import {
  ProductEditor,
  CategoryEditor,
  CmsEditor,
  CompanySettings,
  UserEditor,
  ContentPages,
} from "@/components/admin/editor";
import { LeadDetail } from "@/components/admin/lead-detail";
export default async function AdminPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const admin = await requireAdmin();
  const { segments = [] } = await params;
  const [section, id, action] = segments;
  if (!section) return <Dashboard />;
  if (["users", "audit-logs"].includes(section) && admin.role !== "SUPER_ADMIN")
    return (
      <div className="admin-panel editor-panel">
        <h1>Access restricted</h1>
        <p>This area is available to super admins.</p>
        <Link href="/admin" className="button button-primary">
          Back to overview
        </Link>
      </div>
    );
  if (section === "forbidden")
    return <h1>You don’t have permission to view this area.</h1>;
  if (section === "products") {
    if (id === "new") return <ProductEditor />;
    if (id && action === "edit") return <ProductEditor id={id} />;
    if (!id) return <ResourceList kind="products" />;
  }
  if (section === "categories") {
    if (id === "new") return <CategoryEditor />;
    if (id && (action === "edit" || !action)) return <CategoryEditor id={id} />;
    if (!id) return <ResourceList kind="categories" />;
  }
  if (section === "pages") {
    if (id) return <CmsEditor id={id} />;
    return <ContentPages />;
  }
  if (section === "settings" && !id) return <CompanySettings />;
  if (section === "inquiries" || section === "quotations") {
    if (id) return <LeadDetail kind={section} id={id} admin={admin} />;
    return <ResourceList kind={section} />;
  }
  if (section === "users") {
    if (id === "new") return <UserEditor />;
    if (id) return <UserEditor id={id} />;
    return <ResourceList kind="users" />;
  }
  if (section === "audit-logs" && !id)
    return <ResourceList kind="audit-logs" />;
  notFound();
}

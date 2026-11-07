"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Inbox,
  ClipboardList,
  CheckCircle,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { z } from "zod";
import { adminApi, rowSchema, text } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import { AdminError, StatusBadge } from "./shared";
const dashboardSchema = z.object({
  products: z.number(),
  publishedProducts: z.number(),
  newInquiries: z.number(),
  pendingRfqs: z.number(),
  recentInquiries: z.array(rowSchema),
  recentRfqs: z.array(rowSchema),
});
export function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi("admin/dashboard", dashboardSchema),
  });
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="eyebrow">Your workspace at a glance</div>
          <h1>Overview</h1>
          <p>Keep your catalog current and your conversations moving.</p>
        </div>
        <Link className="button button-primary" href="/admin/products/new">
          <Plus size={17} />
          Add product
        </Link>
      </div>
      {error ? (
        <AdminError error={error} retry={() => refetch()} />
      ) : isLoading ? (
        <p role="status">Loading dashboard…</p>
      ) : (
        data && (
          <>
            <div className="kpi-grid">
              {[
                {
                  label: "Total products",
                  value: data.data.products,
                  icon: Package,
                },
                {
                  label: "Published products",
                  value: data.data.publishedProducts,
                  icon: CheckCircle,
                },
                {
                  label: "New inquiries",
                  value: data.data.newInquiries,
                  icon: Inbox,
                },
                {
                  label: "Pending quotations",
                  value: data.data.pendingRfqs,
                  icon: ClipboardList,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div className="kpi-card" key={label}>
                  <div>
                    {label}
                    <Icon size={20} />
                  </div>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="dashboard-grid">
              {[
                {
                  title: "Recent inquiries",
                  rows: data.data.recentInquiries,
                  path: "inquiries",
                },
                {
                  title: "Recent quotation requests",
                  rows: data.data.recentRfqs,
                  path: "quotations",
                },
              ].map((section) => (
                <section className="admin-panel" key={section.path}>
                  <div className="panel-heading">
                    <h2>{section.title}</h2>
                    <Link className="text-link" href={`/admin/${section.path}`}>
                      View all <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  {section.rows.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Status</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row) => (
                            <tr key={text(row, "id")}>
                              <td>
                                <Link
                                  href={`/admin/${section.path}/${text(row, "id")}`}
                                >
                                  {text(row, "reference")}
                                </Link>
                              </td>
                              <td>
                                <StatusBadge status={text(row, "status")} />
                              </td>
                              <td>{formatDate(text(row, "submittedAt"))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="panel-empty">
                      No submissions yet. New requests will appear here.
                    </p>
                  )}
                </section>
              ))}
            </div>
          </>
        )
      )}
    </>
  );
}

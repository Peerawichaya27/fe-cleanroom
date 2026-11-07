"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowUpRight, Search, Archive } from "lucide-react";
import { z } from "zod";
import { adminApi, rowSchema, text, type Row } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import { AdminError, StatusBadge } from "./shared";
import { useQuote } from "@/providers/app-provider";
type Kind =
  | "products"
  | "categories"
  | "inquiries"
  | "quotations"
  | "audit-logs"
  | "users";
const config: Record<
  Kind,
  {
    title: string;
    description: string;
    endpoint: string;
    columns: [string, string][];
    statuses?: string[];
    create?: string;
  }
> = {
  products: {
    title: "Products",
    description: "Manage your catalog, specifications, and publication.",
    endpoint: "admin/products",
    columns: [
      ["name", "Product"],
      ["sku", "SKU"],
      ["status", "Status"],
      ["updatedAt", "Updated"],
    ],
    statuses: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    create: "/admin/products/new",
  },
  categories: {
    title: "Categories",
    description: "Organize your catalog with clear product categories.",
    endpoint: "admin/categories",
    columns: [
      ["name", "Name"],
      ["slug", "Slug"],
      ["isActive", "Visibility"],
      ["sortOrder", "Order"],
    ],
    create: "/admin/categories/new",
  },
  inquiries: {
    title: "Contact inquiries",
    description: "Conversations from your website visitors.",
    endpoint: "admin/contact-inquiries",
    columns: [
      ["reference", "Reference"],
      ["name", "Name"],
      ["subject", "Subject"],
      ["status", "Status"],
      ["submittedAt", "Submitted"],
    ],
    statuses: ["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED"],
  },
  quotations: {
    title: "Quotation requests",
    description: "Review product requirements and follow up with customers.",
    endpoint: "admin/quotation-requests",
    columns: [
      ["reference", "Reference"],
      ["contactName", "Contact"],
      ["company", "Company"],
      ["status", "Status"],
      ["submittedAt", "Submitted"],
    ],
    statuses: ["NEW", "REVIEWING", "RESPONDED", "CLOSED"],
  },
  "audit-logs": {
    title: "Audit history",
    description: "A record of administrative and business changes.",
    endpoint: "admin/audit-logs",
    columns: [
      ["action", "Action"],
      ["entityType", "Entity"],
      ["entityId", "Record ID"],
      ["createdAt", "Time"],
    ],
  },
  users: {
    title: "Admin users",
    description: "Manage access for your authorized team.",
    endpoint: "admin/users",
    columns: [
      ["displayName", "Name"],
      ["email", "Email"],
      ["role", "Role"],
      ["status", "Status"],
    ],
    create: "/admin/users/new",
  },
};
export function ResourceList({ kind }: { kind: Kind }) {
  const cfg = config[kind];
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const { notify } = useQuote();
  const client = useQueryClient();
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  if (query && kind === "products") params.set("q", query);
  const endpoint = cfg.endpoint + (kind === "categories" ? "" : "?" + params);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", kind, page, status, query],
    queryFn: () => adminApi(endpoint, z.array(rowSchema)),
  });
  const archive = useMutation({
    mutationFn: (id: string) =>
      adminApi(`admin/${kind}/${id}`, rowSchema, { method: "DELETE" }),
    onSuccess: () => {
      notify(
        kind === "products" ? "Product archived." : "Category deactivated.",
      );
      void client.invalidateQueries({ queryKey: ["admin", kind] });
    },
  });
  const rows =
    data?.data.filter(
      (row) =>
        !query ||
        kind === "products" ||
        Object.values(row).some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(query.toLowerCase()),
        ),
    ) ?? [];
  function href(row: Row) {
    const id = text(row, "id");
    return kind === "products"
      ? `/admin/products/${id}/edit`
      : kind === "categories" || kind === "users"
        ? `/admin/${kind}/${id}/edit`
        : `/admin/${kind}/${id}`;
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>{cfg.title}</h1>
          <p>{cfg.description}</p>
        </div>
        {cfg.create && (
          <Link className="button button-primary" href={cfg.create}>
            <Plus size={17} />
            Add{" "}
            {kind === "categories"
              ? "category"
              : kind === "users"
                ? "admin"
                : "product"}
          </Link>
        )}
      </div>
      <div className="admin-panel">
        <form
          className="admin-filters"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search);
          }}
        >
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search records"
              placeholder={
                kind === "products" ? "Search name or SKU" : "Search this page"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {cfg.statuses && (
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {cfg.statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          <button className="button button-outline" type="submit">
            Search
          </button>
        </form>
        {error && <AdminError error={error} retry={() => refetch()} />}{" "}
        {archive.error && <AdminError error={archive.error} />}{" "}
        {isLoading ? (
          <p role="status" className="panel-empty">
            Loading records…
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {cfg.columns.map(([key, label]) => (
                    <th key={key}>{label}</th>
                  ))}
                  {kind !== "audit-logs" && (
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={text(row, "id")}>
                    {cfg.columns.map(([key]) => (
                      <td key={key}>
                        {key === "status" || key === "role" ? (
                          <StatusBadge status={text(row, key)} />
                        ) : key === "isActive" ? (
                          <StatusBadge
                            status={row.isActive ? "ACTIVE" : "DISABLED"}
                          />
                        ) : key.endsWith("At") ? (
                          formatDate(text(row, key))
                        ) : key === "name" ||
                          key === "reference" ||
                          key === "displayName" ? (
                          <Link href={href(row)}>{text(row, key)}</Link>
                        ) : (
                          text(row, key) || "—"
                        )}
                      </td>
                    ))}
                    {kind !== "audit-logs" && (
                      <td>
                        <div className="row-actions">
                          <Link
                            className="icon-button"
                            href={href(row)}
                            aria-label={`Open ${text(row, "name") || text(row, "reference") || text(row, "displayName")}`}
                          >
                            <ArrowUpRight size={17} />
                          </Link>
                          {(kind === "products" || kind === "categories") && (
                            <button
                              className="icon-button"
                              disabled={archive.isPending}
                              aria-label={
                                kind === "products"
                                  ? "Archive product"
                                  : "Deactivate category"
                              }
                              onClick={() => {
                                if (
                                  window.confirm(
                                    kind === "products"
                                      ? "Archive this product? It will be hidden from the public catalog."
                                      : "Deactivate this category? Published products must first be unpublished.",
                                  )
                                )
                                  archive.mutate(text(row, "id"));
                              }}
                            >
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="panel-empty">No records to show.</p>}
          </div>
        )}
        <div className="table-pagination">
          <span>
            {data?.meta
              ? `${data.meta.total} records`
              : `${rows.length} records`}
            {query &&
              kind !== "products" &&
              " · Search applies to the current page"}
          </span>
          <div>
            <button
              className="button button-ghost button-sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>{page}</span>
            <button
              className="button button-ghost button-sm"
              disabled={page >= (data?.meta?.totalPages ?? 1)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

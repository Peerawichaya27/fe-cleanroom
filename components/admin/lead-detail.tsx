"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { z } from "zod";
import { adminApi, rowSchema, text } from "@/lib/api/admin";
import { adminSchema, type Admin } from "@/lib/api/contracts";
import { formatDate } from "@/lib/utils";
import { useQuote } from "@/providers/app-provider";
import { AdminError, SaveButton, StatusBadge } from "./shared";
export function LeadDetail({
  kind,
  id,
  admin,
}: {
  kind: "inquiries" | "quotations";
  id: string;
  admin: Admin;
}) {
  const rfq = kind === "quotations";
  const endpoint = rfq ? "admin/quotation-requests" : "admin/contact-inquiries";
  const client = useQueryClient();
  const { notify } = useQuote();
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin", kind, id],
    queryFn: () => adminApi(`${endpoint}/${id}`, rowSchema),
  });
  const { data: users } = useQuery({
    queryKey: ["admin", "assignees"],
    enabled: admin.role === "SUPER_ADMIN",
    queryFn: () => adminApi("admin/users?limit=100", z.array(adminSchema)),
  });
  const [status, setStatus] = useState("NEW");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [outcome, setOutcome] = useState("");
  useEffect(() => {
    if (data) {
      setStatus(text(data.data, "status"));
      setNote(text(data.data, "internalNote"));
      setAssignee(text(data.data, "assignedAdminId"));
      setOutcome(text(data.data, "outcome"));
    }
  }, [data]);
  const save = useMutation({
    mutationFn: () =>
      adminApi(`${endpoint}/${id}`, rowSchema, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          internalNote: note || null,
          assignedAdminId: assignee || null,
          ...(rfq
            ? { outcome: status === "CLOSED" ? outcome || null : null }
            : {}),
        }),
      }),
    onSuccess: () => {
      notify("Request updated.");
      void client.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  if (error) return <AdminError error={error} />;
  if (isLoading || !data) return <p role="status">Loading request…</p>;
  const record = data.data;
  const current = text(record, "status");
  const transitions: Record<string, string[]> = {
    NEW: [rfq ? "REVIEWING" : "IN_PROGRESS", "CLOSED"],
    REVIEWING: ["RESPONDED", "CLOSED"],
    IN_PROGRESS: ["RESPONDED", "CLOSED"],
    RESPONDED: [rfq ? "REVIEWING" : "IN_PROGRESS", "CLOSED"],
    CLOSED: [],
  };
  const items = z.array(rowSchema).safeParse(record.items);
  const assignees = [admin, ...(users?.data ?? [])].filter(
    (user, index, all) =>
      all.findIndex((u) => u.id === user.id) === index &&
      user.status === "ACTIVE",
  );
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <Link className="text-link" href={`/admin/${kind}`}>
            ← {rfq ? "Quotation requests" : "Contact inquiries"}
          </Link>
          <h1>{text(record, "reference")}</h1>
          <p>Submitted {formatDate(text(record, "submittedAt"))}</p>
        </div>
        <StatusBadge status={current} />
      </div>
      <div className="editor-layout">
        <div>
          <section className="admin-panel editor-panel">
            <h2>{text(record, rfq ? "contactName" : "name")}</h2>
            <p className="lead">{text(record, "company")}</p>
            <div className="contact-actions">
              <a href={`mailto:${text(record, "email")}`}>
                <Mail size={17} />
                {text(record, "email")}
              </a>
              {text(record, "phone") && (
                <a href={`tel:${text(record, "phone")}`}>
                  <Phone size={17} />
                  {text(record, "phone")}
                </a>
              )}
            </div>
            {!rfq && <h3>{text(record, "subject")}</h3>}
            <p className="preserve-lines">
              {text(record, "message") || "No additional message."}
            </p>
          </section>
          {rfq && (
            <section className="admin-panel editor-panel">
              <h2>Requested products</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product snapshot</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Requirements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.success &&
                      items.data.map((item) => (
                        <tr key={text(item, "id")}>
                          <td>{text(item, "productNameSnapshot")}</td>
                          <td>{text(item, "skuSnapshot")}</td>
                          <td>
                            {text(item, "quantity")}{" "}
                            {text(item, "unitSnapshot")}
                          </td>
                          <td className="preserve-lines">
                            {text(item, "requirements") || "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
        <form
          className="admin-panel editor-panel editor-aside"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h2>Manage request</h2>
          <label className="field">
            Status
            <select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {[current, ...(transitions[current] ?? [])].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          {rfq && status === "CLOSED" && (
            <label className="field">
              Outcome
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              >
                <option value="">Not specified</option>
                <option>WON</option>
                <option>LOST</option>
                <option>CANCELLED</option>
              </select>
            </label>
          )}
          <label className="field">
            Assigned to
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">Unassigned</option>
              {assignee && !assignees.some((u) => u.id === assignee) && (
                <option value={assignee}>Current assignee</option>
              )}
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                  {user.id === admin.id ? " (you)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Internal note
            <textarea
              rows={7}
              maxLength={20000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Only visible to your admin team."
            />
          </label>
          {save.error && <AdminError error={save.error} />}
          <SaveButton pending={save.isPending} />
        </form>
      </div>
    </>
  );
}

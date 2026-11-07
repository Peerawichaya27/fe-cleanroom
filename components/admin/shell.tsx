"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  FileText,
  Settings,
  Inbox,
  ClipboardList,
  ShieldCheck,
  Users,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { z } from "zod";
import type { Admin } from "@/lib/api/contracts";
import { api } from "@/lib/api/client";
const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  {
    href: "/admin/quotations",
    label: "Quotation requests",
    icon: ClipboardList,
  },
  { href: "/admin/pages", label: "Website content", icon: FileText },
  { href: "/admin/settings", label: "Company settings", icon: Settings },
  {
    href: "/admin/audit-logs",
    label: "Audit history",
    icon: ShieldCheck,
    super: true,
  },
  { href: "/admin/users", label: "Admin users", icon: Users, super: true },
];
export function AdminShell({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  const client = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const expired = () => {
      client.clear();
      router.replace("/admin/login");
      router.refresh();
    };
    window.addEventListener("ptc:session-expired", expired);
    return () => window.removeEventListener("ptc:session-expired", expired);
  }, [router, client]);
  async function logout() {
    try {
      await api("admin/auth/logout", z.unknown(), { method: "POST" });
      client.clear();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    }
  }
  return (
    <div className="admin-layout">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <Link className="brand" href="/admin">
          <Image
            src="/ptc-logo.svg"
            style={{ height: "auto" }}
            width={92}
            height={65}
            alt="PTC"
          />
          <span>
            PEETOP<span>Admin workspace</span>
          </span>
        </Link>
        <button
          className="sidebar-close icon-button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <div className="sidebar-label">Workspace</div>
        <nav aria-label="Admin navigation">
          {links
            .filter((link) => !link.super || admin.role === "SUPER_ADMIN")
            .map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={
                  pathname === href ||
                  (href !== "/admin" && pathname.startsWith(href + "/"))
                    ? "active"
                    : ""
                }
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            View website <ArrowUpRight size={16} />
          </Link>
          <button onClick={logout}>
            <LogOut size={16} />
            Sign out
          </button>
          {error && <p className="form-error">{error}</p>}
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="menu-toggle"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <span>
            Peetop /{" "}
            <strong>
              {links.find(
                (l) =>
                  pathname === l.href ||
                  (l.href !== "/admin" && pathname.startsWith(l.href + "/")),
              )?.label ?? "Workspace"}
            </strong>
          </span>
          <div className="admin-profile">
            <div className="avatar">{admin.displayName.slice(0, 1)}</div>
            <div>
              {admin.displayName}
              <small>
                {admin.role === "SUPER_ADMIN" ? "Super admin" : "Editor"}
              </small>
            </div>
          </div>
        </header>
        <main id="main" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}

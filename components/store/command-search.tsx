"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Search,
  CornerDownLeft,
  ArrowUpRight,
  Package,
  LayoutGrid,
  History,
  LoaderCircle,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { flattenCategories, productSchema } from "@/lib/api/contracts";
import { primaryImage } from "@/components/quote/use-quote-products";
import { useDialog, useStoreUI } from "./store-ui";
import { RecentThumb, useRecent } from "./recently-viewed";
type Row = { key: string; href: string };
export function CommandSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { categories } = useStoreUI();
  const recent = useRecent();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  useDialog(open, onClose, ref);
  useEffect(() => {
    const id = window.setTimeout(() => setTerm(q.trim()), 180);
    return () => window.clearTimeout(id);
  }, [q]);
  useEffect(() => {
    if (!open) {
      setQ("");
      setTerm("");
    }
  }, [open]);
  const { data, isFetching } = useQuery({
    queryKey: ["command-search", term],
    enabled: open && term.length > 0,
    staleTime: 30000,
    queryFn: () =>
      api(
        `products?limit=6&q=${encodeURIComponent(term.slice(0, 200))}`,
        z.array(productSchema),
      ),
  });
  const results = term ? (data?.data ?? []) : [];
  const flat = flattenCategories(categories).slice(0, 6);
  const rows: Row[] = term
    ? [
        ...results.map((p) => ({ key: p.id, href: `/products/${p.slug}` })),
        { key: "all", href: `/products?q=${encodeURIComponent(term)}` },
      ]
    : [
        ...recent
          .slice(0, 4)
          .map((p) => ({ key: p.id, href: `/products/${p.slug}` })),
        ...flat.map((c) => ({ key: c.id, href: `/categories/${c.slug}` })),
        { key: "catalog", href: "/products" },
      ];
  useEffect(() => setActive(0), [term, open]);
  function go(href: string) {
    onClose();
    router.push(href);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[active];
      if (row) go(row.href);
      else if (q.trim()) go(`/products?q=${encodeURIComponent(q.trim())}`);
    }
  }
  const idx = (key: string) => rows.findIndex((r) => r.key === key);
  const itemProps = (key: string) => ({
    "data-active": idx(key) === active || undefined,
    onMouseMove: () => setActive(idx(key)),
    onClick: onClose,
  });
  return (
    <div
      className={open ? "sheet-root open" : "sheet-root"}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="sheet-scrim" onClick={onClose} />
      <div
        ref={ref}
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search the catalog"
        tabIndex={-1}
      >
        <div className="palette-input">
          {isFetching ? (
            <LoaderCircle size={19} className="spin" />
          ) : (
            <Search size={19} />
          )}
          <input
            data-autofocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search products, SKUs or categories"
            aria-label="Search products"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            autoComplete="off"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-body" id="palette-results" role="listbox">
          {term ? (
            <>
              <p className="palette-label">Products</p>
              {results.map((p) => {
                const image = primaryImage(p);
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="palette-row"
                    role="option"
                    aria-selected={idx(p.id) === active}
                    {...itemProps(p.id)}
                  >
                    <span className="palette-thumb">
                      {image ? (
                        <Image
                          src={image.url}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                        />
                      ) : (
                        <Package size={18} strokeWidth={1.4} />
                      )}
                    </span>
                    <span className="palette-copy">
                      <strong>{p.name}</strong>
                      <small className="mono">
                        {p.sku} · MOQ {p.minimumOrderQuantity} {p.unit}
                      </small>
                    </span>
                    <CornerDownLeft size={15} className="palette-enter" />
                  </Link>
                );
              })}
              {!isFetching && data && !results.length && (
                <p className="palette-empty">
                  No products match “{term}”. Our team can still help you source
                  it.
                </p>
              )}
              <Link
                href={`/products?q=${encodeURIComponent(term)}`}
                className="palette-row palette-all"
                role="option"
                aria-selected={idx("all") === active}
                {...itemProps("all")}
              >
                <span className="palette-thumb">
                  <Search size={17} />
                </span>
                <span className="palette-copy">
                  <strong>See all results for “{term}”</strong>
                </span>
                <ArrowUpRight size={15} className="palette-enter" />
              </Link>
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <>
                  <p className="palette-label">
                    <History size={13} /> Recently viewed
                  </p>
                  {recent.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="palette-row"
                      role="option"
                      aria-selected={idx(p.id) === active}
                      {...itemProps(p.id)}
                    >
                      <span className="palette-thumb">
                        <RecentThumb item={p} size={44} />
                      </span>
                      <span className="palette-copy">
                        <strong>{p.name}</strong>
                        <small className="mono">{p.sku}</small>
                      </span>
                      <CornerDownLeft size={15} className="palette-enter" />
                    </Link>
                  ))}
                </>
              )}
              <p className="palette-label">
                <LayoutGrid size={13} /> Browse
              </p>
              {flat.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="palette-row"
                  role="option"
                  aria-selected={idx(c.id) === active}
                  {...itemProps(c.id)}
                >
                  <span className="palette-thumb">
                    <LayoutGrid size={17} />
                  </span>
                  <span className="palette-copy">
                    <strong>{c.name}</strong>
                    <small>Category</small>
                  </span>
                  <CornerDownLeft size={15} className="palette-enter" />
                </Link>
              ))}
              <Link
                href="/products"
                className="palette-row"
                role="option"
                aria-selected={idx("catalog") === active}
                {...itemProps("catalog")}
              >
                <span className="palette-thumb">
                  <Package size={17} />
                </span>
                <span className="palette-copy">
                  <strong>Full product catalog</strong>
                  <small>All products</small>
                </span>
                <CornerDownLeft size={15} className="palette-enter" />
              </Link>
            </>
          )}
        </div>
        <footer className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </footer>
      </div>
    </div>
  );
}

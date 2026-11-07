"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, History, Package } from "lucide-react";
import type { Product } from "@/lib/api/contracts";
import { primaryImage } from "@/components/quote/use-quote-products";
export type RecentProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  unit: string;
  image?: string;
};
const KEY = "ptc-recent";
const EVENT = "ptc-recent-change";
export function readRecent(): RecentProduct[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? (parsed as RecentProduct[])
          .filter((p) => p && typeof p.slug === "string")
          .slice(0, 8)
      : [];
  } catch {
    return [];
  }
}
export function useRecent() {
  const [items, setItems] = useState<RecentProduct[]>([]);
  useEffect(() => {
    const sync = () => setItems(readRecent());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}
/** Records a product page visit. Image URLs are presigned, so only non-expiring data is relied upon. */
export function TrackRecentlyViewed({ product }: { product: Product }) {
  useEffect(() => {
    const entry: RecentProduct = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      image: primaryImage(product)?.url,
    };
    try {
      const next = [
        entry,
        ...readRecent().filter((p) => p.id !== product.id),
      ].slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
    } catch {}
  }, [product]);
  return null;
}
export function RecentThumb({
  item,
  size = 56,
}: {
  item: RecentProduct;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? (
    <Image
      src={item.image}
      alt=""
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
    />
  ) : (
    <Package size={size * 0.42} strokeWidth={1.3} />
  );
}
export function RecentlyViewed({
  excludeId,
  title = "Recently viewed",
}: {
  excludeId?: string;
  title?: string;
}) {
  const items = useRecent().filter((p) => p.id !== excludeId);
  if (!items.length) return null;
  return (
    <section className="recent" aria-label={title}>
      <div className="recent-head">
        <h2>
          <History size={18} /> {title}
        </h2>
      </div>
      <div className="recent-rail">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="recent-item"
          >
            <span className="recent-thumb">
              <RecentThumb item={item} />
            </span>
            <span className="recent-copy">
              <small className="mono">{item.sku}</small>
              <strong>{item.name}</strong>
            </span>
            <ArrowUpRight size={15} />
          </Link>
        ))}
      </div>
    </section>
  );
}

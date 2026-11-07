"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, Package, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/api/contracts";
import { AddToQuote } from "./add-to-quote";
import { primaryImage } from "./use-quote-products";
import { useStoreUI } from "@/components/store/store-ui";
import { useQuote } from "@/providers/app-provider";
const MAX = 2147483647;
/**
 * Product-page purchase controls: quantity selector (never below MOQ),
 * add to quotation, and a compact sticky bar once these scroll out of view.
 */
export function BuyActions({ product }: { product: Product }) {
  const min = product.minimumOrderQuantity;
  const [qty, setQty] = useState(min);
  const [stuck, setStuck] = useState(false);
  // The sticky bar is portalled to the store root: animated/transformed
  // ancestors (like the buy box) would otherwise capture position: fixed.
  const [host, setHost] = useState<HTMLElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { openDrawer } = useStoreUI();
  const { items } = useQuote();
  const inQuote = items.find((i) => i.productId === product.id);
  const image = primaryImage(product);
  useEffect(() => {
    const node = ref.current;
    setHost(node?.closest<HTMLElement>(".store") ?? null);
    if (!node || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) =>
        setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  const clamp = (n: number) => Math.max(min, Math.min(MAX, n || min));
  return (
    <>
      <div ref={ref} className="buy-actions">
        <div className="qty-row">
          <label htmlFor={`qty-${product.id}`}>Quantity ({product.unit})</label>
          <div className="stepper">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={qty <= min}
              onClick={() => setQty((q) => clamp(q - 1))}
            >
              <Minus size={15} />
            </button>
            <input
              id={`qty-${product.id}`}
              type="number"
              inputMode="numeric"
              min={min}
              max={MAX}
              value={qty}
              onChange={(e) => setQty(clamp(Number(e.target.value)))}
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => clamp(q + 1))}
            >
              <Plus size={15} />
            </button>
          </div>
          <span className="qty-note">Min. {min}</span>
        </div>
        <AddToQuote product={product} quantity={qty} />
        <button
          type="button"
          className="btn btn-outline btn-wide"
          onClick={openDrawer}
        >
          <ShoppingBag size={17} />
          {inQuote
            ? `View quotation list · ${inQuote.quantity} ${product.unit} added`
            : "View quotation list"}
        </button>
      </div>
      {host &&
        createPortal(
          <div
            className={stuck ? "sticky-buy show" : "sticky-buy"}
            aria-hidden={!stuck}
            inert={!stuck}
          >
            <div className="container sticky-buy-inner">
              <span className="sticky-thumb">
                {image ? (
                  <Image
                    src={image.url}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                  />
                ) : (
                  <Package size={20} strokeWidth={1.3} />
                )}
              </span>
              <span className="sticky-copy">
                <strong>{product.name}</strong>
                <small className="mono">
                  {product.sku} · {qty} {product.unit}
                </small>
              </span>
              <AddToQuote product={product} quantity={qty} compact sticky />
            </div>
          </div>,
          host,
        )}
    </>
  );
}

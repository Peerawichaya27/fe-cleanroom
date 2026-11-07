"use client";
import { useEffect, useState } from "react";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { useQuote } from "@/providers/app-provider";
import type { Product } from "@/lib/api/contracts";
export function AddToQuote({
  product,
  compact = false,
  quantity,
  sticky = false,
}: {
  product: Product;
  compact?: boolean;
  /** Units to add; defaults to the product's minimum order quantity. */
  quantity?: number;
  /** Secondary copy shown in the sticky bar; uses a distinct accessible name. */
  sticky?: boolean;
}) {
  const { add, items } = useQuote();
  const [added, setAdded] = useState(false);
  const inQuote = items.some((i) => i.productId === product.id);
  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(id);
  }, [added]);
  const amount = Math.max(
    product.minimumOrderQuantity,
    quantity ?? product.minimumOrderQuantity,
  );
  return (
    <button
      type="button"
      className={`btn ${compact ? (sticky ? "btn-accent" : "btn-add") : "btn-accent btn-lg btn-wide"}${added ? " is-added" : ""}`}
      onClick={() => {
        if (add(product.id, amount)) setAdded(true);
      }}
      aria-label={
        sticky
          ? `Quick add ${product.name}`
          : `Add ${product.name} to quotation`
      }
    >
      {added ? (
        <>
          <Check size={compact ? 15 : 18} />
          Added
        </>
      ) : compact ? (
        <>
          <Plus size={15} />
          {sticky ? "Add to quotation" : inQuote ? "Add more" : "Add"}
        </>
      ) : (
        <>
          <ShoppingBag size={18} />
          {inQuote ? "Add more to quotation" : "Add to quotation"}
        </>
      )}
    </button>
  );
}

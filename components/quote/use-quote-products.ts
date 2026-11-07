"use client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { productSchema, type Product } from "@/lib/api/contracts";
import { useQuote } from "@/providers/app-provider";
/**
 * Loads current product data for every item in the quotation selection.
 * Shared by the quote page and the quote drawer so both use one cache entry.
 */
export function useQuoteProducts() {
  const { items, ready } = useQuote();
  const ids = items.map((i) => i.productId);
  const query = useQuery({
    queryKey: ["quote-products", [...ids].sort().join(",")],
    enabled: ready && items.length > 0,
    queryFn: async () => {
      const found: Product[] = [];
      let page = 1;
      let total = 1;
      do {
        const result = await api(
          `products?limit=100&page=${page}`,
          z.array(productSchema),
        );
        found.push(...result.data.filter((p) => ids.includes(p.id)));
        total = result.meta?.totalPages ?? 1;
        page++;
      } while (page <= total && found.length < ids.length);
      return found;
    },
  });
  return { ...query, ids };
}
export function primaryImage(product?: Pick<Product, "media">) {
  return (
    product?.media.find((m) => m.kind === "IMAGE" && m.isPrimary) ??
    product?.media.find((m) => m.kind === "IMAGE")
  );
}

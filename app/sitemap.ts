import type { MetadataRoute } from "next";
import { publicApi } from "@/lib/api/server";
import { flattenCategories } from "@/lib/api/contracts";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";
  const urls = ["", "/products", "/about-us", "/contact-us", "/privacy"].map(
    (path) => ({ url: base + path }),
  );
  const first = await publicApi.products("limit=100").catch(() => null);
  if (first) {
    urls.push(
      ...first.data.map((p) => ({ url: `${base}/products/${p.slug}` })),
    );
    for (let page = 2; page <= (first.meta?.totalPages ?? 1); page++) {
      const batch = await publicApi.products(`limit=100&page=${page}`);
      urls.push(
        ...batch.data.map((p) => ({ url: `${base}/products/${p.slug}` })),
      );
    }
  }
  const categories = await publicApi.categories().catch(() => null);
  if (categories)
    urls.push(
      ...flattenCategories(categories.data).map((c) => ({
        url: `${base}/categories/${c.slug}`,
      })),
    );
  return urls;
}

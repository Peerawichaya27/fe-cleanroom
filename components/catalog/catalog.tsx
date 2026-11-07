import Link from "next/link";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  X,
  Phone,
  FileText,
  ChevronRight,
} from "lucide-react";
import { publicApi } from "@/lib/api/server";
import { flattenCategories } from "@/lib/api/contracts";
import { company } from "@/lib/company";
import { ProductCard } from "./product-card";
import { CatalogView } from "./view-toggle";
import { EmptyState, ServiceError } from "@/components/site/content";
export async function Catalog({
  search,
  category,
}: {
  search: Record<string, string | undefined>;
  category?: string;
}) {
  const page = Math.max(1, Number(search.page) || 1);
  const q = (search.q ?? "").slice(0, 200);
  const sort = ["newest", "name_asc", "name_desc"].includes(search.sort ?? "")
    ? search.sort!
    : "newest";
  const selected = category ?? search.category ?? "";
  const params = new URLSearchParams({ page: String(page), limit: "12", sort });
  if (q) params.set("q", q);
  if (selected) params.set("category", selected);
  const [products, categories] = await Promise.all([
    publicApi.products(params.toString()).catch(() => null),
    publicApi.categories().catch(() => null),
  ]);
  const flat = flattenCategories(categories?.data ?? []);
  const total = products?.meta?.total ?? 0;
  const totalPages = Math.max(1, products?.meta?.totalPages ?? 1);
  const selectedName = flat.find((c) => c.slug === selected)?.name ?? selected;
  function pageLink(index: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(index));
    return `/products?${next}`;
  }
  function categoryLink(slug: string) {
    const next = new URLSearchParams({ sort });
    if (q) next.set("q", q);
    if (slug) next.set("category", slug);
    return `/products?${next}`;
  }
  return (
    <div className="catalog-layout">
      <aside className="catalog-side" aria-label="Catalog filters">
        <div className="side-block">
          <p className="side-label">Categories</p>
          <nav className="side-cats" aria-label="Product categories">
            <Link
              href={categoryLink("")}
              className={!selected ? "active" : ""}
              aria-current={!selected ? "page" : undefined}
            >
              All products
              <ChevronRight size={14} />
            </Link>
            {flat.map((c) => (
              <Link
                key={c.id}
                href={categoryLink(c.slug)}
                className={selected === c.slug ? "active" : ""}
                aria-current={selected === c.slug ? "page" : undefined}
                data-child={c.parentId ? "" : undefined}
              >
                {c.name}
                <ChevronRight size={14} />
              </Link>
            ))}
          </nav>
        </div>
        <div className="side-help">
          <FileText size={20} strokeWidth={1.5} />
          <strong>Can’t find a product?</strong>
          <p>Send your requirements and our team will source it for you.</p>
          <Link href="/contact-us" className="link-arrow">
            Ask our team <ArrowRight size={14} />
          </Link>
          <a href={`tel:${company.phoneLink}`} className="side-phone">
            <Phone size={14} /> {company.phone}
          </a>
        </div>
      </aside>
      <div className="catalog-main">
        {flat.length > 0 && (
          <nav className="cat-chips" aria-label="Product categories (compact)">
            <Link
              href={categoryLink("")}
              className={!selected ? "chip active" : "chip"}
            >
              All products
            </Link>
            {flat.map((c) => (
              <Link
                key={c.id}
                href={categoryLink(c.slug)}
                className={selected === c.slug ? "chip active" : "chip"}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}
        <form className="filter-bar" action="/products">
          <div className="filter-search">
            <Search size={18} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by product name or SKU"
              aria-label="Search products"
            />
          </div>
          {selected && <input type="hidden" name="category" value={selected} />}
          <label className="filter-select">
            <span className="sr-only">Sort products</span>
            <select name="sort" defaultValue={sort}>
              <option value="newest">Sort: Newest first</option>
              <option value="name_asc">Sort: Name A–Z</option>
              <option value="name_desc">Sort: Name Z–A</option>
            </select>
          </label>
          <button className="btn btn-dark" type="submit">
            Apply
          </button>
        </form>
        <CatalogView
          summary={
            <span className="results-summary">
              <strong>{total}</strong> {total === 1 ? "product" : "products"}
              {q && (
                <span className="filter-tag">
                  “{q}”
                  <Link
                    href={categoryLink(selected)}
                    aria-label="Remove search term"
                  >
                    <X size={12} />
                  </Link>
                </span>
              )}
              {selected && (
                <span className="filter-tag">
                  {selectedName}
                  <Link
                    href={(() => {
                      const next = new URLSearchParams({ sort });
                      if (q) next.set("q", q);
                      return `/products?${next}`;
                    })()}
                    aria-label="Remove category filter"
                  >
                    <X size={12} />
                  </Link>
                </span>
              )}
              {(q || selected) && (
                <Link href="/products" className="clear-link">
                  Clear all
                </Link>
              )}
            </span>
          }
        >
          {!products ? (
            <ServiceError />
          ) : products.data.length ? (
            <div className="product-grid catalog-grid">
              {products.data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                q || selected
                  ? "No matching products"
                  : "Our catalog is being prepared"
              }
              description={
                q || selected
                  ? "Try a different keyword or category. Our team can also help you find a specific item."
                  : undefined
              }
            />
          )}
        </CatalogView>
        {totalPages > 1 && (
          <nav className="pager" aria-label="Catalog pagination">
            {page > 1 ? (
              <Link href={pageLink(page - 1)} aria-label="Previous page">
                <ArrowLeft size={16} />
              </Link>
            ) : (
              <span className="disabled">
                <ArrowLeft size={16} />
              </span>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
              )
              .map((n, i, arr) => (
                <span key={n} className="pager-group">
                  {i > 0 && n - arr[i - 1] > 1 && (
                    <span className="gap">…</span>
                  )}
                  {n === page ? (
                    <span className="current" aria-current="page">
                      {n}
                    </span>
                  ) : (
                    <Link href={pageLink(n)}>{n}</Link>
                  )}
                </span>
              ))}
            {page < totalPages ? (
              <Link href={pageLink(page + 1)} aria-label="Next page">
                <ArrowRight size={16} />
              </Link>
            ) : (
              <span className="disabled">
                <ArrowRight size={16} />
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileDown,
  ArrowUpRight,
  BadgeCheck,
  UserRoundX,
  MessageCircle,
  FileText,
  Phone,
} from "lucide-react";
import { publicApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import { Gallery } from "@/components/catalog/gallery";
import { BuyActions } from "@/components/quote/buy-actions";
import {
  RecentlyViewed,
  TrackRecentlyViewed,
} from "@/components/store/recently-viewed";
import { Breadcrumbs } from "@/components/site/content";
import { company } from "@/lib/company";
async function getProduct(slug: string) {
  return publicApi
    .product(slug)
    .then((r) => r.data)
    .catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    });
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await getProduct((await params).slug);
  return {
    title: p.seoTitle || p.name,
    description: p.seoDescription || p.shortDescription || p.name,
    alternates: { canonical: `/products/${p.slug}` },
  };
}
export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = await getProduct((await params).slug);
  const specs = Object.entries(product.specifications);
  const docs = product.media.filter((m) => m.kind === "DATASHEET");
  return (
    <section className="container page-section pdp">
      <Breadcrumbs
        trail={[["Home", "/"], ["Shop", "/products"], [product.name]]}
      />
      <div className="pdp-grid">
        <Gallery product={product} />
        <div className="buy-box">
          <div className="buy-tags">
            {product.isFeatured && (
              <span className="badge badge-hot">★ Featured</span>
            )}
            <span className="badge badge-soft mono">SKU {product.sku}</span>
          </div>
          <h1>{product.name}</h1>
          {product.shortDescription && (
            <p className="lead">{product.shortDescription}</p>
          )}
          <dl className="facts">
            <div>
              <dt>Sold per</dt>
              <dd>{product.unit}</dd>
            </div>
            <div>
              <dt>Minimum order</dt>
              <dd>
                {product.minimumOrderQuantity} {product.unit}
              </dd>
            </div>
            <div>
              <dt>Pricing</dt>
              <dd>On quotation</dd>
            </div>
          </dl>
          <BuyActions product={product} />
          <ul className="assurances">
            <li>
              <UserRoundX size={18} />
              No account required to request pricing
            </li>
            <li>
              <BadgeCheck size={18} />
              Quotation tailored to your quantities
            </li>
            <li>
              <MessageCircle size={18} />
              Questions? LINE ID <strong>{company.lineId}</strong>
            </li>
          </ul>
          <a className="help-card" href={`tel:${company.phoneLink}`}>
            <span>
              <Phone size={18} />
            </span>
            <div>
              <small>Need help choosing?</small>
              <strong>{company.phone}</strong>
            </div>
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
      <div className="pdp-info stagger reveal">
        <section className="info-card">
          <h2>About this product</h2>
          <p className="preserve-lines">
            {product.description ||
              "Contact our team for more information about this product."}
          </p>
        </section>
        <section className="info-card">
          <h2>Technical specifications</h2>
          {specs.length ? (
            <table className="spec-table">
              <tbody>
                {specs.map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Ask our team for detailed technical specifications.</p>
          )}
        </section>
        <aside className="info-card docs-card">
          <h3>
            <FileText size={18} /> Product documents
          </h3>
          {docs.map((m) => (
            <a
              className="doc-link"
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileDown size={20} />
              <span>{m.originalFilename}</span>
              <ArrowUpRight size={15} />
            </a>
          ))}
          {!docs.length && (
            <p className="muted">
              Datasheets can be requested from our sales team.
            </p>
          )}
          <Link href="/contact-us" className="link-arrow">
            Contact sales <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
      <RecentlyViewed excludeId={product.id} />
      <TrackRecentlyViewed product={product} />
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  ShieldCheck,
  MessageCircle,
  ClipboardCheck,
  Phone,
  PackageSearch,
  ListChecks,
  Send,
  Check,
  FolderOpen,
} from "lucide-react";
import { publicApi, optionalPage } from "@/lib/api/server";
import { CmsBlocks, ServiceError } from "@/components/site/content";
import { ProductCard } from "@/components/catalog/product-card";
import { company } from "@/lib/company";
import type { Product } from "@/lib/api/contracts";
import { Tilt } from "@/components/fx/tilt";
import { RecentlyViewed } from "@/components/store/recently-viewed";
function primaryImage(product?: Product) {
  return (
    product?.media.find((m) => m.kind === "IMAGE" && m.isPrimary) ??
    product?.media.find((m) => m.kind === "IMAGE")
  );
}
export default async function Home() {
  const [products, categories, page] = await Promise.all([
    // No featured filter exists in the API, so read a wide page and filter here.
    publicApi.products("limit=100").catch(() => null),
    publicApi.categories().catch(() => null),
    optionalPage("home").catch(() => null),
  ]);
  // Only products marked "Featured" in the admin appear on the homepage.
  const display = (products?.data ?? [])
    .filter((p) => p.isFeatured)
    .slice(0, 4);
  const spotlight = display.find((p) => primaryImage(p)) ?? display[0];
  const spotlightImage = primaryImage(spotlight);
  return (
    <>
      <section className="hero">
        <div className="hero-deco" aria-hidden>
          <span className="hero-blueprint" />
          <span className="hero-floor" />
        </div>
        <div className="container hero-layout">
          <div className="hero-text">
            <span className="kicker">
              Cleanroom supplies · Ayutthaya, Thailand
            </span>
            <h1 className="split-lines">
              <span className="line">
                <span>Cleanroom supplies</span>
              </span>{" "}
              <span className="line">
                <span>for your daily operations</span>
              </span>
            </h1>
            <p>
              Shop cleanroom tools and consumables, build your list, and get a
              business quotation tailored to your volumes — no account needed.
            </p>
            <form action="/products" className="hero-search" role="search">
              <Search size={20} />
              <input
                name="q"
                placeholder="Product name or SKU"
                aria-label="Search products"
              />
              <button type="submit" className="btn btn-accent">
                Search
              </button>
            </form>
            {categories && categories.data.length > 0 && (
              <div className="hero-chips">
                <span>Popular:</span>
                {categories.data.slice(0, 5).map((c) => (
                  <Link key={c.id} href={`/categories/${c.slug}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <div className="hero-cta">
              <Link className="btn btn-light btn-lg" href="/products">
                Shop the catalog <ArrowUpRight size={18} />
              </Link>
              <Link className="btn btn-ghost-light btn-lg" href="/contact-us">
                Talk to our team <ArrowRight size={17} />
              </Link>
            </div>
          </div>
          <Tilt className="hero-stage" max={7}>
            <div className="rig">
              <div className="gyro" aria-hidden>
                <span className="ring ring-a" />
                <span className="ring ring-b" />
                <span className="ring ring-c" />
              </div>
              {spotlight ? (
                <Link
                  href={`/products/${spotlight.slug}`}
                  className="showcase"
                  aria-label={`View ${spotlight.name}`}
                >
                  <span className="showcase-badge">Featured product</span>
                  <div className="showcase-image">
                    {spotlightImage ? (
                      <Image
                        src={spotlightImage.url}
                        alt=""
                        fill
                        unoptimized
                        priority
                        sizes="(max-width:900px) 80vw, 420px"
                      />
                    ) : (
                      <Image
                        src="/cleanroom.svg"
                        loading="eager"
                        alt=""
                        fill
                        priority
                        sizes="420px"
                      />
                    )}
                  </div>
                  <div className="showcase-info">
                    <div>
                      <span className="mono">{spotlight.sku}</span>
                      <strong>{spotlight.name}</strong>
                    </div>
                    <span className="showcase-go">
                      <ArrowUpRight size={20} />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="showcase">
                  <div className="showcase-image">
                    <Image
                      src="/cleanroom.svg"
                      loading="eager"
                      alt="Illustration of a controlled cleanroom environment"
                      fill
                      priority
                      sizes="420px"
                    />
                  </div>
                </div>
              )}
              <div className="float-card float-quote">
                <span className="float-icon">
                  <ClipboardCheck size={18} />
                </span>
                <div>
                  <small>Quotation</small>
                  <strong>3 simple steps</strong>
                </div>
              </div>
              <a
                className="float-card float-call"
                href={`tel:${company.phoneLink}`}
              >
                <span className="float-icon red">
                  <Phone size={17} />
                </span>
                <div>
                  <small>Call our team</small>
                  <strong>{company.phone}</strong>
                </div>
              </a>
            </div>
          </Tilt>
        </div>
        <div className="container hero-perks stagger reveal">
          {[
            [
              ShieldCheck,
              "Clear product specs",
              "SKU, unit & MOQ on every item",
            ],
            [
              ClipboardCheck,
              "Quotes, not checkout",
              "Pricing built for your volume",
            ],
            [
              MessageCircle,
              "Real people",
              `Phone, email or LINE ${company.lineId}`,
            ],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={title as string}>
                <I size={20} />
                <span>
                  <strong>{title as string}</strong>
                  {text as string}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {categories && categories.data.length > 0 && (
        <section className="block container reveal">
          <div className="block-head">
            <div>
              <span className="kicker">Shop by category</span>
              <h2>Supplies for controlled environments</h2>
            </div>
            <Link className="link-arrow" href="/products">
              Browse all products <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="bento stagger">
            {categories.data.map((c, index) => (
              <Tilt className="bento-cell" key={c.id} max={6}>
                <Link className="bento-tile" href={`/categories/${c.slug}`}>
                  <span className="tile-num mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="tile-icon">
                    <FolderOpen size={24} strokeWidth={1.5} />
                  </span>
                  <div className="tile-copy">
                    <h3>{c.name}</h3>
                    {c.description && <p>{c.description}</p>}
                    {c.children && c.children.length > 0 && (
                      <p className="tile-subs">
                        {c.children.map((child) => child.name).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="tile-go">
                    Shop {c.name} <ArrowUpRight size={16} />
                  </span>
                  <span className="glare" aria-hidden />
                </Link>
              </Tilt>
            ))}
          </div>
        </section>
      )}

      {(!products || display.length > 0) && (
        <section className="block block-tint">
          <div className="container reveal">
            <div className="block-head">
              <div>
                <span className="kicker">The collection</span>
                <h2>Featured products</h2>
              </div>
              <Link className="link-arrow" href="/products">
                View the full catalog <ArrowUpRight size={17} />
              </Link>
            </div>
            {!products ? (
              <ServiceError />
            ) : (
              <div className="product-grid stagger">
                {display.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
                {display.length < 4 && (
                  <Link href="/contact-us" className="promo-card">
                    <PackageSearch size={34} strokeWidth={1.4} />
                    <h3>Can’t find it?</h3>
                    <p>
                      Our range goes beyond the online catalog. Tell us the item
                      and we’ll source it for your quotation.
                    </p>
                    <span className="btn btn-light">
                      Ask our team <ArrowUpRight size={16} />
                    </span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="container">
        <RecentlyViewed title="Continue where you left off" />
      </div>

      <section className="block container reveal">
        <div className="block-head center">
          <div>
            <span className="kicker">How ordering works</span>
            <h2>From product list to business quotation</h2>
          </div>
        </div>
        <ol className="steps stagger">
          {[
            [
              PackageSearch,
              "Browse & add",
              "Find products and add them to your quote list — just like a shopping cart.",
            ],
            [
              ListChecks,
              "Set quantities",
              "Adjust volumes above each minimum order and note sizes or materials.",
            ],
            [
              Send,
              "Receive your quote",
              "Send your request. Our team replies with pricing for your business.",
            ],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof Send;
            return (
              <li key={title as string}>
                <span className="step-num mono">0{i + 1}</span>
                <span className="step-icon">
                  <I size={24} strokeWidth={1.6} />
                </span>
                <h3>{title as string}</h3>
                <p>{text as string}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="block container story reveal">
        <div className="story-visual">
          <Image
            src="/cleanroom.svg"
            loading="eager"
            alt="Illustration of a cleanroom workspace"
            fill
            sizes="(max-width:900px) 100vw, 50vw"
          />
          <div className="story-stamp">
            <strong>PTC</strong>
            <span>Peetop Corporation</span>
          </div>
        </div>
        <div className="story-copy">
          <span className="kicker">People behind the products</span>
          <h2>Cleanroom supplies from Ayutthaya</h2>
          <p className="lead">
            Your requirements come first. Our team helps you navigate cleanroom
            supplies and put together a quotation for your operation.
          </p>
          <CmsBlocks page={page} />
          <ul className="checks">
            {[
              "Direct contact with our sales team",
              "Quotations tailored to your quantities",
              "Datasheets available on request",
            ].map((t) => (
              <li key={t}>
                <Check size={16} />
                {t}
              </li>
            ))}
          </ul>
          <Link className="btn btn-dark" href="/about-us">
            Get to know Peetop <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="container cta-wrap reveal">
        <div className="cta">
          <span className="glow glow-a" aria-hidden />
          <span className="glow glow-b" aria-hidden />
          <div>
            <span className="kicker light">Let’s get to work</span>
            <h2>
              Tell us what you need
              <br />
              <em>We’ll prepare your quotation</em>
            </h2>
          </div>
          <div className="cta-actions">
            <Link className="btn btn-accent btn-lg" href="/request-quote">
              Request a quotation <ArrowUpRight size={19} />
            </Link>
            <span>
              or add us on LINE · <strong>{company.lineId}</strong>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  X,
  Phone,
  Mail,
  Search,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { useQuote } from "@/providers/app-provider";
import type { Settings } from "@/lib/api/contracts";
import { company } from "@/lib/company";
import { useStoreUI } from "@/components/store/store-ui";
import { ThemeToggle } from "./theme-toggle";
const announcements = [
  "No account needed to request a quotation",
  "Quotes built around your minimum order quantities",
  `Chat with our team on LINE · ID ${company.lineId}`,
  "Cleanroom tools & consumables from Ayutthaya, Thailand",
];
export function SiteHeader({ settings }: { settings?: Settings }) {
  const email = settings?.contactEmail || company.email;
  const phone = settings?.phone || company.phone;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mac, setMac] = useState(true);
  const { items } = useQuote();
  const { openSearch, openDrawer, categories } = useStoreUI();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setMega(false);
    setOpen(false);
  }, [pathname]);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const shopActive =
    pathname.startsWith("/products") || pathname.startsWith("/categories");
  return (
    <>
      <div className="announce" aria-label="Store announcements">
        <div className="announce-track">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1}>
              {announcements.map((text) => (
                <span key={text}>{text}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="announce-contact">
          <a href={`mailto:${email}`}>
            <Mail size={13} />
            {email}
          </a>
          <a href={`tel:${phone}`}>
            <Phone size={13} />
            {phone}
          </a>
        </div>
      </div>
      <header className={scrolled ? "nav-bar scrolled" : "nav-bar"}>
        <div className="container nav-inner">
          <Link
            className="logo"
            href="/"
            aria-label="Peetop Corporation homepage"
          >
            <span className="logo-mark">
              <Image
                src="/ptc-logo.svg"
                width={58}
                height={41}
                alt="PTC logo"
                priority
              />
            </span>
            <span className="logo-text">
              PEETOP<small>Cleanroom Supply</small>
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className={open ? "nav-links open" : "nav-links"}
          >
            <Link href="/" className={isActive("/") ? "active" : ""}>
              Home
            </Link>
            <div
              className={mega ? "mega-wrap open" : "mega-wrap"}
              onMouseEnter={() => setMega(true)}
              onMouseLeave={() => setMega(false)}
              onKeyDown={(e) => e.key === "Escape" && setMega(false)}
            >
              <Link href="/products" className={shopActive ? "active" : ""}>
                Shop
              </Link>
              <button
                type="button"
                className="mega-toggle"
                aria-expanded={mega}
                aria-controls="mega-panel"
                aria-label="Show shop categories"
                onClick={() => setMega((m) => !m)}
              >
                <ChevronDown size={15} />
              </button>
              <div id="mega-panel" className="mega">
                <div className="mega-col">
                  <p className="mega-label">Categories</p>
                  {categories.length ? (
                    categories.slice(0, 12).map((c) => (
                      <Link
                        key={c.id}
                        href={`/categories/${c.slug}`}
                        className="mega-link"
                      >
                        {c.name}
                        <ArrowUpRight size={13} />
                      </Link>
                    ))
                  ) : (
                    <p className="mega-note">Categories are being prepared.</p>
                  )}
                  <Link href="/products" className="link-arrow mega-all">
                    View all products <ArrowUpRight size={14} />
                  </Link>
                </div>
                <Link href="/request-quote" className="mega-promo">
                  <FileText size={22} strokeWidth={1.5} />
                  <strong>Request a business quotation</strong>
                  <span>
                    Send your product list and quantities. Our team replies with
                    pricing.
                  </span>
                  <em>
                    Start a quotation <ArrowUpRight size={14} />
                  </em>
                </Link>
              </div>
            </div>
            <Link
              href="/about-us"
              className={isActive("/about-us") ? "active" : ""}
            >
              About
            </Link>
            <Link
              href="/contact-us"
              className={isActive("/contact-us") ? "active" : ""}
            >
              Contact
            </Link>
            <Link href="/request-quote" className="nav-mobile-cta">
              Request a quote <ArrowUpRight size={17} />
            </Link>
          </nav>
          <div className="nav-actions">
            <button
              type="button"
              className="nav-search"
              onClick={openSearch}
              aria-label="Search the catalog"
              aria-keyshortcuts="Meta+K Control+K"
            >
              <Search size={17} />
              <span>Search products or SKU</span>
              <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
            </button>
            <button
              type="button"
              className="icon-only search-mobile"
              onClick={openSearch}
              aria-label="Search the catalog"
            >
              <Search size={18} />
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={openDrawer}
              className="quote-bag"
              aria-label={`Quotation list, ${items.length} item${items.length === 1 ? "" : "s"}`}
            >
              <ShoppingBag size={19} />
              <span className="quote-bag-label">Quote</span>
              {items.length > 0 && (
                <span className="quote-bag-count" key={items.length}>
                  {items.length}
                </span>
              )}
            </button>
            <button
              className="nav-toggle"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <span className="scroll-progress" aria-hidden />
      </header>
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { company } from "@/lib/company";
import type { Settings } from "@/lib/api/contracts";
export function SiteFooter({ settings }: { settings?: Settings }) {
  const phone = settings?.phone || company.phone;
  const email = settings?.contactEmail || company.email;
  return (
    <footer className="footer">
      <span className="glow glow-a" aria-hidden />
      <div className="container footer-top">
        <div className="footer-brand">
          <Link className="logo" href="/">
            <span className="logo-mark">
              <Image src="/ptc-logo.svg" width={58} height={41} alt="PTC" />
            </span>
            <span className="logo-text">
              PEETOP<small>Corporation Co., Ltd.</small>
            </span>
          </Link>
          <p>
            Your partner for cleanroom tools, consumables, and workplace
            essentials.
          </p>
          <Link href="/request-quote" className="btn btn-accent">
            Request a quotation <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="footer-col">
          <h3>Shop</h3>
          <Link href="/products">All products</Link>
          <Link href="/request-quote">My quotation</Link>
          <Link href="/products?sort=name_asc">Browse A–Z</Link>
        </div>
        <div className="footer-col">
          <h3>Company</h3>
          <Link href="/about-us">About Peetop</Link>
          <Link href="/contact-us">Contact us</Link>
          <Link href="/privacy">Privacy notice</Link>
        </div>
        <div className="footer-col">
          <h3>Let’s talk</h3>
          <a href={`tel:${phone}`}>
            <Phone size={15} />
            {phone}
          </a>
          <a href={`mailto:${email}`}>
            <Mail size={15} />
            {email}
          </a>
          <span>
            <MessageCircle size={15} />
            LINE ID: {company.lineId}
          </span>
          <span className="footer-address">
            <MapPin size={15} />
            {settings?.address || company.address}
          </span>
        </div>
      </div>
      <div className="footer-word" aria-hidden>
        PEETOP
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Peetop Corporation Co., Ltd.</span>
        <Link href="/admin/login">
          Admin access <ArrowUpRight size={12} />
        </Link>
      </div>
    </footer>
  );
}

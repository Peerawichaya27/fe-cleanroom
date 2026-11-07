import Link from "next/link";
import {
  ArrowRight,
  PackageSearch,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import type { Page } from "@/lib/api/contracts";
export function CmsBlocks({ page }: { page: Page | null }) {
  if (!page) return null;
  return (
    <div className="prose">
      {page.content.map((block, index) =>
        block.type === "paragraph" ? (
          <p key={index}>{block.text}</p>
        ) : block.type === "heading" ? (
          block.level === "h2" ? (
            <h2 key={index}>{block.text}</h2>
          ) : (
            <h3 key={index}>{block.text}</h3>
          )
        ) : (
          <ul key={index}>
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
export function EmptyState({
  title = "Products are being prepared",
  description = "Our team is updating the online catalog. Contact us with your requirements and we’ll help you find the right supplies.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <PackageSearch size={34} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="btn btn-dark" href="/contact-us">
        Contact our team <ArrowRight size={16} />
      </Link>
    </div>
  );
}
export function ServiceError() {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={22} />
      <div>
        <h3>We couldn’t load this content.</h3>
        <p>Please try again shortly, or contact our team directly.</p>
      </div>
      <a className="link-arrow" href="">
        Try again
      </a>
    </div>
  );
}
export function Breadcrumbs({ trail }: { trail: [string, string?][] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map(([label, href], i) => (
        <span key={i}>
          {i > 0 && <ChevronRight size={13} />}
          {href ? (
            <Link href={href}>{label}</Link>
          ) : (
            <span aria-current="page">{label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  trail,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  trail?: [string, string?][];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "page-banner compact" : "page-banner"}>
      <span className="glow glow-a" aria-hidden />
      <span className="glow glow-b" aria-hidden />
      <span className="hero-grid-lines" aria-hidden />
      <div className="page-banner-inner">
        {trail && <Breadcrumbs trail={trail} />}
        <span className="kicker light">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

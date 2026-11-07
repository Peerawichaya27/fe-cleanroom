import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="store container page-section">
      <div className="empty-state">
        <span className="kicker">404 · Page not found</span>
        <h1>Let’s find what you need.</h1>
        <p>This page or product is not available.</p>
        <Link href="/products" className="btn btn-dark">
          Browse the catalog
        </Link>
      </div>
    </main>
  );
}

"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="store container page-section">
      <div className="empty-state">
        <h1>Something interrupted this page.</h1>
        <p>
          Please try again. Your quotation selection is saved on this device.
        </p>
        <button className="btn btn-dark" onClick={reset}>
          Try again
        </button>
        <Link className="link-arrow" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}

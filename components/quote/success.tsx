"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
export function QuoteSuccess() {
  const [reference, setReference] = useState<string | null>(null);
  useEffect(() => {
    try {
      setReference(sessionStorage.getItem("ptc-rfq-reference"));
    } catch {}
  }, []);
  return (
    <div className="submission-success big">
      <span className="success-ring">
        <CheckCircle2 size={44} />
      </span>
      <span className="kicker">Request received</span>
      <h1>Thank you. We’ll take it from here.</h1>
      <p>Your quotation request has been submitted to the Peetop team.</p>
      {reference ? (
        <>
          <div className="ref-ticket">
            <span>Your reference</span>
            <strong className="mono">{reference}</strong>
          </div>
        </>
      ) : (
        <p>Please keep the reference shown after your original submission.</p>
      )}
      <p>
        Our team will review your requirements and contact you using the details
        you provided.
      </p>
      <Link className="btn btn-dark" href="/products">
        Back to products <ArrowUpRight size={18} />
      </Link>
    </div>
  );
}

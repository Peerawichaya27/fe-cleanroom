"use client";
import { useEffect } from "react";
/**
 * Adds `is-in` to `.reveal` elements as they enter the viewport, including
 * ones rendered later (navigation, filtering). Elements are only hidden while
 * `html.js-reveal` is set by the inline boot script, which removes it again
 * if this observer never starts, so content always ends up visible.
 */
export function RevealObserver() {
  useEffect(() => {
    (window as unknown as { __ptcReveal?: boolean }).__ptcReveal = true;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!("IntersectionObserver" in window) || reduce) {
      document.documentElement.classList.remove("js-reveal");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    // Track per effect run (not via DOM attributes) so a re-run of this effect,
    // e.g. React Strict Mode's double invoke, observes everything again.
    const seen = new WeakSet<Element>();
    const scan = () =>
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.is-in)")
        .forEach((n) => {
          if (seen.has(n)) return;
          seen.add(n);
          io.observe(n);
        });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}

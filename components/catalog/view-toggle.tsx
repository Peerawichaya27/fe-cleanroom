"use client";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
type View = "grid" | "list";
const KEY = "ptc-catalog-view";
/** Grid/list switch for catalog results; the choice is remembered per device. */
export function CatalogView({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  const [view, setView] = useState<View>("grid");
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "list") setView("list");
    } catch {}
  }, []);
  function choose(next: View) {
    setView(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  }
  return (
    <>
      <div className="results-bar">
        {summary}
        <div className="view-toggle" role="group" aria-label="Result layout">
          <button
            type="button"
            aria-pressed={view === "grid"}
            aria-label="Grid view"
            onClick={() => choose("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            aria-label="List view"
            onClick={() => choose("list")}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      <div className="catalog-results" data-view={view}>
        {children}
      </div>
    </>
  );
}

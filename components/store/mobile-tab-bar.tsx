"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useQuote } from "@/providers/app-provider";
import { useStoreUI } from "./store-ui";
/** App-style bottom navigation, shown on small screens only. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { items } = useQuote();
  const { openSearch, openDrawer, panel } = useStoreUI();
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      <Link href="/" className={pathname === "/" && !panel ? "active" : ""}>
        <Home size={20} />
        Home
      </Link>
      <Link
        href="/products"
        className={
          (pathname.startsWith("/products") ||
            pathname.startsWith("/categories")) &&
          !panel
            ? "active"
            : ""
        }
      >
        <LayoutGrid size={20} />
        Shop
      </Link>
      <button
        type="button"
        onClick={openSearch}
        className={panel === "search" ? "active" : ""}
      >
        <Search size={20} />
        Search
      </button>
      <button
        type="button"
        onClick={openDrawer}
        className={panel === "drawer" ? "active" : ""}
      >
        <span className="tabbar-icon">
          <ShoppingBag size={20} />
          {items.length > 0 && <b>{items.length}</b>}
        </span>
        Quote
      </button>
    </nav>
  );
}

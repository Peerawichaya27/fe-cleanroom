"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Category } from "@/lib/api/contracts";
import { QuoteDrawer } from "./quote-drawer";
import { CommandSearch } from "./command-search";
import { MobileTabBar } from "./mobile-tab-bar";
type Panel = "search" | "drawer" | null;
type StoreUI = {
  panel: Panel;
  openSearch: () => void;
  openDrawer: () => void;
  close: () => void;
  categories: Category[];
};
const Ctx = createContext<StoreUI | null>(null);
export function StoreUIProvider({
  children,
  categories,
}: {
  children: ReactNode;
  categories: Category[];
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const openSearch = useCallback(() => setPanel("search"), []);
  const openDrawer = useCallback(() => setPanel("drawer"), []);
  const close = useCallback(() => setPanel(null), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel((p) => (p === "search" ? null : "search"));
      } else if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        setPanel("search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("panel-open", panel !== null);
  }, [panel]);
  return (
    <Ctx.Provider value={{ panel, openSearch, openDrawer, close, categories }}>
      {children}
      <CommandSearch open={panel === "search"} onClose={close} />
      <QuoteDrawer open={panel === "drawer"} onClose={close} />
      <MobileTabBar />
    </Ctx.Provider>
  );
}
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}
export function useStoreUI() {
  const value = useContext(Ctx);
  if (!value) throw new Error("StoreUIProvider missing");
  return value;
}
/** Shared modal behaviour: Esc to close, focus the first target, restore focus after. */
export function useDialog(
  open: boolean,
  onClose: () => void,
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]");
    window.setTimeout(() => (first ?? node)?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && node) {
        const focusable = node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose, ref]);
}

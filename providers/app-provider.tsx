"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { z } from "zod";
const selectionSchema = z
  .array(
    z.object({
      productId: z.uuid(),
      quantity: z.number().int().positive(),
      requirements: z.string().max(5000).optional(),
    }),
  )
  .max(50);
export type QuoteItem = z.infer<typeof selectionSchema>[number];
type Context = {
  items: QuoteItem[];
  ready: boolean;
  add: (id: string, minimum: number) => boolean;
  update: (
    id: string,
    patch: Partial<Pick<QuoteItem, "quantity" | "requirements">>,
  ) => void;
  remove: (id: string) => void;
  clear: () => void;
  notice: string;
  notify: (text: string) => void;
};
const QuoteContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15000 },
        },
      }),
  );
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, notify] = useState("");
  useEffect(() => {
    try {
      const parsed = selectionSchema.safeParse(
        JSON.parse(localStorage.getItem("ptc-rfq") ?? "[]"),
      );
      if (parsed.success) setItems(parsed.data);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("ptc-rfq", JSON.stringify(items));
      } catch {}
  }, [items, ready]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => notify(""), 4000);
    return () => clearTimeout(id);
  }, [notice]);
  const add = (id: string, minimum: number) => {
    if (items.length >= 50 && !items.some((i) => i.productId === id)) {
      notify("You can select up to 50 products.");
      return false;
    }
    setItems((current) => {
      const existing = current.find((i) => i.productId === id);
      return existing
        ? current.map((i) =>
            i.productId === id ? { ...i, quantity: i.quantity + minimum } : i,
          )
        : [...current, { productId: id, quantity: minimum }];
    });
    notify("Product added to your quotation request.");
    return true;
  };
  return (
    <QueryClientProvider client={client}>
      <QuoteContext.Provider
        value={{
          items,
          ready,
          add,
          update: (id, patch) =>
            setItems((current) =>
              current.map((i) => (i.productId === id ? { ...i, ...patch } : i)),
            ),
          remove: (id) =>
            setItems((current) => current.filter((i) => i.productId !== id)),
          clear: () => setItems([]),
          notice,
          notify,
        }}
      >
        {children}
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => notify("")}
            >
              ×
            </button>
          </div>
        )}
      </QuoteContext.Provider>
    </QueryClientProvider>
  );
}
export function useQuote() {
  const value = useContext(QuoteContext);
  if (!value) throw new Error("Quote provider missing");
  return value;
}

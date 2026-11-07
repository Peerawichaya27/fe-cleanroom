"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useQuote } from "@/providers/app-provider";
import {
  useQuoteProducts,
  primaryImage,
} from "@/components/quote/use-quote-products";
import { useDialog } from "./store-ui";
export function QuoteDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { items, update, remove } = useQuote();
  const { data: products, isLoading } = useQuoteProducts();
  useDialog(open, onClose, ref);
  const units = items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <div
      className={open ? "sheet-root open" : "sheet-root"}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="sheet-scrim" onClick={onClose} />
      <div
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
      >
        <header className="drawer-head">
          <div>
            <span className="kicker">Quotation list</span>
            <h2 id="drawer-title">
              {items.length} {items.length === 1 ? "product" : "products"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close quotation list"
            data-autofocus
          >
            <X size={20} />
          </button>
        </header>
        <div className="drawer-body">
          {!items.length ? (
            <div className="drawer-empty">
              <span className="empty-icon">
                <ShoppingBag size={30} strokeWidth={1.4} />
              </span>
              <h3>Your list is empty</h3>
              <p>Add products from the catalog to request a quotation.</p>
              <Link href="/products" className="btn btn-dark" onClick={onClose}>
                Browse the catalog <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <ul className="drawer-list">
              {items.map((item) => {
                const product = products?.find((p) => p.id === item.productId);
                const image = primaryImage(product);
                const min = product?.minimumOrderQuantity ?? 1;
                return (
                  <li key={item.productId} className="drawer-item">
                    <span className="drawer-thumb">
                      {image ? (
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          unoptimized
                          sizes="72px"
                        />
                      ) : (
                        <Package size={24} strokeWidth={1.3} />
                      )}
                    </span>
                    <div className="drawer-item-main">
                      {product ? (
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={onClose}
                          className="drawer-name"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        <span className="drawer-name">
                          {isLoading ? "Loading…" : "Unavailable product"}
                        </span>
                      )}
                      <small className="mono">
                        {product?.sku}
                        {product && ` · MOQ ${min} ${product.unit}`}
                      </small>
                      <div className="drawer-qty">
                        <div className="stepper small">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={!product || item.quantity <= min}
                            onClick={() =>
                              update(item.productId, {
                                quantity: Math.max(min, item.quantity - 1),
                              })
                            }
                          >
                            <Minus size={13} />
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={!product}
                            onClick={() =>
                              update(item.productId, {
                                quantity: Math.min(
                                  2147483647,
                                  item.quantity + 1,
                                ),
                              })
                            }
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          className="icon-button"
                          aria-label={`Remove ${product?.name ?? "product"}`}
                          onClick={() => remove(item.productId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <footer className="drawer-foot">
            <dl>
              <div>
                <dt>Products</dt>
                <dd>{items.length}</dd>
              </div>
              <div>
                <dt>Total units</dt>
                <dd>{units.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Pricing</dt>
                <dd>On quotation</dd>
              </div>
            </dl>
            <Link
              href="/request-quote"
              className="btn btn-accent btn-lg btn-wide"
              onClick={onClose}
            >
              Review &amp; request quotation <ArrowRight size={17} />
            </Link>
            <p>
              <ShieldCheck size={14} /> No account needed · Our team replies
              with pricing
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}

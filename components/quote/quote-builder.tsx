"use client";
import Link from "next/link";
import Image from "next/image";
import {
  Trash2,
  ArrowUpRight,
  ShoppingBag,
  AlertCircle,
  Minus,
  Plus,
  Package,
} from "lucide-react";
import { useQuoteProducts, primaryImage } from "./use-quote-products";
import { useQuote } from "@/providers/app-provider";
import { GuestForm } from "@/components/forms/guest-form";
export function QuoteBuilder() {
  const { items, ready, update, remove, clear } = useQuote();
  const { data: products, isLoading, isError, refetch } = useQuoteProducts();
  if (!ready) return <p role="status">Loading your selection…</p>;
  if (!items.length)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <ShoppingBag size={34} strokeWidth={1.4} />
        </span>
        <h2>Your quotation starts here.</h2>
        <p>
          Browse products and add the items you need. For products not yet in
          our catalog, contact our team directly.
        </p>
        <Link className="btn btn-dark" href="/products">
          Explore our products <ArrowUpRight size={18} />
        </Link>
        <Link className="link-arrow" href="/contact-us">
          Contact our team instead
        </Link>
      </div>
    );
  const invalidQuantity = items.some((item) => {
    const product = products?.find((p) => p.id === item.productId);
    return product && item.quantity < product.minimumOrderQuantity;
  });
  const unavailable =
    !isLoading &&
    !isError &&
    items.some((item) => !products?.some((p) => p.id === item.productId));
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <div className="quote-layout">
      <ol className="quote-steps" aria-label="Quotation progress">
        <li className="done">
          <span>1</span>Selection
        </li>
        <li className="current">
          <span>2</span>Your details
        </li>
        <li>
          <span>3</span>Request sent
        </li>
      </ol>
      <section className="cart">
        <div className="selection-heading">
          <h2>
            Your selection <span>({items.length})</span>
          </h2>
          <button
            className="text-button"
            onClick={() => {
              if (
                window.confirm(
                  "Remove all products from your quotation selection?",
                )
              )
                clear();
            }}
          >
            Clear all
          </button>
        </div>
        {isError && (
          <div className="form-alert" role="alert">
            We couldn’t verify the selected products.{" "}
            <button onClick={() => refetch()}>Try again</button>
          </div>
        )}
        {isLoading ? (
          <p role="status">Checking current product information…</p>
        ) : (
          items.map((item) => {
            const product = products?.find((p) => p.id === item.productId);
            const image = primaryImage(product);
            const setQuantity = (value: number) =>
              product &&
              update(item.productId, {
                quantity: Math.max(
                  product.minimumOrderQuantity,
                  Math.min(2147483647, value || product.minimumOrderQuantity),
                ),
              });
            return (
              <article className="quote-item" key={item.productId}>
                <div className="quote-thumb">
                  {image ? (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      unoptimized
                      sizes="96px"
                    />
                  ) : (
                    <Package size={30} strokeWidth={1.2} />
                  )}
                </div>
                <div className="quote-item-main">
                  <div className="quote-item-title">
                    <div>
                      <span className="sku">
                        {product?.sku ?? "Unavailable product"}
                      </span>
                      <h3>
                        {product?.name ?? "This product is no longer available"}
                      </h3>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${product?.name ?? "unavailable product"}`}
                      onClick={() => remove(item.productId)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {product ? (
                    <>
                      <div className="quantity-field">
                        <label htmlFor={`quantity-${item.productId}`}>
                          Quantity ({product.unit})
                        </label>
                        <div className="stepper">
                          <button
                            type="button"
                            aria-label={`Decrease ${product.name} quantity`}
                            disabled={
                              item.quantity <= product.minimumOrderQuantity
                            }
                            onClick={() => setQuantity(item.quantity - 1)}
                          >
                            <Minus size={15} />
                          </button>
                          <input
                            id={`quantity-${item.productId}`}
                            type="number"
                            min={product.minimumOrderQuantity}
                            max={2147483647}
                            value={item.quantity}
                            onChange={(e) =>
                              setQuantity(Number(e.target.value))
                            }
                          />
                          <button
                            type="button"
                            aria-label={`Increase ${product.name} quantity`}
                            onClick={() => setQuantity(item.quantity + 1)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <span>Minimum {product.minimumOrderQuantity}</span>
                      </div>
                      <label className="field">
                        Item requirements{" "}
                        <textarea
                          rows={2}
                          maxLength={5000}
                          placeholder="Size, material, or other details (optional)"
                          value={item.requirements ?? ""}
                          onChange={(e) =>
                            update(item.productId, {
                              requirements: e.target.value,
                            })
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <p className="form-error">
                      Remove this item before sending your request.
                    </p>
                  )}
                </div>
              </article>
            );
          })
        )}
        <div className="cart-foot">
          <Link className="link-arrow" href="/products">
            Continue shopping <ArrowUpRight size={16} />
          </Link>
          <span>
            {items.length} {items.length === 1 ? "product" : "products"} ·{" "}
            {totalUnits.toLocaleString()} units
          </span>
        </div>
      </section>
      <section className="form-card sticky">
        <h2>Your business details</h2>
        <p className="muted">
          We’ll use these details to respond to your request.
        </p>
        {invalidQuantity && (
          <div className="form-alert">
            Update quantities to meet the current minimum order amounts.
          </div>
        )}
        {unavailable && (
          <div className="form-alert">
            <AlertCircle size={18} />
            Please remove unavailable products.
          </div>
        )}
        <GuestForm
          kind="rfq"
          items={items}
          disabled={isLoading || isError || unavailable || invalidQuantity}
        />
      </section>
    </div>
  );
}

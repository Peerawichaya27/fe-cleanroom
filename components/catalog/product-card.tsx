import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Package } from "lucide-react";
import type { Product } from "@/lib/api/contracts";
import { AddToQuote } from "@/components/quote/add-to-quote";
import { Tilt } from "@/components/fx/tilt";
export function ProductCard({ product }: { product: Product }) {
  const images = product.media.filter((m) => m.kind === "IMAGE");
  const image = images.find((m) => m.isPrimary) ?? images[0];
  const alternate = images.find((m) => m.id !== image?.id);
  return (
    <Tilt as="article" className="product-card" max={5}>
      <Link
        className="product-visual"
        href={`/products/${product.slug}`}
        tabIndex={-1}
        aria-hidden
      >
        {image ? (
          <>
            <Image
              className="img-main"
              src={image.url}
              alt=""
              fill
              sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 25vw"
              unoptimized
            />
            {alternate && (
              <Image
                className="img-alt"
                src={alternate.url}
                alt=""
                fill
                sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 25vw"
                unoptimized
              />
            )}
          </>
        ) : (
          <div className="product-placeholder">
            <Package size={54} strokeWidth={1} />
            <span>Product image coming soon</span>
          </div>
        )}
        <span className="product-badges">
          {product.isFeatured && (
            <span className="badge badge-hot">Featured</span>
          )}
          <span className="badge">MOQ {product.minimumOrderQuantity}</span>
        </span>
        <span className="product-open">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="product-body">
        <span className="sku mono">{product.sku}</span>
        <Link href={`/products/${product.slug}`} className="product-title">
          <h3>{product.name}</h3>
        </Link>
        {product.shortDescription && <p>{product.shortDescription}</p>}
        <div className="product-foot">
          <span className="unit">
            <small>Sold per</small>
            {product.unit}
          </span>
          <AddToQuote product={product} compact />
        </div>
      </div>
      <span className="glare" aria-hidden />
    </Tilt>
  );
}

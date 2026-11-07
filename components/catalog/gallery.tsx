"use client";
import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";
import type { Product } from "@/lib/api/contracts";
export function Gallery({ product }: { product: Product }) {
  const images = product.media.filter((m) => m.kind === "IMAGE");
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState(false);
  return (
    <div className="gallery">
      <div className="gallery-main">
        {images[selected] && !failed ? (
          <Image
            key={images[selected].id}
            src={images[selected].url}
            alt={product.name}
            fill
            unoptimized
            onError={() => setFailed(true)}
            sizes="(max-width:900px) 100vw, 55vw"
          />
        ) : (
          <div className="product-placeholder">
            <Package size={90} strokeWidth={0.8} />
            <span>Product image coming soon</span>
          </div>
        )}
        {images.length > 1 && (
          <span className="gallery-count mono">
            {selected + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setSelected(index);
                setFailed(false);
              }}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === selected}
            >
              <Image
                src={image.url}
                alt=""
                width={84}
                height={84}
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

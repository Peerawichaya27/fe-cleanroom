"use client";
import { useRef, type ReactNode, type CSSProperties } from "react";
/**
 * Pointer-driven 3D tilt. Writes --rx/--ry (degrees) and --gx/--gy (glare
 * position, %) to the element; all visuals live in CSS. Disabled for touch
 * and reduced-motion users.
 */
export function Tilt({
  children,
  className,
  max = 8,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  as?: "div" | "article" | "section";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const enabled = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || !enabled()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--ry", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      el.dataset.tilting = "true";
    });
  }
  function leave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    delete el.dataset.tilting;
  }
  return (
    <Tag
      ref={ref as never}
      className={className ? `tilt ${className}` : "tilt"}
      style={style}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </Tag>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
type Theme = "light" | "dark";
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    );
  }, []);
  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.dataset.theme = next;
    try {
      localStorage.setItem("ptc-theme", next);
    } catch {}
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-switching"), 500);
  }
  const label =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-theme-state={theme ?? "light"}
    >
      <span className="theme-icons" aria-hidden>
        <Sun size={18} />
        <Moon size={18} />
      </span>
    </button>
  );
}

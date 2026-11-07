import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./storefront.css";
import { AppProvider } from "@/providers/app-provider";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173",
  ),
  title: {
    default: "Peetop Corporation | Cleanroom Tools & Supplies",
    template: "%s | Peetop Corporation",
  },
  description:
    "Cleanroom tools, consumables, and workplace supplies from Peetop Corporation, Ayutthaya, Thailand.",
  icons: { icon: "/ptc-logo.svg" },
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070b1d" },
  ],
};
// Runs before first paint: applies the saved/system theme (no flash) and
// enables scroll-reveal styles, with a fallback that reveals everything if
// the client observer never starts.
const bootScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem("ptc-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t;}catch(e){}try{var r=document.documentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches){r.classList.add("js-reveal");setTimeout(function(){if(!window.__ptcReveal){r.classList.remove("js-reveal")}},3000)}}catch(e){}})();`;
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <AppProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { publicApi } from "@/lib/api/server";
import { RevealObserver } from "@/components/fx/reveal-observer";
import { StoreUIProvider } from "@/components/store/store-ui";
export const dynamic = "force-dynamic";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    publicApi
      .settings()
      .then((r) => r.data)
      .catch(() => undefined),
    publicApi
      .categories()
      .then((r) => r.data)
      .catch(() => []),
  ]);
  return (
    <div className="store">
      <StoreUIProvider categories={categories}>
        <SiteHeader settings={settings} />
        <main id="main">{children}</main>
        <SiteFooter settings={settings} />
        <RevealObserver />
      </StoreUIProvider>
    </div>
  );
}

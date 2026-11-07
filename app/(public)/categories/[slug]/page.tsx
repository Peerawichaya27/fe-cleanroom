import { notFound } from "next/navigation";
import { Catalog } from "@/components/catalog/catalog";
import { PageHeading } from "@/components/site/content";
import { publicApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const category = await publicApi
    .category(slug)
    .then((r) => r.data)
    .catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    });
  return (
    <section className="container page-section">
      <PageHeading
        eyebrow="Browse by category"
        title={category.name}
        description={category.description ?? undefined}
        trail={[["Home", "/"], ["Shop", "/products"], [category.name]]}
      />
      <Catalog search={await searchParams} category={slug} />
    </section>
  );
}

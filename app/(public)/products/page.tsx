import { Catalog } from "@/components/catalog/catalog";
import { PageHeading } from "@/components/site/content";
export const metadata = { title: "Products" };
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <section className="container page-section">
      <PageHeading
        eyebrow="The Peetop collection"
        title="The right supplies. Right here."
        description="Browse cleanroom tools and consumables, explore the specifications, and build your quotation request."
        trail={[["Home", "/"], ["Shop"]]}
      />
      <Catalog search={await searchParams} />
    </section>
  );
}

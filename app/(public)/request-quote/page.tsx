import { PageHeading } from "@/components/site/content";
import { QuoteBuilder } from "@/components/quote/quote-builder";
export const metadata = { title: "Request a quotation" };
export default function Quote() {
  return (
    <section className="container page-section">
      <PageHeading
        eyebrow="Built around your requirements"
        title="Let’s put your quotation together."
        description="Select your products, confirm quantities, and tell us a little about your business. No account required."
        trail={[["Home", "/"], ["Quotation"]]}
        compact
      />
      <QuoteBuilder />
    </section>
  );
}

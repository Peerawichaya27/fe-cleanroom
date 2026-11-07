import { QuoteSuccess } from "@/components/quote/success";
export const metadata = {
  title: "Quotation request received",
  robots: { index: false, follow: false },
};
export default function Success() {
  return (
    <section className="container page-section">
      <QuoteSuccess />
    </section>
  );
}

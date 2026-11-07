import { company } from "@/lib/company";
import { PageHeading } from "@/components/site/content";
export const metadata = { title: "Privacy information" };
export default function Privacy() {
  return (
    <section className="container page-section narrow">
      <PageHeading
        eyebrow="Before you submit"
        title="Privacy information"
        compact
      />
      <div className="prose prose-card">
        <p>
          Contact and quotation forms send your entered details to Peetop
          Corporation Co., Ltd. Our admin interface makes these submissions
          available to authorized staff.
        </p>
        <p>
          Product selections are saved on your own device. Admin session cookies
          support secure sign-in. This website does not include advertising
          trackers.
        </p>
        <h2>Company privacy notice pending approval</h2>
        <p>
          The company’s formal privacy notice, including retention periods and
          procedures for privacy requests, must be supplied and approved before
          production launch. This page is implementation information and is not
          a replacement for that notice.
        </p>
        <p>
          For questions before submitting information, contact{" "}
          <a href={`mailto:${company.email}`}>{company.email}</a> or{" "}
          <a href={`tel:${company.phoneLink}`}>{company.phone}</a>. Please do
          not submit sensitive personal information through these forms.
        </p>
      </div>
    </section>
  );
}

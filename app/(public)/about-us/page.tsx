import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  MapPin,
  Handshake,
  ClipboardList,
  MessagesSquare,
} from "lucide-react";
import { optionalPage, publicApi } from "@/lib/api/server";
import { CmsBlocks, PageHeading } from "@/components/site/content";
export const metadata = { title: "About us" };
export default async function About() {
  const [page, settings] = await Promise.all([
    optionalPage("about-us"),
    publicApi.settings().then((r) => r.data),
  ]);
  return (
    <section className="container page-section">
      <PageHeading
        eyebrow="Get to know Peetop"
        title={page?.title || "A partner for your everyday precision."}
        description={
          settings.companyDescription ||
          "Cleanroom tools and consumables, with people you can talk to."
        }
        trail={[["Home", "/"], ["About"]]}
      />
      <div className="story about-story reveal">
        <div className="story-visual">
          <Image
            src="/cleanroom.svg"
            loading="eager"
            alt="Illustration of a cleanroom workspace"
            fill
            sizes="(max-width:900px) 100vw, 50vw"
          />
          <div className="story-stamp">
            <MapPin size={16} />
            <span>Ayutthaya, Thailand</span>
          </div>
        </div>
        <div className="story-copy">
          <span className="kicker">Who we are</span>
          <h2>{settings.companyName}</h2>
          <p className="lead">
            Based in Ayutthaya, Thailand, our team is here to discuss your
            cleanroom supply requirements.
          </p>
          <CmsBlocks page={page} />
          <p>
            Browse the catalog, select the products you need, or get in touch
            directly. We’ll work with you on a quotation for your business.
          </p>
          <Link className="btn btn-dark" href="/contact-us">
            Meet your supply partner <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="values stagger reveal">
        {[
          [
            Handshake,
            "Practical partnership",
            "We focus on what your operation actually needs.",
          ],
          [
            ClipboardList,
            "Tailored quotations",
            "Pricing built around your products and quantities.",
          ],
          [
            MessagesSquare,
            "Personal support",
            "Talk to our team by phone, email or LINE.",
          ],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof Handshake;
          return (
            <div className="value-card" key={title as string}>
              <span className="step-icon">
                <I size={22} strokeWidth={1.6} />
              </span>
              <h3>{title as string}</h3>
              <p>{text as string}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

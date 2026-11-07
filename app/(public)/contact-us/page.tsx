import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { publicApi } from "@/lib/api/server";
import { company } from "@/lib/company";
import { PageHeading } from "@/components/site/content";
import { GuestForm } from "@/components/forms/guest-form";
export const metadata = { title: "Contact us" };
export default async function Contact() {
  const settings = await publicApi.settings().then((r) => r.data);
  const address = settings.address || company.address;
  return (
    <section className="container page-section">
      <PageHeading
        eyebrow="Let’s talk"
        title="Contact our cleanroom supply team"
        description="Have a product in mind or a question about your requirements? We’re here to help."
        trail={[["Home", "/"], ["Contact"]]}
      />
      <div className="contact-layout reveal">
        <aside className="contact-side">
          <h2>Contact Peetop</h2>
          <p>Reach our team directly, or leave us a message using the form.</p>
          <div className="contact-cards">
            <a
              className="contact-card"
              href={`tel:${settings.phone || company.phone}`}
            >
              <span className="contact-icon">
                <Phone size={20} />
              </span>
              <span>
                <small>Call us</small>
                <strong>{settings.phone || company.phone}</strong>
              </span>
              <ArrowUpRight size={17} />
            </a>
            <a
              className="contact-card"
              href={`mailto:${settings.contactEmail}`}
            >
              <span className="contact-icon">
                <Mail size={20} />
              </span>
              <span>
                <small>Email us</small>
                <strong>{settings.contactEmail}</strong>
              </span>
              <ArrowUpRight size={17} />
            </a>
            <div className="contact-card">
              <span className="contact-icon line">
                <MessageCircle size={20} />
              </span>
              <span>
                <small>Find us on LINE</small>
                <strong>ID: {company.lineId}</strong>
              </span>
            </div>
          </div>
          <div className="address-card">
            <span className="contact-icon">
              <MapPin size={20} />
            </span>
            <div>
              <small>Our address</small>
              <p>{address}</p>
              <a
                className="link-arrow"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              >
                Open in Google Maps <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <p className="side-note">
            <Clock size={15} /> Messages go straight to our sales team.
          </p>
        </aside>
        <div className="form-card">
          <h2>Send us an inquiry</h2>
          <p className="muted">Fields marked * are required.</p>
          <GuestForm />
        </div>
      </div>
    </section>
  );
}

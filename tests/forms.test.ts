import { describe, it, expect } from "vitest";
import { contactFormSchema, rfqFormSchema } from "@/lib/schemas/forms";
describe("Guest form validation", () => {
  const contact = {
    name: "Jane",
    email: "jane@example.com",
    subject: "Gloves",
    message: "Please quote cleanroom gloves.",
    consent: true,
  };
  it("accepts submissions without a challenge and requires consent", () => {
    expect(contactFormSchema.safeParse(contact).success).toBe(true);
    expect(
      contactFormSchema.safeParse({ ...contact, consent: false }).success,
    ).toBe(false);
  });
  it("requires contact company for a quotation", () => {
    expect(
      rfqFormSchema.safeParse({
        contactName: "Jane",
        company: "",
        email: "jane@example.com",
        consent: true,
      }).success,
    ).toBe(false);
  });
  it("rejects invalid emails and short inquiries", () => {
    expect(
      contactFormSchema.safeParse({ ...contact, email: "invalid" }).success,
    ).toBe(false);
    expect(
      contactFormSchema.safeParse({ ...contact, message: "short" }).success,
    ).toBe(false);
  });
});

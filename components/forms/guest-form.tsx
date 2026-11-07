"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { contactFormSchema, rfqFormSchema } from "@/lib/schemas/forms";
import { api, ApiError } from "@/lib/api/client";
import { acknowledgmentSchema } from "@/lib/api/contracts";
import { useQuote, type QuoteItem } from "@/providers/app-provider";
export function GuestForm({
  kind = "contact",
  items,
  disabled = false,
}: {
  kind?: "contact" | "rfq";
  items?: QuoteItem[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const { clear } = useQuote();
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const schema = kind === "rfq" ? rfqFormSchema : contactFormSchema;
  type Values =
    z.infer<typeof contactFormSchema> | z.infer<typeof rfqFormSchema>;
  const {
    register,
    handleSubmit,
    setError: fieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      phone: "",
      company: "",
      message: "",
      consent: false,
    },
  });
  const fields =
    kind === "contact"
      ? [
          ["name", "Your name", "text", true],
          ["company", "Company", "text", false],
          ["email", "Email address", "email", true],
          ["phone", "Phone number", "tel", false],
          ["subject", "How can we help?", "text", true],
        ]
      : [
          ["contactName", "Your name", "text", true],
          ["company", "Company", "text", true],
          ["email", "Email address", "email", true],
          ["phone", "Phone number", "tel", false],
        ];
  async function submit(values: Values) {
    setError("");
    try {
      const result = await api(
        kind === "rfq" ? "quotation-requests" : "contact-inquiries",
        acknowledgmentSchema,
        {
          method: "POST",
          body: JSON.stringify({
            ...values,
            ...(kind === "rfq" ? { items } : {}),
          }),
        },
      );
      if (kind === "rfq") {
        try {
          sessionStorage.setItem("ptc-rfq-reference", result.data.reference);
        } catch {}
        clear();
        router.push("/request-quote/success");
      } else setReference(result.data.reference);
    } catch (e) {
      if (e instanceof ApiError && e.details)
        for (const issue of e.details) {
          const key = issue.path as keyof Values;
          fieldError(key, { message: issue.message });
        }
      setError(
        e instanceof Error ? e.message : "Unable to submit. Please try again.",
      );
    }
  }
  if (reference)
    return (
      <div className="submission-success" role="status">
        <CheckCircle2 size={40} />
        <h2>Your message is with our team.</h2>
        <p>
          Thank you for contacting Peetop. Keep this reference for your records.
        </p>
        <strong>{reference}</strong>
        <p>This confirms receipt of your inquiry.</p>
        <button
          className="btn btn-outline"
          onClick={() => {
            setReference("");
            router.refresh();
          }}
        >
          Send another inquiry
        </button>
      </div>
    );
  return (
    <form className="guest-form" onSubmit={handleSubmit(submit)} noValidate>
      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}
      <div className="form-grid">
        {fields.map(([name, label, type, required]) => {
          const key = name as keyof Values;
          const issue = errors[key];
          return (
            <div
              className={name === "subject" ? "field full" : "field"}
              key={String(name)}
            >
              <label htmlFor={String(name)}>
                {label}
                {required && <span> *</span>}
              </label>
              <input
                id={String(name)}
                type={String(type)}
                {...register(key)}
                aria-invalid={!!issue}
                aria-describedby={issue ? `${name}-error` : undefined}
                autoComplete={
                  name === "contactName" || name === "name"
                    ? "name"
                    : name === "email"
                      ? "email"
                      : name === "phone"
                        ? "tel"
                        : name === "company"
                          ? "organization"
                          : undefined
                }
              />
              {issue && (
                <span id={`${name}-error`} className="form-error">
                  {issue.message}
                </span>
              )}
            </div>
          );
        })}
        <div className="field full">
          <label htmlFor="message">
            {kind === "rfq" ? "Additional requirements" : "Your message"}
            {kind === "contact" && " *"}
          </label>
          <textarea
            id="message"
            rows={5}
            placeholder={
              kind === "rfq"
                ? "Tell us about delivery preferences or other requirements."
                : "Tell us what you’re looking for."
            }
            {...register("message")}
            aria-invalid={!!errors.message}
            aria-describedby="message-error"
          />
          {errors.message && (
            <span id="message-error" className="form-error">
              {errors.message.message}
            </span>
          )}
        </div>
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          {...register("consent")}
          aria-describedby="consent-error"
        />
        <span>
          I have read the{" "}
          <Link href="/privacy" target="_blank">
            privacy information
          </Link>{" "}
          and agree to submit my contact details with this request. *
        </span>
      </label>
      {errors.consent && (
        <p id="consent-error" className="form-error">
          {errors.consent.message}
        </p>
      )}
      <button
        className="btn btn-accent btn-lg btn-wide"
        type="submit"
        disabled={isSubmitting || disabled}
      >
        {isSubmitting ? (
          <>
            <LoaderCircle size={18} className="spin" />
            Submitting…
          </>
        ) : (
          <>
            {kind === "rfq" ? "Send quotation request" : "Send your inquiry"}
            <ArrowUpRight size={18} />
          </>
        )}
      </button>
      <p className="form-note">
        No account needed. Your request goes directly to our team.
      </p>
    </form>
  );
}

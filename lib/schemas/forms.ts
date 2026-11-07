import { z } from "zod";
export const guestFields = {
  email: z.email("Enter a valid email address.").max(254),
  phone: z.string().max(50).optional(),
  message: z.string().max(10000).optional(),
  consent: z
    .boolean()
    .refine(Boolean, "Please acknowledge the privacy information."),
};
export const contactFormSchema = z.object({
  ...guestFields,
  name: z.string().trim().min(1, "Enter your name.").max(160),
  company: z.string().max(200).optional(),
  subject: z.string().trim().min(1, "Enter a subject.").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please enter at least 10 characters.")
    .max(10000),
});
export const rfqFormSchema = z.object({
  ...guestFields,
  contactName: z.string().trim().min(1, "Enter your name.").max(160),
  company: z.string().trim().min(1, "Enter your company name.").max(200),
});
export const loginFormSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

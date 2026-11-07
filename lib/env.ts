import "server-only";
import { z } from "zod";
const httpUrl = z
  .url()
  .refine((value) => /^https?:\/\//.test(value), "HTTP(S) URL required");
const schema = z.object({
  API_INTERNAL_URL: httpUrl.default("http://localhost:3000/api/v1"),
  NEXT_PUBLIC_SITE_URL: httpUrl.default("http://localhost:5173"),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success)
  throw new Error(
    `Invalid frontend environment: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
  );
export const serverEnv = parsed.data;

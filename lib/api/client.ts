import { z } from "zod";
import { errorSchema, metaSchema, type Meta } from "./contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { path: string; message: string }[],
    public requestId?: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
  base = "/api/backend",
): Promise<{ data: T; meta?: Meta }> {
  let response: Response;
  try {
    response = await fetch(`${base}/${path.replace(/^\//, "")}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      "The service is unavailable. Please try again shortly.",
    );
  }
  if (response.status === 204) return { data: undefined as T };
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = errorSchema.safeParse(body);
    throw new ApiError(
      response.status,
      error.success
        ? error.data.error.message
        : "The request could not be completed.",
      error.success ? error.data.error.details : undefined,
      error.success ? error.data.requestId : undefined,
    );
  }
  const parsed = z
    .object({ data: schema, meta: metaSchema.optional() })
    .safeParse(body);
  if (!parsed.success)
    throw new ApiError(502, "The service returned an unexpected response.");
  return parsed.data;
}

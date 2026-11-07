import "server-only";
import { serverEnv } from "../env";
import { api, ApiError } from "./client";
import {
  productSchema,
  categorySchema,
  settingsSchema,
  pageSchema,
} from "./contracts";
import { z } from "zod";
const base = serverEnv.API_INTERNAL_URL;
export const publicApi = {
  products: (query = "") =>
    api(
      `products${query ? "?" + query : ""}`,
      z.array(productSchema),
      {},
      base,
    ),
  product: (slug: string) =>
    api(`products/${encodeURIComponent(slug)}`, productSchema, {}, base),
  categories: () => api("categories", z.array(categorySchema), {}, base),
  category: (slug: string) =>
    api(`categories/${encodeURIComponent(slug)}`, categorySchema, {}, base),
  settings: () => api("site-settings", settingsSchema, {}, base),
  page: (slug: string) => api(`pages/${slug}`, pageSchema, {}, base),
};
export async function optionalPage(slug: string) {
  try {
    return (await publicApi.page(slug)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

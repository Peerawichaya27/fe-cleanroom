import { z } from "zod";
export const adminSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string(),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]),
  status: z.enum(["ACTIVE", "DISABLED"]),
});
export type Admin = z.infer<typeof adminSchema>;
export const mediaSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["IMAGE", "DATASHEET"]),
  mimeType: z.string(),
  originalFilename: z.string(),
  url: z.url(),
  sortOrder: z.number(),
  isPrimary: z.boolean(),
});
export const productSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  sku: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string().nullable(),
  description: z.string().nullable(),
  specifications: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
  unit: z.string(),
  minimumOrderQuantity: z.number().int().positive(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  isFeatured: z.boolean(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  media: z.array(mediaSchema),
});
export type Product = z.infer<typeof productSchema>;
export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
};
export const categorySchema: z.ZodType<Category> = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  children: z.lazy(() => z.array(categorySchema)).optional(),
});
export const settingsSchema = z.object({
  companyName: z.string(),
  companyDescription: z.string().nullable(),
  contactEmail: z.email(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  socialLinks: z.record(z.string(), z.string()),
  logoMediaId: z.string().nullable(),
});
export type Settings = z.infer<typeof settingsSchema>;
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("heading"),
    text: z.string(),
    level: z.enum(["h2", "h3"]),
  }),
  z.object({ type: z.literal("list"), items: z.array(z.string()) }),
]);
export const pageSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  content: z.array(blockSchema),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  publishedAt: z.string().nullable(),
});
export type Page = z.infer<typeof pageSchema>;
export const metaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type Meta = z.infer<typeof metaSchema>;
export const acknowledgmentSchema = z.object({
  reference: z.string(),
  status: z.literal("NEW"),
  submittedAt: z.string(),
});
export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  }),
  requestId: z.string().optional(),
});
export function flattenCategories(nodes: Category[]): Category[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenCategories(node.children ?? []),
  ]);
}

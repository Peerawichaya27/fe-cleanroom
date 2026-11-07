"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Upload, GripVertical } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import {
  productSchema,
  categorySchema,
  pageSchema,
  settingsSchema,
  adminSchema,
  type Product,
  type Page,
  type Settings,
} from "@/lib/api/contracts";
import { cmsPages } from "@/lib/company";
import { slugify } from "@/lib/utils";
import { AdminError, SaveButton, StatusBadge } from "./shared";
import { useQuote } from "@/providers/app-provider";
const simpleText = z.string().trim().min(1, "This field is required.");
const productForm = z.object({
  name: simpleText.max(200),
  sku: simpleText.max(100),
  slug: simpleText.regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens.",
  ),
  categoryId: z.uuid("Choose a category."),
  shortDescription: z.string().max(500),
  description: z.string().max(30000),
  unit: simpleText.max(40),
  minimumOrderQuantity: z.coerce.number().int().min(1).max(2147483647),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  isFeatured: z.boolean(),
  seoTitle: z.string().max(160),
  seoDescription: z.string().max(500),
});
const categoryForm = z.object({
  name: simpleText.max(160),
  slug: simpleText.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(5000),
  parentId: z.string(),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});
const userForm = z.object({
  email: z.email(),
  displayName: simpleText.max(120),
  password: z
    .string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]),
});
export function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const { notify } = useQuote();
  const [specs, setSpecs] = useState<[string, string][]>([]);
  const [media, setMedia] = useState<Product["media"]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin", "product", id],
    enabled: !!id,
    queryFn: () => adminApi(`admin/products/${id}`, productSchema),
  });
  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi("admin/categories", z.array(categorySchema)),
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<
    z.input<typeof productForm>,
    unknown,
    z.output<typeof productForm>
  >({
    resolver: zodResolver(productForm),
    defaultValues: {
      name: "",
      sku: "",
      slug: "",
      categoryId: "",
      shortDescription: "",
      description: "",
      unit: "box",
      minimumOrderQuantity: 1,
      status: "DRAFT",
      isFeatured: false,
      seoTitle: "",
      seoDescription: "",
    },
  });
  useEffect(() => {
    if (data) {
      reset({
        ...data.data,
        shortDescription: data.data.shortDescription ?? "",
        description: data.data.description ?? "",
        seoTitle: data.data.seoTitle ?? "",
        seoDescription: data.data.seoDescription ?? "",
      });
      setSpecs(
        Object.entries(data.data.specifications).map(([k, v]) => [
          k,
          String(v),
        ]),
      );
      setMedia(data.data.media);
    }
  }, [data, reset]);
  const save = useMutation({
    mutationFn: async (values: z.output<typeof productForm>) => {
      const { status, ...fields } = values;
      const keys = specs.filter(([k]) => k.trim()).map(([k]) => k.trim());
      if (new Set(keys).size !== keys.length)
        throw new Error("Specification keys must be unique.");
      const payload = {
        ...fields,
        specifications: Object.fromEntries(specs.filter(([k]) => k.trim())),
        media: media.map((m, index) => ({
          mediaAssetId: m.id,
          sortOrder: index,
          isPrimary: m.isPrimary,
        })),
      };
      const created = await adminApi(
        id ? `admin/products/${id}` : "admin/products",
        productSchema,
        {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify({ ...payload, ...(id ? { status } : {}) }),
        },
      );
      if (!id && status !== "DRAFT") {
        try {
          await adminApi(`admin/products/${created.data.id}`, productSchema, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
        } catch (error) {
          router.replace(`/admin/products/${created.data.id}/edit`);
          throw new Error(
            `Draft saved, but publication failed: ${error instanceof Error ? error.message : "Please check required fields."}`,
          );
        }
      }
      return created;
    },
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: ["admin"] });
      notify("Product saved.");
      router.replace(`/admin/products/${result.data.id}/edit`);
    },
  });
  async function upload(file: File) {
    setUploadError("");
    const kind = file.type === "application/pdf" ? "DATASHEET" : "IMAGE";
    if (
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        file.type,
      ) ||
      file.size > (kind === "IMAGE" ? 5 : 20) * 1024 * 1024
    ) {
      setUploadError("Use JPEG, PNG or WebP up to 5 MiB, or PDF up to 20 MiB.");
      return;
    }
    setUploading(true);
    try {
      const pending = await adminApi(
        "admin/media/upload-url",
        z.object({
          id: z.uuid(),
          uploadUrl: z.url(),
          expiresIn: z.number(),
          headers: z.record(z.string(), z.string()),
        }),
        {
          method: "POST",
          body: JSON.stringify({
            originalFilename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            kind,
          }),
        },
      );
      const result = await fetch(pending.data.uploadUrl, {
        method: "PUT",
        headers: pending.data.headers,
        body: file,
      });
      if (!result.ok) throw new Error("Storage upload failed.");
      await adminApi(
        "admin/media/complete",
        z.object({ id: z.uuid(), status: z.literal("READY") }),
        { method: "POST", body: JSON.stringify({ id: pending.data.id }) },
      );
      setMedia((current) => [
        ...current,
        {
          id: pending.data.id,
          kind,
          mimeType: file.type,
          originalFilename: file.name,
          url: "",
          sortOrder: current.length,
          isPrimary: kind === "IMAGE" && !current.some((m) => m.isPrimary),
        },
      ]);
      notify("File verified. Save the product to attach it.");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  if (error) return <AdminError error={error} />;
  if (id && isLoading) return <p role="status">Loading product…</p>;
  const fields = [
    ["name", "Product name"],
    ["sku", "SKU"],
    ["slug", "URL slug"],
    ["unit", "Unit"],
    ["minimumOrderQuantity", "Minimum order quantity"],
    ["seoTitle", "SEO title"],
    ["seoDescription", "SEO description"],
  ] as const;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <Link className="text-link" href="/admin/products">
            ← Products
          </Link>
          <h1>{id ? "Edit product" : "Create a product"}</h1>
          <p>Clear information helps customers choose the right supplies.</p>
        </div>
        {data && <StatusBadge status={data.data.status} />}
      </div>
      <form
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="editor-layout"
        noValidate
      >
        <section className="admin-panel editor-panel">
          <h2>Product information</h2>
          <div className="form-grid">
            {fields.map(([name, label]) => (
              <div className="field" key={name}>
                <label htmlFor={name}>{label}</label>
                <input
                  id={name}
                  type={name === "minimumOrderQuantity" ? "number" : "text"}
                  {...register(name)}
                  onBlur={
                    name === "name"
                      ? () => {
                          if (!getValues("slug"))
                            setValue("slug", slugify(getValues("name")));
                        }
                      : undefined
                  }
                  aria-invalid={!!errors[name]}
                />
                {errors[name] && (
                  <span className="form-error">
                    {String(errors[name]?.message)}
                  </span>
                )}
              </div>
            ))}
            <div className="field">
              <label htmlFor="categoryId">Category</label>
              <select id="categoryId" {...register("categoryId")}>
                <option value="">Choose category</option>
                {categories?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.isActive ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <span className="form-error">{errors.categoryId.message}</span>
              )}
            </div>
            <div className="field full">
              <label htmlFor="shortDescription">Short description</label>
              <textarea
                id="shortDescription"
                rows={3}
                {...register("shortDescription")}
              />
            </div>
            <div className="field full">
              <label htmlFor="description">Full description</label>
              <textarea
                id="description"
                rows={6}
                {...register("description")}
              />
            </div>
          </div>
          <h2>Technical specifications</h2>
          {specs.map(([key, value], index) => (
            <div className="spec-editor" key={index}>
              <input
                aria-label={`Specification ${index + 1} name`}
                value={key}
                placeholder="Specification name"
                onChange={(e) =>
                  setSpecs((current) =>
                    current.map((row, i) =>
                      i === index ? [e.target.value, row[1]] : row,
                    ),
                  )
                }
              />
              <input
                aria-label={`Specification ${index + 1} value`}
                value={value}
                placeholder="Value"
                onChange={(e) =>
                  setSpecs((current) =>
                    current.map((row, i) =>
                      i === index ? [row[0], e.target.value] : row,
                    ),
                  )
                }
              />
              <button
                className="icon-button"
                type="button"
                aria-label="Remove specification"
                onClick={() =>
                  setSpecs((current) => current.filter((_, i) => i !== index))
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button button-outline button-sm"
            onClick={() => setSpecs([...specs, ["", ""]])}
          >
            <Plus size={15} />
            Add specification
          </button>
          <h2>Images & datasheets</h2>
          <label className="upload-zone">
            <Upload size={23} />
            <strong>
              {uploading
                ? "Uploading and verifying…"
                : "Choose a product image or PDF"}
            </strong>
            <span>Images up to 5 MiB · PDFs up to 20 MiB</span>
            <input
              aria-label="Upload product file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
          {uploadError && (
            <p className="form-error" role="alert">
              {uploadError}
            </p>
          )}
          {media.map((m, index) => (
            <div className="media-row" key={m.id}>
              <GripVertical size={16} />
              <span>
                {m.originalFilename}
                <small>{m.kind} · Ready</small>
              </span>
              {m.kind === "IMAGE" && (
                <label>
                  <input
                    type="radio"
                    name="primary-image"
                    checked={m.isPrimary}
                    onChange={() =>
                      setMedia((current) =>
                        current.map((item) => ({
                          ...item,
                          isPrimary: item.id === m.id,
                        })),
                      )
                    }
                  />
                  Primary
                </label>
              )}
              <button
                type="button"
                className="text-button"
                disabled={index === 0}
                onClick={() =>
                  setMedia((current) => {
                    const next = [...current];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    return next;
                  })
                }
              >
                Move up
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${m.originalFilename}`}
                onClick={() =>
                  setMedia((current) =>
                    current.filter((item) => item.id !== m.id),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </section>
        <aside className="admin-panel editor-panel editor-aside">
          <h2>Publication</h2>
          <label className="field">
            Status
            <select aria-label="Status" {...register("status")}>
              <option>DRAFT</option>
              <option>PUBLISHED</option>
              <option>ARCHIVED</option>
            </select>
          </label>
          <label className="checkbox-field">
            <input type="checkbox" {...register("isFeatured")} />
            Feature on homepage
          </label>
          <p className="muted">
            Published products require a short description, unit, and active
            category.
          </p>
          {save.error && <AdminError error={save.error} />}
          <SaveButton
            pending={save.isPending || uploading}
            label={id ? "Save product" : "Create product"}
          />
        </aside>
      </form>
    </>
  );
}

export function CategoryEditor({ id }: { id?: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const { notify } = useQuote();
  const { data, error } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi("admin/categories", z.array(categorySchema)),
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<
    z.input<typeof categoryForm>,
    unknown,
    z.output<typeof categoryForm>
  >({
    resolver: zodResolver(categoryForm),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parentId: "",
      sortOrder: 0,
      isActive: true,
    },
  });
  const existing = data?.data.find((c) => c.id === id);
  useEffect(() => {
    if (existing)
      reset({
        ...existing,
        parentId: existing.parentId ?? "",
        description: existing.description ?? "",
      });
  }, [existing, reset]);
  const save = useMutation({
    mutationFn: (values: z.output<typeof categoryForm>) =>
      adminApi(
        id ? `admin/categories/${id}` : "admin/categories",
        categorySchema,
        {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify({
            ...values,
            parentId: values.parentId || null,
          }),
        },
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "categories"] });
      notify("Category saved.");
      router.push("/admin/categories");
    },
  });
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/categories" className="text-link">
            ← Categories
          </Link>
          <h1>{id ? "Edit category" : "Create a category"}</h1>
        </div>
      </div>
      <form
        className="admin-panel editor-panel narrow"
        onSubmit={handleSubmit((v) => save.mutate(v))}
        noValidate
      >
        {error && <AdminError error={error} />}{" "}
        {(["name", "slug", "description", "sortOrder"] as const).map((name) => (
          <label key={name} className="field">
            {name === "sortOrder"
              ? "Sort order"
              : name[0].toUpperCase() + name.slice(1)}
            <input
              type={name === "sortOrder" ? "number" : "text"}
              {...register(name)}
              onBlur={
                name === "name"
                  ? () => {
                      if (!getValues("slug"))
                        setValue("slug", slugify(getValues("name")));
                    }
                  : undefined
              }
            />
            {errors[name] && (
              <span className="form-error">
                {String(errors[name]?.message)}
              </span>
            )}
          </label>
        ))}
        <label className="field">
          Parent category
          <select {...register("parentId")}>
            <option value="">None (top level)</option>
            {data?.data
              .filter((c) => c.id !== id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <label className="checkbox-field">
          <input type="checkbox" {...register("isActive")} />
          Active
        </label>
        {save.error && <AdminError error={save.error} />}
        <SaveButton pending={save.isPending} />
      </form>
    </>
  );
}

export function CmsEditor({ id }: { id: string }) {
  const client = useQueryClient();
  const { notify } = useQuote();
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin", "page", id],
    queryFn: () => adminApi(`admin/pages/${id}`, pageSchema),
  });
  const [draft, setDraft] = useState<Page | null>(null);
  useEffect(() => {
    if (data) setDraft(data.data);
  }, [data]);
  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Page not loaded.");
      return adminApi(`admin/pages/${id}`, pageSchema, {
        method: "PATCH",
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          status: draft.status,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
        }),
      });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "page", id] });
      notify("Website content saved.");
    },
  });
  if (error) return <AdminError error={error} />;
  if (isLoading || !draft) return <p role="status">Loading content…</p>;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/pages" className="text-link">
            ← Website content
          </Link>
          <h1>Edit {draft.slug === "home" ? "homepage" : "About Us"}</h1>
        </div>
        <StatusBadge status={draft.status} />
      </div>
      <form
        className="admin-panel editor-panel"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="form-grid">
          <label className="field">
            Title
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="field">
            Status
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as Page["status"] })
              }
            >
              <option>DRAFT</option>
              <option>PUBLISHED</option>
            </select>
          </label>
          <label className="field">
            SEO title
            <input
              value={draft.seoTitle ?? ""}
              onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })}
            />
          </label>
          <label className="field">
            SEO description
            <input
              value={draft.seoDescription ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, seoDescription: e.target.value })
              }
            />
          </label>
        </div>
        <h2>Content blocks</h2>
        <p className="muted">Write plain text. HTML is not supported.</p>
        {draft.content.map((block, index) => (
          <div className="content-block" key={index}>
            <div className="panel-heading">
              <strong>
                {block.type === "heading"
                  ? `Heading (${block.level})`
                  : block.type === "list"
                    ? "List"
                    : "Paragraph"}
              </strong>
              <button
                className="icon-button"
                type="button"
                aria-label="Remove block"
                onClick={() =>
                  setDraft({
                    ...draft,
                    content: draft.content.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
            <label className="field">
              {block.type === "list" ? "One item per line" : "Text"}
              <textarea
                rows={block.type === "heading" ? 2 : 4}
                value={
                  block.type === "list" ? block.items.join("\n") : block.text
                }
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    content: draft.content.map((b, i) =>
                      i === index
                        ? b.type === "list"
                          ? { ...b, items: e.target.value.split("\n") }
                          : { ...b, text: e.target.value }
                        : b,
                    ),
                  })
                }
              />
            </label>
          </div>
        ))}
        <div className="row-actions">
          {(["paragraph", "heading", "list"] as const).map((type) => (
            <button
              className="button button-outline button-sm"
              key={type}
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  content: [
                    ...draft.content,
                    type === "list"
                      ? { type, items: [] }
                      : type === "heading"
                        ? { type, text: "", level: "h2" }
                        : { type, text: "" },
                  ],
                })
              }
            >
              <Plus size={14} />
              Add {type}
            </button>
          ))}
        </div>
        {save.error && <AdminError error={save.error} />}
        <div className="form-actions">
          <SaveButton pending={save.isPending} />
        </div>
      </form>
    </>
  );
}

export function CompanySettings() {
  const client = useQueryClient();
  const { notify } = useQuote();
  const { data, error } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminApi("admin/site-settings", settingsSchema),
  });
  const [settings, setSettings] = useState<Settings | null>(null);
  const [social, setSocial] = useState("");
  useEffect(() => {
    if (data) {
      setSettings(data.data);
      setSocial(JSON.stringify(data.data.socialLinks, null, 2));
    }
  }, [data]);
  const save = useMutation({
    mutationFn: () => {
      const links = z
        .record(
          z.string(),
          z.url().refine((v) => v.startsWith("https://")),
        )
        .parse(JSON.parse(social));
      return adminApi("admin/site-settings", settingsSchema, {
        method: "PATCH",
        body: JSON.stringify({ ...settings, socialLinks: links }),
      });
    },
    onSuccess: () => {
      notify("Company details saved.");
      void client.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
  if (error) return <AdminError error={error} />;
  if (!settings) return <p role="status">Loading settings…</p>;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Company settings</h1>
          <p>Public contact details shown on your website.</p>
        </div>
      </div>
      <form
        className="admin-panel editor-panel narrow"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {(
          [
            ["companyName", "Company name"],
            ["contactEmail", "Contact email"],
            ["phone", "Phone number"],
            ["address", "Address"],
            ["companyDescription", "Company description"],
          ] as const
        ).map(([key, label]) => (
          <label className="field" key={key}>
            {label}
            {key === "address" || key === "companyDescription" ? (
              <textarea
                rows={3}
                value={settings[key] ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.value })
                }
              />
            ) : (
              <input
                required={key === "companyName" || key === "contactEmail"}
                type={key === "contactEmail" ? "email" : "text"}
                value={settings[key] ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.value })
                }
              />
            )}
          </label>
        ))}
        <label className="field">
          Social links (HTTPS URLs, JSON)
          <textarea
            rows={4}
            value={social}
            onChange={(e) => setSocial(e.target.value)}
          />
        </label>
        {save.error && <AdminError error={save.error} />}
        <SaveButton pending={save.isPending} />
      </form>
    </>
  );
}

export function UserEditor({ id }: { id?: string }) {
  const client = useQueryClient();
  const router = useRouter();
  const { notify } = useQuote();
  const { data, error } = useQuery({
    queryKey: ["admin", "users", "all"],
    enabled: !!id,
    queryFn: () => adminApi("admin/users?limit=100", z.array(adminSchema)),
  });
  const existing = data?.data.find((u) => u.id === id);
  const [role, setRole] = useState("EDITOR");
  const [status, setStatus] = useState("ACTIVE");
  useEffect(() => {
    if (existing) {
      setRole(existing.role);
      setStatus(existing.status);
    }
  }, [existing]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof userForm>>({
    resolver: zodResolver(userForm),
    defaultValues: { role: "EDITOR" },
  });
  const save = useMutation({
    mutationFn: (values: FieldValues) =>
      adminApi(id ? `admin/users/${id}` : "admin/users", adminSchema, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(id ? { role, status } : values),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "users"] });
      notify("Admin account saved.");
      router.push("/admin/users");
    },
  });
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/users" className="text-link">
            ← Admin users
          </Link>
          <h1>{id ? "Edit admin access" : "Create an admin"}</h1>
          <p>
            {existing?.email ?? "Provide access to an authorized team member."}
          </p>
        </div>
      </div>
      <form
        className="admin-panel editor-panel narrow"
        onSubmit={
          id
            ? (e) => {
                e.preventDefault();
                if (
                  window.confirm(
                    "Update this admin’s access? Existing sessions may be revoked.",
                  )
                )
                  save.mutate({});
              }
            : handleSubmit((v) => save.mutate(v))
        }
      >
        {error && <AdminError error={error} />}{" "}
        {id ? (
          <>
            <label className="field">
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option>EDITOR</option>
                <option>SUPER_ADMIN</option>
              </select>
            </label>
            <label className="field">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>ACTIVE</option>
                <option>DISABLED</option>
              </select>
            </label>
          </>
        ) : (
          <>
            {(["displayName", "email", "password"] as const).map((key) => (
              <label className="field" key={key}>
                {key === "displayName"
                  ? "Display name"
                  : key === "email"
                    ? "Email address"
                    : "Initial password"}
                <input
                  type={
                    key === "password"
                      ? "password"
                      : key === "email"
                        ? "email"
                        : "text"
                  }
                  {...register(key)}
                />
                {errors[key] && (
                  <span className="form-error">{errors[key].message}</span>
                )}
              </label>
            ))}
            <p className="muted">
              Use at least 12 characters including uppercase, lowercase, and a
              number.
            </p>
            <label className="field">
              Role
              <select {...register("role")}>
                <option>EDITOR</option>
                <option>SUPER_ADMIN</option>
              </select>
            </label>
          </>
        )}
        {save.error && <AdminError error={save.error} />}
        <SaveButton pending={save.isPending} />
      </form>
    </>
  );
}

export function ContentPages() {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Website content</h1>
          <p>Edit the content your customers see.</p>
        </div>
      </div>
      <div className="content-page-grid">
        {cmsPages.map((page) => (
          <Link
            className="admin-panel content-page-card"
            key={page.id}
            href={`/admin/pages/${page.id}`}
          >
            <h2>{page.label}</h2>
            <p>Manage structured text, SEO information, and publication.</p>
            <span className="text-link">Edit content →</span>
          </Link>
        ))}
      </div>
    </>
  );
}

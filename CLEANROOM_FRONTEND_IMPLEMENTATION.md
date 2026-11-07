# Cleanroom Catalog Frontend — AI Implementation Instructions

> **Purpose:** Give this Markdown file to a coding AI agent (Cursor, Claude Code, Codex, etc.) alongside `CLEANROOM_BACKEND_IMPLEMENTATION.md`. Implement working storefront and admin interfaces against the defined NestJS REST API. This is an execution specification, not a design-only suggestion.

## 0. Agent operating instructions

You are a senior frontend engineer. Inspect the existing repository before editing. Implement functional, production-minded UI, not static mockups. Work phase by phase and run lint, typecheck, tests, and build where possible; report precisely what passed or failed. Never invent backend endpoints or treat mock data as real production data.

- **Use Yarn exclusively** via Corepack; pin `packageManager`, commit `yarn.lock`, do not generate npm/pnpm lockfiles.
- Use **Next.js App Router + TypeScript strict + Tailwind CSS + shadcn/ui + Lucide icons + Zod 4**. Use React Hook Form with `@hookform/resolvers/zod` for nontrivial forms, and TanStack Query for admin mutations and dynamic admin data when valuable. Favor server components for public catalog/CMS content. Do not introduce Redux unless requirements justify it.
- Keep public and admin experiences visually distinct while sharing design tokens, reusable components and API contracts. Prefer one Next.js application with `/admin/*` route group unless the existing repository already separates apps.
- **The backend is the source of truth:** `CLEANROOM_BACKEND_IMPLEMENTATION.md`. Follow its API paths, status values, response envelope, and role rules. If backend implementations differ, inspect actual OpenAPI and adapt a typed API adapter; document any mismatch rather than making up a working integration.
- Do not add customer registration, login, shopping cart, checkout, payments, or inventory features. Guests can submit contact inquiries and multi-item RFQs.
- Deliver responsive, accessible pages; loading/empty/error states, keyboard navigation, meaningful labels, field validation and visible submission feedback are mandatory.
- Use real API integration in normal operation. A clearly segregated optional mock/demo mode is allowed for UI development, but it must not silently substitute fabricated records when the backend is unavailable.

## 1. Product goals and information architecture

### Public site

| Route                    | Page            | Main behavior                                                                                                                           |
| ------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                      | Home            | Hero, company value proposition, featured cleanroom products, category tiles, RFQ CTA; render from published CMS and product data       |
| `/products`              | Catalog         | Keyword search, category filter, sorting, pagination, product cards                                                                     |
| `/products/[slug]`       | Product details | Image gallery, SKU, unit, minimum order quantity, technical specifications, downloadable datasheets, add product to local RFQ selection |
| `/categories/[slug]`     | Category        | Category heading, description and filtered product results; hierarchical breadcrumbs                                                    |
| `/about-us`              | About Us        | Published content from CMS page `about-us`, company positioning and business contact CTA                                                |
| `/contact-us`            | Contact Us      | Public company details plus guest inquiry form                                                                                          |
| `/request-quote`         | RFQ request     | Local selected product list, quantity/requirements per item, guest contact details and submission                                       |
| `/request-quote/success` | RFQ success     | Show reference returned from submission (avoid storing sensitive request data in URL)                                                   |
| `/privacy`               | Privacy notice  | Published privacy text or clearly identified content integration requirement; do not invent legal policy                                |
| `not-found`              | 404             | Helpful navigation back to catalog                                                                                                      |

The public website does **not** show a cart icon, payment CTA or any customer login. Product CTA should say **Request a Quote** or **Add to Quote**; secondary CTA may say **Contact Sales**. Do not show retail prices because backend MVP has no price field.

### Admin site

| Route                       | Page                     | Main behavior                                                                 |
| --------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `/admin/login`              | Admin login              | Email/password, loading/errors, secure session handling                       |
| `/admin`                    | Dashboard                | Product counts, new inquiries, pending RFQs, recent submissions               |
| `/admin/products`           | Product management       | Server-side list, search, status filter, actions                              |
| `/admin/products/new`       | Create product           | Validated product form with status and specs                                  |
| `/admin/products/[id]/edit` | Edit product             | Update, publish/unpublish/archive; image/PDF upload and association           |
| `/admin/categories`         | Categories               | List/tree, create/edit, parent selection, active status                       |
| `/admin/media`              | Media manager (optional) | Uploaded assets, validation and attachment management                         |
| `/admin/pages`              | CMS content              | Home and About Us management; add navigation to edit screens                  |
| `/admin/pages/[id]`         | Edit CMS page            | Structured blocks editor; published/draft status                              |
| `/admin/settings`           | Company/site settings    | Contact information, logo, social links                                       |
| `/admin/inquiries`          | Contact inbox            | Filters, statuses, assignee and recent inquiries                              |
| `/admin/inquiries/[id]`     | Inquiry details          | Contact data, internal notes, status, assignment                              |
| `/admin/quotations`         | RFQ inbox                | Filters by status, reference, submitted date                                  |
| `/admin/quotations/[id]`    | RFQ details              | Requested items, snapshots, quantities, guest contact, internal notes, status |
| `/admin/audit-logs`         | Audit history            | Read-only, restricted to authorized users                                     |
| `/admin/users`              | Admin users              | Super-admin only; create/change role/disable                                  |
| `/admin/forbidden`          | Unauthorized             | Role-based access message                                                     |

Only display navigation entries authorized for the current admin; backend guards remain authoritative.

## 2. Design direction and design system

**Brand concept:** modern industrial precision, technical trust, clean and minimal. Imagine a professional cleanroom supplies distributor, not a consumer gadget store. Use airy layouts, precise grid alignment, legible technical tables and restrained blue/teal accents. Avoid sterile-looking blank pages; use high-quality product photography or purposeful neutral placeholders when assets are missing.

### Visual tokens (initial design defaults; make easy to change)

- Primary: navy `#12243A`; accent: clean teal `#078B87`; secondary accent: pale aqua `#E5F5F3`.
- Surface: white `#FFFFFF`; background: cool off-white `#F6F8FA`; border `#DFE6EB`; text `#172534`; muted `#627383`.
- Feedback: success green, warning amber, destructive red, all meeting readable contrast.
- Typography: **Inter** or **Geist** for UI; 16px base; clear typography hierarchy. Use tabular numerals for KPIs.
- 8px spacing system, 12–16px component radius, subtle shadows and visible focus rings. Do not overuse gradients/glassmorphism.
- Max content width 1280px; desktop navigation, mobile drawer. Use a consistent sidebar layout for admin.

### Reusable components

`SiteHeader`, `SiteFooter`, `MainNavigation`, `MobileNavigation`, `Hero`, `CategoryCard`, `ProductCard`, `ProductGallery`, `ProductSpecifications`, `ProductDatasheetList`, `SearchInput`, `CatalogFilters`, `Pagination`, `Breadcrumbs`, `RFQSelectionBadge`, `QuoteLineItem`, `ContactForm`, `RFQForm`, `SectionHeading`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `AdminShell`, `AdminSidebar`, `AdminTopbar`, `StatusBadge`, `DataTable`, `ConfirmDialog`, `MediaUploader`, `FormField`, `FormError`, `Toast`.

### Page-level UI layout

**Home** — global announcement or trust strip (optional), sticky responsive header, large banner with primary CTA `Browse Products` and secondary `Request a Quote`, featured category cards, featured products grid, information/quality assurance section, About Us preview, footer with phone/email/address. Content must come from CMS/site settings where available.

**Catalog** — page heading and description, search box, filter/sidebar or mobile filter drawer, product count/sort selector, responsive 4-column desktop / 2-column tablet / 1-column mobile product grid, numbered pagination and empty-state reset filters.

**Product detail** — breadcrumbs, primary image and thumbnail gallery, title/SKU/category, unit and MOQ, add-to-quote CTA, description, structured technical specification table, PDF datasheet download links, contact CTA. Do not make unsupported certification or ISO-grade claims.

**Contact** — clear contact details and contact form (name, company optional, email, phone optional, subject, message, required privacy acknowledgement where applicable), submit/success/error states. Never expose company secrets or admin contact lists.

**RFQ** — selected items with editable positive integer quantity and requirements, product image/name/SKU snapshot for display, remove control, guest contact form (contactName, company, email, phone, message, privacy acknowledgement), explicit success reference. Warn before removing all items. No payment language.

**Admin dashboard** — four KPI cards, recent inquiry/RFQ tables, quick links to product and content editors; desktop sidebar, responsive drawer on mobile.

## 3. Repository structure

```text
.
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── products/page.tsx
│   │   ├── products/[slug]/page.tsx
│   │   ├── categories/[slug]/page.tsx
│   │   ├── about-us/page.tsx
│   │   ├── contact-us/page.tsx
│   │   ├── request-quote/page.tsx
│   │   └── request-quote/success/page.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── (protected)/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── products/...
│   │       ├── categories/...
│   │       ├── pages/...
│   │       ├── settings/page.tsx
│   │       ├── inquiries/...
│   │       ├── quotations/...
│   │       ├── audit-logs/page.tsx
│   │       └── users/page.tsx
│   ├── api/                  # only if needed for secure same-origin BFF routes
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── ui/                   # shadcn/ui
│   ├── site/
│   ├── catalog/
│   ├── quote/
│   ├── forms/
│   └── admin/
├── lib/
│   ├── api/                  # typed HTTP client, response envelope, endpoint functions
│   ├── auth/                 # session management and access guards
│   ├── schemas/              # Zod forms/contracts
│   ├── hooks/
│   ├── utils/
│   └── constants/
├── providers/                # query, toast, quote-selection context if needed
├── public/
├── tests/
├── .env.example
├── package.json
└── yarn.lock
```

Route group folders in parentheses do not appear in URLs. Keep browser-only code in explicit client components and avoid broad `"use client"` at the top-level layout.

## 4. Backend API integration contract

Use `NEXT_PUBLIC_API_BASE_URL` for **public browser-readable API origin only** (e.g. `https://api.example.com/api/v1`); do not put credentials or private server URLs in `NEXT_PUBLIC_*`. Consider server-only `API_INTERNAL_URL` for server component requests in deployment. Normalize the envelope `data` and pagination metadata in one client adapter. Derive types from shared Zod contracts or validated OpenAPI client types; do not silently assume shapes.

| UI capability                | Backend endpoint                                                           |
| ---------------------------- | -------------------------------------------------------------------------- |
| Category navigation          | `GET /categories`                                                          |
| Category details             | `GET /categories/:slug`                                                    |
| Product catalog              | `GET /products?q=&category=&page=&limit=&sort=`                            |
| Product details              | `GET /products/:slug`                                                      |
| Homepage/About Us            | `GET /pages/:slug` (`home`, `about-us`)                                    |
| Company/footer/contact       | `GET /site-settings`                                                       |
| Guest contact submission     | `POST /contact-inquiries`                                                  |
| Guest RFQ submission         | `POST /quotation-requests`                                                 |
| Admin login                  | `POST /admin/auth/login`                                                   |
| Admin current user           | `GET /admin/auth/me`                                                       |
| Admin session refresh/logout | `POST /admin/auth/refresh`, `POST /admin/auth/logout`                      |
| Product management           | `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id`         |
| Category management          | `GET/POST /admin/categories`, `PATCH/DELETE /admin/categories/:id`         |
| Media uploads                | `POST /admin/media/upload-url`, `POST /admin/media/complete`               |
| CMS                          | `GET/PATCH /admin/pages/:id`                                               |
| Company settings             | `GET/PATCH /admin/site-settings`                                           |
| Inquiries                    | `GET /admin/contact-inquiries`, `GET/PATCH /admin/contact-inquiries/:id`   |
| RFQs                         | `GET /admin/quotation-requests`, `GET/PATCH /admin/quotation-requests/:id` |
| Dashboard                    | `GET /admin/dashboard`                                                     |
| Audit                        | `GET /admin/audit-logs`                                                    |
| Admin users                  | `GET/POST /admin/users`, `PATCH /admin/users/:id`                          |

### Contract handling

- Public product results include **published items only**; never show draft or archived products in public UI.
- Sort options must map exactly to backend values: `newest`, `name_asc`, `name_desc`.
- Product specifications are dynamic key-value fields (`jsonb`); safely render readable labels/values without assuming a fixed ISO-grade vocabulary.
- Display media using verified URLs supplied by the backend. If the API returns a storage key rather than URL, request a backend-supported URL; do not fabricate public S3 paths.
- Contact payload matches `{name, company?, email, phone?, subject, message, consent}`.
- RFQ payload matches `{contactName, company, email, phone?, message?, consent, items:[{productId,quantity,requirements?}]}`.
- Minimum RFQ item quantity must respect product `minimumOrderQuantity`; backend must independently enforce it.
- RFQ success displays `reference` returned by API. If the guest refreshes the success page without reference in short-lived client state, show a generic success instruction rather than inventing a reference.
- Error handling: map `401` to admin reauthentication, `403` to permission messaging, `404` to not-found, `409` to conflict/duplicate error, `422` or `400` to form field errors, `429` to throttling notice, `5xx` to retryable service failure.

## 5. Authentication and session security

- Public pages and guest forms require no customer authentication.
- Admin login requires email/password; **no admin signup** route or interface.
- Prefer a same-origin **Next.js BFF** for admin auth if API and frontend deploy on different origins: refresh token stored in `HttpOnly`, `Secure`, `SameSite` cookie; access token kept server-side or short-lived in memory. Do not store refresh tokens in localStorage or expose them in client-rendered HTML.
- Coordinate BFF cookie/session approach with the actual NestJS login/refresh cookie contract; do not invent incompatible auth flow. If backend sets HttpOnly cookie directly, forward/handle Set-Cookie and credentials correctly, with CSRF defenses as required.
- Protect admin pages using a server-side session check; client route guards are for UX only, not security. Always rely on backend role guards.
- Add `logout` that revokes the server-side refresh session, clears cookies and redirects to login.
- Handle a single refresh attempt after 401 where appropriate; prevent refresh loops and concurrent refresh races.
- `SUPER_ADMIN`: admin users and audit logs; `EDITOR`: products, categories, CMS, inquiries, RFQs according to backend permissions. Hide disallowed navigation and actions without pretending it is backend authorization.

## 6. RFQ selection state and guest forms

- Keep an **RFQ selection**, not a shopping cart. Store only `productId`, `quantity`, optional `requirements` locally. Avoid storing guest PII in localStorage.
- Local persistence (e.g. localStorage) is acceptable for the selected items list; validate and hydrate using current product API data before submission. Deduplicate product IDs and cap at 50 distinct items.
- Support adding one product from listing/detail, quantity adjustment, removing a product, and clear-all. The same product should increment or consolidate rather than add duplicate rows.
- Validate with Zod on client, including email, nonempty company, positive quantities and required acknowledgement; backend must validate independently.
- Disable submit while pending, handle duplicate clicks and display precise error messages. On successful RFQ, clear selected items after server acknowledgment.
- Contact form should display success acknowledgement reference if returned; avoid claiming email was delivered simply because API accepted the form.
- Guest form accessibility: `aria-invalid` and error IDs, proper labels, keyboard operability, focus the first invalid field when appropriate.

## 7. CMS rendering and product SEO

- Render **structured CMS JSON blocks using an allowlisted renderer** (`heading`, `paragraph`, `image`, `featureGrid`, `callToAction`, etc. as actually supported by backend schema). Never blindly insert arbitrary HTML or `dangerouslySetInnerHTML` into pages.
- Published CMS data only; use server-rendered content where possible for SEO and fast first paint.
- Generate page titles/descriptions from product and CMS SEO fields with a sane fallback. Add canonical URLs, Open Graph tags and appropriate product metadata where supported. Do not output retail `Offer` prices that the backend does not have.
- Add `robots.txt`, `sitemap.xml` for publicly published products/pages and accessible category URLs. Do not index `/admin`.
- Use Next.js `<Image>` with configured remote patterns for actual backend-approved media domains; provide accessible alt text and graceful fallbacks.
- Apply explicit caching/revalidation policies; ensure newly published/archived products don't remain visible indefinitely. Document any revalidation webhook or time-based ISR strategy.

## 8. Admin UI behaviors

### Products

- Table with SKU, thumbnail, name, category, status, featured and last update.
- Create/edit form with general details, category, specifications key/value editor, media section, SEO fields, draft/publish actions.
- Confirm archiving; surface 409/conflict errors; invalidate list/detail caches after edits.
- Upload media using backend signed upload URL, then call `/admin/media/complete`, and only then attach or display a READY media asset. Validate file extension/type/size on client for UX; backend remains authoritative.

### Categories

- List/tree of nested categories; create/edit parent, name, slug, description, sort order, active state.
- Prevent self-parent and obvious cycles in UI; backend must also enforce.

### CMS

- Structured editor for seeded `home` and `about-us` content. Show draft/published status, SEO title/description, last updated date, save feedback.
- Map the UI to the backend's actual content block schema. If block schema is not yet defined, implement it collaboratively or document the required contract instead of dumping arbitrary HTML in `jsonb`.

### Inquiries and RFQs

- Search/filter by reference and status; details show guest contact fields, submission timestamp, admin-only internal notes and assignment.
- RFQ items show saved name/SKU snapshots (not only current product values), quantity, unit and requirements.
- Status options: inquiries `NEW`, `IN_PROGRESS`, `RESPONDED`, `CLOSED`; RFQs `NEW`, `REVIEWING`, `RESPONDED`, `CLOSED` (outcomes `WON`, `LOST`, `CANCELLED` when closed).
- Show confirmation before destructive or irreversible actions; statuses should update only after API success.

## 9. Performance, accessibility and resilience

- Mobile-first breakpoints; test at 375px, 768px, 1280px and wide desktop. Product cards should not overflow.
- WCAG 2.2 AA-oriented basics: contrast, keyboard, focus visibility, accessible dialogs, alt text, non-color-only status indicators.
- Server-render public catalog/CMS pages; use URL search params as source of truth for query/filter/sort/page so results are bookmarkable.
- Debounce catalog search and cancel stale requests where needed; keep pagination stable. Use skeletons, empty states, retry actions and error boundaries.
- No production API secrets in client bundles, no logging submitted guest PII to analytics or client console.
- Add no-op-safe analytics abstraction only if required; do not include third-party trackers by default.

## 10. Test strategy and acceptance criteria

Use Vitest + React Testing Library for unit/component tests, and Playwright for browser end-to-end tests. Use mocked API fixtures in **isolated tests only**; include an actual backend-connected smoke test where environment permits.

Required scenarios:

1. Home, About Us and Contact show actual published CMS/site settings data.
2. Catalog query, category filter, sort and pagination are reflected in the URL and result list.
3. Unpublished products cannot appear publicly (including direct product URL).
4. Product image gallery falls back gracefully when no media exists.
5. RFQ selection persists across page navigation and deduplicates products.
6. RFQ quantity respects backend MOQ; multi-item RFQ payload matches the API.
7. Guest RFQ submit shows the server-returned reference; does not invent success if request fails.
8. Contact form validates required fields and consent; handles server errors.
9. Admin login success/failure, session expiry and logout work without localStorage refresh tokens.
10. Unauthorized editors cannot see or activate super-admin-only actions; backend 403 is handled.
11. Product create/edit/publish/archiving updates admin lists and public views appropriately.
12. Media upload is not shown complete until backend finalization succeeds.
13. Admin inquiry/RFQ status and internal notes update after successful API response.
14. All major pages work on mobile and are keyboard navigable.
15. Typecheck, lint, unit tests, E2E smoke tests and production build run cleanly (or failures are explicitly reported).

## 11. Implementation roadmap

### Phase 1 — Frontend foundation

- [ ] Inspect current repo and backend OpenAPI; initialize Next.js App Router with Yarn where missing.
- [ ] Configure strict TypeScript, Tailwind, shadcn/ui, fonts, shared tokens and responsive layouts.
- [ ] Create typed API client with safe envelope/error parsing and Zod contracts.
- [ ] Configure global error/not-found/loading states, toast, UI tests and environment validation.
- [ ] Set up public and admin shells, navigation and basic mobile responsiveness.

**Done when:** App builds; shared UI components render; API error/response handling is tested and documented.

### Phase 2 — Public website/catalog

- [ ] Implement homepage with CMS and featured products.
- [ ] Implement categories and product listing with filter/search/sort/pagination.
- [ ] Implement product details, image gallery and datasheet links.
- [ ] Implement About Us, public company/contact information, SEO metadata, sitemap and responsive footer.

**Done when:** Guest can browse published products and navigate from home to details without using mock data in normal mode.

### Phase 3 — Guest Contact and RFQ

- [ ] Build reusable Zod-backed forms with consent validation.
- [ ] Implement Contact Us submission and confirmation/error states.
- [ ] Implement RFQ selection store, add/remove/quantity editing and persistence.
- [ ] Implement guest RFQ form, backend submission and reference-success flow.

**Done when:** Guest submits a valid multi-product RFQ end-to-end without account creation.

### Phase 4 — Admin auth/dashboard

- [ ] Implement secure admin login, refresh, logout and session-aware server protection.
- [ ] Implement admin shell/sidebar and role-aware menu.
- [ ] Dashboard KPI and recent records integration.

**Done when:** Authorized admin can log in and view dashboard, unauthorized users are redirected/rejected.

### Phase 5 — Admin CRUD and workflows

- [ ] Product table and editor, categories manager, media uploader, publish/archive flows.
- [ ] CMS content editor and site settings editor.
- [ ] Inquiry and RFQ inbox, details, status, notes and assignee.
- [ ] Audit log and admin user pages restricted to super admins.

**Done when:** Business team can manage website and RFQ operations without backend manual edits.

### Phase 6 — Hardening and delivery

- [ ] Run responsive/accessibility checks and critical browser E2E journeys.
- [ ] Check SEO, metadata, empty/loading/error states, stale cache handling.
- [ ] Build production Dockerfile/deployment instructions if needed.
- [ ] Document environment variables, actual API dependencies and known contract gaps.
- [ ] Run Yarn lint/typecheck/test/build and record results.

**Done when:** Deployment and operating instructions are reproducible, critical flows tested, and no unavailable backend dependency is silently mocked.

## 12. Example environment and Yarn scripts

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
API_INTERNAL_URL=http://api:8080/api/v1
```

Never put secret JWT keys, SMTP passwords, DB credentials, or S3 access keys into `NEXT_PUBLIC_*` variables.

Typical commands (adapt scripts to generated project):

```bash
corepack enable
yarn install
yarn dev
yarn lint
yarn typecheck
yarn test
yarn test:e2e
yarn build
```

## 13. Definition of done

- Usable responsive public website and secure admin interface are implemented, not merely visually sketched.
- Every page integrates with the backend endpoints and status values defined in the backend spec.
- Guest contact and RFQ forms work without registration; no cart/checkout/payment UI is present.
- Admin login/session handling, product/category/media/CMS management, lead inbox and dashboard work.
- Zod validation, safe API error handling, loading states, keyboard accessibility and SEO are addressed.
- Yarn is used exclusively; `yarn.lock`, README, `.env.example`, and test scripts are committed.
- Tests and builds are executed where available; missing dependencies and failures are clearly reported.

---

## Paste into your coding AI

**Implement the frontend according to `CLEANROOM_FRONTEND_IMPLEMENTATION.md` and the companion `CLEANROOM_BACKEND_IMPLEMENTATION.md`. Use Yarn only. Start by inspecting the actual NestJS API/OpenAPI contract, then implement Phase 1 and continue in dependency order. Build working responsive Next.js pages with clean industrial styling, actual API integration, guest Contact Us and RFQ, and a secure admin dashboard. Do not add cart, checkout, payments, or customer accounts. Run available validation/tests/build and report which checks actually passed.**

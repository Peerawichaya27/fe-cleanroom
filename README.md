# Peetop cleanroom frontend

A backend-connected public catalog and admin workspace for **Peetop Corporation Co., Ltd.** Built with Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, shadcn-style Radix/CVA UI components, Lucide, Zod 4, React Hook Form, and TanStack Query. Uses **Node 24 LTS and Yarn 1.22.22** exclusively, with exact direct package versions and `yarn.lock`.

## Run locally

The sibling backend is `../be-cleanroom`. Start it and its PostgreSQL/MinIO dependencies first; it normally serves `http://localhost:3000/api/v1`.

```bash
nvm use
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install --frozen-lockfile
cp .env.example .env
yarn dev
```

Open **http://localhost:5173**. Admin sign-in is **http://localhost:5173/admin/login**. Only admins sign in; guests browse and submit contact inquiries or quotation requests without an account. There is no checkout, cart, payment or customer registration.

If the backend was already running before its directory moved, keep the existing containers. Its Compose project is `cleanroome-commerce`; starting a different Compose project creates separate volumes. To reuse the existing project from the moved backend directory, use `docker compose -p cleanroome-commerce ...`.

## Branding and company data

The navy/red design and `public/ptc-logo.svg` are a vector rendering based on the supplied PTC reference. `public/cleanroom.svg` is a custom cleanroom illustration, not a photograph or a claim about Peetop's facility. Replace the SVG logo with the original production artwork if higher-fidelity source files become available.

Company details are taken from the supplied business card:

- Peetop Corporation Co., Ltd.
- Phone: 081-571-4445
- Email: peetop@ymail.com
- LINE ID: T00010
- Address: 68/9 M.3 Soi Mu Ban Somwang Sap Muen Saen, Sam Ruan, Bang Pa-in, Phra Nakhon Si Ayutthaya 13160, Thailand.

The backend's `yarn company:seed` command saves these details and publishes factual starter text only when seeded CMS pages are still empty drafts. Run it from `../be-cleanroom`. It preserves existing CMS edits. It updates company contact fields intentionally and records an audit event. The local development database has been configured with these details.

There are **no invented production products**. Until real product records are published, the catalog shows a helpful empty state and direct sales contacts. The four homepage supply-area tiles are descriptive navigation to the catalog, not fabricated category records. Actual category navigation comes from the API.

The formal company privacy notice has not been supplied. `/privacy` states this explicitly; replace the pending notice with company-approved content before a production launch.

## Features and structure

Public routes include home, catalog with URL-backed search/filter/sort/pagination, category pages, product details/gallery/specifications/PDFs, About Us, Contact Us, quotation selection/submission, success references, privacy information, sitemap and robots.

The admin workspace includes server-checked authentication, dashboard, products and category management, product images/PDF uploads, publication/archive flows, structured CMS editing, company settings, inquiry/RFQ inboxes, notes/status/assignment, and super-admin-only user/audit pages. The optional standalone media library is omitted because the backend exposes upload/finalization, not an asset-list endpoint; media management is available in product editing.

```text
app/(public)/           Server-rendered public pages
app/admin/login/        Admin sign-in
app/admin/(protected)/  Server-authorized admin routes
app/api/backend/        Same-origin BFF proxy
components/site/        Branded header, footer and content
components/catalog/     Catalog, product cards and gallery
components/forms/       Zod/RHF guest forms
components/quote/       Guest quotation workflow
components/admin/       Admin shell, lists and feature editors
components/ui/          Shared shadcn-style button primitive
lib/api/                Validated adapters and shared refresh handling
lib/auth/               Server-side session checks
providers/              TanStack Query and local quote-selection state
tests/                  Unit/component and actual backend browser tests
```

Public requests use `cache: 'no-store'`, so published/archived changes appear on the next request. Admin queries are invalidated after successful mutations. Draft products/pages are never fetched through admin endpoints for public rendering. CMS only renders allowlisted plain-text heading/paragraph/list blocks; no raw HTML is inserted.

## API and session configuration

| Variable                         | Purpose                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `API_INTERNAL_URL`               | Server-only NestJS base URL. Local default `http://localhost:3000/api/v1`. In Docker use the backend's reachable hostname.          |
| `NEXT_PUBLIC_SITE_URL`           | Public canonical frontend URL for metadata/sitemap.                                                                                 |
| `NEXT_PUBLIC_API_BASE_URL`       | Documented public backend origin; browser data requests use the safer same-origin `/api/backend` proxy. No credentials belong here. |
| `MEDIA_HOST`                     | Optional HTTPS storage hostname for Next image configuration.                                                                       |

Next.js automatically loads the ignored `.env` for local runs. Compose reads it for build arguments/runtime interpolation; the Docker-specific backend URL prevents the local `localhost` value from pointing back at the frontend container. Public `NEXT_PUBLIC_*` values are built into browser assets, so rebuild after changing the public URL. Never put backend secrets in these variables.

The BFF uses the actual NestJS login/refresh/logout contract. It saves backend access/refresh tokens in HttpOnly SameSite=Strict cookies; production cookies are Secure. Browser JSON never receives the session tokens. Mutations reject foreign Origin/cross-site requests against the configured `NEXT_PUBLIC_SITE_URL`, including when the application runs behind an HTTPS reverse proxy. Use the configured canonical URL when accessing the site. Server components verify the access token with `/admin/auth/me`; the backend remains authoritative for role and disabled-account checks. Refresh requests share one in-flight promise, preventing duplicate rotation/reuse problems. An expired access cookie redirects through sign-in, where a still-valid refresh session can restore access. No access/refresh tokens are saved to localStorage.

Quote selection persistence contains **only product IDs, quantities, and optional item requirements**. Contact PII is never persisted in localStorage. Current public product data and MOQ are rechecked before submission. Removed/unpublished products block submission until removed. Success pages read only the returned reference from sessionStorage and never invent a reference after refresh.

Use same-site HTTPS hosting for frontend/API. Keep `API_INTERNAL_URL` trusted and server-only. The server proxy strips user-supplied authorization headers and uses its own HttpOnly access cookie. If deploying behind a trusted reverse proxy, configure backend trusted hops and edge rate limiting: by default the backend sees the BFF server as the client for IP throttling. Do not trust arbitrary browser-provided forwarding headers.

The API normalizer validates success envelopes and safe error details. Specialized public/auth/product/CMS responses use Zod domain contracts; generic admin tables validate record envelopes and narrow individual values before rendering. API failure does not silently substitute mock products.

### Public form protection

Contact and Request a Quote accept submissions without CAPTCHA. Consent validation and backend rate limiting remain enabled.



### Actual backend limitations handled in the UI

- CMS page list endpoint does not exist: the CMS screen uses the backend's two documented stable seed IDs.
- Inquiry/RFQ list endpoints support status/pagination but not reference/date search: their search is explicitly labeled **current-page search**. Product search is server-side.
- The admin-user list is super-admin-only: editors can retain the current assignee, assign themselves, or unassign. Super admins see active admin choices (up to the first 100 accounts).
- Admin-user edit has no GET-by-ID endpoint: it finds the user through the admin list (first 100). Larger staff directories need a backend contract extension or paginated lookup.
- LINE ID is part of the supplied brand configuration, since the backend currently models HTTPS social links but no LINE ID field.
- Admin login/account provisioning uses the backend bootstrap CLI; the frontend has no signup. No production/development administrator password is created by this frontend.

## Checks

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```

`yarn test` covers response validation, safe network/error handling, guest input validation, and quotation deduplication/persistence. Fixtures are isolated to tests.

### Real backend browser tests

Chrome is used via Playwright's `channel: 'chrome'`. Install Google Chrome, or change the config to use Playwright Chromium and install it with `yarn playwright install chromium`.

These tests use **a dedicated `cleanroom_frontend_test` database**, separate backend port 3002 and frontend port 5174. Never point test variables to business data. Fixture preparation refuses databases without `_frontend_test` and rebuilds only that database's public schema. Synthetic admin passwords in the fixture file are test-only and never provisioned in development/production.

With the existing PostgreSQL container running:

```bash
docker exec cleanroome-commerce-postgres-1 createdb -U cleanroom cleanroom_frontend_test
yarn node scripts/prepare-e2e.cjs
```

From `../be-cleanroom`, start the isolated backend:

```bash
NODE_ENV=development PORT=3002 \
DATABASE_URL=postgresql://cleanroom:local-development-password@localhost:5432/cleanroom_frontend_test \
JWT_SECRET=frontend-e2e-test-secret-at-least-32-characters \
OUTBOX_ENABLED=false LOG_LEVEL=silent \
S3_BUCKET=cleanroom-frontend-test yarn start
```

Then, from this frontend directory:

```bash
yarn test:e2e
```

Playwright starts/stops its own frontend and uses a separate `.next-e2e` build directory. Re-prepare fixtures before repeating the suite. `E2E_API_URL` can override the isolated API URL. `FRONTEND_TEST_DATABASE_URL` overrides fixture storage but still requires `_frontend_test`. Test usernames/passwords are confined to this synthetic database.

Tests exercise published/draft visibility, catalog filters, real guest contact/RFQ persistence and references, quote deduplication, private cookies, product create/publish/archive, inquiry edits, editor access restrictions, and 375/768/1280px layouts. Screenshots were also inspected at desktop and mobile widths.

## Docker

```bash
docker compose up -d --build
```

The frontend runs at http://localhost:5173 and reaches the local backend using `host.docker.internal:3000`. Stop a development server using that port first. This Compose file defines only the frontend; it does not recreate or replace backend databases.

The multi-stage image builds a Next.js standalone server and runs it as a non-root user. Configure public frontend URL at build time, and the server-only backend URL at runtime. Real production deployment additionally needs HTTPS, company-approved privacy content, real product data/assets and operational account/service configuration. No public internet deployment is performed by local Compose.

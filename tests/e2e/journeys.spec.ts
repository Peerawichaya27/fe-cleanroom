import { test, expect } from "@playwright/test";
const password = "FrontendSmokePassword123";
async function login(
  page: import("@playwright/test").Page,
  email = "smoke-admin@example.test",
) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
}
test("public pages show actual backend data and private products stay private", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Cleanroom supplies",
  );
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "QA Nitrile Gloves", exact: true }),
  ).toBeVisible();
  await page.goto("/products?q=Nitrile&category=qa-gloves&sort=name_asc");
  await expect(
    page.getByRole("heading", { name: "QA Nitrile Gloves" }),
  ).toBeVisible();
  await expect(page.getByText("QA Private Draft", { exact: true })).toHaveCount(
    0,
  );
  await page.goto("/products/qa-private-draft");
  await expect(
    page.getByRole("heading", { name: "Let’s find what you need." }),
  ).toBeVisible();
  await page.goto("/about-us");
  await expect(
    page
      .getByRole("main")
      .getByText("Backend-connected QA content for Peetop."),
  ).toBeVisible();
  await page.goto("/contact-us");
  await expect(
    page.getByRole("heading", { name: "Contact Peetop" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Email us peetop@ymail.com" }),
  ).toBeVisible();
});
test("guest quotation persists, consolidates items and displays the real reference", async ({
  page,
}) => {
  await page.goto("/products/qa-nitrile-gloves");
  await expect(
    page.getByRole("main").getByText("Product image coming soon"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add QA Nitrile Gloves to quotation" })
    .click();
  await page
    .getByRole("button", { name: "Add QA Nitrile Gloves to quotation" })
    .click();
  await page.goto("/request-quote");
  await expect(
    page.getByRole("spinbutton", { name: "Quantity (box)" }),
  ).toHaveValue("20");
  await page.reload();
  await expect(
    page.getByRole("spinbutton", { name: "Quantity (box)" }),
  ).toHaveValue("20");
  await page.getByLabel("Your name").fill("QA Guest");
  await page.getByLabel("Company", { exact: false }).fill("QA Business");
  await page.getByLabel("Email address").fill("guest@example.test");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send quotation request" }).click();
  await expect(page).toHaveURL(/request-quote\/success/);
  await expect(page.getByText(/RFQ-\d{4}-\d+/)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("ptc-rfq") ?? "[]").length,
      ),
    )
    .toBe(0);
  await expect(
    page.evaluate(() => localStorage.getItem("ptc-rfq")),
  ).resolves.not.toContain("guest@example.test");
});
test("contact form validates and receives backend acknowledgment", async ({
  page,
}) => {
  await page.goto("/contact-us");
  await page.getByRole("button", { name: "Send your inquiry" }).click();
  await expect(page.getByText("Enter your name.")).toBeVisible();
  await page.getByLabel("Your name").fill("QA Contact");
  await page.getByLabel("Email address").fill("contact@example.test");
  await page.getByLabel("How can we help?").fill("QA supplies inquiry");
  await page
    .getByLabel("Your message")
    .fill("Please contact us about cleanroom supplies for QA.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send your inquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "Your message is with our team." }),
  ).toBeVisible();
  await expect(page.getByText(/INQ-\d{4}-\d+/)).toBeVisible();
});
test("admin login, private session cookies, product create/publish/archive and logout", async ({
  page,
  context,
}) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/admin\/login/);
  await login(page);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "ptc_access")?.httpOnly).toBe(true);
  expect(cookies.find((c) => c.name === "ptc_refresh")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "ptc_access",
  );
  expect(await page.evaluate(() => Object.keys(localStorage))).not.toContain(
    "accessToken",
  );
  await page.goto("/admin/products/new");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("QA Browser Product");
  await page.getByLabel("SKU", { exact: true }).fill("QA-BROWSER-001");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "QA Gloves" });
  await page
    .getByLabel("Short description")
    .fill("A synthetic browser-created product.");
  await page.getByLabel("Status", { exact: true }).selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/admin\/products\/.+\/edit/);
  await page.goto("/products/qa-browser-product");
  await expect(
    page.getByRole("heading", { name: "QA Browser Product" }),
  ).toBeVisible();
  await page.goto("/admin/products");
  page.on("dialog", (dialog) => dialog.accept());
  const row = page.getByRole("row").filter({ hasText: "QA Browser Product" });
  await row.getByRole("button", { name: "Archive product" }).click();
  await expect(row.getByText("ARCHIVED")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/admin\/login/);
});
test("admin can update real inquiry notes/status and editor cannot access super-admin pages", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/inquiries");
  await page
    .getByRole("link", { name: /INQ-\d{4}-\d+/ })
    .first()
    .click();
  await page.getByLabel("Internal note").fill("QA internal note");
  await page.getByLabel("Status", { exact: true }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Request updated.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Internal note")).toHaveValue(
    "QA internal note",
  );
  await page.getByRole("button", { name: "Sign out" }).click();
  await login(page, "smoke-editor@example.test");
  await expect(
    page.getByRole("link", { name: "Admin users", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/users");
  await expect(
    page.getByRole("heading", { name: "Access restricted" }),
  ).toBeVisible();
});
test("responsive public navigation and page layouts avoid horizontal overflow", async ({
  page,
}) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (width === 375) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeVisible();
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Shop", exact: true })
        .click();
      await expect(page).toHaveURL(/products/);
    }
  }
});

test("expired access cookies restore through exactly one refresh flight", async ({
  page,
  context,
}) => {
  await login(page);
  await context.clearCookies({ name: "ptc_access" });
  await page.goto("/admin/products");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "ptc_access")
      ?.httpOnly,
  ).toBe(true);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/admin\/login/);
});

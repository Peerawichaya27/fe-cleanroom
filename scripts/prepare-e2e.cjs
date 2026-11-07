const path = require("node:path");
process.env.NODE_ENV = "development";
process.env.DATABASE_URL =
  process.env.FRONTEND_TEST_DATABASE_URL ||
  "postgresql://cleanroom:local-development-password@localhost:5432/cleanroom_frontend_test";
if (!new URL(process.env.DATABASE_URL).pathname.endsWith("_frontend_test"))
  throw new Error("Refusing to reset a database without _frontend_test suffix");
process.env.JWT_SECRET = "frontend-e2e-test-secret-at-least-32-characters";
process.env.S3_ACCESS_KEY = "local-cleanroom";
process.env.S3_SECRET_KEY = "local-minio-password-change-me";
process.env.S3_BUCKET = "cleanroom-frontend-test";
process.env.OUTBOX_ENABLED = "false";
process.env.TS_NODE_PROJECT = path.resolve("../be-cleanroom/tsconfig.json");
require("../../be-cleanroom/node_modules/ts-node/register");
const database =
  require("../../be-cleanroom/src/database/data-source.ts").default;
const {
  AdminUser,
} = require("../../be-cleanroom/src/modules/admin-users/entities/admin-user.entity.ts");
const {
  Category,
} = require("../../be-cleanroom/src/modules/categories/entities/category.entity.ts");
const {
  Product,
} = require("../../be-cleanroom/src/modules/products/entities/product.entity.ts");
const {
  SiteSettings,
  SETTINGS_ID,
} = require("../../be-cleanroom/src/modules/cms/entities/site-settings.entity.ts");
const {
  CmsPage,
} = require("../../be-cleanroom/src/modules/cms/entities/cms-page.entity.ts");
const argon = require("../../be-cleanroom/node_modules/argon2");
(async () => {
  await database.initialize();
  try {
    await database.query("DROP SCHEMA public CASCADE");
    await database.query("CREATE SCHEMA public");
    await database.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await database.runMigrations();
    const hash = await argon.hash("FrontendSmokePassword123", {
      type: argon.argon2id,
    });
    await database.getRepository(AdminUser).save([
      {
        email: "smoke-admin@example.test",
        displayName: "QA Administrator",
        passwordHash: hash,
        role: "SUPER_ADMIN",
      },
      {
        email: "smoke-editor@example.test",
        displayName: "QA Editor",
        passwordHash: hash,
        role: "EDITOR",
      },
    ]);
    const category = await database
      .getRepository(Category)
      .save({ name: "QA Gloves", slug: "qa-gloves" });
    await database.getRepository(Product).save([
      {
        categoryId: category.id,
        sku: "QA-GLOVE-001",
        name: "QA Nitrile Gloves",
        slug: "qa-nitrile-gloves",
        unit: "box",
        minimumOrderQuantity: 10,
        shortDescription: "Synthetic product for isolated browser testing.",
        specifications: { Material: "Nitrile", Packaging: "100 pieces" },
        status: "PUBLISHED",
        publishedAt: new Date(),
        isFeatured: true,
      },
      {
        categoryId: category.id,
        sku: "QA-DRAFT-001",
        name: "QA Private Draft",
        slug: "qa-private-draft",
        unit: "box",
        minimumOrderQuantity: 1,
        status: "DRAFT",
      },
    ]);
    await database.getRepository(SiteSettings).update(SETTINGS_ID, {
      companyName: "Peetop Corporation Co., Ltd.",
      contactEmail: "peetop@ymail.com",
      phone: "081-571-4445",
      address: "Ayutthaya, Thailand",
    });
    for (const slug of ["home", "about-us"])
      await database.getRepository(CmsPage).update(
        { slug },
        {
          title: slug === "home" ? "Peetop" : "About Peetop",
          status: "PUBLISHED",
          publishedAt: new Date(),
          content: [
            {
              type: "paragraph",
              text: "Backend-connected QA content for Peetop.",
            },
          ],
        },
      );
    console.log(
      "Isolated frontend test fixtures ready. No development records changed.",
    );
  } finally {
    await database.destroy();
  }
})().catch((error) => {
  console.error(error.name);
  process.exitCode = 1;
});

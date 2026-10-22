import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_HOME_BLOCKS } from "../src/lib/cms/types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@orderline.app";
const DEMO_PASSWORD = "Demo1234!";

const IMG = {
  chicken: "/menu/menu-chicken.jpg",
  burger: "/menu/menu-burger.jpg",
  bucket: "/menu/menu-bucket.jpg",
  fries: "/menu/menu-fries.jpg",
  wings: "/menu/menu-wings.jpg",
  drink: "/menu/menu-drink.jpg",
  wrap: "/menu/menu-wrap.jpg",
  dessert: "/menu/menu-dessert.jpg",
  popcorn: "/menu/menu-popcorn.jpg",
  deal: "/menu/menu-deal.jpg",
  slaw: "/menu/menu-slaw.jpg",
  rice: "/menu/menu-rice.jpg",
} as const;

type ProductSeed = {
  name: string;
  sku: string;
  category: string;
  priceCents: number;
  imageUrl: string;
  description: string;
  sortOrder: number;
};

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 12);

  const superEmail =
    process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim() || DEMO_EMAIL;

  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: "Demo Owner",
      passwordHash,
      isSuperAdmin: DEMO_EMAIL === superEmail,
    },
    create: {
      email: DEMO_EMAIL,
      name: "Demo Owner",
      passwordHash,
      isSuperAdmin: DEMO_EMAIL === superEmail,
    },
  });

  if (superEmail !== DEMO_EMAIL) {
    await db.user.upsert({
      where: { email: superEmail },
      update: { isSuperAdmin: true, passwordHash },
      create: {
        email: superEmail,
        name: "Super Admin",
        passwordHash,
        isSuperAdmin: true,
      },
    });
  }

  const organization = await db.organization.upsert({
    where: { slug: "orderline-demo" },
    update: { name: "Crispy King Demo" },
    create: {
      name: "Crispy King Demo",
      slug: "orderline-demo",
    },
  });

  await db.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  const categoryDefs = [
    {
      name: "Hot & Crispy",
      slug: "hot-crispy",
      color: "#e11d48",
      sortOrder: 1,
      description: "Signature fried chicken pieces",
      imageUrl: IMG.chicken,
    },
    {
      name: "Burgers",
      slug: "burgers",
      color: "#ea580c",
      sortOrder: 2,
      description: "Fillet burgers and sandwiches",
      imageUrl: IMG.burger,
    },
    {
      name: "Buckets",
      slug: "buckets",
      color: "#b45309",
      sortOrder: 3,
      description: "Family and sharing buckets",
      imageUrl: IMG.bucket,
    },
    {
      name: "Wings & Bites",
      slug: "wings-bites",
      color: "#c2410c",
      sortOrder: 4,
      description: "Wings, popcorn and snacks",
      imageUrl: IMG.wings,
    },
    {
      name: "Wraps",
      slug: "wraps",
      color: "#ca8a04",
      sortOrder: 5,
      description: "Twister-style wraps",
      imageUrl: IMG.wrap,
    },
    {
      name: "Sides",
      slug: "sides",
      color: "#d97706",
      sortOrder: 6,
      description: "Fries, slaw, rice and extras",
      imageUrl: IMG.fries,
    },
    {
      name: "Beverages",
      slug: "beverages",
      color: "#0284c7",
      sortOrder: 7,
      description: "Soft drinks and shakes",
      imageUrl: IMG.drink,
    },
    {
      name: "Desserts",
      slug: "desserts",
      color: "#7c3aed",
      sortOrder: 8,
      description: "Sweet finishes",
      imageUrl: IMG.dessert,
    },
    {
      name: "Deals",
      slug: "deals",
      color: "#be123c",
      sortOrder: 0,
      description: "Value combos and family deals",
      imageUrl: IMG.deal,
    },
  ];

  const categories: Record<string, { id: string }> = {};
  for (const def of categoryDefs) {
    const row = await db.category.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: def.slug,
        },
      },
      update: {
        name: def.name,
        color: def.color,
        sortOrder: def.sortOrder,
        description: def.description,
        imageUrl: def.imageUrl,
        active: true,
      },
      create: {
        organizationId: organization.id,
        ...def,
        active: true,
      },
    });
    categories[def.slug] = row;
  }

  const products: ProductSeed[] = [
    // Hot & Crispy
    {
      name: "Hot & Crispy 1 pc",
      sku: "HC-1PC",
      category: "hot-crispy",
      priceCents: 320,
      imageUrl: IMG.chicken,
      description: "One piece signature crispy chicken",
      sortOrder: 1,
    },
    {
      name: "Hot & Crispy 2 pc",
      sku: "HC-2PC",
      category: "hot-crispy",
      priceCents: 590,
      imageUrl: IMG.chicken,
      description: "Two pieces signature crispy chicken",
      sortOrder: 2,
    },
    {
      name: "Hot & Crispy 5 pc",
      sku: "HC-5PC",
      category: "hot-crispy",
      priceCents: 1390,
      imageUrl: IMG.chicken,
      description: "Five pieces for sharing",
      sortOrder: 3,
    },
    {
      name: "Original Recipe 2 pc",
      sku: "OR-2PC",
      category: "hot-crispy",
      priceCents: 620,
      imageUrl: IMG.chicken,
      description: "Classic herbs & spice chicken",
      sortOrder: 4,
    },
    {
      name: "Original Recipe 3 pc",
      sku: "OR-3PC",
      category: "hot-crispy",
      priceCents: 890,
      imageUrl: IMG.chicken,
      description: "Three pieces original recipe",
      sortOrder: 5,
    },
    // Burgers
    {
      name: "Zinger Burger",
      sku: "BRG-ZINGER",
      category: "burgers",
      priceCents: 520,
      imageUrl: IMG.burger,
      description: "Spicy fillet burger with mayo & lettuce",
      sortOrder: 1,
    },
    {
      name: "Zinger Stacker",
      sku: "BRG-STACK",
      category: "burgers",
      priceCents: 720,
      imageUrl: IMG.burger,
      description: "Double spicy fillet stacker",
      sortOrder: 2,
    },
    {
      name: "Chicken Fillet Burger",
      sku: "BRG-FILLET",
      category: "burgers",
      priceCents: 480,
      imageUrl: IMG.burger,
      description: "Crispy fillet burger",
      sortOrder: 3,
    },
    {
      name: "Tower Burger",
      sku: "BRG-TOWER",
      category: "burgers",
      priceCents: 690,
      imageUrl: IMG.burger,
      description: "Fillet, hash brown & cheese tower",
      sortOrder: 4,
    },
    {
      name: "Mighty Zinger",
      sku: "BRG-MIGHTY",
      category: "burgers",
      priceCents: 780,
      imageUrl: IMG.burger,
      description: "Loaded spicy chicken burger",
      sortOrder: 5,
    },
    // Buckets
    {
      name: "Family Bucket 8 pc",
      sku: "BKT-8",
      category: "buckets",
      priceCents: 2490,
      imageUrl: IMG.bucket,
      description: "8 pc chicken bucket",
      sortOrder: 1,
    },
    {
      name: "Family Bucket 12 pc",
      sku: "BKT-12",
      category: "buckets",
      priceCents: 3490,
      imageUrl: IMG.bucket,
      description: "12 pc chicken bucket",
      sortOrder: 2,
    },
    {
      name: "Duo Bucket",
      sku: "BKT-DUO",
      category: "buckets",
      priceCents: 1890,
      imageUrl: IMG.bucket,
      description: "Bucket for two with sides",
      sortOrder: 3,
    },
    {
      name: "Midnight Bucket",
      sku: "BKT-NIGHT",
      category: "buckets",
      priceCents: 2190,
      imageUrl: IMG.bucket,
      description: "Late-night sharing bucket",
      sortOrder: 4,
    },
    // Wings & bites
    {
      name: "Hot Wings 6 pc",
      sku: "WNG-6",
      category: "wings-bites",
      priceCents: 590,
      imageUrl: IMG.wings,
      description: "Six spicy hot wings",
      sortOrder: 1,
    },
    {
      name: "Hot Wings 10 pc",
      sku: "WNG-10",
      category: "wings-bites",
      priceCents: 890,
      imageUrl: IMG.wings,
      description: "Ten spicy hot wings",
      sortOrder: 2,
    },
    {
      name: "Popcorn Chicken Regular",
      sku: "POP-REG",
      category: "wings-bites",
      priceCents: 420,
      imageUrl: IMG.popcorn,
      description: "Bite-size crispy popcorn chicken",
      sortOrder: 3,
    },
    {
      name: "Popcorn Chicken Large",
      sku: "POP-LRG",
      category: "wings-bites",
      priceCents: 620,
      imageUrl: IMG.popcorn,
      description: "Large popcorn chicken box",
      sortOrder: 4,
    },
    {
      name: "Nuggets 9 pc",
      sku: "NUG-9",
      category: "wings-bites",
      priceCents: 490,
      imageUrl: IMG.popcorn,
      description: "Nine crispy chicken nuggets",
      sortOrder: 5,
    },
    // Wraps
    {
      name: "Twister Wrap",
      sku: "WRP-TWIST",
      category: "wraps",
      priceCents: 520,
      imageUrl: IMG.wrap,
      description: "Classic chicken twister wrap",
      sortOrder: 1,
    },
    {
      name: "Zingeratha Wrap",
      sku: "WRP-ZING",
      category: "wraps",
      priceCents: 560,
      imageUrl: IMG.wrap,
      description: "Spicy wrap with fresh veggies",
      sortOrder: 2,
    },
    {
      name: "Rice & Spice Bowl",
      sku: "RICE-SPICE",
      category: "wraps",
      priceCents: 640,
      imageUrl: IMG.rice,
      description: "Spiced rice with crispy strips",
      sortOrder: 3,
    },
    // Sides
    {
      name: "Fries Regular",
      sku: "SID-FRY-R",
      category: "sides",
      priceCents: 220,
      imageUrl: IMG.fries,
      description: "Regular salted fries",
      sortOrder: 1,
    },
    {
      name: "Fries Large",
      sku: "SID-FRY-L",
      category: "sides",
      priceCents: 320,
      imageUrl: IMG.fries,
      description: "Large salted fries",
      sortOrder: 2,
    },
    {
      name: "Coleslaw",
      sku: "SID-SLAW",
      category: "sides",
      priceCents: 180,
      imageUrl: IMG.slaw,
      description: "Creamy coleslaw cup",
      sortOrder: 3,
    },
    {
      name: "Dinner Roll",
      sku: "SID-ROLL",
      category: "sides",
      priceCents: 90,
      imageUrl: IMG.slaw,
      description: "Soft dinner roll",
      sortOrder: 4,
    },
    {
      name: "Corn on the Cob",
      sku: "SID-CORN",
      category: "sides",
      priceCents: 210,
      imageUrl: IMG.rice,
      description: "Buttery corn cob",
      sortOrder: 5,
    },
    // Beverages
    {
      name: "Pepsi Regular",
      sku: "DRK-PEP-R",
      category: "beverages",
      priceCents: 150,
      imageUrl: IMG.drink,
      description: "Chilled soft drink regular",
      sortOrder: 1,
    },
    {
      name: "Pepsi Large",
      sku: "DRK-PEP-L",
      category: "beverages",
      priceCents: 200,
      imageUrl: IMG.drink,
      description: "Chilled soft drink large",
      sortOrder: 2,
    },
    {
      name: "Mountain Dew",
      sku: "DRK-DEW",
      category: "beverages",
      priceCents: 150,
      imageUrl: IMG.drink,
      description: "Chilled citrus soft drink",
      sortOrder: 3,
    },
    {
      name: "Mineral Water",
      sku: "DRK-WTR",
      category: "beverages",
      priceCents: 100,
      imageUrl: IMG.drink,
      description: "Bottled mineral water",
      sortOrder: 4,
    },
    {
      name: "Chocolate Shake",
      sku: "DRK-SHK",
      category: "beverages",
      priceCents: 350,
      imageUrl: IMG.drink,
      description: "Thick chocolate milkshake",
      sortOrder: 5,
    },
    // Desserts
    {
      name: "Soft Serve Cone",
      sku: "DST-CONE",
      category: "desserts",
      priceCents: 120,
      imageUrl: IMG.dessert,
      description: "Vanilla soft serve cone",
      sortOrder: 1,
    },
    {
      name: "Sundae Chocolate",
      sku: "DST-SUN",
      category: "desserts",
      priceCents: 220,
      imageUrl: IMG.dessert,
      description: "Chocolate sundae cup",
      sortOrder: 2,
    },
  ];

  const productBySku: Record<string, { id: string; priceCents: number; name: string }> = {};

  for (const item of products) {
    const row = await db.product.upsert({
      where: {
        organizationId_sku: {
          organizationId: organization.id,
          sku: item.sku,
        },
      },
      update: {
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        priceCents: item.priceCents,
        categoryId: categories[item.category].id,
        sortOrder: item.sortOrder,
        active: true,
        archivedAt: null,
        trackStock: false,
        currency: "USD",
      },
      create: {
        organizationId: organization.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        imageUrl: item.imageUrl,
        priceCents: item.priceCents,
        categoryId: categories[item.category].id,
        sortOrder: item.sortOrder,
        active: true,
        trackStock: false,
        currency: "USD",
      },
    });
    productBySku[item.sku] = {
      id: row.id,
      priceCents: row.priceCents,
      name: row.name,
    };
  }

  // Also create deal products under Deals category for POS grid visibility
  const dealDefs = [
    {
      name: "Zinger Combo",
      slug: "zinger-combo",
      priceCents: 799,
      compareAtCents: 990,
      imageUrl: IMG.deal,
      description: "Zinger Burger + Fries Regular + Pepsi Regular",
      sortOrder: 1,
      items: [
        { sku: "BRG-ZINGER", quantity: 1 },
        { sku: "SID-FRY-R", quantity: 1 },
        { sku: "DRK-PEP-R", quantity: 1 },
      ],
    },
    {
      name: "Mighty Box",
      slug: "mighty-box",
      priceCents: 1099,
      compareAtCents: 1350,
      imageUrl: IMG.deal,
      description: "Mighty Zinger + Fries Large + Pepsi Large",
      sortOrder: 2,
      items: [
        { sku: "BRG-MIGHTY", quantity: 1 },
        { sku: "SID-FRY-L", quantity: 1 },
        { sku: "DRK-PEP-L", quantity: 1 },
      ],
    },
    {
      name: "Hot Wings Deal",
      slug: "wings-deal",
      priceCents: 999,
      compareAtCents: 1240,
      imageUrl: IMG.wings,
      description: "Hot Wings 10 pc + Fries Regular + Pepsi Regular",
      sortOrder: 3,
      items: [
        { sku: "WNG-10", quantity: 1 },
        { sku: "SID-FRY-R", quantity: 1 },
        { sku: "DRK-PEP-R", quantity: 1 },
      ],
    },
    {
      name: "Family Feast",
      slug: "family-feast",
      priceCents: 3999,
      compareAtCents: 4890,
      imageUrl: IMG.bucket,
      description: "Family Bucket 8 pc + 2 Fries Large + 1.5L Pepsi + Coleslaw",
      sortOrder: 4,
      items: [
        { sku: "BKT-8", quantity: 1 },
        { sku: "SID-FRY-L", quantity: 2 },
        { sku: "DRK-PEP-L", quantity: 2 },
        { sku: "SID-SLAW", quantity: 1 },
      ],
    },
    {
      name: "Twister Meal",
      slug: "twister-meal",
      priceCents: 749,
      compareAtCents: 890,
      imageUrl: IMG.wrap,
      description: "Twister Wrap + Fries Regular + Pepsi Regular",
      sortOrder: 5,
      items: [
        { sku: "WRP-TWIST", quantity: 1 },
        { sku: "SID-FRY-R", quantity: 1 },
        { sku: "DRK-PEP-R", quantity: 1 },
      ],
    },
    {
      name: "Crispy Duo",
      slug: "crispy-duo",
      priceCents: 1299,
      compareAtCents: 1560,
      imageUrl: IMG.deal,
      description: "Hot & Crispy 2 pc x2 + Fries Large + 2 Pepsi Regular",
      sortOrder: 6,
      items: [
        { sku: "HC-2PC", quantity: 2 },
        { sku: "SID-FRY-L", quantity: 1 },
        { sku: "DRK-PEP-R", quantity: 2 },
      ],
    },
  ];

  for (const deal of dealDefs) {
    // Mirror deal as a POS product in Deals category for quick tap
    await db.product.upsert({
      where: {
        organizationId_sku: {
          organizationId: organization.id,
          sku: `DEAL-${deal.slug.toUpperCase()}`,
        },
      },
      update: {
        name: deal.name,
        description: deal.description,
        imageUrl: deal.imageUrl,
        priceCents: deal.priceCents,
        categoryId: categories.deals.id,
        sortOrder: deal.sortOrder,
        active: true,
        archivedAt: null,
      },
      create: {
        organizationId: organization.id,
        name: deal.name,
        sku: `DEAL-${deal.slug.toUpperCase()}`,
        description: deal.description,
        imageUrl: deal.imageUrl,
        priceCents: deal.priceCents,
        categoryId: categories.deals.id,
        sortOrder: deal.sortOrder,
        active: true,
        trackStock: false,
        currency: "USD",
      },
    });

    const dealRow = await db.deal.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: deal.slug,
        },
      },
      update: {
        name: deal.name,
        description: deal.description,
        imageUrl: deal.imageUrl,
        priceCents: deal.priceCents,
        compareAtCents: deal.compareAtCents,
        sortOrder: deal.sortOrder,
        active: true,
      },
      create: {
        organizationId: organization.id,
        name: deal.name,
        slug: deal.slug,
        description: deal.description,
        imageUrl: deal.imageUrl,
        priceCents: deal.priceCents,
        compareAtCents: deal.compareAtCents,
        sortOrder: deal.sortOrder,
        active: true,
      },
    });

    await db.dealItem.deleteMany({ where: { dealId: dealRow.id } });
    for (const line of deal.items) {
      const product = productBySku[line.sku];
      if (!product) continue;
      await db.dealItem.create({
        data: {
          dealId: dealRow.id,
          productId: product.id,
          quantity: line.quantity,
        },
      });
    }
  }

  const tableDefs = [
    { code: "T1", name: "Table 1", seats: 2, section: "Window", sortOrder: 1 },
    { code: "T2", name: "Table 2", seats: 4, section: "Window", sortOrder: 2 },
    { code: "T3", name: "Table 3", seats: 4, section: "Main hall", sortOrder: 3 },
    { code: "T4", name: "Table 4", seats: 4, section: "Main hall", sortOrder: 4 },
    { code: "T5", name: "Table 5", seats: 6, section: "Main hall", sortOrder: 5 },
    { code: "T6", name: "Table 6", seats: 8, section: "Patio", sortOrder: 6 },
    { code: "T7", name: "Table 7", seats: 2, section: "Patio", sortOrder: 7 },
    { code: "T8", name: "Table 8", seats: 4, section: "Patio", sortOrder: 8 },
  ];

  for (const def of tableDefs) {
    await db.diningTable.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: def.code,
        },
      },
      update: {
        name: def.name,
        seats: def.seats,
        section: def.section,
        sortOrder: def.sortOrder,
        status: "AVAILABLE",
      },
      create: {
        organizationId: organization.id,
        ...def,
        status: "AVAILABLE",
      },
    });
  }

  await db.auditLog.create({
    data: {
      action: "seed.kfc_menu",
      entityType: "organization",
      entityId: organization.id,
      summary: "Full crispy-chicken QSR menu seeded with deals",
      organizationId: organization.id,
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      metadata: {
        products: products.length,
        deals: dealDefs.length,
        categories: categoryDefs.length,
      },
    },
  });

  await seedCmsContent();

  console.log("Full menu seed complete");
  console.log("Login email:   ", DEMO_EMAIL);
  console.log("Login password:", DEMO_PASSWORD);
  console.log("Super Admin:   ", superEmail, "(isSuperAdmin=true)");
  console.log(`Categories: ${categoryDefs.length}`);
  console.log(`Products:   ${products.length + dealDefs.length} (incl. deal SKUs)`);
  console.log(`Deals:      ${dealDefs.length}`);
  console.log("Open POS:    /pos");
  console.log("Marketing:   /");
  console.log("CMS panel:   /super-admin");
}

async function seedCmsContent() {
  const homeBlocks = DEFAULT_HOME_BLOCKS;

  const pages: Array<{
    slug: string;
    title: string;
    excerpt: string;
    contentHtml: string;
    template: "HOME" | "DEFAULT";
    isSystem: boolean;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogImage: string;
    canonicalPath: string;
    homeBlocks?: typeof homeBlocks;
  }> = [
    {
      slug: "home",
      title: "Home",
      excerpt: "OrderLine restaurant operations platform",
      contentHtml: "",
      template: "HOME",
      isSystem: true,
      metaTitle: "OrderLine — Restaurant POS, Kitchen & WhatsApp AI",
      metaDescription:
        "Multi-tenant restaurant SaaS with POS, kitchen display, smart pricing, reports, and WhatsApp AI ordering.",
      metaKeywords:
        "restaurant pos, kitchen display, whatsapp ordering, multi-tenant saas",
      ogImage: IMG.bucket,
      canonicalPath: "/",
      homeBlocks,
    },
    {
      slug: "about-us",
      title: "About Us",
      excerpt:
        "OrderLine is the multi-tenant restaurant platform that connects POS, kitchen, tables, customers, reports, and WhatsApp AI for modern restaurant owners.",
      contentHtml: `
        <h2>Why restaurants choose OrderLine</h2>
        <p>OrderLine was built for company owners who need one connected system instead of a patchwork of tills, kitchen boards, spreadsheets, and chat apps. From the first POS tap to kitchen ready status and owner reports, every module shares the same live restaurant data.</p>
        <h3>What you get in one workspace</h3>
        <ul>
          <li>Fast POS for dine-in, takeaway, and delivery</li>
          <li>Kitchen display with clear status flow</li>
          <li>Floor plan tables, menu, deals, and customer directory</li>
          <li>Smart pricing with tax and service charge controls</li>
          <li>WhatsApp AI that orders against your live menu</li>
          <li>Dashboard graphs and exportable owner reports</li>
        </ul>
        <h3>Built for multi-tenant growth</h3>
        <p>Each restaurant organization stays isolated — menus, staff, orders, and messaging credentials never cross tenants. That makes OrderLine ready for single locations and growing groups alike.</p>
        <p>If you are evaluating restaurant management software, start with OrderLine: create a workspace, invite your team, and see how connected operations feel on a real service day.</p>
      `,
      template: "DEFAULT",
      isSystem: true,
      metaTitle:
        "About OrderLine | Restaurant POS, Kitchen & WhatsApp AI Platform",
      metaDescription:
        "Learn about OrderLine — the multi-tenant restaurant operating system for owners. Discover our mission, values, and how POS, kitchen, tables, reports, and WhatsApp AI work in one platform.",
      metaKeywords:
        "about orderline, restaurant management software, restaurant pos platform, kitchen display system, whatsapp ai ordering, multi-tenant restaurant saas, restaurant owner dashboard",
      ogImage: IMG.chicken,
      canonicalPath: "/about-us",
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      excerpt: "How OrderLine handles account and restaurant data.",
      contentHtml: `
        <h2>Privacy Policy</h2>
        <p>OrderLine processes account, organization, and operational data solely to provide the service.</p>
        <h3>Data we store</h3>
        <ul>
          <li>Account email and profile details</li>
          <li>Restaurant menu, orders, and customer records you create</li>
          <li>WhatsApp connection credentials encrypted at rest when configured</li>
        </ul>
        <h3>Your control</h3>
        <p>Organization owners can manage members, export reports, and request deletion of workspace data by contacting support.</p>
        <p>We do not sell personal data. Update this page from Super Admin as your legal copy evolves.</p>
      `,
      template: "DEFAULT",
      isSystem: true,
      metaTitle: "Privacy Policy · OrderLine",
      metaDescription: "Privacy practices for the OrderLine restaurant platform.",
      metaKeywords: "privacy policy, orderline",
      ogImage: IMG.drink,
      canonicalPath: "/privacy-policy",
    },
    {
      slug: "terms-and-conditions",
      title: "Terms and Conditions",
      excerpt: "Terms of use for OrderLine workspaces.",
      contentHtml: `
        <h2>Terms and Conditions</h2>
        <p>By creating an OrderLine workspace you agree to use the platform lawfully and keep credentials secure.</p>
        <h3>Service</h3>
        <p>OrderLine provides multi-tenant tools for restaurant operations. Features may change as we ship improvements.</p>
        <h3>Accounts</h3>
        <p>You are responsible for activity under your organization, including invited staff and connected WhatsApp numbers.</p>
        <h3>Acceptable use</h3>
        <ul>
          <li>No unauthorized access to other tenants</li>
          <li>No abuse of messaging or AI tooling</li>
          <li>Comply with local food-service and privacy laws</li>
        </ul>
        <p>Super Admins can revise these terms on the marketing site at any time.</p>
      `,
      template: "DEFAULT",
      isSystem: true,
      metaTitle: "Terms and Conditions · OrderLine",
      metaDescription: "Terms of use for OrderLine restaurant workspaces.",
      metaKeywords: "terms, conditions, orderline",
      ogImage: IMG.slaw,
      canonicalPath: "/terms-and-conditions",
    },
  ];

  const pageIds: Record<string, string> = {};

  for (const page of pages) {
    const row = await db.cmsPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        excerpt: page.excerpt,
        contentHtml: page.contentHtml,
        template: page.template,
        isSystem: page.isSystem,
        status: "PUBLISHED",
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        metaKeywords: page.metaKeywords,
        ogImage: page.ogImage,
        canonicalPath: page.canonicalPath,
        noIndex: false,
        publishedAt: new Date(),
        ...(page.homeBlocks ? { homeBlocks: page.homeBlocks } : {}),
      },
      create: {
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        contentHtml: page.contentHtml,
        template: page.template,
        isSystem: page.isSystem,
        status: "PUBLISHED",
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        metaKeywords: page.metaKeywords,
        ogImage: page.ogImage,
        canonicalPath: page.canonicalPath,
        noIndex: false,
        publishedAt: new Date(),
        homeBlocks: page.homeBlocks ?? undefined,
      },
    });
    pageIds[page.slug] = row.id;
  }

  const navDefs = [
    { label: "Home", href: "/", slug: "home" },
    { label: "About", href: "/about-us", slug: "about-us" },
    { label: "Privacy", href: "/privacy-policy", slug: "privacy-policy" },
    {
      label: "Terms",
      href: "/terms-and-conditions",
      slug: "terms-and-conditions",
    },
  ];

  const existingNav = await db.cmsNavItem.count();
  if (existingNav === 0) {
    for (let i = 0; i < navDefs.length; i += 1) {
      const item = navDefs[i];
      await db.cmsNavItem.create({
        data: {
          label: item.label,
          href: item.href,
          sortOrder: i,
          visible: true,
          pageId: pageIds[item.slug] ?? null,
        },
      });
    }
  }

  console.log("CMS pages + navbar seeded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

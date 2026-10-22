export type HomeFeature = {
  title: string;
  description: string;
  imageUrl: string;
};

export type OwnerModule = {
  title: string;
  description: string;
  points: string[];
  imageUrl: string;
};

export type HomeBlocks = {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    imageUrl: string;
  };
  featuresHeading: string;
  featuresSubheading: string;
  features: HomeFeature[];
  showcase: {
    title: string;
    description: string;
    imageUrl: string;
  };
  bottomCta: {
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
  };
  modulesHeading?: string;
  modulesSubheading?: string;
  modules?: OwnerModule[];
};

export const DEFAULT_OWNER_MODULES: OwnerModule[] = [
  {
    title: "Owner dashboard",
    description:
      "See today’s revenue, active orders, average ticket, and table occupancy in one live screen — so owners know the floor without calling the counter.",
    points: [
      "Live sales vs yesterday",
      "Active orders by channel",
      "Peak-hour trend graphs",
      "Branch-ready KPI cards",
    ],
    imageUrl: "/menu/menu-bucket.jpg",
  },
  {
    title: "POS & order desk",
    description:
      "Take dine-in, takeaway, and delivery from one terminal. Cart, modifiers, customers, tax, and thermal receipts stay fast during rush.",
    points: [
      "Table + takeaway + delivery",
      "Customer picker & addresses",
      "Smart tax on every ticket",
      "Print-ready receipts",
    ],
    imageUrl: "/menu/menu-burger.jpg",
  },
  {
    title: "Kitchen display",
    description:
      "Tickets land on the pass instantly. Staff advance status from pending to ready so front-of-house always knows what is plating.",
    points: [
      "One-tap status flow",
      "Channel-aware tickets",
      "Clear ready alerts",
      "Less verbal chasing",
    ],
    imageUrl: "/menu/menu-chicken.jpg",
  },
  {
    title: "Menu, deals & catalog",
    description:
      "Owners control categories, product photos, combo deals, and availability — tenant-safe so every restaurant keeps its own catalog.",
    points: [
      "Image-rich products",
      "Combo deal builder",
      "Category ordering",
      "Workspace isolation",
    ],
    imageUrl: "/menu/menu-deal.jpg",
  },
  {
    title: "Tables & floor plan",
    description:
      "Drag tables on a visual floor, track free vs occupied, and attach dine-in orders to the right cover count.",
    points: [
      "Visual floor editor",
      "Live occupancy",
      "Seat-aware orders",
      "Service clarity",
    ],
    imageUrl: "/menu/menu-wings.jpg",
  },
  {
    title: "Customers & delivery",
    description:
      "Store guest profiles and delivery addresses so repeat orders are faster and riders get the right destination every time.",
    points: [
      "Customer directory",
      "Saved addresses",
      "Order history links",
      "Delivery-ready tickets",
    ],
    imageUrl: "/menu/menu-wrap.jpg",
  },
  {
    title: "WhatsApp AI ordering",
    description:
      "Connect a business number and let AI browse your live menu, build carts, place kitchen orders, and hand off to humans when needed.",
    points: [
      "Live menu answers",
      "Cart & place order",
      "Order tracking replies",
      "Human handoff",
    ],
    imageUrl: "/menu/menu-drink.jpg",
  },
  {
    title: "Reports & smart pricing",
    description:
      "Export sales, products, and customers. Apply sales tax, VAT, and service charge automatically — inclusive or exclusive.",
    points: [
      "Charts on dashboard",
      "CSV / Excel / PDF export",
      "Tax & service charge",
      "Owner-ready insights",
    ],
    imageUrl: "/menu/menu-dessert.jpg",
  },
];

export const DEFAULT_HOME_BLOCKS: HomeBlocks = {
  hero: {
    eyebrow: "Restaurant operations platform",
    headline: "Your whole restaurant. One connected OrderLine.",
    subheadline:
      "POS, kitchen, tables, customers, reports, and WhatsApp AI work together — so owners run service, margins, and growth from one workspace.",
    primaryCtaLabel: "Start free",
    primaryCtaHref: "/register",
    secondaryCtaLabel: "Sign in",
    secondaryCtaHref: "/login",
    imageUrl: "/menu/menu-bucket.jpg",
  },
  featuresHeading: "Helping with what matters most",
  featuresSubheading:
    "Grow revenue, run service like clockwork, and make clearer owner decisions — with modules built for real restaurant shifts.",
  features: [
    {
      title: "Grow your revenue",
      description:
        "Turn WhatsApp conversations into kitchen orders, launch deals that move volume, and keep every channel in one queue so fewer tickets fall through.",
      imageUrl: "/menu/menu-deal.jpg",
    },
    {
      title: "Run service like clockwork",
      description:
        "Dine-in, takeaway, and delivery share one live system — from POS cart to kitchen ready — so the pass stays clear during rush.",
      imageUrl: "/menu/menu-chicken.jpg",
    },
    {
      title: "Make smarter owner decisions",
      description:
        "Dashboard graphs, product reports, and tax-aware pricing give owners a clear view of what is selling and what needs attention.",
      imageUrl: "/menu/menu-fries.jpg",
    },
    {
      title: "Stay in control of every branch workspace",
      description:
        "Multi-tenant isolation keeps each restaurant’s menu, staff, orders, and WhatsApp connection private and ready to scale.",
      imageUrl: "/menu/menu-wrap.jpg",
    },
  ],
  modulesHeading: "Owner modules that run the restaurant",
  modulesSubheading:
    "Every module is designed for company owners and managers — live visibility, faster service, and less busywork between systems.",
  modules: DEFAULT_OWNER_MODULES,
  showcase: {
    title: "Simplify and consolidate your restaurant tech",
    description:
      "The till, kitchen board, floor plan, customer book, reports spreadsheet, and WhatsApp inbox become one platform sharing one live view of your restaurant.",
    imageUrl: "/menu/menu-burger.jpg",
  },
  bottomCta: {
    title: "Ready to connect your whole restaurant?",
    description:
      "Create a workspace in minutes. Invite your team, set up menu and tables, and open the owner dashboard when service starts.",
    buttonLabel: "Create workspace",
    buttonHref: "/register",
  },
};

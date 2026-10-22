import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ChartColumnIncreasing,
  ChefHat,
  LayoutDashboard,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { HomeHeroDashboard } from "@/components/marketing/home-hero-dashboard";
import { HomeInsightsChart } from "@/components/marketing/home-insights-chart";
import {
  DEFAULT_OWNER_MODULES,
  type HomeBlocks,
} from "@/lib/cms/types";

const PLATFORM_MODULES = [
  "POS",
  "Orders",
  "Kitchen",
  "Tables",
  "Menu",
  "Deals",
  "Customers",
  "WhatsApp AI",
  "Reports",
  "Smart Pricing",
  "Team",
  "Multi-tenant",
];

const RESTAURANT_TYPES = [
  {
    type: "Quick service",
    bestFor: "High-volume rush hours",
    title: "Speed up every order from cart to kitchen.",
    points: ["Fast POS cart", "Combo deals", "Kitchen routing", "Receipt print"],
    image: "/menu/menu-burger.jpg",
  },
  {
    type: "Cafés & casual",
    bestFor: "Small teams, counter + tables",
    title: "Quick billing and table orders that keep the line moving.",
    points: ["Table floor plan", "Staff roles", "Daily sales view", "Customer saves"],
    image: "/menu/menu-drink.jpg",
  },
  {
    type: "Delivery-led",
    bestFor: "Takeaway & delivery brands",
    title: "One queue from ticket to address-ready delivery.",
    points: ["Delivery tickets", "Customer addresses", "Live status", "WhatsApp orders"],
    image: "/menu/menu-wrap.jpg",
  },
  {
    type: "Growing groups",
    bestFor: "Owners with multiple workspaces",
    title: "Standardise menus and reporting across each tenant workspace.",
    points: ["Isolated data", "Owner dashboards", "Role permissions", "Exportable reports"],
    image: "/menu/menu-bucket.jpg",
  },
];

export function ProHome({ blocks }: { blocks: HomeBlocks }) {
  const {
    hero,
    features,
    showcase,
    bottomCta,
    featuresHeading,
    featuresSubheading,
  } = blocks;
  const modules = blocks.modules?.length
    ? blocks.modules
    : DEFAULT_OWNER_MODULES;
  const modulesHeading =
    blocks.modulesHeading || "Owner modules that run the restaurant";
  const modulesSubheading =
    blocks.modulesSubheading ||
    "Every module is designed for company owners and managers — live visibility, faster service, and less busywork between systems.";

  return (
    <div className="bg-[#f5f9f6] text-[#10241a]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(13,159,110,0.14),transparent_42%),radial-gradient(circle_at_88%_8%,rgba(16,36,26,0.05),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <p className="mkt-fade-up inline-flex items-center gap-2 rounded-full border border-[#cfe5d9] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
              <Sparkles className="h-3.5 w-3.5" />
              {hero.eyebrow}
            </p>
            <h1 className="mkt-fade-up mkt-delay-1 mt-5 max-w-xl font-[family-name:var(--font-sora)] text-4xl font-semibold leading-[1.08] tracking-tight text-[#10241a] sm:text-5xl lg:text-[3.4rem]">
              {hero.headline}
            </h1>
            <p className="mkt-fade-up mkt-delay-2 mt-5 max-w-lg text-base leading-7 text-[#4b6558] sm:text-lg">
              {hero.subheadline}
            </p>
            <div className="mkt-fade-up mkt-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                href={hero.primaryCtaHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(13,159,110,0.9)] transition hover:bg-[#0b865c]"
              >
                {hero.primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={hero.secondaryCtaHref}
                className="rounded-full border border-[#cfe0d6] bg-white px-5 py-3 text-sm font-semibold text-[#10241a] transition hover:bg-[#eef5f1]"
              >
                {hero.secondaryCtaLabel}
              </Link>
            </div>
          </div>

          <div className="mkt-fade-up mkt-delay-2">
            <HomeHeroDashboard imageUrl={hero.imageUrl} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[#dfeae4] bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Multi-tenant safe",
              text: "Each restaurant workspace stays isolated",
            },
            {
              icon: MonitorSmartphone,
              title: "Runs in the browser",
              text: "POS, kitchen, and owner views on your devices",
            },
            {
              icon: Bot,
              title: "WhatsApp AI ready",
              text: "Orders from chat against your live menu",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f0] text-[#0d9f6e]">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#10241a]">{item.title}</p>
                <p className="mt-0.5 text-sm text-[#5f7a6c]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI spotlight */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d7e5dc] bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/menu/menu-deal.jpg"
              alt="WhatsApp AI ordering"
              className="aspect-[4/3] w-full object-cover mkt-photo-drift"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
              Meet WhatsApp AI
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
              The copilot that works your shift with you
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4b6558]">
              OrderLine AI takes menu questions and orders on WhatsApp, builds
              carts from your live catalog, places kitchen tickets, tracks order
              status, and hands off to a human when the guest needs help. You stay
              in control of every decision.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#3d5649]">
              {[
                "Browse live menu and deals in chat",
                "Place orders that appear on kitchen display",
                "Track tickets without calling the counter",
                "Owner visibility in the same workspace",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d9f6e]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Value pillars */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
              {featuresHeading}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4b6558]">
              {featuresSubheading}
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map((feature, index) => (
              <article
                key={`${feature.title}-${index}`}
                className="group overflow-hidden rounded-[1.5rem] border border-[#d7e5dc] bg-[#f7fbf8] transition hover:-translate-y-1 hover:shadow-[0_28px_60px_-40px_rgba(16,36,26,0.35)]"
              >
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={feature.imageUrl}
                    alt={feature.title}
                    className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d9f6e]">
                    Outcome {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-sora)] text-xl font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#4b6558]">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Insights / graphs */}
      <section id="insights" className="scroll-mt-24 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
                Owner insights
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
                Graphs that make margins visible
              </h2>
              <p className="mt-4 text-base leading-7 text-[#4b6558]">
                Company owners see weekly revenue, channel mix, and service
                pressure without exporting a spreadsheet first. Reports deepen the
                view when you need exports for accounting.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#3d5649]">
                {[
                  { icon: ChartColumnIncreasing, label: "Sales trends" },
                  { icon: LayoutDashboard, label: "Live KPIs" },
                  { icon: Store, label: "Channel mix" },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7e5dc] bg-white px-3 py-1.5"
                  >
                    <item.icon className="h-3.5 w-3.5 text-[#0d9f6e]" />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mkt-reveal">
              <HomeInsightsChart />
            </div>
          </div>
        </div>
      </section>

      {/* Owner modules */}
      <section id="modules" className="scroll-mt-24 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
              For company owners
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
              {modulesHeading}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4b6558]">
              {modulesSubheading}
            </p>
          </div>

          <div className="mt-14 space-y-16">
            {modules.map((mod, index) => {
              const reverse = index % 2 === 1;
              return (
                <article
                  key={`${mod.title}-${index}`}
                  className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                    reverse ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div
                    className="mkt-reveal overflow-hidden rounded-[1.75rem] border border-[#d7e5dc] shadow-[0_30px_70px_-48px_rgba(16,36,26,0.45)]"
                    style={{ animationDelay: `${0.06 * index}s` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mod.imageUrl}
                      alt={mod.title}
                      className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105 mkt-photo-drift"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
                      Module {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 font-[family-name:var(--font-sora)] text-2xl font-semibold tracking-tight sm:text-3xl">
                      {mod.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-[#4b6558]">
                      {mod.description}
                    </p>
                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {mod.points.map((point) => (
                        <li
                          key={point}
                          className="rounded-xl border border-[#d7e5dc] bg-[#f7fbf8] px-3 py-2.5 text-sm text-[#3d5649]"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Restaurant types */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for the way your restaurant works
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4b6558]">
              From a single counter to multi-workspace growth — OrderLine adapts
              to how owners actually run service.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {RESTAURANT_TYPES.map((item) => (
              <article
                key={item.type}
                className="overflow-hidden rounded-[1.5rem] border border-[#d7e5dc] bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.type}
                  className="aspect-[2/1] w-full object-cover"
                />
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    <span className="text-[#0d9f6e]">{item.type}</span>
                    <span className="text-[#9aafa3]">·</span>
                    <span className="text-[#5f7a6c]">{item.bestFor}</span>
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-sora)] text-xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {item.points.map((point) => (
                      <li
                        key={point}
                        className="rounded-full bg-[#eef5f1] px-3 py-1 text-xs font-medium text-[#3d5649]"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Connected platform */}
      <section className="relative overflow-hidden border-y border-[#dfeae4] bg-[#10241a] py-20 text-white lg:py-24">
        <div
          className="absolute inset-0 opacity-25 mkt-kenburns"
          style={{
            backgroundImage: `url(${showcase.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-[#10241a]/88" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
              {showcase.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-white/70">
              {showcase.description}
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {PLATFORM_MODULES.map((mod) => (
              <span
                key={mod}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white/85 backdrop-blur transition hover:bg-white/10"
              >
                {mod}
              </span>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: UtensilsCrossed,
                title: "Front of house",
                text: "POS, tables, customers, and receipts",
              },
              {
                icon: ChefHat,
                title: "Back of house",
                text: "Kitchen tickets and ready status",
              },
              {
                icon: Users,
                title: "Owner office",
                text: "Dashboard, reports, pricing, WhatsApp AI",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <item.icon className="h-5 w-5 text-[#6ee7b0]" />
                <p className="mt-3 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-white/65">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-[2rem] border border-[#cfe5d9] bg-gradient-to-br from-white via-[#f3faf6] to-[#e7f6ee] px-8 py-12 sm:px-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h2 className="max-w-2xl font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
                  {bottomCta.title}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#4b6558]">
                  {bottomCta.description}
                </p>
                <Link
                  href={bottomCta.buttonHref}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b865c]"
                >
                  {bottomCta.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-[#d7e5dc]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/menu/menu-popcorn.jpg"
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

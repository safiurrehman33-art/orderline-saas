import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Eye,
  HeartHandshake,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

const VALUES = [
  {
    icon: Zap,
    title: "Speed on the floor",
    text: "Every screen is built for rush hour — fewer taps, clearer tickets, faster handoffs between counter and kitchen.",
  },
  {
    icon: ShieldCheck,
    title: "Tenant-safe by design",
    text: "Each restaurant workspace is isolated. Menus, orders, customers, and WhatsApp connections never leak across tenants.",
  },
  {
    icon: Bot,
    title: "AI that talks to live data",
    text: "WhatsApp AI answers from your real catalog and can place kitchen orders — not a static FAQ bolted on the side.",
  },
  {
    icon: Eye,
    title: "Owner clarity",
    text: "Dashboards, graphs, and reports give company owners a live view of revenue, channels, and service pressure.",
  },
];

const MILESTONES = [
  {
    step: "01",
    title: "One workspace for the whole line",
    text: "We started OrderLine to replace scattered tills, kitchen boards, spreadsheets, and chat threads with a single multi-tenant restaurant OS.",
  },
  {
    step: "02",
    title: "Modules owners actually use",
    text: "POS, kitchen display, floor tables, catalog, deals, customers, smart pricing, and reports were designed around daily owner and manager workflows.",
  },
  {
    step: "03",
    title: "WhatsApp AI on the same system",
    text: "Instead of a separate chatbot, OrderLine connects messaging to the live menu so guests can order while staff stay in one operational view.",
  },
  {
    step: "04",
    title: "Built to grow with you",
    text: "From a single QSR counter to multi-workspace groups, OrderLine keeps permissions, data, and service flows ready for the next branch.",
  },
];

const TEAM_FOCUS = [
  {
    icon: Users,
    title: "Restaurant owners",
    text: "See KPIs, approve pricing rules, invite staff, and keep every channel visible without calling the floor.",
  },
  {
    icon: Layers3,
    title: "Managers & supervisors",
    text: "Run tables, tickets, and team access with clear roles so service stays consistent across shifts.",
  },
  {
    icon: HeartHandshake,
    title: "Front & kitchen teams",
    text: "Use a fast POS and kitchen board that reduce verbal chasing and keep guests moving.",
  },
];

export function AboutPremium({
  title,
  excerpt,
  contentHtml,
}: {
  title: string;
  excerpt?: string | null;
  contentHtml?: string;
}) {
  return (
    <div className="bg-[#f5f9f6] text-[#10241a]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#dfeae4]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(13,159,110,0.14),transparent_42%),radial-gradient(circle_at_90%_10%,rgba(16,36,26,0.05),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="mkt-fade-up inline-flex items-center gap-2 rounded-full border border-[#cfe5d9] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
              <Sparkles className="h-3.5 w-3.5" />
              About OrderLine
            </p>
            <h1 className="mkt-fade-up mkt-delay-1 mt-5 font-[family-name:var(--font-sora)] text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {title === "About Us"
                ? "Building a smarter restaurant operating system."
                : title}
            </h1>
            <p className="mkt-fade-up mkt-delay-2 mt-5 max-w-xl text-base leading-7 text-[#4b6558] sm:text-lg">
              {excerpt ||
                "OrderLine is the multi-tenant platform that connects POS, kitchen, tables, customers, reports, and WhatsApp AI — so restaurant owners run service and growth from one place."}
            </p>
            <div className="mkt-fade-up mkt-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(13,159,110,0.9)] transition hover:bg-[#0b865c]"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#modules"
                className="rounded-full border border-[#cfe0d6] bg-white px-5 py-3 text-sm font-semibold text-[#10241a] transition hover:bg-[#eef5f1]"
              >
                Explore modules
              </Link>
            </div>
          </div>
          <div className="mkt-fade-up mkt-delay-2 relative">
            <div className="overflow-hidden rounded-[1.75rem] border border-[#d7e5dc] bg-white shadow-[0_40px_100px_-48px_rgba(16,36,26,0.4)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/menu/menu-chicken.jpg"
                alt="Restaurant kitchen and service powered by OrderLine"
                className="aspect-[4/3] w-full object-cover mkt-photo-drift"
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-[#d7e5dc] bg-white/95 p-4 shadow-lg backdrop-blur sm:left-8 sm:right-auto sm:max-w-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d9f6e]">
                Our mission
              </p>
              <p className="mt-1 text-sm leading-6 text-[#3d5649]">
                Keep the line moving — for guests, staff, and owners — with one
                connected restaurant OS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
              Our story
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Built around real restaurant work
            </h2>
          </div>
          <div className="space-y-5 text-base leading-7 text-[#4b6558]">
            <p>
              Restaurants already juggle too many tools: a till for billing, a
              separate kitchen screen, a floor chart on paper, customer notes in
              chat, and reports trapped in spreadsheets. OrderLine was created to
              consolidate that stack into one live workspace.
            </p>
            <p>
              We focus on what company owners need every day — visibility,
              control, and speed — while giving front-of-house and kitchen teams
              interfaces that stay clear when the rush hits.
            </p>
            <p>
              Whether you run a single counter or multiple tenant workspaces,
              OrderLine keeps catalog, orders, tables, pricing, and WhatsApp AI
              connected under one brand: yours.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((item) => (
            <article
              key={item.step}
              className="rounded-[1.25rem] border border-[#d7e5dc] bg-white p-5 shadow-sm"
            >
              <p className="font-mono text-xs font-semibold text-[#0d9f6e]">
                {item.step}
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-sora)] text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5f7a6c]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
              What we believe
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Principles that shape every module
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4b6558]">
              From POS to WhatsApp AI, OrderLine is guided by a few non‑negotiables
              for restaurant software that has to work on a busy Friday night.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {VALUES.map((value) => (
              <article
                key={value.title}
                className="rounded-[1.5rem] border border-[#d7e5dc] bg-[#f7fbf8] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-36px_rgba(16,36,26,0.35)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f7f0] text-[#0d9f6e]">
                  <value.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-sora)] text-xl font-semibold tracking-tight">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#4b6558]">{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="overflow-hidden rounded-[1.75rem] border border-[#d7e5dc] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/menu/menu-burger.jpg"
                alt="OrderLine for restaurant owners and teams"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
                Who OrderLine is for
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
                Designed for owners first — useful for every role
              </h2>
              <div className="mt-8 space-y-5">
                {TEAM_FOCUS.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#d7e5dc] text-[#0d9f6e]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#10241a]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#4b6558]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CMS editable story block */}
      {contentHtml?.trim() ? (
        <section className="border-y border-[#dfeae4] bg-white py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d9f6e]">
              More from our team
            </p>
            <div
              className="prose-cms mt-6 text-[#4b6558]"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </section>
      ) : null}

      {/* Platform promise */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-[2rem] border border-[#cfe5d9] bg-gradient-to-br from-white via-[#f3faf6] to-[#e7f6ee] px-8 py-12 sm:px-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 text-[#0d9f6e]">
                  <Target className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                    Our promise
                  </span>
                </div>
                <h2 className="mt-3 max-w-xl font-[family-name:var(--font-sora)] text-3xl font-semibold tracking-tight sm:text-4xl">
                  One connected platform. Clearer decisions. Faster service.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#4b6558]">
                  Create a workspace, invite your team, and connect the modules
                  that matter — from the first POS ticket to owner reports and
                  WhatsApp AI orders.
                </p>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b865c]"
                >
                  Create your workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-[#d7e5dc]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/menu/menu-deal.jpg"
                  alt="OrderLine restaurant platform"
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

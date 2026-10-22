"use client";

import { HomeInsightsChart } from "@/components/marketing/home-insights-chart";

export function HomeHeroDashboard({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative mkt-float">
      <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(13,159,110,0.18),transparent_55%)]" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d5e4db] bg-white shadow-[0_40px_100px_-48px_rgba(16,36,26,0.45)]">
        <div className="flex items-center justify-between border-b border-[#e7eee9] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <p className="text-xs font-medium text-[#5f7a6c]">Owner dashboard</p>
          <span className="rounded-full bg-[#e8f7f0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0d9f6e]">
            Live
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { label: "Revenue today", value: "$4,280", hint: "+12%" },
            { label: "Active orders", value: "24", hint: "3 ready" },
            { label: "Avg ticket", value: "$18.40", hint: "stable" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-[#e7eee9] bg-[#f7fbf8] px-3 py-3"
            >
              <p className="text-[11px] text-[#5f7a6c]">{kpi.label}</p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className="text-lg font-semibold text-[#10241a]">{kpi.value}</p>
                <p className="text-[11px] font-medium text-[#0d9f6e]">{kpi.hint}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <HomeInsightsChart />
        </div>

        <div className="border-t border-[#e7eee9] p-4">
          <div className="overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Restaurant service"
              className="aspect-[21/9] w-full object-cover mkt-photo-drift"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

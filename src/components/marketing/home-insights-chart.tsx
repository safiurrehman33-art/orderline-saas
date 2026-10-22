"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const revenueData = [
  { day: "Mon", sales: 1840, orders: 62 },
  { day: "Tue", sales: 2120, orders: 71 },
  { day: "Wed", sales: 1980, orders: 68 },
  { day: "Thu", sales: 2460, orders: 84 },
  { day: "Fri", sales: 3120, orders: 109 },
  { day: "Sat", sales: 3580, orders: 128 },
  { day: "Sun", sales: 2890, orders: 97 },
];

const channelData = [
  { name: "Dine-in", value: 42 },
  { name: "Takeaway", value: 28 },
  { name: "Delivery", value: 18 },
  { name: "WhatsApp", value: 12 },
];

export function HomeInsightsChart() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-[#d7e5dc] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f7a6c]">
              Owner insight
            </p>
            <p className="mt-1 text-sm font-semibold text-[#10241a]">
              Weekly revenue trend
            </p>
          </div>
          <p className="text-xs font-medium text-[#0d9f6e]">+18.4% vs last week</p>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="olSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9f6e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0d9f6e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e7eee9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "#6b8476", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b8476", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #d7e5dc",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0d9f6e"
                strokeWidth={2.5}
                fill="url(#olSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#d7e5dc] bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f7a6c]">
          Channels
        </p>
        <p className="mt-1 text-sm font-semibold text-[#10241a]">
          Orders by source
        </p>
        <div className="mt-2 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelData}>
              <CartesianGrid stroke="#e7eee9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b8476", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #d7e5dc",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="#0d9f6e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

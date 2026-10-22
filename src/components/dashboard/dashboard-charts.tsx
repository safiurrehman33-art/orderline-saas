"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0f6b4c", "#e11d48", "#0ea5e9", "#f59e0b", "#8b5cf6", "#64748b"];

type Charts = {
  revenueByDay: { date: string; revenue: number; orders: number }[];
  statusChart: { status: string; count: number }[];
  typeChart: { type: string; orders: number; revenue: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="h-64 w-full">{children}</div>
    </section>
  );
}

export function DashboardCharts({ charts }: { charts: Charts }) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <ChartCard
        title="Revenue trend"
        subtitle="Last 14 days · confirmed / ready / fulfilled"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={charts.revenueByDay}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f6b4c" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0f6b4c" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d5e0d9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#5f6f66" />
            <YAxis tick={{ fontSize: 11 }} stroke="#5f6f66" />
            <Tooltip
              formatter={(value) => [
                typeof value === "number" ? `$${value.toFixed(2)}` : value,
                "Revenue",
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0f6b4c"
              strokeWidth={2.5}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Orders by status" subtitle="All-time pipeline mix">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={charts.statusChart}
              dataKey="count"
              nameKey="status"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {charts.statusChart.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Order type mix"
        subtitle="Last 14 days · dine-in / takeaway / delivery"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.typeChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d5e0d9" />
            <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="#5f6f66" />
            <YAxis tick={{ fontSize: 11 }} stroke="#5f6f66" />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="orders" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Orders" />
            <Bar dataKey="revenue" fill="#0f6b4c" radius={[6, 6, 0, 0]} name="Revenue $" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top sellers" subtitle="Last 14 days by quantity">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.topProducts} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d5e0d9" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#5f6f66" />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11 }}
              stroke="#5f6f66"
            />
            <Tooltip />
            <Bar dataKey="qty" fill="#e11d48" radius={[0, 6, 6, 0]} name="Qty sold" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

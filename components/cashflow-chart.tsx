"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  month: string;
  planned: number;
  paid: number;
}

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const months = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
  return `${months[parseInt(m) - 1]} ${year}`;
}

function formatPLN(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(value);
}

export function CashflowChart({ data }: { data: ChartData[] }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatPLN(value),
            name === "planned" ? "Planowane" : "Zapłacone",
          ]}
          labelFormatter={formatMonth}
        />
        <Legend
          formatter={(value) => (value === "planned" ? "Planowane" : "Zapłacone")}
        />
        <Area
          type="monotone"
          dataKey="planned"
          stroke="#6366f1"
          fill="url(#colorPlanned)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="paid"
          stroke="#22c55e"
          fill="url(#colorPaid)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

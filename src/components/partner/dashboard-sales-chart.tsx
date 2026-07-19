import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatPrice } from "@/lib/programs";

interface Point {
  label: string;
  amount: number;
  sales: number;
}

// Recharts is ~100KB gzipped. Kept in a dedicated chunk so it only loads
// when the dashboard chart section actually renders.
export default function DashboardSalesChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 animate-in fade-in duration-500">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="amtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.68 0.16 220)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.68 0.16 220)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="oklch(0.55 0 0)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="oklch(0.55 0 0)"
            tickFormatter={(v) =>
              v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "amount" ? [formatPrice(value, "INR"), "Collected"] : [value, "Sales"]
            }
            contentStyle={{
              borderRadius: 12,
              border: "1px solid oklch(0.9 0.005 240)",
              fontSize: 12,
              boxShadow: "0 4px 20px -8px oklch(0.5 0 0 / 0.15)",
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="oklch(0.6 0.18 220)"
            strokeWidth={2}
            fill="url(#amtGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

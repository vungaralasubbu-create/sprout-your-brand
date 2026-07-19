import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const fmtInr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const fmtInt = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0);

export default function SalesCommandRevenueChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0891b2" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="bucket" fontSize={11} stroke="hsl(var(--muted-foreground))" />
        <YAxis yAxisId="left" fontSize={11} stroke="hsl(var(--muted-foreground))" />
        <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(var(--muted-foreground))" />
        <Tooltip formatter={(v: any, k: any) => (k === "revenue" ? fmtInr(Number(v)) : fmtInt(Number(v)))} />
        <Legend />
        <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} fill="url(#rev)" />
        <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} fill="url(#sal)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

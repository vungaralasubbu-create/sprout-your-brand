import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

export default function PartnerSalesTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis yAxisId="l" fontSize={11} />
        <YAxis yAxisId="r" orientation="right" fontSize={11} />
        <Tooltip formatter={(v: any, key: any) => (key === "revenue" ? fmtINR(Number(v)) : v)} />
        <Line yAxisId="l" type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Sales" />
        <Line yAxisId="r" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
      </LineChart>
    </ResponsiveContainer>
  );
}

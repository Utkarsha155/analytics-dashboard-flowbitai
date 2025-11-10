"use client";

import {
  Card,
  CardContent,
  CardDescription, // Subtitle ke liye
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"; // <-- Ab sahi hai
import useSWR from "swr";

// --- Fetcher (Jo errors ko handle karta hai) ---
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error: any = new Error("An error occurred while fetching the data.");
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// API se data ka type
type ApiOutflowData = {
  date: string;
  amount_due: string;
};

// --- Currency Formatter (Figma jaisa) ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

// --- Y-Axis Formatter (€0k, €15k...) ---
const formatAxis = (value: number) => {
  if (value === 0) return "€0k";
  return `€${value / 1000}k`;
};

// --- Custom Tooltip (Screenshot jaisa popup) ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-sm">
        {/* Label (Date Range) */}
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {/* Data */}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-gray-500">Amount Due:</span>
          <span
            className="text-xs font-bold ml-4"
            style={{ color: "hsl(var(--primary))" }} // Dark Purple
          >
            {formatCurrency(payload[0].value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// --- Data Grouping Function (API data ko ranges mein daalne ke liye) ---
const groupDataIntoRanges = (data: ApiOutflowData[]) => {
  const buckets = {
    "0 - 7 days": 0,
    "8-30 days": 0,
    "31-60 days": 0,
    "60+ days": 0,
  };

  const today = new Date();
  // Din ka difference nikalne ke liye helper
  const daysDiff = (date1: Date, date2: Date) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  data.forEach((item) => {
    const itemDate = new Date(item.date);
    const diff = daysDiff(itemDate, today);
    const amount = Number(item.amount_due);

    if (diff <= 7) {
      buckets["0 - 7 days"] += amount;
    } else if (diff <= 30) {
      buckets["8-30 days"] += amount;
    } else if (diff <= 60) {
      buckets["31-60 days"] += amount;
    } else {
      buckets["60+ days"] += amount;
    }
  });

  // Object ko array mein convert karo (chart ke liye)
  return [
    { name: "0 - 7 days", AmountDue: buckets["0 - 7 days"] },
    { name: "8-30 days", AmountDue: buckets["8-30 days"] },
    { name: "31-60 days", AmountDue: buckets["31-60 days"] },
    { name: "60+ days", AmountDue: buckets["60+ days"] },
  ];
};

export function CashOutflowChart() {
  const { data, error } = useSWR<ApiOutflowData[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/cash-outflow`,
    fetcher
  );

  if (error) return <div>Failed to load chart</div>;
  if (!data) return <div>Loading...</div>;

  // Data ko ranges mein group karo
  const chartData = groupDataIntoRanges(data);
  // Y-axis ka max value (e.g., 45k)
  const maxAmount = Math.max(...chartData.map((d) => d.AmountDue));
  const domainMax = Math.ceil(maxAmount / 15000) * 15000;

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader>
        <CardTitle>Cash Outflow Forecast</CardTitle>
        {/* Subtitle add kiya */}
        <CardDescription>
          Expected payment obligations grouped by due date ranges.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            {/* Background grid (Figma jaisi horizontal lines) */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false} // Sirf horizontal lines
            />

            {/* X-Axis (Neeche "0 - 7 days"...) */}
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              fontSize={12}
              stroke="#6b7280"
            />

            {/* Y-Axis (Left mein €0k, €15k...) */}
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={12}
              stroke="#6b7280"
              tickFormatter={formatAxis} // Formatter use karo
              domain={[0, domainMax]}
              ticks={[0, 15000, 30000, 45000]}
            />

            {/* Custom Tooltip */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
            />

            {/* --- YEH HAI MAIN FIX (Dark Purple + Light Purple) --- */}
            <Bar
  dataKey="AmountDue"
  name="Amount Due"
  radius={[4, 4, 0, 0]}
  fill="hsl(var(--primary))"
  barSize={40}
  // --- YEH HAI FIX ---
  // Background ko ek prop ki tarah add karo
  background={{
    fill: "hsl(var(--primary) / 0.1)",
    radius: 4,
  }}
  // --- END FIX ---
/>
            {/* Legend ko hata diya */}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
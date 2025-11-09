"use client"; // Charts ko client-side pe render karna padta hai

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import useSWR from "swr"; // Data fetching ke liye

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    // --- THIS IS THE FIX ---
    // We cast 'error' to 'any' to allow adding custom properties
    const error: any = new Error("An error occurred while fetching the data.");
    // --- END FIX ---

    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};
// API se data aisa dikhega: [{ month: "2025-01", total_spend: 1000, invoice_count: 5 }]
type TrendData = {
  month: string;
  total_spend: number;
  invoice_count: number;
};

export function InvoiceTrendChart() {
  const { data, error } = useSWR<TrendData[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoice-trends`,
    fetcher
  );

  if (error) return <div>Failed to load chart</div>;
  if (!data) return <div>Loading...</div>;
const chartData = data.map((item) => ({
  ...item,
  total_spend: Number(item.total_spend),
  invoice_count: Number(item.invoice_count),
}));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Volume + Value Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_spend"
              stroke="#8884d8"
              name="Total Spend"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="invoice_count"
              stroke="#82ca9d"
              name="Invoice Count"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
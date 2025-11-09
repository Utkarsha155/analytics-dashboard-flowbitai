"use client";

import {
  Card,
  CardContent,
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
  Legend,
} from "recharts";
import useSWR from "swr";

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

// API data: [{ date: "2025-11-10T00:00:00.000Z", amount_due: "1500" }]
type OutflowData = {
  date: string;
  amount_due: string;
};

export function CashOutflowChart() {
  const { data, error } = useSWR<OutflowData[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/cash-outflow`,
    fetcher
  );

  if (error) return <div>Failed to load chart</div>;
  if (!data) return <div>Loading...</div>;

  // Format data for the chart
  const chartData = data.map((item) => ({
    // Format date to be shorter, e.g., "11/10"
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    }),
    AmountDue: Number(item.amount_due),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Outflow Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(value)
              }
            />
            <Legend />
            <Bar
              dataKey="AmountDue"
              fill="#82ca9d"
              name="Amount Due"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
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
} from "recharts";
import useSWR from "swr";

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
// API se data: [{ name: "Vendor A", total_spend: 5000 }]
type VendorData = {
  name: string;
  total_spend: number;
};

export function VendorSpendChart() {
  const { data, error } = useSWR<VendorData[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/vendors/top10`,
    fetcher
  );

  if (error) return <div>Failed to load chart</div>;
  if (!data) return <div>Loading...</div>;

  // Recharts ko numbers chahiye, string nahi
  const chartData = data.map((item) => ({
    ...item,
    total_spend: Number(item.total_spend), // Convert string to number
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend by Vendor (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="total_spend" fill="#8884d8" name="Total Spend" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
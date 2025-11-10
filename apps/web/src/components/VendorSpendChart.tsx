"use client";

import {
  Card,
  CardContent,
  CardDescription, 
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
  Cell, 
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

type VendorData = {
  name: string;
  total_spend: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

const formatAxis = (value: number) => {
  if (value === 0) return "€0k";
  return `€${value / 1000}k`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-gray-500">Vendor Spend:</span>
          <span
            className="text-xs font-bold ml-4"
            style={{ color: "hsl(var(--primary))" }} 
          >
            {formatCurrency(payload[0].value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function VendorSpendChart() {
  const { data, error } = useSWR<VendorData[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/vendors/top10`,
    fetcher
  );

  if (error) return <div>Failed to load chart</div>;
  if (!data) return <div>Loading...</div>;

  const chartData = data
    .map((item) => ({
      ...item,
      total_spend: Number(item.total_spend),
    }))
    .reverse();

  const maxSpend = Math.max(...chartData.map((d) => d.total_spend));
  const domainMax = Math.ceil(maxSpend / 15000) * 15000; 
  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader>
        <CardTitle>Spend by Vendor (Top 10)</CardTitle>
        <CardDescription>
          Vendor spend with cumulative percentage distribution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              horizontal={false}
            />

            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              fontSize={12}
              stroke="#6b7280"
              tickFormatter={formatAxis}
              domain={[0, domainMax]}
              ticks={[0, 15000, 30000, 45000]}
            />

            <YAxis
              dataKey="name"
              type="category"
              width={100}
              axisLine={false}
              tickLine={false}
              fontSize={12}
              stroke="#6b7280"
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
            />

            <Bar
              dataKey="total_spend"
              name="Total Spend"
              radius={[4, 4, 0, 0]}
              barSize={12}
              background={{
                fill: "hsl(var(--primary) / 0.1)", 
                radius: 4,
              }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === "OmegaLtd"
                      ? "hsl(var(--primary))" 
                      : "hsl(var(--chart-subtle))" 
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
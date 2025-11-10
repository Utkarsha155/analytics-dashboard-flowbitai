"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

type TrendData = {
  month: string;
  total_spend: number;
  invoice_count: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(`${label}-02`);
    const monthYear = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const spendData = payload.find((p: any) => p.dataKey === "total_spend");
    const countData = payload.find((p: any) => p.dataKey === "invoice_count");

    return (
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800">{monthYear}</p>
        <div className="mt-2 space-y-1">
          {countData && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Invoice count:</span>
              <span
                className="text-xs font-bold ml-4"
                style={{ color: "hsl(var(--chart-subtle))" }} 
              >
                {countData.value}
              </span>
            </div>
          )}
          {spendData && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Total Spend:</span>
              <span
                className="text-xs font-bold ml-4"
                style={{ color: "hsl(var(--primary))" }}
              >
                {formatCurrency(spendData.value)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function InvoiceTrendChart() {
  const { data, error } = useSWR<TrendData[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoice-trends`,
    fetcher
  );

  const yAxisMax = 80;

  const chartData = data
    ? data.map((item) => ({
        ...item,
        total_spend: Number(item.total_spend),
        invoice_count: Number(item.invoice_count),
        monthLabel: new Date(`${item.month}-02`).toLocaleString("en-US", {
          month: "short",
        }),
        backgroundBar: yAxisMax,
      }))
    : [];

  if (error) return <div>Failed to load chart</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader>
        <CardTitle>Invoice Volume + Value Trend</CardTitle>
        <CardDescription>
          Invoice count and total spend over 12 months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="monthLabel"
              axisLine={true}
              tickLine={true}
              fontSize={12}
              stroke="#6b7280"
            />
            <YAxis
              yAxisId="count"
              orientation="left"
              axisLine={true}
              tickLine={true}
              fontSize={12}
              stroke="#6b7280"
              domain={[0, yAxisMax]}
            />
            <YAxis yAxisId="spend" hide={true} />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
            />
            <Bar
              yAxisId="count"
              dataKey="backgroundBar"
              barSize={40}
              fill="hsl(var(--primary) / 0.05)"
              isAnimationActive={false}
            />
            
            <Line
              yAxisId="spend" 
              type="monotone"
              dataKey="total_spend"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              name="Total Spend"
            />

            <Line
              yAxisId="count" 
              type="monotone"
              dataKey="invoice_count"
              stroke="hsl(var(--chart-subtle))"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              name="Invoice Count"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
"use client";

import {
  Card,
  CardContent,
  CardDescription, // Subtitle ke liye
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"; // Legend ko remove kar diya
import useSWR from "swr";
import { cn } from "@/lib/utils";

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
type CategoryData = {
  category: string;
  total_spend: string;
};

// --- Figma ke Colors (aapke globals.css se) ---
const COLORS = [
  "hsl(var(--chart-1))", // Dark Purple
  "hsl(var(--chart-2))", // Orange
  "hsl(var(--chart-3))", // Light Blue/Peach
];

// --- Currency Formatter (Figma jaisa) ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR", // Figma mein € use hua hai
  }).format(Number(value));
};

export function CategorySpendChart() {
  const { data, error } = useSWR<CategoryData[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/category-spend`,
    fetcher
  );

  if (error) return <div>Failed to load chart</div>;
  if (!data) return <div>Loading...</div>;

  // Data ko ready karna (Number convert karna)
  const chartData = data.map((item) => ({
    name: item.category,
    value: Number(item.total_spend),
  }));

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader>
        <CardTitle>Spend by Category</CardTitle>
        {/* Subtitle add kiya */}
        <CardDescription>
          Distribution of spending across different categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chart (250px uncha) */}
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            {/* Tooltip (Hover popup) */}
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                border: "none",
              }}
            />

            {/* Background Donut (Light Gray) */}
            <Pie
              data={[{ value: 100 }]}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={70} // Donut hole
              outerRadius={90} // Donut size
              fill="#f3f4f6" // Tailwind gray-100
              stroke="none"
            />

            {/* Data Donut (Purple, Orange, Peach) */}
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70} // Donut hole
              outerRadius={90} // Donut size
              dataKey="value"
              nameKey="name"
              stroke="none"
              paddingAngle={2} // Chote gaps
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            {/* Default Legend ko hata diya */}
          </PieChart>
        </ResponsiveContainer>

        {/* --- YEH HAI NAYA CUSTOM LEGEND (Screenshot jaisa) --- */}
        <div className="mt-4 space-y-2 border-t pt-4">
          {chartData.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center justify-between"
            >
              {/* Left side (Color dot + Name) */}
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-700">{entry.name}</span>
              </div>
              {/* Right side (Value) */}
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
        {/* --- END CUSTOM LEGEND --- */}
      </CardContent>
    </Card>
  );
}
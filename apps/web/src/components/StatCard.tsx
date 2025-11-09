"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

// Mini-chart ke liye sample data (future mein isse bhi dynamic bana sakte hain)
const chartData = [
  { value: 10 },
  { value: 20 },
  { value: 15 },
  { value: 30 },
  { value: 25 },
  { value: 40 },
];

type StatCardProps = {
  title: string;
  value: string | number;
  percentage: string;
  isPositive: boolean; // Green ya Red
};

export function StatCard({
  title,
  value,
  percentage,
  isPositive,
}: StatCardProps) {
  const trendColor = isPositive ? "text-green-600" : "text-red-600";
  const chartStroke = isPositive ? "#22c55e" : "#dc2626";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between">
          {/* Left Side (Value + Percentage) */}
          <div>
            <div className="text-3xl font-bold">{value}</div>
            <p className={cn("text-xs", trendColor)}>
              {isPositive ? (
                <ArrowUpRight className="inline h-4 w-4" />
              ) : (
                <ArrowDownRight className="inline h-4 w-4" />
              )}
              {percentage} from last month
            </p>
          </div>

          {/* Right Side (Mini Chart) */}
          <div className="h-12 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chartStroke}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
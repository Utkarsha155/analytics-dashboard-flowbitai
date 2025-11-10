"use client"; // Needs to be a client component for Recharts

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// --- FIX 1: Import the correct icons (ArrowUp/ArrowDown) ---
import { ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

// Sample data for the mini-charts
const sampleDataGreen = [
  { v: 10 }, { v: 20 }, { v: 15 }, { v: 30 }, { v: 25 }, { v: 40 },
];
const sampleDataRed = [
  { v: 40 }, { v: 30 }, { v: 35 }, { v: 20 }, { v: 25 }, { v: 10 },
];

type StatCardProps = {
  title: string;
  value: string | number;
  percentage: string;
  isPositive: boolean;
  note?: string;
};

export function StatCard({
  title,
  value,
  percentage,
  isPositive,
  note,
}: StatCardProps) {
  // --- FIX 2: Use the exact green/red hex codes from Figma ---
  const trendColor = isPositive ? "text-[#16a34a]" : "text-[#e11d48]";
  const chartStroke = isPositive ? "#16a34a" : "#e11d48";
  const chartData = isPositive ? sampleDataGreen : sampleDataRed;

  return (
    // --- FIX 3: Use exact card styling (white bg, border, rounded) ---
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Title: "Total Spend" (light gray) */}
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        {/* Note: "(YTD)" (blue) */}
        <span className="text-xs font-semibold text-blue-500">{note}</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between">
          {/* Left Side (Value + Percentage) */}
          <div>
            {/* --- FIX 4: Use exact font size (2xl, not 3xl) --- */}
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <p className={cn("text-xs flex items-center pt-1", trendColor)}>
              {/* --- FIX 5: Use correct icons (ArrowUp/ArrowDown) --- */}
              {isPositive ? (
                <ArrowUp className="inline h-4 w-4" />
              ) : (
                <ArrowDown className="inline h-4 w-4" />
              )}
              {percentage}
              <span className="text-gray-500 ml-1.5">from last month</span>
            </p>
          </div>

          {/* Right Side (Mini Chart) */}
          {/* --- FIX 6: Adjust chart size to match Figma --- */}
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={chartStroke}
                  strokeWidth={2.5}
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
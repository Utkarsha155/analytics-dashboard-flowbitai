// This file fetches data and arranges all the components
import { StatCard } from "@/components/StatCard";
import { InvoiceTrendChart } from "@/components/InvoiceTrendChart";
import { VendorSpendChart } from "@/components/VendorSpendChart";
import { CategorySpendChart } from "@/components/CategorySpendChart";
import { CashOutflowChart } from "@/components/CashOutflowChart";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Sidebar } from "@/components/Sidebar"; // Import new Sidebar
import { Header } from "@/components/Header"; // Import new Header

// Data types (Same as before)
type StatsData = {
  totalSpend: number;
  totalInvoices: number;
  avgInvoiceValue: number;
  documentsUploaded: number;
};

// Data fetch function (Same as before)
async function getStats(): Promise<StatsData | null> {
  try {
    // We use 'no-store' to ensure data is fresh on every load for the demo
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/stats`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

// Currency formatter (Same as before)
const formatCurrency = (value: number) => {
  // Figma uses '€' (Euro)
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

export default async function Home() {
  const stats = await getStats();

  // Helper function to safely format data or show 'Loading...'
  const getStat = (key: keyof StatsData, isCurrency = false) => {
    if (!stats) return "Loading...";
    const value = stats[key];
    if (isCurrency) {
      return formatCurrency(value);
    }
    return value.toString();
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Figma-Perfect Sidebar */}
      <Sidebar />

      {/* Main Content Area (must have left margin of w-60) */}
      <div className="flex flex-1 flex-col ml-60">
        {/* Figma-Perfect Header */}
        <Header />

        {/* Main Dashboard Grid */}
        <main className="flex-1 grid-cols-1 gap-6 p-6 md:grid">
          {/* Top 4 Stat Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Spend"
              value={getStat("totalSpend", true)}
              percentage="+8.2%"
              isPositive={true}
              note="(YTD)"
            />
            <StatCard
              title="Total Invoices Processed"
              value={getStat("totalInvoices")}
              percentage="+8.2%"
              isPositive={true}
            />
            <StatCard
              title="Documents Uploaded"
              value={getStat("documentsUploaded")}
              percentage="-0"
              isPositive={false}
              note="This Month"
            />
            <StatCard
              title="Average Invoice Value"
              value={getStat("avgInvoiceValue", true)}
              percentage="+8.2%"
              isPositive={true}
            />
          </div>

          {/* Main Charts Grid (Line + Bar) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <InvoiceTrendChart />
            </div>
            <div>
              <VendorSpendChart />
            </div>
          </div>

          {/* Bottom Charts Grid (Pie + Bar) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <CategorySpendChart />
            </div>
            <div className="lg:col-span-2">
              <CashOutflowChart />
            </div>
          </div>

          {/* Invoice Table */}
          <InvoiceTable />
        </main>
      </div>
    </div>
  );
}
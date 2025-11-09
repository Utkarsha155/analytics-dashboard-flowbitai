// Yeh file ab data fetch karegi aur sab components ko jodegi
import { StatCard } from "@/components/StatCard";
import { InvoiceTrendChart } from "@/components/InvoiceTrendChart";
import { VendorSpendChart } from "@/components/VendorSpendChart";
import { CategorySpendChart } from "@/components/CategorySpendChart";
import { CashOutflowChart } from "@/components/CashOutflowChart";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Sidebar } from "@/components/Sidebar"; // Naya
import { Header } from "@/components/Header"; // Naya

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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/stats`,
      {
        next: { revalidate: 10 },
      }
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Naya Sidebar yahan hai */}
      <Sidebar />

      {/* Main content (ab 'sm:pl-14' use karega sidebar ke liye) */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        {/* Naya Header yahan hai */}
        <Header />

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {/* Top 4 Stat Cards (Naye StatCard component ke saath) */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <StatCard
              title="Total Spend (YTD)"
              value={stats ? formatCurrency(stats.totalSpend) : "Loading..."}
              percentage="+8.2%" // Sample data
              isPositive={true}  // Sample data
            />
            <StatCard
              title="Total Invoices Processed"
              value={stats ? stats.totalInvoices : "Loading..."}
              percentage="+8.2%" // Sample data
              isPositive={true}  // Sample data
            />
            <StatCard
              title="Documents Uploaded"
              value={stats ? stats.documentsUploaded : "Loading..."}
              percentage="-0 (less from)" // Sample data
              isPositive={false} // Sample data
            />
            <StatCard
              title="Average Invoice Value"
              value={
                stats ? formatCurrency(stats.avgInvoiceValue) : "Loading..."
              }
              percentage="+8.2%" // Sample data
              isPositive={true}  // Sample data
            />
          </div>

          {/* Charts (Same as before) */}
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="lg:col-span-2">
              <InvoiceTrendChart />
            </div>
            <div>
              <VendorSpendChart />
            </div>
          </div>

          <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <CategorySpendChart />
            <CashOutflowChart />
          </div>

          {/* Table (Same as before) */}
          <InvoiceTable />
        </main>
      </div>
    </div>
  );
}
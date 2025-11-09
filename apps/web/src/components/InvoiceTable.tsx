"use client"; // This component fetches its own data

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useSWR from "swr";

// This is the fetcher function we created before
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

// Define the type for a single invoice from our API
type Invoice = {
  id: string;
  invoice_number: string;
  date: string;
  amount: number;
  status: string;
  vendor: {
    name: string;
  };
};

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value)); // Ensure value is a number
};

// Helper to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

export function InvoiceTable() {
  const { data: invoices, error } = useSWR<Invoice[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices`,
    fetcher
  );

  if (error) return <div>Failed to load invoices</div>;
  if (!invoices) return <div>Loading invoices...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        {/* We can add a search bar here later */}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.vendor.name}</TableCell>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(invoice.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
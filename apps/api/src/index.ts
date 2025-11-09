// apps/api/src/index.ts
import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Initialize app & prisma client
const app = express();
const prisma = new PrismaClient();

// --- Middlewares ---
app.use(express.json()); // Allow express to read JSON bodies
app.use(cors()); // Allow all cross-origin requests (for now)

// --- Routes ---
// Simple "health check" route to see if it's working
app.get('/', (req, res) => {
  res.send('API is running!');
});

// --- API Endpoints ---

// 1. GET /stats (For the overview cards)
app.get('/stats', async (req, res) => {
  try {
    const totalSpend = await prisma.invoice.aggregate({
      _sum: { amount: true },
    });

    const totalInvoices = await prisma.invoice.count();

    const avgInvoice = await prisma.invoice.aggregate({
      _avg: { amount: true },
    });

    res.json({
      totalSpend: totalSpend._sum.amount || 0,
      totalInvoices: totalInvoices || 0,
      avgInvoiceValue: avgInvoice._avg.amount || 0,
      documentsUploaded: totalInvoices || 0, // Assuming 1 doc per invoice
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 2. GET /invoice-trends (For the main line chart)
app.get('/invoice-trends', async (req, res) => {
  try {
    const trends = await prisma.$queryRaw`
      SELECT 
        to_char(date, 'YYYY-MM') as month,
        SUM(amount) as total_spend,
        COUNT(id) as invoice_count
      FROM "Invoice"
      GROUP BY month
      ORDER BY month;
    `;
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// 3. GET /vendors/top10 (For the vendor bar chart)
app.get('/vendors/top10', async (req, res) => {
  try {
    const topVendors = await prisma.$queryRaw`
      SELECT 
        v.name,
        SUM(i.amount) as total_spend
      FROM "Invoice" i
      JOIN "Vendor" v ON i."vendorId" = v.id
      GROUP BY v.name
      ORDER BY total_spend DESC
      LIMIT 10;
    `;
    res.json(topVendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top vendors' });
  }
});

// 4. GET /category-spend (For the pie chart)
app.get('/category-spend', async (req, res) => {
  try {
    const accurateCategorySpend = await prisma.$queryRaw`
      SELECT
        category,
        SUM(price * quantity) as total_spend
      FROM "LineItem"
      GROUP BY category
      ORDER BY total_spend DESC;
    `;
    
    res.json(accurateCategorySpend);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category spend' });
  }
});

// 5. GET /invoices (For the main table)
app.get('/invoices', async (req, res) => {
  try {
    const { search } = req.query; // Get the search query

    const invoices = await prisma.invoice.findMany({
      where: {
        OR: search ? [
          { invoice_number: { contains: search as string, mode: 'insensitive' } },
          { vendor: { name: { contains: search as string, mode: 'insensitive' } } }
        ] : undefined,
      },
      include: {
        vendor: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// 6. GET /cash-outflow (For the cash outflow chart)
app.get('/cash-outflow', async (req, res) => {
  try {
    const outflow = await prisma.$queryRaw`
      SELECT 
        due_date::date as date,
        SUM(amount) as amount_due
      FROM "Invoice"
      WHERE status != 'Paid'
      GROUP BY date
      ORDER BY date
      LIMIT 30;
    `;
    res.json(outflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cash outflow' });
  }
});

// 7. POST /chat-with-data (This one is for Phase 4)
app.post('/chat-with-data', async (req, res) => {
  const { question } = req.body;
  
  res.json({
    message: "AI endpoint is not connected yet.",
    sql: "SELECT 'todo'",
    results: [],
  });
});

// --- Start the Server ---
const PORT = process.env.PORT || 8080; // We changed this to 8080
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
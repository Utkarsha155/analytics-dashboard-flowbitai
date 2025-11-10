import 'dotenv/config'; // Password loader
// Poore server ko batata hai ki BigInt ko string mein kaise badalna hai
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
// --- END 'BigInt' FIX ---

import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';

// Initialize app & prisma client
const app = express();
const prisma = new PrismaClient();

const Groq = require('groq');
// We use 'as any' to bypass the TypeScript misinterpretation of the constructor
// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Middlewares ---
app.use(express.json());
app.use(cors());

// --- Routes ---
// Simple "health check" route
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
      documentsUploaded: totalInvoices || 0,
    });
  } catch (error) {
    console.error('!!! ERROR IN /stats !!!', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 2. GET /invoice-trends (For the main line chart)
app.get('/invoice-trends', async (req, res) => {
  try {
    // --- YEH HAI SQL TYPO FIX ---
    // GROUP BY clause ko SELECT clause se match kar diya hai
    const trends = await prisma.$queryRaw`
      SELECT 
        to_char(date, 'YYYY-MM') as month,
        SUM(amount) as total_spend,
        COUNT(id) as invoice_count
      FROM "Invoice"
      GROUP BY to_char(date, 'YYYY-MM') -- YEH LINE FIX HO GAYI HAI
      ORDER BY month;
    `;
    res.json(trends);
  } catch (error) {
    console.error('!!! ERROR IN /invoice-trends !!!', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// 3. GET /vendors/top10 (For the vendor bar chart)
// (Is route mein 'BigInt' fix (Step 1) se help milegi)
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
    console.error('!!! ERROR IN /vendors/top10 !!!', error);
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
    console.error('!!! ERROR IN /category-spend !!!', error);
    res.status(500).json({ error: 'Failed to fetch category spend' });
  }
});

// 5. GET /invoices (For the main table)
app.get('/invoices', async (req, res) => {
  try {
    const { search } = req.query;
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: search ? [
          { invoice_number: { contains: search as string, mode: 'insensitive' } },
          { vendor: { name: { contains: search as string, mode: 'insensitive' } } }
        ] : undefined,
      },
      include: { vendor: true },
      orderBy: { date: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    console.error('!!! ERROR IN /invoices !!!', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// 6. GET /cash-outflow (For the cash outflow chart)
// 6. GET /cash-outflow (For the cash outflow chart)
app.get('/cash-outflow', async (req, res) => {
  try {
    // --- YEH HAI SQL FIX ---
    // Hum 'GROUP BY' ko 'SELECT' se 100% match kar rahe hain
    const outflow = await prisma.$queryRaw`
      SELECT 
        due_date::date as date,
        SUM(amount) as amount_due
      FROM "Invoice"
      WHERE status != 'Paid'
      GROUP BY due_date::date  -- YEH LINE FIX HO GAYI HAI
      ORDER BY date
      LIMIT 30;
    `;
    res.json(outflow);
  } catch (error) {
    console.error("!!! ERROR IN /cash-outflow !!!", error);
    res.status(500).json({ error: 'Failed to fetch cash outflow' });
  }
});
// 7. POST /chat-with-data (This one is for Phase 4)
// Endpoint 7. POST /chat-with-data (Final Working Version)
// Endpoint 7. POST /chat-with-data (Final Working Version)
app.post('/chat-with-data', async (req, res) => {
  // NOTE: Groq key is loaded via .env, client is initialized globally
  const { question } = req.body;

  try {
    // --- 1. Schema aur Question ko Groq ke paas bhejo ---
    // Hum database ka schema nikal kar LLM ko de rahe hain
    const schema = await prisma.$queryRaw`
      SELECT 
        table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `;

    const prompt = `You are a helpful PostgreSQL SQL assistant. Your task is to generate a PostgreSQL query based on the user's question. The database schema is provided below. Only return the SQL query, nothing else.

    SCHEMA: ${JSON.stringify(schema)}

    Question: ${question}`;

    // --- 2. Groq se SQL generate karwao ---
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768', 
      temperature: 0,
    });

    const rawSql = chatCompletion.choices[0].message.content.trim();
    // Remove markdown and semicolon for safe execution
    const sqlQuery = rawSql.replace(/```sql|```|;/g, '').trim();

    // --- 3. Generated SQL query ko database pe run karo ---
    const results = await prisma.$queryRawUnsafe(sqlQuery);

    // --- 4. Frontend ko data wapas bhejo ---
    res.json({
      sql: sqlQuery,
      results_json: JSON.stringify(results), // Frontend will parse this
    });

  } catch (error) {
    console.error('!!! ERROR IN /chat-with-data !!!', error);
    res.status(500).json({ error: `AI Processing Failed. Please check the question format or backend logs.` });
  }
});
// --- Start the Server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  // Yeh console.log ab local pe nahi dikhega, sirf Render pe dikhega
  // Humne password check wala log hata diya hai
  console.log(`Server is running on http://localhost:${PORT}`);
});
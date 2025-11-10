import 'dotenv/config'; // Loads DB connection string and Groq Key

// --- BigInt FIX: Tells JSON.stringify how to handle large numbers ---
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
// --- END FIX ---

// --- Groq Fix: Use CommonJS require for stable instantiation ---
const Groq = require('groq'); 

import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';

// Initialize clients
const prisma = new PrismaClient();
const app = express();

// Groq client initialization (using the simplest working form)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Middlewares ---
app.use(cors()); 
app.use(express.json());

// --- Core Data Endpoints (Task 1) ---

// 1. GET /stats (Overview Cards)
app.get('/stats', async (req, res) => {
  try {
    const totalSpend = await prisma.invoice.aggregate({ _sum: { amount: true } });
    const totalInvoices = await prisma.invoice.count();
    const avgInvoice = await prisma.invoice.aggregate({ _avg: { amount: true } });

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

// 2. GET /invoice-trends (Line Chart)
app.get('/invoice-trends', async (req, res) => {
  try {
    // FIX: GROUP BY clause now matches the expression in SELECT
    const trends = await prisma.$queryRaw`
      SELECT 
        to_char(date, 'YYYY-MM') as month,
        SUM(amount) as total_spend,
        COUNT(id) as invoice_count
      FROM "Invoice"
      GROUP BY to_char(date, 'YYYY-MM')
      ORDER BY month;
    `;
    res.json(trends);
  } catch (error) {
    console.error('!!! ERROR IN /invoice-trends !!!', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// 3. GET /vendors/top10 (Bar Chart)
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

// 4. GET /category-spend (Pie Chart)
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

// 5. GET /cash-outflow (Bar Chart)
app.get('/cash-outflow', async (req, res) => {
  try {
    const outflow = await prisma.$queryRaw`
      SELECT 
        due_date::date as date,
        SUM(amount) as amount_due
      FROM "Invoice"
      WHERE status != 'Paid'
      GROUP BY due_date::date
      ORDER BY date
      LIMIT 30;
    `;
    res.json(outflow);
  } catch (error) {
    console.error('!!! ERROR IN /cash-outflow !!!', error);
    res.status(500).json({ error: 'Failed to fetch cash outflow' });
  }
});

// --- AI Endpoint (Task 2: "Chat with Data") ---
app.post('/chat-with-data', async (req, res) => {
  const { question } = req.body;

  try {
    // 1. Get Schema (Provide Groq with table structure)
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

    // 2. Groq se SQL generate karwao
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768', 
      temperature: 0,
    });

    const rawSql = chatCompletion.choices[0].message.content.trim();
    // Clean SQL for safe execution
    const sqlQuery = rawSql.replace(/```sql|```|;/g, '').trim();

    // 3. Generated SQL query ko database pe run karo
    const results = await prisma.$queryRawUnsafe(sqlQuery);

    // 4. Frontend ko data wapas bhejo
    res.json({
      sql: sqlQuery,
      results_json: JSON.stringify(results), 
    });

  } catch (error) {
    console.error('!!! ERROR IN /chat-with-data !!!', error);
    res.status(500).json({ error: `AI Processing Failed. Please check the question format or backend logs.` });
  }
});

// --- Start the Server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
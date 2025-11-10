import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';

// --- Fix BigInt serialization for JSON ---
declare global {
  interface BigInt {
    toJSON: () => string;
  }
}
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// --- Initialize ---
const prisma = new PrismaClient();
const app = express();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

app.use(cors());
app.use(express.json());

// ======================================================
// 🧾 /invoices — Fetch all invoices
// ======================================================
app.get('/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        vendor: true,
        customer: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
    res.json(invoices);
  } catch (error) {
    console.error('!!! ERROR IN /invoices !!!', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// ======================================================
// 📊 /stats — Overview Cards
// ======================================================
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

// ======================================================
// 📈 /invoice-trends — Line Chart
// ======================================================
app.get('/invoice-trends', async (req, res) => {
  try {
    const trends = await prisma.$queryRawUnsafe(`
      SELECT 
        to_char(date, 'YYYY-MM') as month,
        SUM(amount) as total_spend,
        COUNT(id) as invoice_count
      FROM "Invoice"
      GROUP BY to_char(date, 'YYYY-MM')
      ORDER BY month;
    `);
    res.json(trends);
  } catch (error) {
    console.error('!!! ERROR IN /invoice-trends !!!', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// ======================================================
// 🏆 /vendors/top10 — Bar Chart
// ======================================================
app.get('/vendors/top10', async (req, res) => {
  try {
    const topVendors = await prisma.$queryRawUnsafe(`
      SELECT 
        v.name,
        SUM(i.amount) as total_spend
      FROM "Invoice" i
      JOIN "Vendor" v ON i."vendorId" = v.id
      GROUP BY v.name
      ORDER BY total_spend DESC
      LIMIT 10;
    `);
    res.json(topVendors);
  } catch (error) {
    console.error('!!! ERROR IN /vendors/top10 !!!', error);
    res.status(500).json({ error: 'Failed to fetch top vendors' });
  }
});

// ======================================================
// 🥧 /category-spend — Pie Chart
// ======================================================
app.get('/category-spend', async (req, res) => {
  try {
    const categorySpend = await prisma.$queryRawUnsafe(`
      SELECT
        category,
        SUM(price * quantity) as total_spend
      FROM "LineItem"
      GROUP BY category
      ORDER BY total_spend DESC;
    `);
    res.json(categorySpend);
  } catch (error) {
    console.error('!!! ERROR IN /category-spend !!!', error);
    res.status(500).json({ error: 'Failed to fetch category spend' });
  }
});

// ======================================================
// 💸 /cash-outflow — Bar Chart
// ======================================================
app.get('/cash-outflow', async (req, res) => {
  try {
    const outflow = await prisma.$queryRawUnsafe(`
      SELECT 
        due_date::date as date,
        SUM(amount) as amount_due
      FROM "Invoice"
      WHERE status != 'Paid'
      GROUP BY due_date::date
      ORDER BY date
      LIMIT 30;
    `);
    res.json(outflow);
  } catch (error) {
    console.error('!!! ERROR IN /cash-outflow !!!', error);
    res.status(500).json({ error: 'Failed to fetch cash outflow' });
  }
});

// ======================================================
// 🤖 /chat-with-data — AI SQL Assistant
// ======================================================
app.post('/chat-with-data', async (req, res) => {
  const { question } = req.body;

  try {
    const schema = await prisma.$queryRawUnsafe(`
      SELECT 
        table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    const prompt = `
You are an expert PostgreSQL SQL assistant.
Generate a valid SQL query for the question below using this schema.
⚠️ Rules:
- Always use double quotes for tables and columns.
- For time filters, use CURRENT_DATE - INTERVAL '90 days'.
- Return only SQL (no text).
SCHEMA:
${JSON.stringify(schema)}
QUESTION:
${question}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      temperature: 0,
    });

    let rawSql = chatCompletion.choices?.[0]?.message?.content?.trim() || '';
    let sqlQuery = rawSql.replace(/```sql|```/gi, '').replace(/;$/, '').trim();

    if (!sqlQuery.toLowerCase().startsWith('select')) {
      throw new Error(`Invalid SQL generated: ${sqlQuery}`);
    }

    console.log('🧠 Final SQL before execution:', sqlQuery);

    const results = await prisma.$queryRawUnsafe(sqlQuery);

    let explanation = '';
    try {
      const explainPrompt = `
You are a data analyst. Explain this SQL result in one short English sentence.
Question: ${question}
SQL: ${sqlQuery}
Results: ${JSON.stringify(results).slice(0, 400)}
`;
      const explain = await groq.chat.completions.create({
        messages: [{ role: 'user', content: explainPrompt }],
        model: GROQ_MODEL,
        temperature: 0.2,
      });
      explanation = explain.choices?.[0]?.message?.content?.trim() || '';
    } catch (expErr) {
      console.error('⚠️ Explanation generation failed:', expErr);
    }

    res.json({
      sql: sqlQuery,
      results_json: JSON.stringify(results),
      explanation,
    });
  } catch (error: any) {
    console.error('!!! ERROR IN /chat-with-data !!!', error);
    res.status(500).json({
      error: 'AI Processing Failed or invalid SQL.',
      details: error.message || error,
    });
  }
});

// ======================================================
// 🚀 Start Server
// ======================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`==> Your service is live 🎉`);
});

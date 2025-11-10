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

app.use(cors());
app.use(express.json());

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

// ======================================================
// 🏆 /vendors/top10 — Bar Chart
// ======================================================
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

// ======================================================
// 🥧 /category-spend — Pie Chart
// ======================================================
app.get('/category-spend', async (req, res) => {
  try {
    const categorySpend = await prisma.$queryRaw`
      SELECT
        category,
        SUM(price * quantity) as total_spend
      FROM "LineItem"
      GROUP BY category
      ORDER BY total_spend DESC;
    `;
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

// ======================================================
// 🤖 /chat-with-data — AI SQL Assistant
// ======================================================
app.post('/chat-with-data', async (req, res) => {
  const { question } = req.body;

  try {
    // 1️⃣ Get schema
    const schema = await prisma.$queryRaw`
      SELECT 
        table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    // 2️⃣ Build AI prompt
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
  model: 'gemma-2-9b-it',
  temperature: 0,
});


    let rawSql = chatCompletion.choices?.[0]?.message?.content?.trim() || '';
    let sqlQuery = rawSql.replace(/```sql|```/gi, '').replace(/;$/, '').trim();

    // 3️⃣ Validate query
    if (!sqlQuery.toLowerCase().startsWith('select')) {
      throw new Error(`Invalid SQL generated: ${sqlQuery}`);
    }

    console.log('🧠 Final SQL before execution:', sqlQuery);

    // 4️⃣ Execute SQL
    const results = await prisma.$queryRawUnsafe(sqlQuery);

    // 5️⃣ Generate AI explanation
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
  model: 'gemma-2-9b-it',
  temperature: 0.2,
});

      explanation = explain.choices?.[0]?.message?.content?.trim() || '';
    } catch (expErr) {
      console.error('⚠️ Explanation generation failed:', expErr);
    }

    // ✅ Return all
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
});

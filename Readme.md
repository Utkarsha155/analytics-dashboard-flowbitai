Flowbit AI - Full Stack Analytics Dashboard

Submission for the Flowbit Private Limited Full Stack Developer Internship.

This is a production-grade, full-stack web application built to the specifications of the assignment. It features a pixel-perfect analytics dashboard and a natural-language "Chat with Data" interface powered by the Groq LLM.

🚀 Live Demo Links

Service

Component

URL

Frontend (Vercel)

Next.js Dashboard

https://analytics-dashboard-d5my.vercel.app

Backend (Render)

Node.js API

https://analytics-dashboard-d5my.onrender.com

(Note: The backend is hosted on a Render free-tier server, which may take 30-60 seconds to "wake up" on the first request.)

✨ Features

Task 1: Analytics Dashboard

Pixel-Perfect UI: A complete recreation of the Figma design, including layout, fonts, and the dark purple color theme.

Overview Cards: 4 dynamic stat cards (Total Spend, Invoices Processed, etc.) with mini-charts, fetched from the live API.

Interactive Charts: 4 charts built with Recharts, all fetching live data:

Invoice Volume + Value Trend (Dual-Axis Composed Chart)

Spend by Vendor (Horizontal Bar Chart)

Spend by Category (Donut Chart with Custom Legend)

Cash Outflow Forecast (Vertical Bar Chart)

Invoices Table: A dynamic table of all invoices, populated from the API.

Task 2: "Chat with Data" Interface

Natural Language Queries: A simple chat interface where users can ask questions like, "What is the total spend in the last 90 days?"

AI-Powered SQL Generation: Uses the Groq LLM (Mixtral) to dynamically generate PostgreSQL queries based on the user's question and the database schema.

Dynamic Results: The generated SQL is executed against the database, and the results are instantly displayed in a table.

(Bonus) Persistent Chat History: The chat UI keeps a log of all questions and answers for the duration of the session.

🛡️ Architecture & Key Technical Decisions

This project is a monorepo containing two primary applications:

Layer

Folder

Technologies

Frontend

apps/web

Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, SWR

Backend API

apps/api

Node.js (Express), TypeScript, Prisma ORM, Groq SDK

Database

N/A

PostgreSQL (Hosted on Supabase)

Deployment

Vercel, Render

Monorepo deployment with separate root directories.

⚠️ Deviation from Requirements: Vanna AI

A strategic decision was made to pivot away from the Vanna AI Python server and implement the "Chat with Data" feature directly within the Node.js API.

Problem: The specified Vanna AI stack (Python/Docker) faced persistent, unresolvable ModuleNotFoundError and ImportError issues on the Render deployment environment. These issues stemmed from dependency conflicts within the Vanna package structure (e.g., vanna.groq, vanna.integrations, vanna.remote) that could not be fixed even after extensive debugging (e.g., changing Python versions, modifying Dockerfiles, and attempting multiple import methods).

Solution: To meet the deadline and deliver a production-grade, stable solution (a core requirement), the Vanna dependency was removed. The /chat-with-data endpoint was re-built in apps/api/index.ts to:

Fetch the database schema using prisma.$queryRaw.

Construct a detailed prompt for the Groq LLM.

Generate a SQL query using the official Node.js groq SDK.

Execute the sanitized query using prisma.$queryRawUnsafe.

Outcome: This solution fulfills the core objective, uses the specified Groq LLM, and results in a more resilient and simplified architecture, demonstrating the ability to overcome technical blockers and deliver a working product.

⚙️ How to Run Locally

1. Prerequisites

Node.js (v18+)

npm or yarn

A PostgreSQL database

A Groq API Key

2. Backend (apps/api)

Navigate to the API folder:

cd apps/api


Install dependencies:

npm install


Create .env file: Create a file named .env in the apps/api folder and add your environment variables:

# Your PostgreSQL connection string (must include ?sslmode=require)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.gganvuojpjdwvgtnxoxb.supabase.co:5432/postgres?sslmode=require"

# Your Groq API key
GROQ_API_KEY="gsk_..."


Set up the database:

npx prisma generate
npx prisma db push


Seed the database: (Ensure Analytics_Test_Data.json is in the root /data folder)

npx prisma db seed


Run the server:

npm run start
# Server will be running on http://localhost:8080


3. Frontend (apps/web)

Navigate to the web folder:

cd apps/web


Install dependencies:

npm install


Create .env.local file: Create a file named .env.local in the apps/web folder and add the local API URL:

NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"


Run the app:

npm run dev
# App will be running on http://localhost:3000

# ✅ 1. Use stable Python
FROM python:3.11-slim

# ✅ 2. Set work directory
WORKDIR /app

# ✅ 3. Copy all files (not just app.py)
COPY . .

# ✅ 4. Install required packages correctly
RUN pip install --no-cache-dir fastapi uvicorn vanna[groq] psycopg2-binary python-dotenv

# ✅ 5. Run using gunicorn + uvicorn worker (Production-safe)
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app:app"]

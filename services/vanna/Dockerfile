# Use Python 3.11
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn[standard] vanna[groq] psycopg2-binary python-dotenv gunicorn

# Expose port (Render passes PORT env)
EXPOSE 10000

# Run app using gunicorn (fast + production ready)
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app:app"]

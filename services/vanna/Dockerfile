# Use Python 3.11
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN pip install 'vanna[groq,postgres]' openai groq psycopg2-binary fastapi uvicorn python-dotenv
# Expose port (Render passes PORT env)
EXPOSE 10000

# Run app using gunicorn (fast + production ready)
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app:app"]

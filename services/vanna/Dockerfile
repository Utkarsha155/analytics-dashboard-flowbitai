# 1. Python ka ek stable version (3.11) use karo
FROM python:3.11-slim

# 2. Server ke andar ek 'app' folder banao
WORKDIR /app

# 3. .env file ko chhodkar, baaki sab copy karo
COPY app.py .

# 4. Saare packages alag-alag install karo (extras ke bina)
RUN pip install vanna groq psycopg2-binary fastapi uvicorn python-dotenv

# 5. Render ko batao ki server kaise start karna hai
CMD ["python", "app.py"]
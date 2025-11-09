import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vanna.groq import Groq  # <-- Hum original import pe wapas aa gaye hain
from vanna.postgres import VannaPostgres
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- 1. Set up Vanna (Original Tareeka) ---
vn = Groq(config={'api_key': os.environ.get('GROQ_API_KEY')})

# We connect Vanna to our PostgreSQL database
db_url = os.environ.get('DATABASE_URL')
# Convert 'postgresql://' to 'postgresql+psycopg2://'
vanna_db_url = db_url.replace("postgresql://", "postgresql+psycopg2://")
vn.connect_to_postgres(connection_string=vanna_db_url)

# --- 2. Train Vanna (Same as before) ---
print("Training Vanna on database schema...")
vn.train(ddl="SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public';")
print("Training complete.")

# --- 3. Set up FastAPI Server (Same as before) ---
# Hum FastAPI ko 0.0.0.0 host pe 10000 port pe chalayenge (Render ke liye zaroori)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

# --- 4. Create the API Endpoint (Same as before) ---
@app.post("/chat-with-data")
async def chat_with_data(request: ChatRequest):
    try:
        sql = vn.generate_sql(request.question)
        results_df = vn.run_sql(sql)
        results_json = results_df.to_json(orient='records')

        return {
            "sql": sql,
            "results_json": results_json
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def home():
    return {"message": "Vanna AI server is running."}

# --- 5. Server Ko Chalane Ka Naya Tareeka ---
if __name__ == "__main__":
    import uvicorn
    # Render humein PORT environment variable dega
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- YEH NAYA FIX HAI ---
# Hum Vanna aur Groq ko alag-alag import kar rahe hain
from vanna.base import VannaDefault  # Vanna ka base model
from groq import Groq              # Groq ka main package
from vanna.postgres import VannaPostgres # Postgres connection
# --- END NAYA FIX ---

# Load environment variables from .env file
load_dotenv()

# --- 1. Set up Vanna (Naya Tareeka) ---
# Pehle, Groq client banao
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

# Phir, Vanna model ko Groq client pass karo
# (Yeh 'vn = Groq(...)' se behtar hai)
vn = VannaDefault(llm=groq_client)

# Vanna ko database se connect karo (yeh code same hai)
db_url = os.environ.get('DATABASE_URL')
vanna_db_url = db_url.replace("postgresql://", "postgresql+psycopg2://")
vn.connect_to_postgres(connection_string=vanna_db_url)

# --- 2. Train Vanna (Same as before) ---
print("Training Vanna on database schema...")
vn.train(ddl="SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public';")
print("Training complete.")

# --- 3. Set up FastAPI Server (Same as before) ---
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
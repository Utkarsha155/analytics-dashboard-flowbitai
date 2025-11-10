import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- NAYA FIX: BYPASSING VannaAI and using stable OpenAI_Chat class ---
# Yeh class stable hai aur isse hum Groq ka URL dekar chala sakte hain
from vanna.openai import OpenAI_Chat 
from vanna.postgres import VannaPostgres
# --- END NAYA FIX ---

# Groq API endpoint aur model name
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "mixtral-8x7b-32768" # Stable Groq model

load_dotenv()

# ✅ Initialize Vanna (Ab hum stable OpenAI_Chat use karenge)
# Hum base_url dekar Groq ki service ko hijack kar rahe hain
vn = OpenAI_Chat(
    model=GROQ_MODEL,
    api_key=os.getenv("GROQ_API_KEY"),
    base_url=GROQ_BASE_URL
)

# ✅ Connect PostgreSQL (Same as before)
db_url = os.getenv("DATABASE_URL")
vanna_db_url = db_url.replace("postgresql://", "postgresql+psycopg2://")
vn.connect_to_postgres(connection_string=vanna_db_url)

# ✅ Train schema
print("Training...")
vn.train(ddl="SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public';")
print("Training complete.")

# ✅ FastAPI
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

@app.post("/chat-with-data")
async def chat_with_data(request: ChatRequest):
    try:
        sql = vn.generate_sql(request.question)
        df = vn.run_sql(sql)
        return {"sql": sql, "results_json": df.to_json(orient="records")}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def home():
    return {"message": "Vanna AI is running on Render!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 10000)))
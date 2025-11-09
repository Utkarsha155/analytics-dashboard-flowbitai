import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vanna import VannaDefault
from dotenv import load_dotenv

load_dotenv()

# ✅ Initialize Vanna + Groq
vn = VannaDefault(
    api_key=os.getenv("GROQ_API_KEY"),
    model="groq"
)

# ✅ Connect to Supabase Postgres directly
db_url = os.getenv("DATABASE_URL")
if db_url:
    vn.connect_to_postgres(connection_string=db_url)

# ✅ Train on schema
print("Training Vanna...")
vn.train("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public';")
print("Training done.")

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
        return {"sql": sql, "results_json": df.to_json(orient='records')}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def home():
    return {"message": "Vanna AI server is running ✅"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 10000)))

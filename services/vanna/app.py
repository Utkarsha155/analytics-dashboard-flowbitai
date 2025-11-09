import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vanna import VannaDefault          # ✅ Fixed import
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ✅ Initialize Vanna with Groq
vn = VannaDefault(
    api_key=os.getenv("GROQ_API_KEY"),
    model="groq"
)

# ✅ Connect to Postgres
db_url = os.getenv("DATABASE_URL")
if db_url:
    vanna_db_url = db_url.replace("postgresql://", "postgresql+psycopg2://")
    vn.connect_to_postgres(connection_string=vanna_db_url)

# ✅ Train Vanna
print("Training Vanna on database schema...")
vn.train(ddl="SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public';")
print("Training complete.")

# ✅ FastAPI setup
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
        results_df = vn.run_sql(sql)
        return {"sql": sql, "results_json": results_df.to_json(orient='records')}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def home():
    return {"message": "Vanna AI server is running correctly!"}

# ✅ Proper entry for Docker/Render
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vanna.groq import Groq
from vanna.postgres import VannaPostgres
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- 1. Set up Vanna ---
# We use Groq as the "brain" (LLM)
vn = Groq(config={'api_key': os.environ.get('GROQ_API_KEY')})

# We connect Vanna to our PostgreSQL database using the URL from .env
vn.connect_to_postgres(connection_string=os.environ.get('DATABASE_URL'))

# --- 2. Train Vanna ---
# Vanna "learns" your database schema (tables, columns)
# This is how it knows how to write SQL.
print("Training Vanna on database schema...")
vn.train(ddl="SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public';")
print("Training complete.")

# --- 3. Set up FastAPI Server ---
app = FastAPI()

# Allow your API server to call this AI server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# This defines what the incoming question will look like
class ChatRequest(BaseModel):
    question: str

# --- 4. Create the API Endpoint ---
@app.post("/chat-with-data")
async def chat_with_data(request: ChatRequest):
    try:
        # 1. Vanna + Groq generate a SQL query from the question
        sql = vn.generate_sql(request.question)
        
        # 2. Vanna runs the SQL on your database
        results_df = vn.run_sql(sql) # Returns a Pandas DataFrame
        
        # 3. Convert the results to JSON
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
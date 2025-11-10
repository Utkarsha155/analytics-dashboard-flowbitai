import os
from vanna.integrations.groq import GroqLlmService
from vanna.integrations.postgres import PostgresSqlRunner
from vanna.servers.fastapi import VannaFastAPIServer
from vanna import Agent

# Environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
VERCEL_FRONTEND_URL = os.getenv("VERCEL_FRONTEND_URL", "*")

# LLM service
llm_service = GroqLlmService(
    api_key=GROQ_API_KEY,
    model="mixtral-8x7b-32768"
)

# Database connector
sql_runner = PostgresSqlRunner(connection_string=DATABASE_URL)

# Agent connects LLM and SQL
agent = Agent(llm_service=llm_service, sql_runner=sql_runner)

# FastAPI + CORS config
config = {
    "cors": {
        "enabled": True,
        "allow_origins": [VERCEL_FRONTEND_URL],
        "allow_credentials": True,
        "allow_methods": ["GET", "POST"],
        "allow_headers": ["*"],
    }
}

server = VannaFastAPIServer(agent, config=config)
app = server.create_app()

@app.get("/")
def home():
    return {"status": "Backend running fine! Waiting for frontend 🚀"}

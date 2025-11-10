import os
from vanna.integrations.groq import GroqLlmService
from vanna.integrations.postgres import PostgresSqlRunner
from vanna.servers.fastapi import VannaFastAPIServer
from vanna import Agent

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL")
VERCEL_FRONTEND_URL = os.environ.get("VERCEL_FRONTEND_URL", "http://localhost:3000") 


llm_service = GroqLlmService(
    api_key=GROQ_API_KEY,
    model="mixtral-8x7b-32768" 
)

sql_runner = PostgresSqlRunner(
    connection_string=DATABASE_URL
)

agent = Agent(
    llm_service=llm_service,
    sql_runner=sql_runner
)

config = {
    "cors": {
        "enabled": True,
        "allow_origins": [VERCEL_FRONTEND_URL], 
        "allow_credentials": True,
        "allow_methods": ["GET", "POST"]
    }
}

server = VannaFastAPIServer(agent, config=config)
app = server.create_app()


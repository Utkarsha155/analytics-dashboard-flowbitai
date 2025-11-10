FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 10000

CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app:app"]

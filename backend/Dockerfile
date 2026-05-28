FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2 compilation)
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source code
COPY . .

# Render dynamically sets the $PORT environment variable.
# We map uvicorn to listen on that port. If not set, default to 8088.
ENV PORT=8088
EXPOSE $PORT

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT

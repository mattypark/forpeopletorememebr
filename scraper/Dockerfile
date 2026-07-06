# Bery scraper sidecar — deployable to Railway / Fly / Render.
# Build context: the scraper/ directory.

FROM python:3.12-slim-bookworm

# Firefox/Camoufox runtime libs for the stealth browser. Optional at runtime —
# if the browser install fails, plain fetching still works.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libdbus-glib-1-2 \
    libx11-xcb1 \
    libxt6 \
    libasound2 \
    libpci3 \
    libegl1 \
    libgl1 \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Camoufox stealth browser — used for authwalled pages (LinkedIn etc.)
RUN scrapling install || echo "stealth browser install failed — plain fetch only"

COPY main.py .

ENV PORT=8787
EXPOSE 8787

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.services.iss_api import fetch_iss
from app.services.tle_provider import download_starlink_tle, parse_tle_text
from app.services.orbit import sat_latlon_now

app = FastAPI(title="SatelliteFinder API")

# CORS (dev: 只放 Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"name": "SatelliteFinder API", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/iss")
def iss():
    return fetch_iss()

@app.get("/api/starlink")
def starlink(limit: int = Query(200, ge=1, le=2000)):
    tle_text = download_starlink_tle()
    sats = parse_tle_text(tle_text, limit=limit)
    items = [sat_latlon_now(name, l1, l2) for (name, l1, l2) in sats]
    return {"count": len(items), "items": items}

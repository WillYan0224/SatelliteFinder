from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

# ISS
from app.services.iss_api import fetch_iss
# Starlink
from app.services.tle_provider import download_starlink_tle, parse_tle_text
from app.services.orbit import sat_latlon_now

app = FastAPI(title="SatelliteFinder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
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
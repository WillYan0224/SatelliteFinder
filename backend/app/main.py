from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.iss_api import fetch_iss

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

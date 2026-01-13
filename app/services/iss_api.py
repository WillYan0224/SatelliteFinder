import requests

ISS_API = "https://api.wheretheiss.at/v1/satellites/25544"

def fetch_iss(timeout: int = 10) -> dict:
    """Fetch ISS live telemetry from public API."""
    r = requests.get(ISS_API, timeout=timeout)
    r.raise_for_status()
    return r.json()

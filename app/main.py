import streamlit as st
import importlib
import requests

st.set_page_config(page_title="Setup Test", layout="wide")
st.title("🧪 Setup Testing")

def check_import(pkg: str) -> tuple[bool, str]:
    try:
        m = importlib.import_module(pkg)
        ver = getattr(m, "__version__", "(no __version__)")
        return True, str(ver)
    except Exception as e:
        return False, str(e)

st.subheader("1) Python Packages")
pkgs = ["streamlit", "requests", "pandas", "pydeck", "skyfield"]
for p in pkgs:
    ok, info = check_import(p)
    st.write(("✅" if ok else "❌"), p, "-", info)

st.subheader("2) ISS API test")
ISS_API = "https://api.wheretheiss.at/v1/satellites/25544"
try:
    r = requests.get(ISS_API, timeout=10)
    r.raise_for_status()
    data = r.json()
    st.success("ISS API OK")
    st.json({
        "name": data.get("name"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "altitude_km": data.get("altitude"),
        "velocity_kmh": data.get("velocity"),
        "timestamp": data.get("timestamp"),
    })
except Exception as e:
    st.error(f"ISS API failed: {e}")

st.subheader("3) Starlink TLE download test")
STARLINK_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle&GROUP=starlink"
try:
    r = requests.get(STARLINK_TLE_URL, timeout=20)
    r.raise_for_status()
    lines = [ln.strip() for ln in r.text.splitlines() if ln.strip()]
    st.success(f"TLE OK (lines={len(lines)})")
    st.code("\n".join(lines[:6]))
except Exception as e:
    st.error(f"TLE download failed: {e}")

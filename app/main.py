import pandas as pd
import streamlit as st
import pydeck as pdk

from app.services.iss_api import fetch_iss

st.set_page_config(page_title="SatelliteFinder", layout="wide")
st.title("🛰️ SatelliteFinder — ISS Live")

# ---------- Sidebar ----------
with st.sidebar:
    st.header("Controls")
    refresh_sec = st.slider("Auto refresh (sec)", 2, 30, 5)

# ---------- Fetch ISS ----------
@st.cache_data(ttl=5)
def get_iss_cached():
    return fetch_iss()

try:
    iss = get_iss_cached()
except Exception as e:
    st.error(f"ISS fetch failed: {e}")
    st.stop()

# ---------- Layout ----------
left, right = st.columns([2, 1], gap="large")

# ---------- Map ----------
df_iss = pd.DataFrame([{
    "name": iss.get("name", "ISS"),
    "lat": float(iss["latitude"]),
    "lon": float(iss["longitude"]),
    "alt_km": float(iss.get("altitude", 0.0)),
    "vel_kmh": float(iss.get("velocity", 0.0)),
}])

layer = pdk.Layer(
    "ScatterplotLayer",
    data=df_iss,
    get_position="[lon, lat]",
    get_radius=80000,
    pickable=True,
)

view = pdk.ViewState(
    latitude=float(iss["latitude"]),
    longitude=float(iss["longitude"]),
    zoom=2.2,
    pitch=0,
)

tooltip = {"html": "<b>{name}</b><br/>Lat: {lat}<br/>Lon: {lon}<br/>Alt(km): {alt_km}"}

with left:
    st.pydeck_chart(
        pdk.Deck(
            map_style="mapbox://styles/mapbox/dark-v11",
            initial_view_state=view,
            layers=[layer],
            tooltip=tooltip,
        ),
        use_container_width=True,
    )

# ---------- Telemetry panel ----------
with right:
    st.subheader("ISS Telemetry")
    st.write({
        "Latitude": iss.get("latitude"),
        "Longitude": iss.get("longitude"),
        "Altitude (km)": iss.get("altitude"),
        "Velocity (km/h)": iss.get("velocity"),
        "Timestamp": iss.get("timestamp"),
    })

    st.caption("Auto refresh via rerun.")
    st.write(f"Next refresh: {refresh_sec}s")

# ---------- Simple auto refresh ----------
import time
time.sleep(refresh_sec)
st.rerun()

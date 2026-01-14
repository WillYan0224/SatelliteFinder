from datetime import datetime, timezone
from skyfield.api import EarthSatellite, load

_ts = load.timescale()

def sat_latlon_now(name: str, line1: str, line2: str):
    sat = EarthSatellite(line1, line2, name, _ts)
    t = _ts.now()
    geocentric = sat.at(t)
    subpoint = geocentric.subpoint()

    return {
        "name": name,
        "latitude": subpoint.latitude.degrees,
        "longitude": subpoint.longitude.degrees,
        "altitude_km": subpoint.elevation.km,
        "timestamp_utc": datetime.now(timezone.utc).isoformat()
    }

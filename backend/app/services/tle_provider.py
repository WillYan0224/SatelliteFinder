import requests

STARLINK_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle"

def download_starlink_tle(timeout: int = 20) -> str:
    r = requests.get(STARLINK_TLE_URL, timeout=timeout)
    r.raise_for_status()
    return r.text

def parse_tle_text(tle_text: str, limit: int = 200):
    """
    Return list of (name, line1, line2)
    """
    lines = [ln.strip() for ln in tle_text.splitlines() if ln.strip()]
    out = []
    i = 0
    while i + 2 < len(lines) and len(out) < limit:
        name = lines[i]
        l1 = lines[i + 1]
        l2 = lines[i + 2]
        # basic sanity check
        if l1.startswith("1 ") and l2.startswith("2 "):
            out.append((name, l1, l2))
            i += 3
        else:
            i += 1
    return out

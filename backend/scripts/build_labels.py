import geopandas as gpd
from pathlib import Path

# repo root (SatelliteFinder/)
ROOT = Path(__file__).resolve().parents[2]

RAW = ROOT / "backend" / "data_raw"
OUT = ROOT / "frontend" / "public" / "data"

OUT.mkdir(parents=True, exist_ok=True)

# ---------- Countries ----------
def build_countries():
    shp = RAW / "ne_10m_admin_0_countries" / "ne_10m_admin_0_countries.shp"
    gdf = gpd.read_file(shp)

    out = gdf[["NAME", "LABEL_X", "LABEL_Y"]].dropna()

    out = gpd.GeoDataFrame(
        out,
        geometry=gpd.points_from_xy(out.LABEL_X, out.LABEL_Y),
        crs="EPSG:4326",
    )

    out = out.rename(columns={"NAME": "name"})

    out[["name", "geometry"]].to_file(
        OUT / "countries_points.geojson",
        driver="GeoJSON",
    )

    print(f"Countries: {len(out)} -> {OUT / 'countries_points.geojson'}")

# ---------- Cities ----------
def build_cities(min_pop=1_000_000):
    shp = RAW / "ne_10m_populated_places" / "ne_10m_populated_places.shp"
    gdf = gpd.read_file(shp)

    gdf = gdf[(gdf["POP_MAX"] >= min_pop) & gdf["NAME"].notna()]

    out = gdf[["NAME", "POP_MAX", "geometry"]].rename(
        columns={"NAME": "name", "POP_MAX": "population"}
    )

    out.to_file(
        OUT / "cities_big.geojson",
        driver="GeoJSON",
    )

    print(f"Cities (pop ≥ {min_pop}): {len(out)} -> {OUT / 'cities_big.geojson'}")

# ---------- Run ----------
if __name__ == "__main__":
    build_countries()
    build_cities()

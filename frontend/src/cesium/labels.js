import {
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  HeightReference,
  NearFarScalar,
} from "cesium";

export function setupLabels(viewer) {
  let countryEntities = [];
  let cityEntities = [];

  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed to load ${url}`);
    return await r.json();
  }

  function clearAll() {
    for (const e of countryEntities) viewer.entities.remove(e);
    for (const e of cityEntities) viewer.entities.remove(e);
    countryEntities = [];
    cityEntities = [];
  }

  function addPointLabel({ lon, lat, text, kind }) {
    // kind: "country" | "city"
    const isCountry = kind === "country";

    const ent = viewer.entities.add({
      position: Cartesian3.fromDegrees(lon, lat, 0),
      label: {
        text,
        font: isCountry
          ? "750 18px system-ui, -apple-system, sans-serif"
          : "600 15px system-ui, -apple-system, sans-serif",

        fillColor: isCountry
          ? Color.WHITE.withAlpha(0.92)
          : Color.WHITE.withAlpha(0.88),

        scaleByDistance: isCountry
          ? new NearFarScalar(2.0e6, 1.0, 1.2e7, 0.85)
          : new NearFarScalar(3.0e5, 1.15, 3.0e6, 0.7),

        outlineColor: Color.BLACK.withAlpha(0.65),
        outlineWidth: isCountry ? 3 : 2,

        heightReference: HeightReference.CLAMP_TO_GROUND,

        // overlappng
        disableDepthTestDistance: Number.POSITIVE_INFINITY,

        // Display distance polict
        distanceDisplayCondition: isCountry
          ? new DistanceDisplayCondition(1.4e6, 1.5e7) // 1400km ~ 15000km
          : new DistanceDisplayCondition(0.0, 3.5e6), // 0.0 ~ 3500km

        translucencyByDistance: isCountry
          ? undefined
          : new NearFarScalar(1.5e6, 1.0, 3.5e6, 0.0),
      },
    });

    return ent;
  }

  function buildFromGeoJSON(geo, kind) {
    for (const f of geo.features ?? []) {
      if (f.geometry?.type !== "Point") continue;
      const coords = f.geometry.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;

      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

      const p = f.properties ?? {};
      const text =
        (kind === "country"
          ? (p.name ?? p.NAME ?? p.ADMIN ?? p.SOVEREIGNT)
          : (p.name ?? p.NAME ?? p.NAMEASCII ?? p.city ?? p.CITY_NAME)) ?? null;

      if (!text) continue;

      const ent = addPointLabel({ lon, lat, text, kind });
      if (kind === "country") countryEntities.push(ent);
      else cityEntities.push(ent);
    }
  }

  async function loadAndBuild({
    countriesUrl = "/data/countries_points.geojson",
    citiesUrl = "/data/cities_big.geojson",
  } = {}) {
    clearAll();

    const [countries, cities] = await Promise.all([
      loadJSON(countriesUrl),
      loadJSON(citiesUrl),
    ]);

    buildFromGeoJSON(countries, "country");
    buildFromGeoJSON(cities, "city");

    return {
      countries: countryEntities.length,
      cities: cityEntities.length,
    };
  }

  return {
    loadAndBuild,
    clearAll,
  };
}

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

  // for viewport visibility control
  let allLabelEntities = [];
  let _visScheduled = false;

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
    allLabelEntities = [];
  }

  function addPointLabel({ lon, lat, text, kind }) {
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
        disableDepthTestDistance: Number.POSITIVE_INFINITY,

        distanceDisplayCondition: isCountry
          ? new DistanceDisplayCondition(1.4e6, 1.5e7)
          : new DistanceDisplayCondition(0.0, 3.5e6),

        translucencyByDistance: isCountry
          ? undefined
          : new NearFarScalar(1.5e6, 1.0, 3.5e6, 0.0),
      },
    });

    ent.__labelKind = kind;
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
      allLabelEntities.push(ent);

      if (kind === "country") countryEntities.push(ent);
      else cityEntities.push(ent);
    }
  }

  // ---------- Viewport visibility (compatible method) ----------
  function _applyViewportVisibility() {
    _visScheduled = false;

    const scene = viewer.scene;
    const canvas = scene.canvas;
    const w = canvas.clientWidth || 0;
    const h = canvas.clientHeight || 0;
    if (!w || !h) return;

    const pad = 30;

    for (const ent of allLabelEntities) {
      const pos = ent.position?.getValue?.(viewer.clock.currentTime);
      if (!pos || !ent.label) {
        if (ent.label) ent.label.show = false;
        continue;
      }

      // ✅ Most compatible API
      const win = scene.cartesianToCanvasCoordinates(pos);

      // null = behind camera / not projectable
      if (!win) {
        ent.label.show = false;
        continue;
      }

      const onScreen =
        win.x >= -pad && win.x <= w + pad && win.y >= -pad && win.y <= h + pad;

      ent.label.show = onScreen;
    }
  }

  function _scheduleVisibilityUpdate() {
    if (_visScheduled) return;
    _visScheduled = true;
    requestAnimationFrame(_applyViewportVisibility);
  }

  // hook camera changes once
  viewer.camera.changed.addEventListener(_scheduleVisibilityUpdate);

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

    _applyViewportVisibility();

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

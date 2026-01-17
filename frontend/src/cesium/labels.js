import {
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  HeightReference,
  NearFarScalar,
  Ellipsoid,
  EllipsoidalOccluder,
} from "cesium";

export function setupLabels(viewer) {
  let countryEntities = [];
  let cityEntities = [];

  let allLabelEntities = [];
  let _visScheduled = false;

  // -----------------------------
  // Tuning knobs (TUNE THESE!!!!)
  // -----------------------------
  const PAD_PX = 30;

  // Camera height thresholds (meters)
  const CITY_ENABLE_HEIGHT = 6.0e6; // higher means fewer
  const CITY_SOFT_HEIGHT = 3.0e6; // higher means fewer

  // Caps
  const MAX_CITY_LABELS_NEAR = 60;
  const MAX_CITY_LABELS_FAR = 25;

  // Declutter grid size (px) — LESS CHAOS!!!!
  const GRID_CITY_PX = 70; // // higher means fewer
  const GRID_COUNTRY_PX = 140; // // higher means fewer

  // Distance display
  const CITY_MAX_DISTANCE = 1.6e6;
  const COUNTRY_MIN_DISTANCE = 1.6e6;
  const COUNTRY_MAX_DISTANCE = 1.5e7;

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

        // occluder
        disableDepthTestDistance: Number.POSITIVE_INFINITY,

        distanceDisplayCondition: isCountry
          ? new DistanceDisplayCondition(
              COUNTRY_MIN_DISTANCE,
              COUNTRY_MAX_DISTANCE,
            )
          : new DistanceDisplayCondition(0.0, CITY_MAX_DISTANCE),

        translucencyByDistance: isCountry
          ? undefined
          : new NearFarScalar(1.5e6, 1.0, CITY_MAX_DISTANCE, 0.0),
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

  function _applyViewportVisibility() {
    _visScheduled = false;

    const scene = viewer.scene;
    const canvas = scene.canvas;
    const w = canvas.clientWidth || 0;
    const h = canvas.clientHeight || 0;
    if (!w || !h) return;

    const camera = scene.camera;
    const camHeight = camera.positionCartographic?.height ?? 0;

    // strict earth occlusion
    const ellipsoid = scene.globe?.ellipsoid ?? Ellipsoid.WGS84;
    const occluder = new EllipsoidalOccluder(ellipsoid, camera.positionWC);

    const showCities = camHeight <= CITY_ENABLE_HEIGHT;
    const maxCity =
      camHeight <= CITY_SOFT_HEIGHT
        ? MAX_CITY_LABELS_NEAR
        : MAX_CITY_LABELS_FAR;
    let visibleCityCount = 0;

    // screen-space declutter
    const usedCityCells = new Set();
    const usedCountryCells = new Set();

    function cellKey(x, y, cell) {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      return `${cx},${cy}`;
    }

    for (const ent of allLabelEntities) {
      if (!ent?.label) continue;

      // city off at high zoom-out
      if (ent.__labelKind === "city" && !showCities) {
        ent.label.show = false;
        continue;
      }

      const pos = ent.position?.getValue?.(viewer.clock.currentTime);
      if (!pos) {
        ent.label.show = false;
        continue;
      }

      // dont displace when earth blocked
      if (!occluder.isPointVisible(pos)) {
        ent.label.show = false;
        continue;
      }

      // projectability
      const win = scene.cartesianToCanvasCoordinates(pos);
      if (!win) {
        ent.label.show = false;
        continue;
      }

      // screen bounds
      const onScreen =
        win.x >= -PAD_PX &&
        win.x <= w + PAD_PX &&
        win.y >= -PAD_PX &&
        win.y <= h + PAD_PX;

      if (!onScreen) {
        ent.label.show = false;
        continue;
      }

      // declutter by grid
      if (ent.__labelKind === "country") {
        const key = cellKey(win.x, win.y, GRID_COUNTRY_PX);
        if (usedCountryCells.has(key)) {
          ent.label.show = false;
          continue;
        }
        usedCountryCells.add(key);
      } else {
        const key = cellKey(win.x, win.y, GRID_CITY_PX);
        if (usedCityCells.has(key)) {
          ent.label.show = false;
          continue;
        }
        usedCityCells.add(key);
      }

      // city hard cap (after declutter)
      if (ent.__labelKind === "city") {
        if (visibleCityCount >= maxCity) {
          ent.label.show = false;
          continue;
        }
        visibleCityCount++;
      }

      ent.label.show = true;
    }
  }

  function _scheduleVisibilityUpdate() {
    if (_visScheduled) return;
    _visScheduled = true;
    requestAnimationFrame(_applyViewportVisibility);
  }

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

import { Cartesian3, Color } from "cesium";
import { haversineKm } from "./utils.js";

export function setupStarlink(viewer) {
  const starlinkMap = new Map(); // name -> { entity, lat, lon, altKm }
  let timer = null;

  async function fetchStarlink(limit = 200) {
    const res = await fetch(
      `http://127.0.0.1:8000/api/starlink?limit=${limit}`
    );
    if (!res.ok) {
      // keep message useful
      const txt = await res.text().catch(() => "");
      throw new Error(`Starlink API failed: ${res.status} ${txt}`);
    }
    return await res.json();
  }

  let highlighted = null;

  function resetHighlight() {
    if (!highlighted) return;
    if (highlighted.point) {
      highlighted.point.pixelSize = 3;
      highlighted.point.color = Color.YELLOW.withAlpha(0.8);
    }
    highlighted.label = undefined;
    highlighted = null;
  }

  function highlight(entity, labelText = "Selected") {
    resetHighlight();

    if (entity?.point) {
      entity.point.pixelSize = 10;
      entity.point.color = Color.CYAN.withAlpha(0.95);
      entity.label = {
        text: labelText,
        font: "14px sans-serif",
        fillColor: Color.WHITE,
        pixelOffset: new Cartesian3(0, -18, 0),
      };
      highlighted = entity;
    }
  }

  function findNearest(userLat, userLon) {
    if (!starlinkMap.size) return null;

    let best = null;

    for (const [name, { entity, lat, lon, altKm }] of starlinkMap.entries()) {
      const dKm = haversineKm(userLat, userLon, lat, lon);
      if (!best || dKm < best.distanceKm) {
        best = { name, entity, lat, lon, altKm, distanceKm: dKm };
      }
    }
    return best;
  }

  function snapNearest(userLat, userLon, { fly = true } = {}) {
    const nearest = findNearest(userLat, userLon);
    if (!nearest) return null;

    highlight(nearest.entity, "Nearest");
    if (fly) viewer.flyTo(nearest.entity);
    return nearest;
  }

  function getInfoByEntity(entity) {
    if (!entity) return null;

    for (const [name, rec] of starlinkMap.entries()) {
      if (rec.entity === entity) {
        return {
          name,
          lat: rec.lat,
          lon: rec.lon,
          altKm: rec.altKm,
          entity: rec.entity,
        };
      }
    }
    return null;
  }

  function selectByEntity(entity, { fly = true } = {}) {
    const info = getInfoByEntity(entity);
    if (!info) return null;

    highlight(info.entity, "Selected");
    if (fly) viewer.flyTo(info.entity);
    return info; // { name, lat, lon, altKm, entity }
  }

  function upsertStarlink(s) {
    const lat = Number(s.latitude);
    const lon = Number(s.longitude);
    const altKm = Number(s.altitude_km ?? 550);
    const pos = Cartesian3.fromDegrees(lon, lat, altKm * 1000);

    if (starlinkMap.has(s.name)) {
      const rec = starlinkMap.get(s.name);
      rec.entity.position = pos;
      rec.lat = lat;
      rec.lon = lon;
      rec.altKm = altKm;
    } else {
      const entity = viewer.entities.add({
        name: s.name,
        position: pos,
        point: {
          pixelSize: 3,
          color: Color.YELLOW.withAlpha(0.8),
        },
      });
      starlinkMap.set(s.name, { entity, lat, lon, altKm });
    }
  }

  async function renderOnce(limit = 200) {
    const data = await fetchStarlink(limit);
    for (const s of data.items) upsertStarlink(s);
    return data.count;
  }

  // dynamic update
  async function startAutoUpdate(limit = 200, intervalMs = 30000) {
    stopAutoUpdate();

    await renderOnce(limit);

    timer = setInterval(() => {
      renderOnce(limit).catch((e) => {
        console.warn("[Starlink] auto update failed:", e);
      });
    }, intervalMs);
  }

  function stopAutoUpdate() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function clear() {
    resetHighlight();
    stopAutoUpdate();

    for (const { entity } of starlinkMap.values()) {
      viewer.entities.remove(entity);
    }
    starlinkMap.clear();
  }

  function hasData() {
    return starlinkMap.size > 0;
  }

  return {
    renderOnce,
    startAutoUpdate,
    stopAutoUpdate,
    clear,
    hasData,
    starlinkMap,
    findNearest,
    highlight,
    snapNearest,
    getInfoByEntity,
    selectByEntity,
  };
}

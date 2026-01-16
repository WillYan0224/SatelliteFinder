import { Cartesian3, Color } from "cesium";

export function setupStarlink(viewer) {
  let starlinkEntities = [];
  let starlinkRecords = []; // [{ e, name, lat, lon, altKm }]

  async function fetchStarlink(limit = 200) {
    const res = await fetch(
      `http://127.0.0.1:8000/api/starlink?limit=${limit}`
    );
    if (!res.ok) throw new Error("Starlink API failed");
    return await res.json();
  }

  function clear() {
    for (const e of starlinkEntities) viewer.entities.remove(e);
    starlinkEntities = [];
    starlinkRecords = [];
    resetHighlight();
  }

  async function render(limit = 200) {
    clear();
    const data = await fetchStarlink(limit);

    for (const s of data.items) {
      const lat = Number(s.latitude);
      const lon = Number(s.longitude);
      const altKm = Number(s.altitude_km ?? 550);

      const e = viewer.entities.add({
        name: s.name,
        position: Cartesian3.fromDegrees(lon, lat, altKm * 1000),
        point: { pixelSize: 3, color: Color.YELLOW.withAlpha(0.8) },
      });

      starlinkEntities.push(e);
      starlinkRecords.push({ e, name: s.name, lat, lon, altKm });
    }

    return { count: data.count, items: data.items };
  }

  function hasData() {
    return starlinkRecords.length > 0;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findNearest(userLat, userLon) {
    if (!starlinkRecords.length) return null;

    let best = null;
    for (const r of starlinkRecords) {
      const dKm = haversineKm(userLat, userLon, r.lat, r.lon);
      if (!best || dKm < best.distanceKm) best = { ...r, distanceKm: dKm };
    }
    return best; // { e, name, lat, lon, altKm, distanceKm }
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

  function highlight(entity) {
    resetHighlight();

    if (entity?.point) {
      entity.point.pixelSize = 10;
      entity.point.color = Color.CYAN.withAlpha(0.95);
      entity.label = {
        text: "Nearest",
        font: "14px sans-serif",
        fillColor: Color.WHITE,
        pixelOffset: new Cartesian3(0, -18, 0),
      };
      highlighted = entity;
    }
  }

  function flyTo(entity) {
    if (entity) viewer.flyTo(entity);
  }

  return { render, clear, hasData, findNearest, highlight, flyTo };
}

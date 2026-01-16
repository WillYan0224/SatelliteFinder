import { Cartesian3, Color } from "cesium";

export function setupStarlink(viewer) {
  let starlinkEntities = [];

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
  }

  async function render(limit = 200) {
    const data = await fetchStarlink(limit);
    clear();

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
    }

    return { count: data.count, items: data.items };
  }

  return { render, clear };
}

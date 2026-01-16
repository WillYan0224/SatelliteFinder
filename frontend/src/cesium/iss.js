import { Cartesian3, Color } from "cesium";

export function setupISS(viewer) {
  let issEnt = viewer.entities.getById("iss");
  if (!issEnt) {
    issEnt = viewer.entities.add({
      id: "iss",
      name: "ISS",
      point: {
        pixelSize: 10,
        color: Color.CYAN,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: "ISS",
        font: "16px sans-serif",
        fillColor: Color.WHITE,
        pixelOffset: new Cartesian3(0, -20, 0),
      },
    });
  }

  let segments = [[]];
  let lastLon = null;
  const MAX_POINTS_TOTAL = 300;
  const trailEntities = [];

  function rebuildTrail() {
    for (const e of trailEntities) viewer.entities.remove(e);
    trailEntities.length = 0;

    for (const seg of segments) {
      if (seg.length < 2) continue;
      const e = viewer.entities.add({
        polyline: {
          positions: seg,
          width: 2,
          material: Color.WHITE.withAlpha(0.8),
        },
      });
      trailEntities.push(e);
    }
  }

  async function fetchISS() {
    const res = await fetch("http://127.0.0.1:8000/api/iss");
    if (!res.ok) throw new Error("ISS API failed");
    return await res.json();
  }

  async function tick(onTelemetry) {
    const iss = await fetchISS();
    const lat = Number(iss.latitude);
    const lon = Number(iss.longitude);
    const altKm = Number(iss.altitude ?? 420);
    const vel = Number(iss.velocity ?? 0);

    const pos = Cartesian3.fromDegrees(lon, lat, altKm * 1000);
    issEnt.position = pos;

    // callback: update HUD
    onTelemetry?.({ lat, lon, altKm, vel, raw: iss });

    // trail dateline split
    if (lastLon !== null) {
      const d = Math.abs(lon - lastLon);
      if (d > 180) segments.push([]);
    }
    lastLon = lon;
    segments[segments.length - 1].push(pos);

    // limit total points
    let total = segments.reduce((s, seg) => s + seg.length, 0);
    while (total > MAX_POINTS_TOTAL && segments.length) {
      if (segments[0].length <= 2) {
        total -= segments[0].length;
        segments.shift();
      } else {
        segments[0].shift();
        total -= 1;
      }
    }

    rebuildTrail();

    if (!tick._didFly) {
      tick._didFly = true;
      viewer.flyTo(issEnt);
    }
  }

  return { issEnt, tick };
}

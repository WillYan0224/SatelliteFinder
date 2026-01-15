import "./style.css";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  Viewer,
  Cartesian3,
  Color,
  Cartographic,
  Math as CesiumMath,
} from "cesium";

window.CESIUM_BASE_URL = "/cesium";

const viewer = new Viewer("app", {
  animation: false,
  timeline: false,
  homeButton: true,
  geocoder: false,
});

const hud = document.getElementById("issText");
document.getElementById("btnStarlink")?.addEventListener("click", () => {
  renderStarlink(200);
});
document.getElementById("btnClear")?.addEventListener("click", () => {
  clearStarlink();
});

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

let segments = [[]]; // segments as positions array
let lastLon = null;
const MAX_POINTS_TOTAL = 300;

const trailEntities = [];
function rebuildTrailEntities() {
  // remove old
  for (const e of trailEntities) viewer.entities.remove(e);
  trailEntities.length = 0;

  // segments -> polyline
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

async function tick() {
  const iss = await fetchISS();
  const lat = Number(iss.latitude);
  const lon = Number(iss.longitude);
  const altKm = Number(iss.altitude ?? 420);

  const pos = Cartesian3.fromDegrees(lon, lat, altKm * 1000);

  // update ISS entity
  issEnt.position = pos;

  // HUD update
  if (hud) {
    hud.textContent =
      `Lat: ${lat.toFixed(4)}\n` +
      `Lon: ${lon.toFixed(4)}\n` +
      `Alt: ${altKm.toFixed(1)} km\n` +
      `Vel: ${Number(iss.velocity ?? 0).toFixed(1)} km/h`;
  }
  // ---- Trail：handle dateline change ----
  if (lastLon !== null) {
    const d = Math.abs(lon - lastLon);
    if (d > 180) {
      // create new segments on longitude striding
      segments.push([]);
    }
  }
  lastLon = lon;
  segments[segments.length - 1].push(pos);

  // poping  limiting length
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

  rebuildTrailEntities();

  // zoom in iss at start
  if (!tick._didFly) {
    tick._didFly = true;
    viewer.flyTo(issEnt);
  }
}

async function fetchStarlink(limit = 200) {
  const res = await fetch(`http://127.0.0.1:8000/api/starlink?limit=${limit}`);
  if (!res.ok) throw new Error("Starlink API failed");
  return await res.json(); // {count, items:[{name, latitude, longitude, altitude_km, ...}]}
}

let starlinkEntities = [];
function clearStarlink() {
  for (const e of starlinkEntities) viewer.entities.remove(e);
  starlinkEntities = [];
}

async function renderStarlink(limit = 200) {
  const data = await fetchStarlink(limit);
  clearStarlink();

  for (const s of data.items) {
    const lat = Number(s.latitude);
    const lon = Number(s.longitude);
    const altKm = Number(s.altitude_km ?? 550);

    const e = viewer.entities.add({
      name: s.name,
      position: Cartesian3.fromDegrees(lon, lat, altKm * 1000),
      point: {
        pixelSize: 3,
        color: Color.YELLOW.withAlpha(0.8),
      },
    });

    starlinkEntities.push(e);
  }
}

tick();
setInterval(tick, 3000); // for better performance

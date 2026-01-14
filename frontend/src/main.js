import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  Viewer,
  Cartesian3,
  Color,
  Entity,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";

window.CESIUM_BASE_URL = "/cesium";

const viewer = new Viewer("app", {
  animation: false,
  timeline: false,
  homeButton: true,
  geocoder: false,
});

async function fetchISS() {
  const res = await fetch("http://127.0.0.1:8000/api/iss");
  if (!res.ok) throw new Error("ISS API failed");
  return await res.json();
}

async function addOrUpdateISS() {
  const iss = await fetchISS();
  const lat = Number(iss.latitude);
  const lon = Number(iss.longitude);
  const altKm = Number(iss.altitude ?? 420);

  const pos = Cartesian3.fromDegrees(lon, lat, altKm * 1000);

  let ent = viewer.entities.getById("iss");
  if (!ent) {
    ent = viewer.entities.add({
      id: "iss",
      name: "ISS",
      position: pos,
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
    viewer.flyTo(ent);
  } else {
    ent.position = pos;
  }
}

addOrUpdateISS();
setInterval(addOrUpdateISS, 5000);

import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  Viewer,
  Cartesian3,
  Color,
  SampledPositionProperty,
  JulianDate,
  LagrangePolynomialApproximation,
} from "cesium";

window.CESIUM_BASE_URL = "/cesium";

const viewer = new Viewer("app", {
  animation: false,
  timeline: false,
  homeButton: true,
  geocoder: false,
});

viewer.clock.shouldAnimate = true;
viewer.clock.multiplier = 1;

const API_BASE = "http://127.0.0.1:8000";

const issPosition = new SampledPositionProperty();
issPosition.setInterpolationOptions({
  interpolationDegree: 2,
  interpolationAlgorithm: LagrangePolynomialApproximation,
});

let issEntity = viewer.entities.add({
  id: "iss",
  name: "ISS",
  position: issPosition,
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
  // Trail
  path: {
    leadTime: 0,
    trailTime: 15 * 60, //sec * fequency -> n-mins
    width: 2,
  },
});

// Camera tracking
viewer.trackedEntity = issEntity;

async function fetchISS() {
  const res = await fetch("http://127.0.0.1:8000/api/iss");
  if (!res.ok) throw new Error("ISS API failed");
  return await res.json();
}

async function addSampleISS() {
  const iss = await fetchISS();

  const lat = Number(iss.latitude);
  const lon = Number(iss.longitude);
  const altKm = Number(iss.altitude ?? 420);

  const pos = Cartesian3.fromDegrees(lon, lat, altKm * 1000);

  const now = viewer.clock.currentTime.clone();
  issPosition.addSample(now, pos);

  if (!addSampleISS._inited) {
    await viewer.flyTo(issEntity);
    addSampleISS._inited = true;
  }
}

addSampleISS();
setInterval(addSampleISS, 3000); // for better performance

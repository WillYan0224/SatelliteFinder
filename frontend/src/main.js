import "./style.css";
import { createViewer } from "./cesium/viewer.js";
import { setupISS } from "./cesium/iss.js";
import { setupStarlink } from "./cesium/starlink.js";
import { setupGeolocate } from "./cesium/geolocate.js";
import { setupHUD } from "./cesium/hud.js";

const viewer = createViewer("app");

const starlink = setupStarlink(viewer);
const geo = setupGeolocate(viewer);

const hud = setupHUD({
  onLoadStarlink: (limit) => starlink.render(limit),
  onClear: () => starlink.clear(),
  onLocateMe: () => geo.locateMe(),
});

const iss = setupISS(viewer);

// loop
async function loop() {
  await iss.tick(hud.setTelemetry);
}
loop();
setInterval(loop, 3000);

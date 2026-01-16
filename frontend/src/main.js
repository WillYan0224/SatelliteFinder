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
  onLocateMe: () => geo.locateMeStrict(), // strict
  onNearestStarlink: async (limit) => {
    const me = await geo.locateMeStrict(); // {lat, lon}

    if (!starlink.hasData()) {
      await starlink.render(limit);
    }

    const nearest = starlink.findNearest(me.lat, me.lon);
    if (!nearest) {
      alert("No Starlink data loaded.");
      return null;
    }

    starlink.highlight(nearest.e);
    starlink.flyTo(nearest.e);

    return nearest;
  },
});

const iss = setupISS(viewer);

// loop
async function loop() {
  await iss.tick(hud.setTelemetry);
}
loop();
setInterval(loop, 5000);

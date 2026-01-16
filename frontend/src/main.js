import "./style.css";
import { createViewer } from "./cesium/viewer.js";
import { setupISS } from "./cesium/iss.js";
import { setupStarlink } from "./cesium/starlink.js";
import { setupGeolocate } from "./cesium/geolocate.js";
import { setupHUD } from "./cesium/hud.js";

const viewer = createViewer("app");

const starlink = setupStarlink(viewer);
const geo = setupGeolocate(viewer);

let userLocation = null; // { lat, lon }
let nearestTimer = null;

// snap every 5secs
function startNearestLoop() {
  stopNearestLoop();

  nearestTimer = setInterval(() => {
    if (!userLocation) return;
    if (!starlink.hasData()) return;

    // highlight only
    starlink.snapNearest(userLocation.lat, userLocation.lon, {
      fly: false,
    });
  }, 5000);
}

function stopNearestLoop() {
  if (nearestTimer) {
    clearInterval(nearestTimer);
    nearestTimer = null;
  }
}

const hud = setupHUD({
  onLoadStarlink: (limit) => {
    starlink.startAutoUpdate(limit, 5000);
  },

  // clear all
  onClear: () => {
    starlink.clear();
    stopNearestLoop();
    userLocation = null;
  },

  onLocateMe: async () => {
    const me = await geo.locateMeStrict();
    userLocation = { lat: me.lat, lon: me.lon };
    return me;
  },

  onNearestStarlink: async (limit) => {
    if (!userLocation) {
      const me = await geo.locateMeStrict();
      userLocation = { lat: me.lat, lon: me.lon };
    }

    if (!starlink.hasData()) {
      await starlink.renderOnce(limit);
      starlink.startAutoUpdate(limit, 5000);
    }

    const nearest = starlink.snapNearest(userLocation.lat, userLocation.lon, {
      fly: true,
    });

    // tracking & snapping to nearest every 5secs
    startNearestLoop();

    return nearest;
  },
});

const iss = setupISS(viewer);

async function loop() {
  await iss.tick(hud.setTelemetry);
}
loop();
setInterval(loop, 5000);

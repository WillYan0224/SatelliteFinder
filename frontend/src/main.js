import "./style.css";
import { createViewer } from "./cesium/viewer.js";
import { setupISS } from "./cesium/iss.js";
import { setupStarlink } from "./cesium/starlink.js";
import { setupGeolocate } from "./cesium/geolocate.js";
import { setupHUD } from "./cesium/hud.js";
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";
import { setupLabels } from "./cesium/labels.js";

const viewer = createViewer("app");

const starlink = setupStarlink(viewer);
const geo = setupGeolocate(viewer);

const STARLINK_INTERVAL_MS = 30000; // 30s

let userLocation = null; // { lat, lon }
let nearestTimer = null;

function stopNearestLoop() {
  if (nearestTimer) {
    clearInterval(nearestTimer);
    nearestTimer = null;
  }
}

// snap loop：starlink update sync
function startNearestLoop() {
  stopNearestLoop();

  nearestTimer = setInterval(() => {
    if (!userLocation) return;
    if (!starlink.hasData()) return;

    starlink.snapNearest(userLocation.lat, userLocation.lon, { fly: false });
  }, STARLINK_INTERVAL_MS);
}

const hud = setupHUD({
  onLoadStarlink: async (limit) => {
    try {
      await starlink.startAutoUpdate(limit, STARLINK_INTERVAL_MS);
    } catch (e) {
      console.warn("[Starlink] startAutoUpdate failed:", e);
      alert("Load Starlink failed. (backend may be 503)");
    }
  },

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
      try {
        await starlink.renderOnce(limit);
        await starlink.startAutoUpdate(limit, STARLINK_INTERVAL_MS);
      } catch (e) {
        console.warn("[Starlink] render/start failed:", e);
        alert("Starlink data unavailable (backend may be 503).");
        return null;
      }
    }

    // snap now & fly once
    const nearest = starlink.snapNearest(userLocation.lat, userLocation.lon, {
      fly: true,
    });

    startNearestLoop();

    return nearest;
  },
});

const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction((movement) => {
  const picked = viewer.scene.pick(movement.position);
  if (!picked || !picked.id) return;

  const info = starlink.selectByEntity(picked.id, { fly: true });
  if (!info) return;

  hud.setPickedStarlink?.(info);
}, ScreenSpaceEventType.LEFT_CLICK);

// ISS
const iss = setupISS(viewer);
async function loop() {
  await iss.tick(hud.setTelemetry);
}

// Country Hints
const labels = setupLabels(viewer);
labels.loadAndBuild().catch((e) => console.warn("[labels] load failed:", e));

loop();
setInterval(loop, 5000);

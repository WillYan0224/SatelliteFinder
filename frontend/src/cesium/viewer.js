import "cesium/Build/Cesium/Widgets/widgets.css";
import { Viewer } from "cesium";

export function createViewer(containerId = "app") {
  window.CESIUM_BASE_URL = "/cesium";

  const viewer = new Viewer(containerId, {
    animation: false,
    timeline: false,
    homeButton: true,
    geocoder: false,
  });

  return viewer;
}

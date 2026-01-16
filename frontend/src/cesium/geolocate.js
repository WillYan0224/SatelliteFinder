import { Cartesian3, Color } from "cesium";

export function setupGeolocate(viewer) {
  let meEntity = null;

  function locateMe() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const p = Cartesian3.fromDegrees(lon, lat, 0);

        if (!meEntity) {
          meEntity = viewer.entities.add({
            id: "me",
            name: "You",
            position: p,
            point: {
              pixelSize: 8,
              color: Color.DODGERBLUE.withAlpha(0.9),
              outlineColor: Color.WHITE,
              outlineWidth: 2,
            },
            label: {
              text: "You",
              font: "14px sans-serif",
              fillColor: Color.WHITE,
              pixelOffset: new Cartesian3(0, -18, 0),
            },
          });
        } else {
          meEntity.position = p;
        }

        viewer.flyTo(meEntity);
      },
      (err) => alert("Geolocation failed: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return { locateMe };
}

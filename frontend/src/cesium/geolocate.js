import { Cartesian3, Color } from "cesium";

export function setupGeolocate(viewer) {
  let meEntity = null;

  function upsertMe(lat, lon) {
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

    return meEntity;
  }

  function locateMe() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const e = upsertMe(lat, lon);
        viewer.flyTo(e);
      },
      (err) => alert("Geolocation failed: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function getPermissionState() {
    if (!navigator.permissions?.query) return "unknown";
    try {
      const res = await navigator.permissions.query({ name: "geolocation" });
      return res.state; // granted | prompt | denied
    } catch {
      return "unknown";
    }
  }

  function requestOnce() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation)
        return reject(new Error("Geolocation not supported"));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const e = upsertMe(lat, lon);
          viewer.flyTo(e);
          resolve({ lat, lon, accuracy: pos.coords.accuracy });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  async function locateMeStrict() {
    const state = await getPermissionState();

    if (state === "denied") {
      alert(
        "Location access denied, go to browser setting to turn on permission to resolve it"
      );
      throw new Error("Geolocation permission denied");
    }

    try {
      return await requestOnce(); // {lat, lon, accuracy}
    } catch (err) {
      alert("Geolocation failed: " + (err?.message ?? String(err)));
      throw err;
    }
  }

  return { locateMe, locateMeStrict };
}

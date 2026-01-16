export function setupHUD({
  onLoadStarlink,
  onClear,
  onLocateMe,
  onNearestStarlink,
}) {
  const hudText = document.getElementById("issText");

  const slider = document.getElementById("starlinkSlider");
  const countText = document.getElementById("starlinkCount");
  const btnStarlink = document.getElementById("btnStarlink");
  const btnClear = document.getElementById("btnClear");

  const btnLocate = document.getElementById("btnLocate");

  // nearest
  const btnNearest = document.getElementById("btnNearest");
  const nearestText = document.getElementById("nearestText");

  // selected (picked by click)
  const pickedText = document.getElementById("pickedStarlinkText");

  function setPickedStarlink(info) {
    if (!pickedText) return;

    if (!info) {
      pickedText.textContent = "Selected: —";
      return;
    }

    pickedText.textContent =
      `Selected: ${info.name}\n` +
      `Lat: ${info.lat.toFixed(4)}  Lon: ${info.lon.toFixed(4)}\n` +
      `Alt: ${info.altKm.toFixed(1)} km`;
  }

  function setNearestStarlink(nearest) {
    if (!nearestText) return;

    if (!nearest) {
      nearestText.textContent = "Nearest: —";
      return;
    }

    nearestText.textContent =
      `Nearest: ${nearest.name}\n` +
      `Distance: ${nearest.distanceKm.toFixed(1)} km`;
  }

  function setTelemetry({ lat, lon, altKm, vel }) {
    if (!hudText) return;
    hudText.textContent =
      `Lat: ${lat.toFixed(4)}\n` +
      `Lon: ${lon.toFixed(4)}\n` +
      `Alt: ${altKm.toFixed(1)} km\n` +
      `Vel: ${vel.toFixed(1)} km/h`;
  }

  function getStarlinkLimit() {
    const v = Number(slider?.value ?? 200);
    return Number.isFinite(v) ? v : 200;
  }

  function syncStarlinkUI() {
    const v = getStarlinkLimit();
    if (countText) countText.textContent = String(v);
    if (btnStarlink) btnStarlink.textContent = "Load Starlink";
  }

  slider?.addEventListener("input", syncStarlinkUI);

  btnStarlink?.addEventListener("click", async () => {
    await onLoadStarlink?.(getStarlinkLimit());
    setNearestStarlink(null);
  });

  btnClear?.addEventListener("click", () => {
    onClear?.();
    setNearestStarlink(null);
    setPickedStarlink(null);
  });

  btnLocate?.addEventListener("click", () => onLocateMe?.());

  btnNearest?.addEventListener("click", async () => {
    try {
      const nearest = await onNearestStarlink?.(getStarlinkLimit());
      setNearestStarlink(nearest);
    } catch (e) {
      console.warn(e);
      setNearestStarlink(null);
    }
  });

  // init
  syncStarlinkUI();
  setNearestStarlink(null);
  setPickedStarlink(null);

  return {
    setTelemetry,
    syncStarlinkUI,
    setPickedStarlink,
    setNearestStarlink,
  };
}

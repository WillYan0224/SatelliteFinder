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
    if (btnStarlink) btnStarlink.textContent = `Load Starlink`;
  }

  slider?.addEventListener("input", syncStarlinkUI);

  btnStarlink?.addEventListener("click", async () => {
    await onLoadStarlink?.(getStarlinkLimit());
    if (nearestText) nearestText.textContent = "Nearest: —";
  });

  btnClear?.addEventListener("click", () => {
    onClear?.();
    if (nearestText) nearestText.textContent = "Nearest: —";
  });

  btnLocate?.addEventListener("click", () => onLocateMe?.());

  // Nearest
  btnNearest?.addEventListener("click", async () => {
    try {
      const nearest = await onNearestStarlink?.(getStarlinkLimit());
      if (!nearest) {
        if (nearestText) nearestText.textContent = "Nearest: —";
        return;
      }
      if (nearestText) {
        nearestText.textContent = `Nearest: ${
          nearest.name
        } • ${nearest.distanceKm.toFixed(1)} km`;
      }
    } catch (e) {
      console.warn(e);
    }
  });

  syncStarlinkUI();
  return { setTelemetry, syncStarlinkUI };
}

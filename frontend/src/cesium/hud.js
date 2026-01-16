export function setupHUD({ onLoadStarlink, onClear, onLocateMe }) {
  const hudText = document.getElementById("issText");

  const slider = document.getElementById("starlinkSlider");
  const countText = document.getElementById("starlinkCount");
  const btnStarlink = document.getElementById("btnStarlink");
  const btnClear = document.getElementById("btnClear");
  const btnMe = document.getElementById("btnLocate");

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

  btnStarlink?.addEventListener("click", () => {
    onLoadStarlink?.(getStarlinkLimit());
  });

  btnClear?.addEventListener("click", () => onClear?.());
  btnMe?.addEventListener("click", () => onLocateMe?.());

  // init
  syncStarlinkUI();

  return { setTelemetry, syncStarlinkUI };
}

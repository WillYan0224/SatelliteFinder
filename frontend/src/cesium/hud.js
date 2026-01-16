export function setupHUD({ onLoadStarlink, onClear, onLocateMe }) {
  const hudText = document.getElementById("issText");

  function setTelemetry({ lat, lon, altKm, vel }) {
    if (!hudText) return;
    hudText.textContent =
      `Lat: ${lat.toFixed(4)}\n` +
      `Lon: ${lon.toFixed(4)}\n` +
      `Alt: ${altKm.toFixed(1)} km\n` +
      `Vel: ${vel.toFixed(1)} km/h`;
  }

  document.getElementById("btnStarlink")?.addEventListener("click", () => {
    onLoadStarlink?.(200);
  });

  document.getElementById("btnClear")?.addEventListener("click", () => {
    onClear?.();
  });

  document.getElementById("btnMe")?.addEventListener("click", () => {
    onLocateMe?.();
  });

  return { setTelemetry };
}

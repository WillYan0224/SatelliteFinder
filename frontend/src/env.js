export const ENV = {
  CESIUM_TOKEN: import.meta.env.VITE_CESIUM_TOKEN,
  API_BASE: import.meta.env.VITE_API_BASE,
};

if (!ENV.CESIUM_TOKEN) {
  console.warn("[ENV] Missing VITE_CESIUM_TOKEN");
}

if (!ENV.API_BASE) {
  console.warn("[ENV] Missing VITE_API_BASE");
}

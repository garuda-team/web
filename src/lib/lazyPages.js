/* Lazy page loaders: each one fetches the page's data module and component once; hover/focus on the nav link only warms the same promise. */
let hw;
let st;
/* The data must be resolved before the page module is evaluated (it reads it as a live binding). */
/* A rejected import clears its cache entry so the next attempt (navigation, preload or Retry) imports again. */
export const importHardware = () =>
  (hw ??= import("../content.hardware.js")
    .then((m) => m.loadHardware())
    .then(() => import("../components/HardwarePage.jsx"))
    .catch((e) => {
      hw = undefined;
      throw e;
    }));
export const importStats = () =>
  (st ??= import("../content.stats.js")
    .then((m) => m.loadStats())
    .then(() => import("../components/StatsPage.jsx"))
    .catch((e) => {
      st = undefined;
      throw e;
    }));

const PRELOAD = { "/hardware": importHardware, "/stats": importStats };
export const preloadPage = (path) => {
  PRELOAD[path]?.().catch(() => {});
};

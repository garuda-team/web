/*
  Lazy data for the hardware page: loaded with import() only when the page opens.
  English base here; es/ca overrides live in content.hardware.es.js / content.hardware.ca.js and are merged by index like content.js.
*/
import { LANG } from "./lib/lang.js";
import { merge } from "./content.js";

/*
  hardware3d: Hardware 3D page (annotated model). Shape (identical in es/ca; features keep 9 entries, same order):
    hardware3d.title, loading, fallback, listLabel, partsLabel, partFeeders, partDoorL, partDoorR, rotateHint, rotateHintTouch, scrollHint, loadError, retry   texts (fallback = no WebGL; loadError + retry = load failure; listLabel = aria-label of the list;
                            parts* = hint and buttons to open the feeders and the two doors at the start;
                            rotateHint = desktop, rotateHintTouch = mobile (two fingers rotate, one finger scrolls); scrollHint = short "scroll for more" cue)
    hardware3d.features[9]  { id, title, text, y, side }  title translated per language;
                            y = provisional height in the model, 0 (top) to 1 (bottom); side = "left" | "right"
*/
export const hardware3dEn = {
  title: "Hardware",
  loading: "Loading 3D model…",
  fallback: "Your browser cannot show the 3D model (WebGL is not available). The features are listed below.",
  loadError: "The 3D model could not be loaded. The features are listed below.",
  retry: "Retry",
  listLabel: "Hardware features",
  partsLabel: "Click a part to open it:",
  partFeeders: "Feeders",
  partDoorL: "Left door",
  partDoorR: "Right door",
  rotateHint: "Drag to rotate",
  rotateHintTouch: "Use two fingers to rotate",
  scrollHint: "Scroll to see more information",
  features: [
    { id: "remote-4g-connection", title: "Remote 4G connection", text: "Mobile connectivity for remote monitoring and alerts, without relying on WiFi.", y: 0.06, side: "left" },
    { id: "edge-ai-detection", title: "AI detection", text: "Frames are encrypted on the device and sent over 4G to the server, where the AI detects the species. The prototype does not run AI on board.", y: 0.17, side: "right" },
    { id: "multi-species-feeder", title: "Multi-species feeder", text: "Feeder designed to attract and manage several species.", y: 0.28, side: "left" },
    { id: "high-autonomy-battery", title: "High-autonomy battery", text: "Long-life battery optimised to run for weeks in the field.", y: 0.39, side: "right" },
    { id: "sustainable-materials", title: "Sustainable materials", text: "Recycled/recyclable materials with lower environmental impact.", y: 0.5, side: "left" },
    { id: "solar-charging", title: "Solar charging", text: "Solar panel included in every unit to extend autonomy.", y: 0.61, side: "right" },
    { id: "weatherproof-design", title: "Weatherproof design", text: "Casing resistant to rain, dust and extreme temperatures.", y: 0.72, side: "left" },
    { id: "real-time-alerts", title: "Real-time alerts", text: "Instant notifications when a target species is detected.", y: 0.83, side: "right" },
    { id: "modular-repairable", title: "Modular & repairable", text: "Individually replaceable parts to ease maintenance.", y: 0.94, side: "left" },
  ],
};


/* Resolved data for the active language; filled by loadHardware() before the page module is evaluated. */
export let hardware3d = hardware3dEn;

export async function loadHardware() {
  const over = LANG === "es" ? (await import("./content.hardware.es.js")).default : LANG === "ca" ? (await import("./content.hardware.ca.js")).default : undefined;
  hardware3d = merge(hardware3dEn, over);
  return hardware3d;
}

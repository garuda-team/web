import { LANG } from "./lang.js";

/* Shared by the chart (tooltip) and the data table so both say the same thing about a point. */
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/* Same number format as the chart tooltip. */
export const fmtNum = (v) => (typeof v === "number" ? v.toLocaleString(LANG) : String(v));

/* Keys that hold a category or a year: never given a thousands separator. */
export const isLabelKey = (k) => k === "label" || k === "x" || /year/i.test(String(k));

export const hasRange = (p) => p && isNum(p.low) && isNum(p.high);

/* Text of one value of a point: "> 3000000" for a lower bound, "low–high" for a range without central value, noData for the rest. */
export function pointText(p, key, noData, fmt = String) {
  const v = p[key];
  if (isLabelKey(key)) return v === null || v === undefined ? noData : String(v);
  if (isNum(v)) return (p.bound === "min" ? "> " : "") + fmt(v);
  if (v === null || v === undefined) {
    if (key === "value" && hasRange(p)) return `${fmt(p.low)}–${fmt(p.high)}`;
    return noData;
  }
  return String(v);
}

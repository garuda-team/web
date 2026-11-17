/*
  Photo discovery: one folder per section under src/photos/,
  e.g. "home/home_title" or "home/home_title".
*/


const images = import.meta.glob(
  [
    "../photos/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP,AVIF,GIF}",
    "!../photos/flora/troncos_estilizados/**" /* unused trunks: kept on disk, not bundled */,
  ],
  { eager: true, import: "default" },
);
const videos = import.meta.glob("../photos/**/*.{mp4,webm,m4v,MP4,WEBM,M4V}", {
  eager: true,
  import: "default",
});

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function captionFrom(base) {
  const words = base
    .replace(/^\d+[a-z]?(?=[-_ .]|$)/i, "")
    .replace(/[-_.]+/g, " ")
    .trim();
  if (!words) return "";
  if (/^(img|dsc|dscn|dscf|pxl|mvimg|vid|photo|image|whatsapp|screenshot|captura|foto)\b/i.test(words)) return "";
  if (/^[\d\s]+$/.test(words)) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toItem(path, url, type) {
  const segments = path.replace(/^\.\.\/photos\//, "").split("/");
  const file = segments[segments.length - 1];
  const folder = segments[segments.length - 2];
  const base = file.replace(/\.[^.]+$/, "");
  return { url, type, folder, file, base, caption: captionFrom(base), dir: segments.slice(0, -1).join("/") };
}

const all = [
  ...Object.entries(images).map(([p, u]) => toItem(p, u, "image")),
  ...Object.entries(videos).map(([p, u]) => toItem(p, u, "video")),
].sort((a, b) => collator.compare(a.file, b.file));

/** Items in a folder path such as "home/home_title" and any of its subfolders, in natural name order. */
export const inV2Folder = (dir) => {
  const prefix = dir.replace(/\/+$/, "") + "/";
  return all.filter((x) => x.dir === dir || (x.dir + "/").startsWith(prefix));
};

/** Files in a folder path whose name starts with the number n (01, 1, 01b ...). */
export function startingWithV2(dir, n) {
  const re = new RegExp(`^0*${n}(?!\\d)`);
  return inV2Folder(dir).filter((x) => re.test(x.base));
}

/** First image of an SDG logo (folder sdg, file number n). */
export const sdgLogo = (n) => startingWithV2("sdg", n).find((x) => x.type === "image");

/** Files in a folder (last path segment) whose name starts with the number n (01, 1, 01b ...). */
export function startingWith(folder, n) {
  const re = new RegExp(`^0*${n}(?!\\d)`);
  return all.filter((x) => x.folder === folder).filter((x) => re.test(x.base));
}

/** Files in a folder (last path segment) whose name is exactly `name` (case-insensitive), e.g. "monitoring_AI". */
export function named(folder, name) {
  const want = name.toLowerCase();
  return all.filter((x) => x.folder === folder && x.base.toLowerCase() === want);
}

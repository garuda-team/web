/* Colour negative of a sprite (alpha kept), cached per image. Done once, so drawing stays a plain drawImage. */
/* Longest side is capped (max draw size 42 px x DPR 2 = 84, rounded to 128) so cached canvases stay small. */
const CACHE = new WeakMap();
const MAX_SIDE = 128;

export function negativeOf(img, maxSide = MAX_SIDE) {
  if (!img || !img.complete || !img.naturalWidth) return img;
  let c = CACHE.get(img);
  if (c) return c;
  c = document.createElement("canvas");
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(img, 0, 0, c.width, c.height);
  /* Invert straight (non-premultiplied) RGB and keep alpha, so soft edges get no light halo. */
  try {
    const d = g.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      px[i] = 255 - px[i];
      px[i + 1] = 255 - px[i + 1];
      px[i + 2] = 255 - px[i + 2];
    }
    g.putImageData(d, 0, 0);
  } catch {
    /* Tainted (cross-origin) canvas: SecurityError. Cache the original so it is not retried every frame. */
    CACHE.set(img, img);
    return img;
  }
  CACHE.set(img, c);
  return c;
}

/* Pages with a green ground draw leaves and sparrows in negative. */
const NEGATIVE_PAGES = [];
export const isNegativePage = () => NEGATIVE_PAGES.includes(document.documentElement.dataset.page);

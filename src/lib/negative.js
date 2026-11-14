/* Colour negative of a sprite (alpha kept), cached per image. Done once, so drawing stays a plain drawImage. */
/* Longest side is capped (max draw size 60 px x DPR 2 = 120, rounded to 128) so cached canvases stay small. */
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
  g.globalCompositeOperation = "difference";
  g.fillStyle = "#fff"; /* pure white is the operand that makes difference invert; not a design colour */
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(img, 0, 0, c.width, c.height);
  CACHE.set(img, c);
  return c;
}

/* Pages with a green ground draw leaves and sparrows in negative. */
const NEGATIVE_PAGES = [];
export const isNegativePage = () => NEGATIVE_PAGES.includes(document.documentElement.dataset.page);

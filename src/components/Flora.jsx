import { useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/hooks.js";
import { inV2Folder } from "../lib/photos.js";

/*
  Home-only decorative flora, drawn from the real frame sequences in src/photos/flora/<folder>/.
  - Crowns (copas, no trunks) on both edges, at most 40% of each tree on screen.
  - Sparrows (gorrion) crossing the background, on their own: no scroll, no pointer.
  - One canvas, one rAF loop, no React state per frame. Frames load lazily on mount, cached per folder so remounts do not reload; with birdsOnly only the bird folder is loaded.
  - Reduced motion: a single static frame, no loop (redrawn only on resize).
*/

/* Lazy, cached per folder: nothing is requested until a Flora mounts. */
const cache = {};
const load = (folder) =>
  (cache[folder] ||= inV2Folder(`flora/${folder}`).map((it) => {
    const img = new Image();
    img.decoding = "async";
    img.src = it.url;
    return img;
  }));

/* Sparrow flap cycle (1-based frames of gorrion/): wings up 5-10, downstroke 11-16, back up 17-25, then loops to 5. Downstroke start held for a smoother turn. */
const BIRD_SEQ = [5, 6, 7, 8, 9, 10, 11, 11, 12, 13, 14, 15, 16, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map((n) => n - 1);
const FPS = { tree: 10, bird: 24 };
const ALPHA = { tree: 0.4, bird: 0.85 };
const BIRD_SCALE = 0.75; /* common scale for every sparrow */
const FADE_EDGE = 0.4; /* fraction of a tree that stays on screen */

/* Trees: side, vertical position (fraction of viewport height), frame phase, size factor, hidden on small screens. */
const TREES = [
  { side: -1, y: 0.18, ph: 0, k: 1 },
  { side: -1, y: 0.7, ph: 17, k: 0.9 },
  { side: 1, y: 0.12, ph: 31, k: 0.95 },
  { side: 1, y: 0.6, ph: 9, k: 1 },
  { side: 1, y: 1.0, ph: 23, k: 0.8, extra: true },
];
/* Sparrow lanes: own height (fraction of vh), direction, speed (px/s), glide amplitude, wave offset, start delay (s), static x (fraction of vw). */
const BIRD_LANES = [
  { yr: 0.12, dir: 1, v: 70, amp: 18, o: 0.5, wait: 0.5, sx: 0.22 },
  { yr: 0.3, dir: -1, v: 105, amp: 30, o: 2.1, wait: 3, sx: 0.7 },
  { yr: 0.47, dir: 1, v: 90, amp: 22, o: 4.0, wait: 6, sx: 0.45 },
  { yr: 0.64, dir: -1, v: 120, amp: 16, o: 5.3, wait: 9, sx: 0.85 },
  { yr: 0.82, dir: 1, v: 80, amp: 26, o: 1.2, wait: 12, sx: 0.12 },
];

const ready = (img) => img && img.complete && img.naturalWidth > 0;
const frameOf = (seq, t, fps, ph) => (seq.length ? seq[(Math.floor(t * fps) + ph) % seq.length] : null);

/* birdsOnly: no crowns, sparrows in colour negative (green pages). */
export default function Flora({ birdsOnly = false }) {
  const reduced = useReducedMotion();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const SEQ = { crown: birdsOnly ? [] : load("copas"), bird: load("gorrion") };
    const rnd = Math.random;
    let vw = 0;
    let vh = 0;
    let small = false;

    const birds = BIRD_LANES.map((l, i) => ({
      ...l, on: false, x: 0, ph: (i * 5 + Math.floor(rnd() * 5)) % BIRD_SEQ.length,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      small = vw <= 720;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const sprite = (img, cx, cy, w, flip) => {
      if (!ready(img)) return;
      const src = img;
      const h = (w * img.naturalHeight) / img.naturalWidth;
      if (flip < 0) {
        ctx.save();
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(src, -w / 2, cy - h / 2, w, h);
        ctx.restore();
      } else ctx.drawImage(src, cx - w / 2, cy - h / 2, w, h);
    };

    const drawTrees = (t) => {
      if (birdsOnly) return;
      const base = small ? Math.max(110, Math.min(150, vw * 0.3)) : Math.max(160, Math.min(320, vw * 0.2));
      ctx.globalAlpha = ALPHA.tree;
      for (const tr of TREES) {
        if (small && tr.extra) continue;
        const w = base * tr.k;
        /* centre so that only FADE_EDGE of the width is inside the viewport */
        const cx = tr.side < 0 ? w * FADE_EDGE - w / 2 : vw - w * FADE_EDGE + w / 2;
        const crown = frameOf(SEQ.crown, t, FPS.tree, tr.ph);
        sprite(crown, cx, tr.y * vh, w * 1.25, tr.side);
      }
    };

    const drawBirds = (t, dt) => {
      ctx.globalAlpha = ALPHA.bird;
      const size = (small ? 40 : 60) * BIRD_SCALE;
      for (const b of birds) {
        if (!b.on) {
          b.wait -= dt;
          if (b.wait > 0) continue;
          b.on = true;
          b.x = b.dir > 0 ? -80 : vw + 80;
        }
        b.x += b.dir * b.v * dt;
        /* wingbeat bob (one rise per flap) over a slow glide wave */
        const beat = t * (FPS.bird / BIRD_SEQ.length) * 6.283;
        const y = b.yr * vh + Math.sin(t * 0.6 + b.o) * b.amp - Math.sin(beat + b.ph) * 3;
        const f = SEQ.bird[BIRD_SEQ[(Math.floor(t * FPS.bird) + b.ph) % BIRD_SEQ.length]];
        sprite(f, b.x, y, size, b.dir);
        if (b.x < -100 || b.x > vw + 100) {
          b.on = false;
          b.wait = 8 + rnd() * 8;
        }
      }
    };

    const draw = (t, dt) => {
      ctx.clearRect(0, 0, vw, vh);
      drawTrees(t);
      drawBirds(t, dt);
      ctx.globalAlpha = 1;
    };

    /* Reduced motion: one still composition (first frame, five birds spread out). */
    const drawStatic = () => {
      ctx.clearRect(0, 0, vw, vh);
      drawTrees(0);
      ctx.globalAlpha = ALPHA.bird;
      for (const l of BIRD_LANES) sprite(SEQ.bird[BIRD_SEQ[0]], vw * l.sx, vh * l.yr, (small ? 40 : 60) * BIRD_SCALE, l.dir);
      ctx.globalAlpha = 1;
    };

    let alive = true;
    let raf = 0;
    let last = 0;
    let clock = 0;
    const frame = (now) => {
      raf = 0;
      if (!alive || document.hidden) return;
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      clock += dt;
      draw(clock, dt);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduced || !alive || raf || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      resize();
      if (reduced) drawStatic();
    };

    let staticImgs = [];
    resize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    if (reduced) {
      /* frames may still be decoding: redraw once each first frame has loaded */
      drawStatic();
      staticImgs = [
        ...(birdsOnly ? [] : TREES.map((tr) => frameOf(SEQ.crown, 0, FPS.tree, tr.ph))),
        SEQ.bird[BIRD_SEQ[0]],
      ].filter((img) => img && !ready(img));
      staticImgs.forEach((img) => img.addEventListener("load", drawStatic));
    } else start();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      raf = 0;
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("resize", onResize);
      staticImgs.forEach((img) => img.removeEventListener("load", drawStatic));
    };
  }, [reduced, birdsOnly]);

  return <canvas ref={canvasRef} className={birdsOnly ? "flora flora--birds" : "flora"} aria-hidden="true" />;
}

import { useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/hooks.js";
import { inV2Folder } from "../lib/photos.js";
import { isNegativePage, negativeOf } from "../lib/negative.js";

/*
  One fixed field of falling leaves behind the whole page (aria-hidden, below every section).
  - Leaves are the real frames of src/photos/flora/hojas/ (no drawn shapes), in varied sizes (0.45-1.75x).
  - Each leaf falls, sways and spins; leaving the bottom it reappears at the top.
    Fast scrolling raises a gust of wind that calms down gradually.
  - Background colour comes from the sections that carry [data-wave]: each one declares
    --wave-bg and --wave-dot in CSS; the canvas blends between their centres as you scroll.
  - Cheap: ~30 fps, paused in background tabs, DPR <= 2, 27-180 leaves,
    no allocations inside the frame loop. Reduced motion: still leaves, colour follows the scroll only.
*/
const FRAME_MS = 33;
const MIN_LEAVES = 27;
const MAX_LEAVES = 180;
const AREA_PER_LEAF = 6500;
const SCALE_MIN = 0.45; /* same range as the home flora */
const SCALE_MAX = 1.75;
const BASE_SIZE = 24;
const BASE_SIZE_SMALL = 17;
const LEAF_FPS = 12;
const SIZE_MAX = BASE_SIZE * SCALE_MAX;

/* Real leaf frames: created lazily on first mount, cached across remounts. */
let leafCache = null;
const loadLeaves = () =>
  (leafCache ||= inV2Folder("flora/hojas").map((it) => {
    const img = new Image();
    img.decoding = "async";
    img.src = it.url;
    return img;
  }));

export default function Backdrop() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;
    const LEAF = loadLeaves();
    const SPRITES = LEAF.length;
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    probe.canvas.width = 1;
    probe.canvas.height = 1;

    /* fallback colours come from the :root tokens, read once */
    const rootCs = getComputedStyle(document.documentElement);
    const fallbackBg = rootCs.getPropertyValue("--paper").trim();
    const fallbackInk = rootCs.getPropertyValue("--forest").trim();

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let lastDraw = 0;
    let scrollY = 0;
    let prevScroll = -1;
    let gust = 0;
    let clock = 0;
    let stopsY = new Float32Array(0);
    let stopsC = new Float32Array(0); /* per stop: bg r,g,b, leaf r,g,b */
    let nStops = 0;
    let stopColors = null; /* cached parsed colours per [data-wave] element */
    let tokenSig = "";
    let bgKey = -1;
    let n = 0;
    let lx = new Float32Array(0);
    let ly = new Float32Array(0);
    let lv = new Float32Array(0); /* fall speed px/s */
    let ls = new Float32Array(0); /* size px */
    let lk = new Uint8Array(0); /* sprite index */
    let la = new Float32Array(0); /* spin angle */
    let lw = new Float32Array(0); /* spin speed */
    let lp = new Float32Array(0); /* sway phase */
    let lf = new Float32Array(0); /* sway speed */
    let lm = new Float32Array(0); /* sway amplitude px */
    let lfl = new Float32Array(0); /* flip phase */
    let lfs = new Float32Array(0); /* flip speed */
    let lal = new Float32Array(0); /* alpha */
    const rgb = new Float32Array(6);

    const parse = (css, out, at) => {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = "black";
      probe.fillStyle = css;
      probe.fillRect(0, 0, 1, 1);
      const d = probe.getImageData(0, 0, 1, 1).data;
      out[at] = d[0];
      out[at + 1] = d[1];
      out[at + 2] = d[2];
    };

    /* Read the stops: centre of every [data-wave] block, in document coordinates. */
    const readStops = () => {
      const els = document.querySelectorAll("[data-wave]");
      const list = [];
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        list.push({ el, y: r.top + window.scrollY + r.height / 2 });
      });
      list.sort((a, b) => a.y - b.y);
      nStops = list.length;
      stopsY = new Float32Array(nStops);
      /* colours are read (getComputedStyle + getImageData) only when the tokens changed */
      const raw = list.map((s) => {
        const cs = getComputedStyle(s.el);
        return [cs.getPropertyValue("--wave-bg").trim(), cs.getPropertyValue("--wave-dot").trim()];
      });
      const sig = raw.map((r) => r.join("|")).join(";");
      if (sig !== tokenSig || !stopColors || stopColors.length !== nStops * 6) {
        tokenSig = sig;
        stopColors = new Float32Array(nStops * 6);
        raw.forEach((r, i) => {
          parse(r[0] || fallbackBg, stopColors, i * 6);
          parse(r[1] || fallbackInk, stopColors, i * 6 + 3);
        });
        bgKey = -1;
      }
      stopsC = stopColors;
      list.forEach((s, i) => {
        stopsY[i] = s.y;
      });
    };

    const applyColors = () => {
      if (nStops === 0) {
        if (bgKey === -1) {
          bgKey = 0;
          canvas.style.backgroundColor = fallbackBg;
        }
        return;
      }
      const pos = scrollY + window.innerHeight / 2;
      let a = 0;
      while (a < nStops - 1 && pos > stopsY[a + 1]) a++;
      const b = Math.min(a + 1, nStops - 1);
      let k = 0;
      if (b !== a) {
        const span = stopsY[b] - stopsY[a];
        k = span > 0 ? (pos - stopsY[a]) / span : 1; /* equal y: use the next stop */
        k = k < 0 ? 0 : k > 1 ? 1 : k;
        k = k * k * (3 - 2 * k);
      }
      for (let c = 0; c < 6; c++) rgb[c] = Math.round(stopsC[a * 6 + c] + (stopsC[b * 6 + c] - stopsC[a * 6 + c]) * k);
      const bk = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
      if (bk !== bgKey) {
        bgKey = bk;
        canvas.style.backgroundColor = `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
      }
    };

    const draw = (now) => {
      scrollY = window.scrollY;
      applyColors();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!n || !SPRITES) return;

      let dt = 0;
      if (!reduced) {
        dt = lastDraw ? (now - lastDraw) / 1000 : 0.033;
        dt = dt > 0.1 ? 0.1 : dt < 0.001 ? 0.001 : dt;
        lastDraw = now;
        /* wind: scroll speed raises a gust that decays with a ~1.6 s time constant */
        const vel = prevScroll < 0 ? 0 : Math.abs(scrollY - prevScroll) / dt;
        prevScroll = scrollY;
        const target = Math.min(vel / 2500, 1.5);
        gust = Math.max(gust * Math.exp(-dt / 1.6), target);
        clock = now / 1000;
      }
      const base = reduced ? 0 : 10 + 8 * Math.sin(clock * 0.4);
      const edge = SIZE_MAX * 1.5;
      const neg = isNegativePage();
      for (let i = 0; i < n; i++) {
        const sz = ls[i];
        if (!reduced) {
          lp[i] += lf[i] * dt * (1 + gust);
          la[i] += lw[i] * dt * (1 + gust * 2);
          lfl[i] += lfs[i] * dt * (1 + gust);
          ly[i] += lv[i] * dt * (1 + gust * 0.8);
          lx[i] += (base + gust * 170 * (0.5 + sz / SIZE_MAX)) * dt;
          if (ly[i] > h + edge) {
            ly[i] = -edge;
            lx[i] = Math.random() * (w + edge * 2) - edge;
          }
          if (lx[i] > w + edge) lx[i] -= w + edge * 2;
        }
        const x = lx[i] + Math.sin(lp[i]) * lm[i];
        const y = ly[i];
        const ang = la[i] + Math.cos(lp[i]) * 0.6;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const sx = 0.3 + 0.7 * Math.abs(Math.cos(lfl[i]));
        ctx.setTransform(dpr * c * sx, dpr * s * sx, -dpr * s, dpr * c, dpr * x, dpr * y);
        ctx.globalAlpha = lal[i];
        const img0 = LEAF[(Math.floor(clock * LEAF_FPS) + lk[i]) % SPRITES];
        const img = neg ? negativeOf(img0) : img0;
        if (img0.complete && img0.naturalWidth > 0) {
          const ih = (sz * img0.naturalHeight) / img0.naturalWidth;
          ctx.drawImage(img, -sz / 2, -ih / 2, sz, ih);
        }
      }
      ctx.globalAlpha = 1;
    };

    const spawn = (i, anywhere) => {
      const r = Math.random;
      const near = r() * r(); /* 0 far/small/slow .. 1 near/big/fast; squared-ish bias: mostly small */
      ls[i] = (w <= 720 ? BASE_SIZE_SMALL : BASE_SIZE) * (SCALE_MIN + near * (SCALE_MAX - SCALE_MIN));
      lv[i] = 22 + near * 38 + r() * 14;
      lal[i] = 0.35 + near * 0.4;
      lk[i] = Math.floor(r() * SPRITES);
      lx[i] = r() * w;
      ly[i] = anywhere ? r() * (h + SIZE_MAX * 3) - SIZE_MAX * 1.5 : -SIZE_MAX * 1.5 - r() * h * 0.2;
      la[i] = r() * Math.PI * 2;
      lw[i] = (r() - 0.5) * 1.6;
      lp[i] = r() * Math.PI * 2;
      lf[i] = 0.8 + r() * 1.2;
      lm[i] = 10 + r() * 22;
      lfl[i] = r() * Math.PI * 2;
      lfs[i] = 0.6 + r() * 1.6;
    };

    const grow = (Type, old, len) => {
      const next = new Type(len);
      next.set(old.subarray(0, Math.min(old.length, len)));
      return next;
    };

    const resize = () => {
      const nw = canvas.clientWidth || document.documentElement.clientWidth;
      const nh = canvas.clientHeight || window.innerHeight;
      const ndpr = Math.min(window.devicePixelRatio || 1, 2);
      /* mobile address bar: ignore small height-only changes so the leaves do not jump */
      if (w && nw === w && ndpr === dpr && Math.abs(nh - h) < 160) return;
      const oldW = w;
      const first = !oldW;
      dpr = ndpr;
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const nn = Math.max(MIN_LEAVES, Math.min(MAX_LEAVES, Math.round((w * h) / AREA_PER_LEAF)));
      const old = n;
      if (nn !== old) {
        /* keep the existing leaves, add or drop only the difference */
        lx = grow(Float32Array, lx, nn);
        ly = grow(Float32Array, ly, nn);
        lv = grow(Float32Array, lv, nn);
        ls = grow(Float32Array, ls, nn);
        lk = grow(Uint8Array, lk, nn);
        la = grow(Float32Array, la, nn);
        lw = grow(Float32Array, lw, nn);
        lp = grow(Float32Array, lp, nn);
        lf = grow(Float32Array, lf, nn);
        lm = grow(Float32Array, lm, nn);
        lfl = grow(Float32Array, lfl, nn);
        lfs = grow(Float32Array, lfs, nn);
        lal = grow(Float32Array, lal, nn);
        n = nn;
        for (let i = old; i < nn; i++) spawn(i, true);
      }
      if (!first && oldW !== w) {
        const k = w / oldW;
        for (let i = 0; i < Math.min(old, nn); i++) lx[i] *= k;
      }
      lastDraw = 0;
      readStops();
      draw(performance.now());
    };

    let rRaf = 0;
    const relayout = () => {
      if (rRaf) return;
      rRaf = requestAnimationFrame(() => {
        rRaf = 0;
        readStops();
        if (!raf) draw(performance.now());
      });
    };

    const loop = (now) => {
      raf = 0;
      if (document.hidden) return;
      if (now - last >= FRAME_MS) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && !document.hidden) {
        lastDraw = 0; /* do not integrate the time spent in a hidden tab */
        raf = requestAnimationFrame(loop);
      }
    };
    const onVis = () => {
      if (!document.hidden) start();
    };
    let sRaf = 0;
    const onScroll = () => {
      if (sRaf) return;
      sRaf = requestAnimationFrame(() => {
        sRaf = 0;
        draw(performance.now());
      });
    };

    resize();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(relayout);
      ro.observe(document.documentElement);
      ro.observe(document.body);
    }
    window.addEventListener("resize", resize);
    let hRaf = 0;
    const onHash = () => {
      cancelAnimationFrame(hRaf);
      /* wait for App to update data-page and the new page to lay out */
      hRaf = requestAnimationFrame(() => {
        hRaf = requestAnimationFrame(() => {
          hRaf = 0;
          readStops();
          draw(performance.now());
        });
      });
    };
    let pending = [];
    if (reduced) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("hashchange", onHash);
      /* leaves may still be loading: repaint once each pending one arrives */
      pending = LEAF.filter((img) => !(img.complete && img.naturalWidth > 0));
      pending.forEach((img) => img.addEventListener("load", onScroll));
    } else {
      document.addEventListener("visibilitychange", onVis);
      start();
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sRaf);
      cancelAnimationFrame(rRaf);
      cancelAnimationFrame(hRaf);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      pending.forEach((img) => img.removeEventListener("load", onScroll));
      ro?.disconnect();
    };
  }, [reduced]);

  return <canvas ref={ref} className="backdrop" aria-hidden="true" />;
}

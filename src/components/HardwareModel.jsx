import { useEffect, useRef } from "react";
import {
  ACESFilmicToneMapping, AmbientLight, Box3, BoxGeometry, BufferAttribute, BufferGeometry, ClampToEdgeWrapping, Color,
  CylinderGeometry, DataTexture, DepthTexture, DirectionalLight, DoubleSide, EdgesGeometry, Fog, Group, HalfFloatType, HemisphereLight,
  IcosahedronGeometry, InstancedMesh, LinearFilter, LinearMipmapLinearFilter, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshLambertMaterial,
  MeshStandardMaterial, Object3D, OrthographicCamera, PCFSoftShadowMap, PlaneGeometry, PMREMGenerator, Quaternion, Raycaster,
  RepeatWrapping, Scene, ShaderMaterial, SphereGeometry, Spherical, SRGBColorSpace, TextureLoader, Vector2, Vector3, Vector4,
  WebGLRenderer, WebGLRenderTarget,
} from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DracoLite } from "../lib/dracoLite.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

export const MODEL_URL = `${import.meta.env.BASE_URL}models/ensamblaje-caseta-draco.glb`;
export const DRACO_PATH = `${import.meta.env.BASE_URL}draco/gltf/`;
export const TEX_URL = (kind, map) => `${import.meta.env.BASE_URL}textures/${kind}/${map}.webp`;
export const WOOD_REPEAT = 2; /* tiles per generated-UV unit (one unit = the model's longest side) */
export const EDGE_ANGLE = 30; /* degrees: only real creases get a line, not inner triangles */
const SEEDS_PER_FEEDER = 450;
const SEED_BUDGET_MS = 4; /* per-frame time for probing the feeder cavities */
const CAM_DIST = 20000; /* camera distance to the origin; fog is measured from the camera */
export const TRUNK_R = 0.62; /* trunk radius, in hut widths: clearly wider than the hut, as in the reference photos */
const HINGE_R = 0.0025; /* model units: radius of the hinge barrel that runs along the top edge of each door */
const DOOR_OPEN = 1.25; /* rad: how far a door swings up and into the hut around that barrel */
const CLICK_SLOP = 6; /* px: a press that moves further is an OrbitControls drag, not a click */
const CLICK_MS = 600;

/* Forest backdrop (the photo below only lights the scene). It is drawn into a half-resolution target and composited blurred behind the model (depth of field). */
export const PANO_URL = `${import.meta.env.BASE_URL}textures/forest/stone-pines.webp`;
const BG_SCALE = 0.5; /* target size, in CSS pixels */
/* Instances per kind. Phones (same narrow criterion as the layout, innerWidth <= 720) get about half (BUG-168);
   the low-discrepancy scatter below keeps any count evenly spread over the full turn, so fewer leaves no gaps. */
export const FOREST_DESKTOP = {
  PINES: 85, /* per variant (two variants): 10 more than before */
  OAKS: 60,
  BUSHES: 90, /* round scrub, per oak variant (two variants) */
  SHRUBS: 40, /* twiggy shrubs with visible stems, per variant (two variants) */
  FERNS: 70, /* arching fronds */
  ROCKS: 80,
  TUFTS: 420, /* forest floor litter: grass tufts, fallen cones and twigs (a few triangles each) */
  CONES: 140,
  TWIGS: 70,
};
const FOREST_NARROW = { PINES: 43, OAKS: 30, BUSHES: 45, SHRUBS: 20, FERNS: 35, ROCKS: 40, TUFTS: 200, CONES: 70, TWIGS: 35 };
export const FAR_DESKTOP = 34; /* tall far pines per variant (two variants), real geometry so they turn with the camera */
const FAR_NARROW = 14;
const NARROW = 720;
const isNarrow = () => window.innerWidth <= NARROW;
export const RINGS = 44; /* ground: polar grid, denser near the model */
export const SECTORS = 96;
export const SUN = new Vector3(-0.6, 0.55, 0.58).normalize(); /* mid-afternoon sun from the left */

/* Deterministic PRNG so the seed mix looks the same on every load. */
export const rng = (a) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const f3 = (v) => `vec3(${v.x.toFixed(5)}, ${v.y.toFixed(5)}, ${v.z.toFixed(5)})`;
const SUN_U = new Vector3().crossVectors(SUN, new Vector3(0, 1, 0)).normalize();
const SUN_V = new Vector3().crossVectors(SUN, SUN_U).normalize();

/* Dappled light: a noise mask projected along the sun, as if the canopy above were casting it. */
const DAPPLE_GLSL = `
uniform vec4 uDap;
varying vec3 vDapPos;
float dapH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float dapN(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(dapH(i), dapH(i + vec2(1.0, 0.0)), f.x), mix(dapH(i + vec2(0.0, 1.0)), dapH(i + vec2(1.0, 1.0)), f.x), f.y);
}
float dapple(float lo) {
  vec3 p = (vDapPos - uDap.xyz) * uDap.w;
  vec2 q = vec2(dot(p, ${f3(SUN_U)}), dot(p, ${f3(SUN_V)}));
  float n = dapN(q) * 0.6 + dapN(q * 2.3 + 7.1) * 0.4;
  return mix(lo, 1.0, smoothstep(0.4, 0.6, n));
}`;
/* Adds the mask to a lit material: `uni` places and scales the pattern, `lo` is the light left in the shade. */
export const dappled = (mat, uni, lo, tag = "", extra = null) => {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uDap = uni;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDapPos;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n vec4 dapW = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n dapW = instanceMatrix * dapW;\n#endif\n vDapPos = (modelMatrix * dapW).xyz;",
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\n${DAPPLE_GLSL}`)
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>\n float dapK = dapple(${lo.toFixed(2)});\n reflectedLight.directDiffuse *= dapK;\n reflectedLight.directSpecular *= dapK;`,
      );
    extra?.(sh);
  };
  mat.customProgramCacheKey = () => `dapple-${lo}-${tag}`;
  return mat;
};

const QUAD_VERT = "varying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}";
/* Composite: the forest target, blurred more the further the pixel is, plus a warm glow where the sun comes in. */
const BLUR_FRAG = `
uniform sampler2D tMap;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform vec2 uBlur;
uniform float uDepth;
uniform vec3 uSun;
varying vec2 vUv;
void main() {
  float d = texture2D(tDepth, vUv).r * uDepth;
  float rad = mix(uBlur.x, uBlur.y, smoothstep(0.3, 4.0, d));
  vec3 c = texture2D(tMap, vUv).rgb;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float a = fi * 2.399963;
    c += texture2D(tMap, vUv + vec2(cos(a), sin(a)) * sqrt((fi + 0.5) / 12.0) * rad * uTexel).rgb;
  }
  c /= 13.0;
  float glow = pow(max(0.0, 1.0 - distance(vUv, vec2(-0.05, 0.85)) * 0.9), 3.0);
  gl_FragColor = vec4(c + uSun * glow * 0.22, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.a = 1.0; /* opaque: forest and sky are never blended with the page */
}`;

/* Tileable foliage texture: rgb = short needle/leaf strokes over soft noise, with dark gaps between them;
   alpha = chunky mask that frays the crown outline and opens holes in it. */
export const foliageTexture = () => {
  const n = 256;
  const rnd = rng(77);
  const lattice = (cells) => {
    const v = Array.from({ length: cells * cells }, rnd);
    return (x, y) => {
      const fx = (x / n) * cells; const fy = (y / n) * cells;
      const x0 = Math.floor(fx); const y0 = Math.floor(fy);
      const tx = fx - x0; const ty = fy - y0;
      const at = (i, j) => v[((j + cells) % cells) * cells + ((i + cells) % cells)];
      const sx = tx * tx * (3 - 2 * tx); const sy = ty * ty * (3 - 2 * ty);
      return lerp(lerp(at(x0, y0), at(x0 + 1, y0), sx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), sx), sy);
    };
  };
  const [a, b, c] = [lattice(24), lattice(12), lattice(28)];
  const strokes = new Float32Array(n * n);
  for (let s = 0; s < 3200; s++) {
    const x = rnd() * n; const y = rnd() * n;
    const ang = rnd() * 6.28;
    const len = 4 + rnd() * 8;
    const val = 0.35 + 0.65 * rnd();
    for (let t = 0; t < len; t++) {
      const px = (Math.round(x + Math.cos(ang) * t) + n) % n;
      const py = (Math.round(y + Math.sin(ang) * t) + n) % n;
      strokes[py * n + px] = Math.max(strokes[py * n + px], val * (1 - (0.4 * t) / len)); /* lighter at the tip end */
    }
  }
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4;
      const v = 255 * (0.42 + 0.58 * (0.55 * strokes[y * n + x] + 0.45 * a(x, y)));
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255 * (0.6 * b(x, y) + 0.4 * c(x, y));
    }
  }
  const t = new DataTexture(data, n, n);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.repeat.set(3, 2);
  t.needsUpdate = true;
  return t;
};

/* Tree parts, in units of the tree height (y up, base at the origin). All of them end up in instanced meshes. */
const UP = new Vector3(0, 1, 0);
export const scaleUv = (g, u, v) => {
  const a = g.attributes.uv;
  for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * u, a.getY(i) * v);
  return g;
};
/* Lumpy ball of foliage (or a boulder): shaded by vertex so the underside reads darker than the sunlit top. */
export const blob = (rnd, c, r, detail = 1, shade = true) => {
  const src = new IcosahedronGeometry(1, detail);
  const g = mergeVertices(src);
  src.dispose();
  const P = g.attributes.position;
  const [a, b, d] = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i); const y = P.getY(i); const z = P.getZ(i);
    const k = 1 + 0.2 * Math.sin(x * 3.1 + a) * Math.cos(y * 3.7 + b) + 0.12 * Math.sin(z * 5.3 + d);
    P.setXYZ(i, c[0] + x * k * r[0], c[1] + y * k * r[1], c[2] + z * k * r[2]);
  }
  g.computeVertexNormals();
  if (shade) {
    const N = g.attributes.normal;
    const col = new Float32Array(P.count * 3);
    const tone = 0.82 + 0.3 * rnd(); /* every clump its own value, so the crown reads as separate masses */
    for (let i = 0; i < P.count; i++) col.fill(tone * lerp(0.38, 1, clamp(N.getY(i) * 0.5 + 0.5) ** 0.9), i * 3, i * 3 + 3);
    g.setAttribute("color", new BufferAttribute(col, 3));
  }
  return g;
};
const limb = (from, to, r0, r1) => {
  const a = new Vector3(...from);
  const dir = new Vector3(...to).sub(a);
  const len = dir.length();
  const g = scaleUv(new CylinderGeometry(r1, r0, len, 5, 1, true), 1, len * 8);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new Quaternion().setFromUnitVectors(UP, dir.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
};
const stem = (rnd, top, r0, r1, sway) => {
  const ph = rnd() * 6.28;
  const amp = sway * (0.5 + rnd());
  const bend = (y) => amp * (Math.sin(y * 2.6 + ph) - Math.sin(ph));
  const g = scaleUv(new CylinderGeometry(r1, r0, top, 7, 8, true), 2, top * 8);
  g.translate(0, top / 2, 0);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) P.setX(i, P.getX(i) + bend(P.getY(i)));
  g.computeVertexNormals();
  return { g, x: bend(top) };
};
const fuse = (parts) => {
  const g = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return g;
};
/* Crown shading: normals blend towards a sphere around the crown (soft, round lighting instead of faceted lumps) and the
   colour darkens towards the interior and the underside, as light does inside real foliage. */
const crownShade = (g, c, r, round = 0.65) => {
  const P = g.attributes.position; const N = g.attributes.normal;
  const col = g.attributes.color;
  const v = new Vector3();
  for (let i = 0; i < P.count; i++) {
    v.set((P.getX(i) - c[0]) / r[0], (P.getY(i) - c[1]) / r[1], (P.getZ(i) - c[2]) / r[2]);
    const d = clamp(v.length());
    v.normalize();
    const nx = lerp(N.getX(i), v.x, round); const ny = lerp(N.getY(i), v.y, round); const nz = lerp(N.getZ(i), v.z, round);
    const l = Math.hypot(nx, ny, nz) || 1;
    N.setXYZ(i, nx / l, ny / l, nz / l);
    const ao = lerp(0.5, 1, d ** 0.8) * lerp(0.72, 1, clamp(v.y * 0.5 + 0.5));
    col.setXYZ(i, col.getX(i) * ao, col.getY(i) * ao, col.getZ(i) * ao);
  }
  return g;
};
/* Stone pine: long bare trunk, a few rising limbs and a flat umbrella of needle clumps. */
export const makePine = (seed) => {
  const rnd = rng(seed);
  const { g, x } = stem(rnd, 0.76, 0.03, 0.015, 0.03);
  const wood = [g];
  const leaves = [];
  const n = 9 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.28 + rnd() * 0.5;
    const rr = i === 0 ? 0 : 0.14 + rnd() * 0.16;
    const c = [x + Math.cos(a) * rr, 0.88 + rnd() * 0.05 - rr * 0.14, Math.sin(a) * rr];
    const rad = 0.13 + rnd() * 0.07;
    leaves.push(blob(rnd, c, [rad, rad * 0.42, rad]));
    /* a smaller tuft riding on the rim of each clump breaks the smooth umbrella outline (20 triangles) */
    const sa = a + (rnd() - 0.5) * 1.8;
    const sd = rad * (0.7 + rnd() * 0.3);
    leaves.push(blob(rnd, [c[0] + Math.cos(sa) * sd, c[1] + rad * (0.08 + rnd() * 0.16), c[2] + Math.sin(sa) * sd], [rad * 0.5, rad * 0.24, rad * 0.5], 0));
    /* second tuft on the opposite flank and a hanging one below: tiers of needles instead of a smooth disc */
    const sb = a + 2.2 + rnd() * 1.6;
    leaves.push(blob(rnd, [c[0] + Math.cos(sb) * rad * 0.8, c[1] + rad * (0.02 + rnd() * 0.12), c[2] + Math.sin(sb) * rad * 0.8], [rad * 0.42, rad * 0.2, rad * 0.42], 0));
    if (i > 0) leaves.push(blob(rnd, [c[0] * 1.05, c[1] - rad * 0.38, c[2] * 1.05], [rad * 0.55, rad * 0.16, rad * 0.55], 0));
    if (i % 2 === 0) wood.push(limb([x, 0.7, 0], [c[0], c[1] - 0.015, c[2]], 0.011, 0.005));
  }
  return { wood: fuse(wood), crown: crownShade(fuse(leaves), [x, 0.88, 0], [0.34, 0.16, 0.34], 0.6) };
};
/* Holm oak: short forked trunk under a broad, dense, rounded crown. */
export const makeOak = (seed) => {
  const rnd = rng(seed);
  const { g, x } = stem(rnd, 0.42, 0.06, 0.04, 0.05);
  const wood = [g];
  const leaves = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.28 + rnd() * 0.6;
    const rr = i === 0 ? 0 : 0.14 + rnd() * 0.2;
    const c = [x + Math.cos(a) * rr, 0.62 + rnd() * 0.16 - rr * 0.2, Math.sin(a) * rr];
    const rad = 0.2 + rnd() * 0.08;
    leaves.push(blob(rnd, c, [rad, rad * 0.78, rad]));
    /* a smaller clump on the outer, upper side of each mass: a knobbly outline instead of plain spheres */
    const sa = a + (rnd() - 0.5) * 1.4;
    leaves.push(blob(rnd, [c[0] + Math.cos(sa) * rad * 0.7, c[1] + rad * (0.3 + rnd() * 0.25), c[2] + Math.sin(sa) * rad * 0.7], [rad * 0.48, rad * 0.4, rad * 0.48], 0));
    /* two more small tufts, one on the flank and one on top: leafy lobes along the whole silhouette */
    const sb = a + 2 + rnd() * 2;
    leaves.push(blob(rnd, [c[0] + Math.cos(sb) * rad * 0.85, c[1] + rad * (rnd() * 0.3 - 0.1), c[2] + Math.sin(sb) * rad * 0.85], [rad * 0.4, rad * 0.34, rad * 0.4], 0));
    leaves.push(blob(rnd, [c[0] + (rnd() - 0.5) * rad, c[1] + rad * 0.72, c[2] + (rnd() - 0.5) * rad], [rad * 0.38, rad * 0.3, rad * 0.38], 0));
    if (i % 3 === 0) wood.push(limb([x, 0.36, 0], [c[0] * 0.8, c[1] - 0.05, c[2] * 0.8], 0.03, 0.012));
  }
  return { wood: fuse(wood), crown: crownShade(fuse(leaves), [x, 0.68, 0], [0.42, 0.3, 0.42], 0.7) };
};
/* Forest floor litter, one unit tall or long. Tuft: a fan of single-triangle blades, dark at the base. */
export const makeTuft = (seed) => {
  const rnd = rng(seed);
  const pos = []; const col = []; const nor = []; const uv = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.28 + rnd() * 0.7;
    const lean = 0.15 + rnd() * 0.5;
    const hgt = 0.55 + rnd() * 0.45;
    const [cx, cz] = [Math.cos(a), Math.sin(a)];
    pos.push(cx * 0.05 - cz * 0.07, 0, cz * 0.05 + cx * 0.07, cx * 0.05 + cz * 0.07, 0, cz * 0.05 - cx * 0.07, cx * lean, hgt, cz * lean);
    col.push(0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 1, 1, 1);
    nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0); /* lit like the ground they grow from */
    uv.push(0, 0, 1, 0, 0.5, 1);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  return g;
};
/* Shrub, one unit tall: a few thin stems fanning out from the base, each carrying a lumpy mass of leaves.
   `spread` and `squash` tell a low, wide mastic from a taller, narrower broom. */
export const makeShrub = (seed, spread, squash) => {
  const rnd = rng(seed);
  const wood = [];
  const leaves = [];
  const n = 5 + Math.floor(rnd() * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.28 + rnd() * 0.8;
    const rr = i === 0 ? 0.05 : spread * (0.55 + rnd() * 0.45);
    const rad = 0.2 + rnd() * 0.1;
    const c = [Math.cos(a) * rr, 0.78 - rad * squash - rr * 0.45 * rnd(), Math.sin(a) * rr];
    leaves.push(blob(rnd, c, [rad, rad * squash, rad], i < 3 ? 1 : 0));
    wood.push(limb([Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03], [c[0] * 0.9, c[1], c[2] * 0.9], 0.022, 0.009));
  }
  return { wood: fuse(wood), crown: fuse(leaves) };
};
/* Fern: fronds that rise and arch over, each a tapering strip of three quads, dark at the base. */
export const makeFern = (seed) => {
  const rnd = rng(seed);
  const pos = []; const col = []; const nor = []; const uv = [];
  const SEG = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.28 + rnd() * 0.6;
    const len = 0.7 + rnd() * 0.5;
    const rise = 0.55 + rnd() * 0.45;
    const [cx, cz] = [Math.cos(a), Math.sin(a)];
    const at = (t, side) => {
      const wdt = 0.11 * Math.sin(Math.PI * (0.12 + 0.88 * t)) * side; /* widest mid-frond, pointed tip */
      const out = len * t;
      return [cx * out - cz * wdt, rise * Math.sin(t * 2.3) * (1 - 0.25 * t), cz * out + cx * wdt];
    };
    for (let k = 0; k < SEG; k++) {
      const [t0, t1] = [k / SEG, (k + 1) / SEG];
      const quad = [at(t0, -1), at(t0, 1), at(t1, 1), at(t0, -1), at(t1, 1), at(t1, -1)];
      const tone = [t0, t0, t1, t0, t1, t1];
      quad.forEach((v, j) => {
        pos.push(...v);
        const c = lerp(0.35, 1, tone[j]);
        col.push(c, c, c);
        nor.push(0, 1, 0);
        uv.push(j === 1 || j === 2 || j === 4 ? 1 : 0, tone[j]);
      });
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  return g;
};
/* Fallen twig: a thin crooked branch with one fork, lying along x. */
export const makeTwig = () => fuse([
  limb([-0.5, 0.02, 0], [0.05, 0.05, 0.04], 0.03, 0.022),
  limb([0.05, 0.05, 0.04], [0.5, 0.03, -0.05], 0.022, 0.01),
  limb([0.05, 0.05, 0.04], [0.3, 0.07, 0.22], 0.014, 0.006),
]);

/* Scroll timeline (progress 0..1 of the track). Notes 1-5 each own a piece; 6-9 are loose boxes at the end. */
const ASSEMBLE = [0, 0.1]; /* small and centred -> large and pushed right (half off-screen) */
const STEP0 = 0.12; /* note i spans [STEP0 + i*STEP, +STEP): its piece is highlighted */
const STEP = 0.1;
const LEAD = 5; /* notes with a piece: door, door, feeders, battery, main body */
const SHOW_X = 0.8; /* notes 1-5: horizontal centre of the hut, as a fraction of the viewport width */
const JOIN = [0.64, 0.74]; /* the model goes back to the centre and shrinks */
const LATE_START = 0.76; /* notes 6-9 appear one by one and stay */
const LATE_STEP = 0.04;
const FADE = 0.025;
const TILT = 0.087; /* rad: at rest the CAMERA sits below the hut looking up (low angle); it eases to level by the end of ASSEMBLE */
const tiltAt = (p) => TILT * (1 - smooth(0, ASSEMBLE[1], p));
/* Scroll sequence, in viewport heights scrolled: locked on top with the title -> title gone, free rotation for the lead -> path (zoom...) locked. */
const LEAD_VH = 1; /* free-rotation stretch before the path starts (the track is that much taller) */
const TITLE_IN = 0.07; /* at or above this the title is back: locked, camera returns to the initial view, pieces can be opened */
const TITLE_OUT = 0.2; /* from here the title has faded (0.3s) and the rotation is free */
const FREE_END = 0.97; /* path progress where free rotation comes back at the end; in between the camera follows its path */
const RETURN_RATE = 6; /* 1/s: how fast the camera eases back to the path after a free rotation */
const EASE_RATE = 8; /* 1/s: highlight and feeder explosion easing */
const start = (i) => STEP0 + i * STEP;
const lateAt = (j) => LATE_START + j * LATE_STEP;

/* Node name (GLTFLoader sanitises spaces and brackets, so match by prefix) -> material kind. */
const KINDS = [
  ["main_body", "wood"], ["Puerta_1", "wood"], ["Puerta_2", "wood"], ["Palo_pajaro", "wood"],
  ["Comedero_1", "wood"], ["Comedero_2", "wood"], ["Slot_bateria", "plastic"],
  ["Refrentado", "wood"],
];
const kindOf = (o) => {
  for (let n = o; n; n = n.parent) {
    const k = KINDS.find(([name]) => n.name.startsWith(name));
    if (k) return k[1];
  }
  return null;
};
export const token = (name) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? new Color(v) : new Color(); /* no token -> three's neutral default, no loose hex */
};

/* ACES (three's filmic curve) washes the sand haze into a grey-white; find the linear input whose output is the sand token. */
const ACES_IN = [[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]];
const ACES_OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
const acesMul = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const acesMap = (v) => acesMul(ACES_OUT, acesMul(ACES_IN, v.map((x) => x / 0.6)).map((x) => {
  const y = Math.max(x, 0);
  return Math.min(1, Math.max(0, (y * (y + 0.0245786) - 0.000090537) / (y * (0.983729 * y + 0.432951) + 0.238081)));
})).map((x) => Math.min(1, Math.max(0, x)));
/* Inverse of acesMap: fixed-point steps to get close, then damped Newton (finite-difference Jacobian) until exact.
   Never negative, never NaN: bad steps are dropped and the best candidate so far is kept. */
const solve3 = (m, b) => {
  const d = (a, c, e, f, g, h, k, l, n) => a * (g * n - h * l) - c * (f * n - h * k) + e * (f * l - g * k);
  const det = d(m[0][0], m[0][1], m[0][2], m[1][0], m[1][1], m[1][2], m[2][0], m[2][1], m[2][2]);
  if (!Number.isFinite(det) || Math.abs(det) < 1e-18) return null;
  const col = (k) => m.map((r, i) => r.map((v, jx) => (jx === k ? b[i] : v)));
  return [0, 1, 2].map((k) => {
    const c = col(k);
    return d(c[0][0], c[0][1], c[0][2], c[1][0], c[1][1], c[1][2], c[2][0], c[2][1], c[2][2]) / det;
  });
};
/* Only exact for targets inside ACES' reachable gamut (the sand token is). Others are clamped to [0,1] and
   the closest finite, non-negative input is returned (no exact match is possible there). */
export const preAces = (c) => {
  const t = [c.r, c.g, c.b].map((v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0));
  const err = (x) => {
    const o = acesMap(x);
    return o.reduce((a, v, j) => a + (t[j] - v) ** 2, 0);
  };
  let x = t.slice();
  for (let i = 0; i < 20; i++) {
    const o = acesMap(x);
    x = x.map((v, j) => Math.max(0, v + 0.8 * (t[j] - o[j])));
  }
  let e = err(x);
  for (let i = 0; i < 40 && e > 1e-14; i++) {
    const o = acesMap(x);
    const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let k = 0; k < 3; k++) {
      const step = 1e-5;
      const xp = x.slice();
      xp[k] += step;
      const op = acesMap(xp);
      for (let r = 0; r < 3; r++) J[r][k] = (op[r] - o[r]) / step;
    }
    let moved = false;
    for (const lam of [0, 1e-6, 1e-4, 1e-2]) {
      const dx = solve3(J.map((r, ri) => r.map((v, ci) => v + (ri === ci ? lam : 0))), t.map((v, j) => v - o[j]));
      if (!dx) continue;
      const xn = x.map((v, j) => Math.max(0, v + dx[j]));
      const en = err(xn);
      if (Number.isFinite(en) && en < e) { x = xn; e = en; moved = true; break; }
    }
    if (!moved) break;
  }
  return new Color().setRGB(x[0], x[1], x[2]);
};

/* Swaps the file's materials for the pine/plastic ones, box-projects missing UVs and adds the ink outline. Shared with the dev capture view. */
export const dressHut = (model, size, { plastic, woodMat, edgeMat }) => {
  model.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const k = kindOf(o);
    if (k === "plastic" || k === "wood") {
      [].concat(o.material ?? []).forEach((m) => {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      });
      o.material = k === "plastic" ? plastic : woodMat;
    }
    if (k === "wood") {
      const g = o.geometry;
      if (!g.attributes.uv && g.attributes.position) {
        /* no UVs in the file: box-project them by dominant normal, scaled to the model */
        g.computeVertexNormals();
        const P = g.attributes.position;
        const N = g.attributes.normal;
        const uv = new Float32Array(P.count * 2);
        const md = Math.max(size.x, size.y, size.z);
        for (let i = 0; i < P.count; i++) {
          const ax = Math.abs(N.getX(i)); const ay = Math.abs(N.getY(i)); const az = Math.abs(N.getZ(i));
          const [u, v] = ax >= ay && ax >= az ? [P.getZ(i), P.getY(i)] : ay >= az ? [P.getX(i), P.getZ(i)] : [P.getX(i), P.getY(i)];
          uv[i * 2] = u / md;
          uv[i * 2 + 1] = v / md;
        }
        g.setAttribute("uv", new BufferAttribute(uv, 2));
      }
    }
    o.castShadow = true;
    o.receiveShadow = true;
    /* thin dark outline, child of the mesh so it follows the exploded pieces */
    const edges = new LineSegments(new EdgesGeometry(o.geometry, EDGE_ANGLE), edgeMat);
    edges.name = "edges";
    o.add(edges);
  });
};

/* Pine trunk behind the hut and metal brackets with screws. `size` is the model size and `lb` the box of the centred model;
   `barkMat` is the trunk material. Shared with the dev capture view. */
export const buildTrunk = (size, lb, barkMat, edgeMat) => {
  const back = lb.min.z;
  const R = size.x * TRUNK_R;
  const th = size.x * 0.015; /* bracket plate thickness */
  const L = size.y * 14;
  const tile = size.x * 0.7;
  const tg = scaleUv(new CylinderGeometry(R, R, L, 40, 140, false), Math.round((2 * Math.PI * R) / tile), L / tile);
  const TP = tg.attributes.position;
  for (let v = 0; v < TP.count; v++) {
    const x = TP.getX(v); const y = TP.getY(v); const z = TP.getZ(v);
    const a = Math.atan2(x, z);
    const k = y / size.y;
    const n = 0.5 * Math.sin(5 * a + k * 2.1) + 0.3 * Math.sin(9 * a - k * 3.7 + 1) + 0.2 * Math.sin(2 * a + k * 0.9);
    const f = 1 - 0.05 * (1 - (n + 1) / 2); /* only ever slimmer than R: never pokes into the brackets */
    TP.setXYZ(v, x * f + size.x * 0.075 * Math.sin(k / 3), y, z * f);
  }
  tg.computeVertexNormals();
  const trunk = new Mesh(tg, barkMat);
  trunk.name = "trunk";
  trunk.position.z = back - th * 0.5 - R;
  trunk.receiveShadow = true;

  const parts = [];
  const put = (g, x, y, z) => { g.translate(x, y, z); parts.push(g); };
  const bw = size.x * 0.07;
  const hd = size.z * 0.18;
  const sr = size.x * 0.011;
  const sh = size.x * 0.008;
  for (const sy of [1, -1]) {
    const edge = sy > 0 ? lb.max.y : lb.min.y;
    for (const sx of [-1, 1]) {
      const X = sx * size.x * 0.09;
      put(new BoxGeometry(bw, size.y * 0.22, th), X, edge + sy * size.y * 0.06, back - th / 2); /* arm on the trunk */
      put(new BoxGeometry(bw, th, hd + th), X, edge + sy * th / 2, back - th + (hd + th) / 2); /* arm on the hut */
      for (const d of [0.09, 0.145]) {
        const g = new CylinderGeometry(sr, sr, sh, 10);
        g.rotateX(Math.PI / 2);
        put(g, X, edge + sy * size.y * d, back + sh / 2);
      }
      put(new CylinderGeometry(sr, sr, sh, 10), X, edge + sy * (th + sh / 2), back + hd * 0.6);
    }
  }
  const metalMat = new MeshStandardMaterial({ color: token("--paper").lerp(token("--ink"), 0.4), metalness: 1, roughness: 0.38 });
  const brackets = new Mesh(mergeGeometries(parts), metalMat);
  parts.forEach((g) => g.dispose());
  brackets.name = "brackets";
  brackets.castShadow = true;
  brackets.receiveShadow = true;
  brackets.add(new LineSegments(new EdgesGeometry(brackets.geometry, EDGE_ANGLE), edgeMat));
  return { trunk, brackets };
};

/* The scene. `trackRef` is the tall scroll track, `boxRef` the holder that receives the canvas. */
export default function HardwareModel({ trackRef, boxRef, bgRef, reduced, onReady, onError, onDots, onFree, pick = null, parts, onToggle, onPartsReset, onPickable }) {
  const pickRef = useRef(pick);
  const partsRef = useRef(parts);
  const reqRef = useRef(null);
  pickRef.current = pick;
  partsRef.current = parts;
  useEffect(() => {
    reqRef.current?.();
  }, [pick, parts]);
  useEffect(() => {
    const track = trackRef.current;
    const box = boxRef.current;
    const bg = bgRef.current; /* full-stage backdrop: the canvas covers the whole page background */
    /* The canvas is created per effect run: StrictMode mounts twice and a lost context cannot be reused. */
    const canvas = document.createElement("canvas");
    canvas.className = "hardware3d__canvas";
    canvas.setAttribute("aria-hidden", "true");
    let renderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      onError("webgl");
      return undefined;
    }
    bg.prepend(canvas);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    const scene = new Scene();
    const bgScene = new Scene(); /* the forest: rendered apart so it can be blurred and can never cover the model */
    /* Procedural studio environment until the panorama arrives; then the forest itself lights the scene. */
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    let envTarget = pmrem.fromScene(room, 0.04);
    scene.environment = bgScene.environment = envTarget.texture;
    scene.environmentIntensity = 0.6; /* less sky fill: the sun carries the shading */
    bgScene.environmentIntensity = 0.6;
    const sunTone = token("--sun").lerp(token("--ochre"), 0.35).lerp(token("--sand"), 0.08); /* warmer, late-afternoon gold (local: SUN export untouched) */
    const hazeTone = preAces(token("--sand")); /* tone-mapped back to exactly the page ground */
    scene.add(new HemisphereLight(token("--sky-soft"), token("--ochre"), 0.4));
    scene.add(new AmbientLight(token("--paper"), 0.08));
    const key = new DirectionalLight(sunTone, 3.2); /* strong warm sun */
    const keyDir = SUN.clone();
    key.castShadow = true;
    key.shadow.mapSize.set(isNarrow() ? 1024 : 2048, isNarrow() ? 1024 : 2048);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.5;
    scene.add(key);
    scene.add(key.target);
    const fill = new DirectionalLight(token("--paper"), 0.2);
    fill.position.set(3, 1, 2);
    scene.add(fill);
    bgScene.add(new HemisphereLight(token("--sky-soft"), token("--ochre"), 1.1));
    const sun = new DirectionalLight(sunTone, 3.6);
    sun.position.copy(SUN);
    sun.castShadow = true; /* the near trees shade the floor and each other; frustum set in layoutForest */
    sun.shadow.mapSize.set(isNarrow() ? 1024 : 2048, isNarrow() ? 1024 : 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 2;
    bgScene.add(sun.target);
    bgScene.add(sun);
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 40000);
    camera.position.setFromSpherical(new Spherical(CAM_DIST, Math.PI / 2 + (reduced ? 0 : TILT), 0)); /* start below the hut, looking up */
    camera.lookAt(0, 0, 0);

    /* Free rotation: zoom and pan are off so the wheel always scrolls the page; touch keeps vertical page scroll (pan-y). */
    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !reduced;
    controls.rotateSpeed = 0.8;
    canvas.style.touchAction = "pan-y"; /* OrbitControls sets "none", which would trap vertical swipes on mobile */
    controls.touches.TWO = -1; /* two fingers are handled below (pinch only; no rotate/pan from OrbitControls) */
    /* Pinch zoom (two fingers, free view only). The wheel is untouched: it keeps scrolling the page. */
    let pinch = 0;
    const touchDist = (e) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const onTouchStart = (e) => { pinch = e.touches.length === 2 && controls.enabled ? touchDist(e) : 0; };
    const onTouchMove = (e) => {
      if (!pinch || e.touches.length !== 2 || !controls.enabled) return;
      if (e.cancelable) e.preventDefault();
      const d = touchDist(e);
      /* orthographic: camera.zoom scales the view on top of the automatic fit (draw() never writes it) */
      camera.zoom = Math.min(1.3, Math.max(0.7, camera.zoom * (d / Math.max(pinch, 1))));
      camera.updateProjectionMatrix();
      pinch = d;
      request();
    };
    const onTouchEnd = (e) => { if (e.touches.length < 2) pinch = 0; };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: true });
    const home = new Spherical().setFromVector3(camera.position); /* phi follows the scroll: see draw() */
    const cur = new Spherical();
    let free = null;
    let atTop = true; /* title visible: locked, initial view */
    let last = 0;

    const holder = new Group();
    scene.add(holder);
    const size = new Vector3();
    const extent = new Vector3(); /* size with the four pieces fully separated */
    const extBox = new Box3(); /* same, as a box around the model centre (the holder origin) */
    let model = null;
    let feeder = null; /* { items: [{ obj, base, off, box }], open } the only pieces that separate */
    let pieces = []; /* per note 0-4: { mat, base, hi, t } highlight state */
    let w = 1;
    let h = 1; /* backdrop (canvas) size */
    let hb = 1; /* model box height: the model is sized and centred on this area */
    let yC = 0; /* world height of the stage centre: the origin sits at the centre of the model box */
    let yH = 0; /* world height of the forest horizon */
    let layoutForest = () => {}; /* set once the forest exists; called on every resize */
    let doors = []; /* { key, obj, p0, q0, pivot, t } the two flaps, hinged along their top edge */
    let pickMap = new Map(); /* clickable object -> part key */
    let topOn = null;
    let pickOn = null; /* clicks on the pieces only count in the free rotation at the start (always, in the static version) */
    let raf = 0;
    let seedRaf = 0; /* pending slice of the seed placement */
    const seedJobs = []; /* per feeder: { measure(until) -> done, finish() } */
    let dead = false;
    let visible = true;
    const annots = Array.from(track.querySelectorAll("[data-ann]"));
    const leadLine = track.querySelector("[data-lead-line]"); /* decorative leader of notes 1-5 */
    const leadDot = track.querySelector("[data-lead-dot]");
    const lbox = new Box3();
    const lpt = new Vector3();
    const dots = Array.from(track.querySelectorAll("[data-dot]")); /* mobile: one interactive dot per note */
    let dotsOn = null;
    let dotsMask = 0;
    let actPrev = -2;
    const hiColor = token("--sage");

    let scrolledVh = 0; /* viewport heights scrolled into the track (raw, includes the lead) */
    const progress = () => {
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const lead = LEAD_VH * vh;
      const span = r.height - vh - lead;
      scrolledVh = -r.top / vh;
      return span > 0 ? clamp((-r.top - lead) / span) : 0;
    };

    const draw = () => {
      raf = 0;
      if (dead || !model) return;
      const narrow = isNarrow();
      const p = reduced ? 0.12 : progress();
      /* camera: free (drag to rotate) at both ends of the scroll, otherwise eased back onto its path */
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      /* title visible (TITLE_IN) -> locked; rotation frees once it is gone (TITLE_OUT) and locks again when the zoom starts */
      atTop = scrolledVh <= TITLE_IN;
      const isFree = reduced || (scrolledVh >= TITLE_OUT && (p <= 0 || p >= FREE_END));
      if (isFree !== free) {
        free = isFree;
        controls.enabled = free;
        canvas.classList.toggle("hardware3d__canvas--free", free);
        onFree(free);
      }
      /* outside the free view the pinch zoom is dropped: back to 1 (only when it differs) */
      if (!free && camera.zoom !== 1) {
        camera.zoom = 1;
        camera.updateProjectionMatrix();
      }
      const tilt = reduced ? 0 : tiltAt(p);
      home.phi = Math.PI / 2 + tilt;
      let moving = false;
      if (free) {
        moving = controls.update();
      } else {
        cur.setFromVector3(camera.position);
        const dTheta = home.theta - cur.theta;
        const dPhi = home.phi - cur.phi;
        if (Math.abs(dTheta) > 1e-4 || Math.abs(dPhi) > 1e-4) {
          const k = reduced ? 1 : 1 - Math.exp(-RETURN_RATE * dt);
          cur.theta += dTheta * k;
          cur.phi += dPhi * k;
          if (Math.abs(home.theta - cur.theta) < 1e-3 && Math.abs(home.phi - cur.phi) < 1e-3) {
            cur.theta = home.theta;
            cur.phi = home.phi;
          }
          camera.position.setFromSpherical(cur);
          camera.lookAt(0, 0, 0);
          moving = true;
        }
      }
      /* scale and place: small + centred -> large, centre on the right edge (half visible) -> small + centred */
      /* whole hut (feeders exploded) inside the stage: centre at SHOW_X of the width, small margin on the right and top/bottom */
      const fitRight = () => {
        const mx = 0.02 * w;
        const right = Math.max(extBox.max.x, 1e-6);
        const left = Math.max(-extBox.min.x, 1e-6);
        const up = Math.max(extBox.max.y, 1e-6);
        const down = Math.max(-extBox.min.y, 1e-6);
        return Math.min(
          (w * (1 - SHOW_X) - mx) / right,
          (w * SHOW_X - w * 0.36) / left, /* leaves the left 36% to the notes */
          (hb * 0.46) / Math.max(up, down),
        );
      };
      /* phones: centred, so each half of the exploded box must fit in half the width/height (BUG-169) */
      const fitNarrow = () => Math.min(
        (w * 0.45) / Math.max(extBox.max.x, -extBox.min.x, 1e-6),
        (hb * 0.425) / Math.max(extBox.max.y, -extBox.min.y, 1e-6),
      );
      const sMax = narrow ? fitNarrow() : fitRight();
      const sMin = Math.min((w * (narrow ? 0.5 : 0.3)) / size.x, (hb * 0.4) / size.y, sMax);
      const grow = reduced ? 1 : smooth(ASSEMBLE[0], ASSEMBLE[1], p) - smooth(JOIN[0], JOIN[1], p);
      /* reduced motion: centred and sized for the exploded box, so tapping a feeder never pushes it out of frame (BUG-170) */
      const s = reduced ? Math.min((w * (narrow ? 0.9 : 0.6)) / size.x, (hb * 0.9) / size.y, fitNarrow()) : lerp(sMin, sMax, grow);
      holder.scale.setScalar(s);
      holder.position.x = reduced || narrow ? 0 : w * (SHOW_X - 0.5) * grow;
      /* the forest follows the zoom and drifts with the scroll (static version: neither) */
      const fz = reduced ? 1 : lerp(0.96, 1.1, grow);
      forest.scale.setScalar(fz);
      forest.position.y = yC * (1 - fz); /* zoom about the stage centre, so the floor never climbs into the frame */
      forest.rotation.y = reduced ? 0 : (p - 0.5) * 0.1;
      camera.updateMatrixWorld();
      fgDap.value.set(holder.position.x, holder.position.y, holder.position.z, 3.2 / (s * size.x));
      /* active note: by scroll, or the dot the user tapped on mobile */
      let act = -1;
      if (!reduced) {
        for (let i = 0; i < LEAD; i++) if (p >= start(i) && p < start(i) + STEP) act = i;
        if (act < 0) for (let j = 3; j >= 0; j--) if (p >= lateAt(j)) { act = LEAD + j; break; }
      }
      const sel = narrow && pickRef.current !== null ? pickRef.current : act;
      const ek = reduced ? 1 : 1 - Math.exp(-EASE_RATE * dt);
      let animating = false;
      const ease = (v, t) => {
        const d = t - v;
        if (Math.abs(d) < 0.005) return t;
        animating = true;
        return v + d * ek;
      };
      pieces.forEach((pc, i) => {
        pc.hi = reduced ? 0 : ease(pc.hi, sel === i ? 1 : 0);
        pc.mat.color.copy(pc.base).lerp(hiColor, pc.hi);
      });
      /* pieces opened by hand: only while the start is free; once the scroll begins they go back and the path takes over */
      const canPick = reduced || atTop || free; /* also in the free rotation (start and end of the scroll) */
      if (canPick !== pickOn || atTop !== topOn) {
        pickOn = canPick;
        topOn = atTop;
        if (!canPick) canvas.classList.remove("hardware3d__canvas--pick");
        onPickable(canPick, reduced || atTop);
      }
      const ps = partsRef.current;
      if (!canPick && (ps.feeders || ps.doorL || ps.doorR)) onPartsReset();
      const want = (k) => (canPick && ps[k] ? 1 : 0);
      if (feeder) {
        feeder.open = ease(feeder.open, sel === 2 || want("feeders") ? 1 : 0);
        for (const it of feeder.items) it.obj.position.copy(it.base).addScaledVector(it.off, feeder.open);
      }
      for (const d of doors) {
        d.t = ease(d.t, want(d.key));
        d.obj.quaternion.copy(d.q0).multiply(qTmp.setFromAxisAngle(X_AXIS, DOOR_OPEN * d.t));
        /* the hinge barrel stays where it is */
        d.obj.position.copy(d.p0).add(vA.copy(d.pivot).applyQuaternion(d.q0)).sub(vB.copy(d.pivot).applyQuaternion(d.obj.quaternion));
      }
      /* the shadow frustum follows the (scaled) model so the map stays sharp */
      const R = Math.hypot(extent.x, extent.y, extent.z) * s * 0.6;
      key.position.copy(keyDir).multiplyScalar(R * 2);
      const sc = key.shadow.camera;
      sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = R * 0.1; sc.far = R * 4;
      sc.updateProjectionMatrix();
      /* forest first, into its target: clipped at the model plane, so nothing of it can stand in front of the hut */
      camera.near = CAM_DIST;
      camera.updateProjectionMatrix();
      renderer.setRenderTarget(rt);
      renderer.render(bgScene, camera);
      renderer.setRenderTarget(null);
      camera.near = 0.1;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      if (moving || animating) request();
      if (reduced) return;
      let best = -1;
      let bestO = 0;
      annots.forEach((el, i) => {
        let o;
        if (i < LEAD) {
          const t = start(i);
          o = smooth(t, t + FADE, p) * (1 - smooth(t + STEP - FADE, t + STEP, p));
        } else {
          const t = lateAt(i - LEAD);
          o = smooth(t, t + FADE, p);
        }
        if (i < LEAD && o > bestO) { best = i; bestO = o; }
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      });
      /* leader: from the note text to the left edge of its piece, recomputed every frame (zoom, explosion, resize) */
      if (leadLine && leadDot) {
        const objs = pieces[best]?.objs;
        if (narrow || best < 0 || !objs?.length) {
          leadLine.style.opacity = "0";
          leadDot.style.opacity = "0";
        } else {
          lbox.makeEmpty();
          for (const ob of objs) lbox.expandByObject(ob);
          let minX = Infinity;
          let yAt = 0;
          const cy = (lbox.min.y + lbox.max.y) / 2;
          const cz = (lbox.min.z + lbox.max.z) / 2;
          for (const x of [lbox.min.x, lbox.max.x]) {
            for (const y of [lbox.min.y, cy, lbox.max.y]) {
              for (const z of [lbox.min.z, cz, lbox.max.z]) {
                lpt.set(x, y, z).project(camera);
                const sx = ((lpt.x + 1) / 2) * w;
                if (sx < minX) { minX = sx; yAt = ((1 - lpt.y) / 2) * h; }
              }
            }
          }
          const n = annots[best];
          const x1 = n.offsetLeft + n.offsetWidth;
          const y1 = n.offsetTop + n.offsetHeight / 2;
          leadLine.setAttribute("x1", x1.toFixed(1));
          leadLine.setAttribute("y1", y1.toFixed(1));
          leadLine.setAttribute("x2", minX.toFixed(1));
          leadLine.setAttribute("y2", yAt.toFixed(1));
          leadDot.setAttribute("cx", minX.toFixed(1));
          leadDot.setAttribute("cy", yAt.toFixed(1));
          leadLine.style.opacity = bestO.toFixed(3);
          leadDot.style.opacity = bestO.toFixed(3);
        }
      }
      /* mobile: every dot is on screen; the one in sequence gets the green state */
      const from = narrow ? 0 : null;
      const mask = narrow ? (1 << dots.length) - 1 : 0;
      /* a dot about to hide never keeps the focus: park it on the model box first (no scroll jump), then hide */
      if (!narrow && dots.some((d) => d.contains(document.activeElement))) box.focus({ preventScroll: true });
      dots.forEach((d, i) => {
        d.style.opacity = narrow ? "1" : "0";
        d.style.visibility = narrow ? "visible" : "hidden";
        d.classList.toggle("is-active", narrow && i === act);
      });
      if (from !== dotsOn || mask !== dotsMask || act !== actPrev) {
        dotsOn = from;
        dotsMask = mask;
        actPrev = act;
        onDots(from, mask, act);
      }
    };
    const request = () => {
      if (!raf && !dead && model) raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      const r = bg.getBoundingClientRect();
      const rb = box.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      hb = Math.max(1, Math.round(rb.height));
      const shift = rb.top + rb.height / 2 - (r.top + r.height / 2); /* the origin sits at the centre of the model box */
      yC = shift;
      const rw = Math.max(2, Math.round(w * BG_SCALE));
      const rh = Math.max(2, Math.round(h * BG_SCALE));
      rt.setSize(rw, rh);
      blurMat.uniforms.uTexel.value.set(1 / rw, 1 / rh);
      blurMat.uniforms.uDepth.value = (camera.far - CAM_DIST) / Math.max(w, h);
      renderer.setPixelRatio(Math.min(isNarrow() ? 1.5 : 2, window.devicePixelRatio || 1)); /* phones: fewer fragments (BUG-168) */
      renderer.setSize(w, h, false);
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.setViewOffset(w, h, 0, -shift, w, h);
      camera.updateProjectionMatrix();
      layoutForest();
      request();
    };
    const onScroll = () => visible && request();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(bg);
    ro?.observe(box);
    const io = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) request();
        })
      : null;
    io?.observe(track);
    window.addEventListener("resize", resize);
    controls.addEventListener("change", request);
    if (!reduced) window.addEventListener("scroll", onScroll, { passive: true });
    /* Click on a piece (not a drag): feeders explode, doors swing open; a second click puts them back. */
    const ray = new Raycaster();
    const ndc = new Vector2();
    const pickAt = (e) => {
      if (!model || !pickOn) return null;
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
      ray.setFromCamera(ndc, camera);
      /* nearest clickable piece under the pointer: the feeders sit inside the body, so the shell does not block them */
      for (const hit of ray.intersectObject(model, true)) {
        for (let o = hit.object; o && o !== model; o = o.parent) {
          const k = pickMap.get(o);
          if (k) return k;
        }
      }
      return null;
    };
    let press = null;
    let hoverAt = 0;
    const onDown = (e) => {
      press = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = (e) => {
      const d = press;
      press = null;
      if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > CLICK_SLOP || performance.now() - d.t > CLICK_MS) return;
      const k = pickAt(e);
      if (k) onToggle(k);
    };
    const onMove = (e) => {
      if (e.pointerType !== "mouse" || e.buttons || performance.now() - hoverAt < 40) return;
      hoverAt = performance.now();
      canvas.classList.toggle("hardware3d__canvas--pick", !!pickAt(e));
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointermove", onMove);
    /* Lost GPU context (BUG-167): stop drawing and hand over to the accessible text fallback of the page. */
    const onLost = (e) => {
      e.preventDefault();
      if (dead) return;
      dead = true;
      cancelAnimationFrame(raf);
      raf = 0;
      /* dots and part buttons unmount with the model: park the focus first so it does not fall to body */
      const el = document.activeElement;
      if (el && el !== box && track.contains(el)) box.focus({ preventScroll: true });
      onError();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    reqRef.current = request;

    const disposeTree = (root) => {
      const textures = new Set();
      root.traverse((o) => {
        o.geometry?.dispose();
        if (o.isInstancedMesh) o.dispose();
        for (const m of [].concat(o.material ?? [])) {
          for (const v of Object.values(m)) v?.isTexture && textures.add(v);
          m.dispose();
        }
      });
      textures.forEach((t) => t.dispose());
    };


    /* Forest, in three depths of realism and blur:
       far   = an equirectangular photo of a stone-pine wood, seen through a lens that turns with the camera;
       mid   = pines, holm oaks, scrub and mossy rocks built by code and instanced, on a pine-needle floor;
       light = warm sun from the left, broken up by a canopy mask, and haze that thickens with distance.
       The camera is orthographic, so the wood is laid out already in perspective: things shrink and the floor
       climbs towards a horizon as they get further from the model, the same in every direction (free rotation). */
    const texLoader = new TextureLoader();
    const owned = []; /* every texture loaded here, disposed on unmount whether or not a mesh got to use it */
    /* A texture that fails to load would sample black: give it a 1x1 neutral image instead (BUG-217).
       color = --moss token, normal = flat, roughness = white (leaves the material roughness as is). */
    const texFallback = (t, map) => () => {
      if (dead) return;
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      const g = c.getContext("2d");
      if (g) {
        g.fillStyle = map === "color" ? `#${token("--moss").getHexString()}` : map === "normal" ? "rgb(128,128,255)" : "rgb(255,255,255)";
        g.fillRect(0, 0, 1, 1);
        t.image = c;
        t.needsUpdate = true;
      }
      request();
    };
    const tex = (kind, map, rx = 1, ry = 1) => {
      const t = texLoader.load(TEX_URL(kind, map), request, undefined, (err) => texFallback(t, map)(err));
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(rx, ry);
      t.anisotropy = 4;
      if (map === "color") t.colorSpace = SRGBColorSpace;
      owned.push(t);
      return t;
    };
    const pbr = (kind, rx, ry) => ({ map: tex(kind, "color", rx, ry), normalMap: tex(kind, "normal", rx, ry), roughnessMap: tex(kind, "roughness", rx, ry) });
    const fgDap = { value: new Vector4(0, 0, 0, 1) }; /* light mask on the hut and its trunk: moves and scales with them */
    const bgDap = { value: new Vector4(0, 0, 0, 1) }; /* light mask on the forest */
    const X_AXIS = new Vector3(1, 0, 0);
    const qTmp = new Quaternion();
    const vA = new Vector3();
    const vB = new Vector3();

    const quad = new PlaneGeometry(2, 2);
    /* Far background: flat haze (the page beige). The distant wood is real geometry (far pines, see layoutForest) that turns with the camera. */
    bgScene.background = hazeTone;
    /* the photo is kept only as ambient light and reflections (it is never drawn) */
    const panoTex = texLoader.load(PANO_URL, (t) => {
      if (dead) return;
      const env = pmrem.fromEquirectangular(t);
      scene.environment = bgScene.environment = env.texture;
      envTarget.dispose();
      envTarget = env;
      request();
    }, undefined, () => {}); /* no environment photo: the scene keeps its own lights */
    panoTex.wrapS = RepeatWrapping;
    panoTex.wrapT = ClampToEdgeWrapping;
    panoTex.colorSpace = SRGBColorSpace;
    bgScene.fog = new Fog(hazeTone, 1, 2);
    const rt = new WebGLRenderTarget(2, 2, { type: HalfFloatType, depthTexture: new DepthTexture(2, 2) });
    const blurMat = new ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: BLUR_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: rt.texture }, tDepth: { value: rt.depthTexture }, uTexel: { value: new Vector2(1, 1) },
        uBlur: { value: new Vector2(0.7, 3.2) }, uDepth: { value: 1 }, uSun: { value: sunTone },
      },
    });
    const backdrop = new Mesh(quad, blurMat);
    backdrop.frustumCulled = false;
    backdrop.renderOrder = -1;
    scene.add(backdrop);

    const crownMat = dappled(new MeshLambertMaterial({ vertexColors: true, map: foliageTexture(), side: DoubleSide }), bgDap, 0.3, "crown", (sh) => {
      /* frayed outline: where the surface turns away from the camera the noise mask eats into it.
         The same mask opens gaps inside the crown; through them the far side shows, darker, so the foliage has depth.
         A finer copy of the leaf strokes adds grain when the tree is close. */
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
 if (texture2D(map, vMapUv * 1.7).a < 1.0 - smoothstep(0.0, 0.5, abs(normal.z))) discard;
 if (texture2D(map, vMapUv * 0.9 + 0.31).a < 0.37) discard;
 diffuseColor.rgb *= 0.78 + 0.44 * texture2D(map, vMapUv * 3.7 + 0.17).r;
 if (!gl_FrontFacing) diffuseColor.rgb *= 0.5;`,
      );
    });
    /* grass tufts: two-sided blades, darker at the base (vertex colour), tinted per instance */
    const tuftMat = dappled(new MeshLambertMaterial({ vertexColors: true, side: DoubleSide }), bgDap, 0.3, "tuft");
    const barkMaps = pbr("pine-bark"); /* one tile: each geometry carries its own repeat in the UVs */
    const barkTone = token("--bark").lerp(token("--paper"), 0.55);
    const stemMat = dappled(new MeshLambertMaterial({ color: barkTone, map: barkMaps.map }), bgDap, 0.3, "stem");
    const mossTone = { value: token("--holm").lerp(token("--olive"), 0.25) };
    const rockMaps = pbr("mossy-rock", 2, 1);
    const soilTone = { value: token("--olive").lerp(token("--ochre"), 0.2) };
    const leafTone = { value: token("--olive").lerp(token("--ochre"), 0.12) };
    const leafDark = { value: token("--holm") };
    const groundMat = dappled(new MeshStandardMaterial({ ...pbr("pine-needles"), roughness: 1, metalness: 0 }), bgDap, 0.3, "ground", (sh) => {
      /* Forest floor, anchored to the ground UVs so it does not slide when the forest drifts. Four layers, each with its own
         mask built from noise at several scales, so no patch repeats: a bed of pine needles (two rotated copies of the photo
         at unrelated scales hide the tile), bare earth (the bark photo as grain, in soil tones), moss (the mossy-rock photo)
         and fallen leaves (small ellipses, one per cell of two unrelated grids). Damp and dry patches go over it all. */
      sh.uniforms.uMoss = mossTone;
      sh.uniforms.uSoil = soilTone;
      sh.uniforms.uLeaf = leafTone;
      sh.uniforms.uLeafDark = leafDark;
      sh.uniforms.tSoil = { value: barkMaps.map };
      sh.uniforms.tMoss = { value: rockMaps.map };
      /* declared right before main(): the helper uses the noise that the dapple chunk adds further up */
      sh.fragmentShader = sh.fragmentShader.replace("void main() {", `uniform vec3 uMoss;
uniform vec3 uSoil;
uniform vec3 uLeaf;
uniform vec3 uLeafDark;
uniform sampler2D tSoil;
uniform sampler2D tMoss;
float gLeaf(vec2 p, float keep) {
  vec2 i = floor(p);
  vec2 f = fract(p) - 0.5 + (vec2(dapH(i + 7.3), dapH(i + 3.1)) - 0.5) * 0.4;
  float h = dapH(i);
  float a = h * 6.2832;
  vec2 r = vec2(cos(a) * f.x + sin(a) * f.y, cos(a) * f.y - sin(a) * f.x) / vec2(0.34, 0.15);
  float soft = clamp(fwidth(p.x) + fwidth(p.y), 0.0, 1.0); /* far away the leaves melt into the floor instead of flickering */
  return (1.0 - smoothstep(0.75, 1.0, length(r))) * step(keep, dapH(i + 1.9)) * (1.0 - smoothstep(0.25, 0.7, soft));
}
void main() {`).replace(
        "#include <map_fragment>",
        `#include <map_fragment>
 vec2 gu = vMapUv;
 mat2 gr = mat2(0.8, -0.6, 0.6, 0.8);
 float gBig = dapN(gu * 0.11 + 3.7) * 0.55 + dapN(gu * 0.31 + 1.3) * 0.3 + dapN(gu * 0.9) * 0.15;
 float gMid = dapN(gu * 0.23 + 11.3) * 0.5 + dapN(gu * 0.71 + 2.0) * 0.32 + dapN(gu * 2.1) * 0.18;
 float gFine = dapN(gu * 7.0) * 0.6 + dapN(gu * 19.0) * 0.4;
 vec3 gCol = mix(diffuseColor.rgb, texture2D(map, gr * gu * 0.37 + 0.43).rgb, 0.2 + 0.5 * dapN(gu * 0.19 + 5.0));
 gCol = mix(uMoss, uSoil, 0.5) * (0.45 + 1.7 * dot(gCol, vec3(0.333))); /* tint the needle photo green: the brown is gone */
 vec3 gSoilTex = texture2D(tSoil, gr * gu * 0.53 + 0.21).rgb;
 vec3 gSoil = uSoil * (0.5 + 1.5 * dot(gSoilTex, vec3(0.333))) * mix(0.8, 1.15, dapN(gu * 3.3 + 9.0));
 float gSoilK = smoothstep(0.47, 0.6, gBig + (gFine - 0.5) * 0.2);
 gCol = mix(gCol, gSoil, gSoilK * 0.95); /* light, yellowish grass */
 vec3 gMossTex = texture2D(tMoss, gu * 0.61 + 0.17).rgb;
 vec3 gMoss = mix(gMossTex, uMoss * (0.45 + 1.7 * dot(gMossTex, vec3(0.333))), 0.7);
 float gMossK = smoothstep(0.52, 0.64, gMid + (gFine - 0.5) * 0.24);
 gCol = mix(gCol, gMoss, gMossK * 0.85);
 float gDrift = smoothstep(0.3, 0.7, dapN(gu * 0.27 + 21.0) * 0.6 + dapN(gu * 1.3 + 4.0) * 0.4); /* leaves gather in drifts */
 float gL1 = gLeaf(gu * 9.0, mix(0.8, 0.35, gDrift));
 float gL2 = gLeaf(gr * gu * 14.3 + 3.3, mix(0.9, 0.5, gDrift));
 vec3 gLeafCol = mix(uLeafDark, uLeaf, dapH(floor(gu * 9.0) + floor(gr * gu * 14.3 + 3.3))) * (0.75 + 0.5 * gFine);
 gCol = mix(gCol, gLeafCol, max(gL1, gL2) * (1.0 - 0.6 * gMossK) * 0.25);
 gCol *= mix(0.7, 1.14, dapN(gu * 0.33 + 3.7) * 0.6 + dapN(gu * 1.02) * 0.4) * mix(0.88, 1.1, gFine);
 diffuseColor.rgb = gCol;`,
      );
    });
    const rockMat = dappled(new MeshStandardMaterial({ ...rockMaps, roughness: 1, metalness: 0 }), bgDap, 0.3, "std");

    const { PINES, OAKS, BUSHES, SHRUBS, FERNS, ROCKS, TUFTS, CONES, TWIGS } = isNarrow() ? FOREST_NARROW : FOREST_DESKTOP;
    const forest = new Group();
    bgScene.add(forest);
    const NV = (RINGS + 1) * (SECTORS + 1);
    const groundGeo = new BufferGeometry();
    groundGeo.setAttribute("position", new BufferAttribute(new Float32Array(NV * 3), 3));
    groundGeo.setAttribute("uv", new BufferAttribute(new Float32Array(NV * 2), 2));
    const gi = [];
    for (let j = 0; j < RINGS; j++) {
      for (let i = 0; i < SECTORS; i++) {
        const a = j * (SECTORS + 1) + i;
        const b = a + SECTORS + 1;
        gi.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    groundGeo.setIndex(gi);
    const ground = new Mesh(groundGeo, groundMat);
    ground.frustumCulled = false;
    forest.add(ground);
    const inst = (geo, mat, n) => {
      const m = new InstancedMesh(geo, mat, n);
      m.frustumCulled = false; /* the matrices are rewritten on resize; skip stale bounding spheres */
      forest.add(m);
      return m;
    };
    const pines = [11, 23].map((seed) => {
      const g = makePine(seed);
      return { wood: inst(g.wood, stemMat, PINES), crown: inst(g.crown, crownMat, PINES), seed };
    });
    const FAR = isNarrow() ? FAR_NARROW : FAR_DESKTOP;
    const farPines = pines.map(({ wood, crown }) => ({ wood: inst(wood.geometry, stemMat, FAR), crown: inst(crown.geometry, crownMat, FAR) }));
    const oaks = [37, 53].map((seed) => {
      const g = makeOak(seed);
      return { wood: inst(g.wood, stemMat, OAKS), crown: inst(g.crown, crownMat, OAKS + BUSHES), seed }; /* scrub reuses the oak crown */
    });
    const rocks = inst(blob(rng(5), [0, 0, 0], [1, 0.6, 0.85], 2, false), rockMat, ROCKS);
    const tufts = inst(makeTuft(61), tuftMat, TUFTS);
    const cones = inst(blob(rng(9), [0, 0, 0], [0.34, 0.5, 0.34], 0, false), stemMat, CONES);
    const twigs = inst(makeTwig(), stemMat, TWIGS);
    const shrubs = [[83, 0.42, 0.7], [97, 0.26, 1.05]].map(([seed, spread, squash]) => {
      const g = makeShrub(seed, spread, squash);
      return { wood: inst(g.wood, stemMat, SHRUBS), crown: inst(g.crown, crownMat, SHRUBS), seed };
    });
    const ferns = inst(makeFern(89), tuftMat, FERNS);
    ground.receiveShadow = true;
    for (const { wood, crown } of [...pines, ...oaks]) {
      for (const m of [wood, crown]) { m.castShadow = true; m.receiveShadow = true; }
    }
    rocks.castShadow = rocks.receiveShadow = true;
    /* Real foliage colours: olive needles for the pines, darker grey-green for the holm oaks, drier scrub. */
    const olive = token("--olive");
    const holm = token("--holm");
    const ochre = token("--ochre");
    const slate = token("--slate");
    const tint = new Color();
    pines.forEach(({ wood, crown, seed }) => {
      const rnd = rng(seed + 1);
      for (let t = 0; t < PINES; t++) {
        crown.setColorAt(t, tint.copy(olive).lerp(holm, rnd() * 0.6).multiplyScalar(0.85 + rnd() * 0.4));
        wood.setColorAt(t, tint.setScalar(0.85 + rnd() * 0.3));
      }
    });
    oaks.forEach(({ wood, crown, seed }) => {
      const rnd = rng(seed + 1);
      for (let t = 0; t < OAKS + BUSHES; t++) {
        if (t < OAKS) {
          crown.setColorAt(t, tint.copy(holm).lerp(olive, rnd() * 0.35).multiplyScalar(0.8 + rnd() * 0.4));
          wood.setColorAt(t, tint.copy(slate).multiplyScalar(1.2 + rnd() * 0.5));
        } else {
          crown.setColorAt(t, tint.copy(olive).lerp(ochre, rnd() * 0.35).multiplyScalar(0.8 + rnd() * 0.45));
        }
      }
    });
    {
      const rnd = rng(71);
      for (let t = 0; t < TUFTS; t++) tufts.setColorAt(t, tint.copy(olive).lerp(ochre, rnd() * 0.7).multiplyScalar(0.8 + rnd() * 0.5));
      for (let t = 0; t < CONES; t++) cones.setColorAt(t, tint.setScalar(0.6 + rnd() * 0.3));
      for (let t = 0; t < TWIGS; t++) twigs.setColorAt(t, tint.copy(slate).multiplyScalar(1.1 + rnd() * 0.6));
      for (let t = 0; t < FERNS; t++) ferns.setColorAt(t, tint.copy(olive).lerp(holm, rnd() * 0.5).multiplyScalar(0.9 + rnd() * 0.5));
      shrubs.forEach(({ wood, crown }, v) => {
        for (let t = 0; t < SHRUBS; t++) {
          /* the low one dark and glossy green, the tall one drier */
          crown.setColorAt(t, tint.copy(v ? olive : holm).lerp(v ? ochre : olive, rnd() * 0.45).multiplyScalar(0.8 + rnd() * 0.45));
          wood.setColorAt(t, tint.copy(slate).multiplyScalar(1 + rnd() * 0.5));
        }
      });
    }
    farPines.forEach(({ wood, crown }, v) => {
      const rnd = rng(500 + v);
      for (let t = 0; t < FAR; t++) {
        crown.setColorAt(t, tint.copy(olive).lerp(holm, rnd() * 0.6).multiplyScalar(0.95 + rnd() * 0.4));
        wood.setColorAt(t, tint.setScalar(0.85 + rnd() * 0.3));
      }
    });
    const dummy2 = new Object3D();
    layoutForest = () => {
      const U = Math.max(w, h);
      const T = Math.min(h, U * 0.62); /* tree scale: follows the stage height, bounded on tall phones */
      const D = 0.9 * U; /* distance at which things look half as big */
      const y0 = yC - 1.36 * h; /* canopy-height view: the whole floor lies below the stage... */
      yH = yC - 0.62 * h; /* ...its horizon too, well under the bottom edge, so no ground is ever seen */
      const q = (r) => 1 / (1 + r / D);
      const floorAt = (x, z) => {
        const k = q(Math.hypot(x, z));
        const bumps = Math.sin((x / U) * 7.3 + 1) * Math.cos((z / U) * 5.1) + 0.5 * Math.sin(((x + z) / U) * 13.7)
          + 0.22 * Math.sin((x / U) * 19 + 2) * Math.cos((z / U) * 17 + 0.5); /* smaller hummocks on top of the rolling floor */
        return yH - (yH - y0) * k + 0.018 * h * k * bumps;
      };
      bgScene.fog.near = CAM_DIST + 2 * U; /* light fog: starts close, ends at 40U */
      bgScene.fog.far = CAM_DIST + 40 * U;
      const ss = sun.shadow.camera;
      sun.position.copy(SUN).multiplyScalar(3 * U);
      ss.left = ss.bottom = -2.2 * U; ss.right = ss.top = 2.2 * U; ss.near = 0.2 * U; ss.far = 7 * U;
      ss.updateProjectionMatrix();
      bgDap.value.w = 9 / U;
      const P = groundGeo.attributes.position;
      const V = groundGeo.attributes.uv;
      const tile = 0.35 * T;
      for (let j = 0; j <= RINGS; j++) {
        const r = 10 * U * (j / RINGS) ** 2.2;
        const m = (1 + r / D) / tile; /* needles get smaller with distance, like everything else */
        for (let i = 0; i <= SECTORS; i++) {
          const a = (i / SECTORS) * Math.PI * 2;
          const x = r * Math.cos(a);
          const z = r * Math.sin(a);
          const n = j * (SECTORS + 1) + i;
          P.setXYZ(n, x, floorAt(x, z), z);
          V.setXY(n, x * m, z * m);
        }
      }
      P.needsUpdate = true;
      V.needsUpdate = true;
      groundGeo.computeVertexNormals();
      /* scattered on a ring around the model with a low-discrepancy sequence (angle, distance): every direction of the
         full turn gets the same share of near and far ones, so no side is left bare when the view rotates */
      const put = (meshes, from, n, seed, r0, r1, shape) => {
        const rnd = rng(seed);
        const [oa, or] = [rnd(), rnd()];
        for (let t = 0; t < n; t++) {
          const a = ((t * 0.7548776662 + oa) % 1) * Math.PI * 2;
          const r = U * lerp(r0, r1, (t * 0.569840291 + or) % 1);
          const x = r * Math.cos(a);
          const z = r * Math.sin(a);
          dummy2.rotation.set((rnd() - 0.5) * 0.12, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.12);
          shape(dummy2, rnd, q(r), floorAt(x, z));
          dummy2.position.x = x;
          dummy2.position.z = z;
          dummy2.updateMatrix();
          for (const m of meshes) m.setMatrixAt(from + t, dummy2.matrix);
        }
        for (const m of meshes) m.instanceMatrix.needsUpdate = true;
      };
      for (const { wood, crown, seed } of pines) {
        put([wood, crown], 0, PINES, seed, 0.75, 5.5, (o, rnd, k, y) => {
          const H = 2.6 * T * k * (0.8 + 0.4 * rnd());
          o.position.y = y - H * 0.01;
          o.scale.set(H * (0.85 + 0.3 * rnd()), H, H * (0.85 + 0.3 * rnd()));
        });
      }
      /* far wood: tall pines scattered over a disc behind the model, sized in the stage height so their crowns fill the upper
         part of the view whatever the angle; no shadows (outside the sun frustum) */
      farPines.forEach(({ wood, crown }, v) => {
        const rnd = rng(900 + v);
        const [oa, or] = [rnd(), rnd()];
        for (let t = 0; t < FAR; t++) {
          const a = ((t * 0.7548776662 + oa) % 1) * Math.PI * 2;
          const r = U * (1.1 + 2.6 * Math.sqrt((t * 0.569840291 + or) % 1));
          const H = h * (0.55 + 0.6 * rnd());
          dummy2.rotation.set(0, rnd() * Math.PI * 2, 0);
          dummy2.position.set(r * Math.cos(a), yH - H * 0.01, r * Math.sin(a));
          dummy2.scale.set(H * (0.85 + 0.3 * rnd()), H, H * (0.85 + 0.3 * rnd()));
          dummy2.updateMatrix();
          wood.setMatrixAt(t, dummy2.matrix);
          crown.setMatrixAt(t, dummy2.matrix);
        }
        wood.instanceMatrix.needsUpdate = true;
        crown.instanceMatrix.needsUpdate = true;
      });
      for (const { wood, crown, seed } of oaks) {
        put([wood, crown], 0, OAKS, seed, 0.9, 5, (o, rnd, k, y) => {
          const H = 1.15 * T * k * (0.75 + 0.5 * rnd());
          o.position.y = y - H * 0.01;
          o.scale.set(H * (0.9 + 0.3 * rnd()), H, H * (0.9 + 0.3 * rnd()));
        });
        put([crown], OAKS, BUSHES, seed + 7, 0.6, 4.2, (o, rnd, k, y) => {
          const S = 0.3 * T * k * (0.6 + 0.8 * rnd());
          o.position.y = y - S * 0.32;
          o.scale.set(S * 1.2, S * 0.8, S * 1.2);
        });
      }
      put([rocks], 0, ROCKS, 3, 0.55, 3.4, (o, rnd, k, y) => {
        const S = 0.2 * T * k * (0.5 + rnd());
        o.position.y = y + S * 0.1;
        o.scale.set(S * (0.8 + 0.6 * rnd()), S * (0.6 + 0.5 * rnd()), S);
      });
      put([tufts], 0, TUFTS, 13, 0.5, 3.6, (o, rnd, k, y) => {
        const S = 0.075 * T * k * (0.6 + 0.9 * rnd());
        o.position.y = y - S * 0.05;
        o.scale.set(S * (0.8 + 0.5 * rnd()), S, S * (0.8 + 0.5 * rnd()));
      });
      put([cones], 0, CONES, 17, 0.5, 2.8, (o, rnd, k, y) => {
        const S = 0.05 * T * k * (0.7 + 0.6 * rnd());
        o.rotation.set(1.2 + rnd() * 0.5, rnd() * 6.28, 0); /* lying on their side */
        o.position.y = y + S * 0.25;
        o.scale.setScalar(S);
      });
      shrubs.forEach(({ wood, crown, seed }, v) => {
        put([wood, crown], 0, SHRUBS, seed, 0.55, 4, (o, rnd, k, y) => {
          const S = (v ? 0.5 : 0.36) * T * k * (0.6 + 0.8 * rnd());
          const W = S * (0.9 + 0.5 * rnd());
          o.position.y = y - S * 0.02;
          o.scale.set(W, S, W);
        });
      });
      put([ferns], 0, FERNS, 29, 0.5, 3.4, (o, rnd, k, y) => {
        const S = 0.17 * T * k * (0.6 + 0.8 * rnd());
        o.position.y = y - S * 0.03;
        o.scale.set(S, S * (0.8 + 0.4 * rnd()), S);
      });
      put([twigs], 0, TWIGS, 19, 0.55, 3, (o, rnd, k, y) => {
        const S = 0.42 * T * k * (0.5 + rnd());
        o.position.y = y;
        o.scale.setScalar(S);
      });
      request();
    };
    resize();

    /* Per-piece materials: grey plastic for the battery slot, real pine (PBR) for everything wooden. */
    const plastic = dappled(new MeshStandardMaterial({ color: slate, roughness: 0.85, metalness: 0 }), fgDap, 0.5, "std");
    const woodMat = dappled(new MeshStandardMaterial({ ...pbr("pine", WOOD_REPEAT, WOOD_REPEAT), roughness: 1, metalness: 0 }), fgDap, 0.5, "std");
    const woodMats = [woodMat]; /* + one clone per highlighted piece, so each can tint on its own */
    const edgeMat = new LineBasicMaterial({ color: token("--ink") }); /* --ink is a very dark green, the project has no pure black token */

    const draco = new DracoLite(DRACO_PATH); /* decoder only from public/draco (BUG-147) */
    let failed = false; /* GLTFLoader error and the Draco hook may both fire: notify once */
    const fail = () => {
      if (dead || failed) return;
      failed = true;
      onError();
    };
    draco.onFail = fail;
    new GLTFLoader().setDRACOLoader(draco).load(
      MODEL_URL,
      (gltf) => {
        if (dead) {
          disposeTree(gltf.scene);
          return;
        }
        const bb = new Box3().setFromObject(gltf.scene);
        bb.getSize(size);
        if (!(size.x > 0 && size.y > 0)) {
          disposeTree(gltf.scene);
          onError();
          return;
        }
        model = gltf.scene;
        model.position.sub(bb.getCenter(new Vector3()));
        holder.add(model);
        model.updateMatrixWorld(true);
        dressHut(model, size, { plastic, woodMat, edgeMat });


        /* Pine trunk behind the hut and metal brackets with screws.
           Both are children of the holder, not of the model: they follow zoom and rotation but never explode. */
        const lb = bb.clone().translate(bb.getCenter(new Vector3()).negate()); /* box of the centred model */
        /* the Poly Haven bark is saturated orange: pull part of the colour out, towards the reddish grey of a stone pine */
        const barkMat = dappled(new MeshStandardMaterial({ color: barkTone, ...barkMaps, roughness: 1, metalness: 0 }), fgDap, 0.5, "bark", (sh) => {
          sh.fragmentShader = sh.fragmentShader.replace(
            "#include <map_fragment>",
            "#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), 0.35);",
          );
        });
        const { trunk, brackets } = buildTrunk(size, lb, barkMat, edgeMat);
        holder.add(trunk, brackets);

        /* Of the two doors, the one with the higher box is the top lid. */
        const find = (name) => model.getObjectByName(name);
        const boxOf = (o) => new Box3().setFromObject(o);
        const [d1, d2] = [find("Puerta_1-1"), find("Puerta_2-1")];
        if (!d1 || !d2) {
          holder.remove(model);
          model = null;
          disposeTree(gltf.scene);
          onError();
          return;
        }
        const [top, under] = boxOf(d1).max.y >= boxOf(d2).max.y ? [d1, d2] : [d2, d1];
        let mainBody = null;
        model.traverse((o) => {
          if (!mainBody && o.name.startsWith("main_body")) mainBody = o;
        });
        /* The roof is the two "Refrentado" nodes (thin plate + cover), highlighted together as one lid. */
        const roof = [];
        model.traverse((o) => {
          if (o.name.startsWith("Refrentado")) roof.push(o);
        });
        const feeders = [find("Comedero_1-1"), find("Comedero_2-1")];
        const battery = find("Slot_bateria-1");
        if (!top || !under || !feeders[0] || !feeders[1] || !battery) {
          holder.remove(model);
          model = null;
          disposeTree(gltf.scene);
          onError();
          return;
        }
        /* Simulated feeder mix (sunflower, grains, small seeds), child of each compartment so it follows the explode. */
        const tones = ["--sand", "--linen", "--ink", "--forest", "--ivory"].map(token);
        feeders.forEach((fd, fi) => {
          const rnd = rng(1234 + fi);
          const wb = boxOf(fd);
          const c = wb.getCenter(new Vector3());
          const sz = wb.getSize(new Vector3());
          const inv = fd.matrixWorld.clone().invert();
          const unit = Math.min(sz.x, sz.y, sz.z);
          const m = new Matrix4();
          const col = new Color();
          const dummy = new Object3D();
          /* Inner cavity, measured on the real geometry: one vertical ray per grid cell gives the inner floor and the
             ceiling of that column. Seeds only go in cells whose whole neighbourhood is cavity, above its highest floor,
             so none sinks below the inner bottom or pokes through a wall. */
          const G = 28;
          const NB = 2; /* neighbourhood radius in cells: covers the largest seed plus the jitter inside the cell */
          const maxR = unit * 0.045;
          const eps = sz.y * 1e-3;
          const x0 = c.x - sz.x * 0.5;
          const z0 = c.z - sz.z * 0.5;
          const cellX = sz.x / G;
          const cellZ = sz.z / G;
          const floorY = new Float32Array(G * G);
          const ceilY = new Float32Array(G * G);
          const kind = new Uint8Array(G * G); /* 0 no cavity, 1 open on top, 2 enclosed */
          const probe = new Raycaster();
          const yTop = wb.max.y + sz.y * 0.1;
          const org = new Vector3();
          const dir = new Vector3();
          const pt = new Vector3();
          const delta = new Matrix4();
          const back = new Matrix4();
          let next = 0; /* next cell to probe */
          /* Probes cells until the frame budget runs out (BUG: 2x784 sync raycasts froze phones on load). The feeder may
             already be moving (explode): rays are cast in its current frame and hits brought back to the load frame. */
          const measure = (until) => {
            fd.updateWorldMatrix(true, false);
            delta.multiplyMatrices(fd.matrixWorld, inv);
            back.copy(delta).invert();
            const mats = new Set();
            fd.traverse((o) => {
              if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => mats.add(mt));
            });
            const sides = [...mats].map((mt) => [mt, mt.side]);
            mats.forEach((mt) => { mt.side = DoubleSide; }); /* the ray must also see faces from behind; restored in finally */
            try {
            while (next < G * G) {
              const gx = next % G;
              const gz = (next / G) | 0;
              const k = next++;
              org.set(x0 + (gx + 0.5) * cellX, yTop, z0 + (gz + 0.5) * cellZ).applyMatrix4(delta);
              probe.set(org, dir.set(0, -1, 0).transformDirection(delta));
              const ys = [];
              for (const hit of probe.intersectObject(fd, true)) {
                if (!hit.object.isMesh) continue;
                const y = pt.copy(hit.point).applyMatrix4(back).y;
                if (!ys.length || ys[ys.length - 1] - y > eps) ys.push(y); /* shared edges hit twice: keep one */
              }
              const n = ys.length;
              if (n >= 2 && !(n % 2) && ys[n - 2] - ys[n - 1] <= sz.y * 0.5) { /* else no cavity, or a solid wall */
                floorY[k] = ys[n - 2];
                ceilY[k] = n >= 4 ? ys[n - 3] : wb.max.y;
                kind[k] = n >= 4 ? 2 : 1;
              }
              if (performance.now() > until) break; /* per ray, so one frame never runs a whole row over budget (BUG-171) */
            }
            } finally {
              sides.forEach(([mt, sd]) => { mt.side = sd; }); /* even if a probe throws (BUG-172) */
            }
            return next >= G * G;
          };
          const cellsOf = (min) => {
            const out = [];
            for (let gz = NB; gz < G - NB; gz++) {
              for (let gx = NB; gx < G - NB; gx++) {
                let fl = -Infinity;
                let ce = Infinity;
                let ok = true;
                for (let dz = -NB; ok && dz <= NB; dz++) {
                  for (let dx = -NB; dx <= NB; dx++) {
                    const k = (gz + dz) * G + gx + dx;
                    if (kind[k] < min) { ok = false; break; }
                    fl = Math.max(fl, floorY[k]);
                    ce = Math.min(ce, ceilY[k]);
                  }
                }
                if (ok && ce - fl > maxR * 2.4) out.push({ gx, gz, fl, ce });
              }
            }
            return out;
          };
          /* built only once measured, so an unmount mid-way leaves nothing outside the scene to dispose */
          const finish = () => {
            const mesh = new InstancedMesh(new SphereGeometry(1, 8, 6), new MeshStandardMaterial({ roughness: 0.7, metalness: 0 }), SEEDS_PER_FEEDER);
            mesh.name = "seeds";
            mesh.receiveShadow = true;
            let cells = cellsOf(2); /* prefer the enclosed hopper; an open tray only if there is no such cavity */
            if (cells.length < G) cells = cellsOf(1);
            for (let i = 0; i < SEEDS_PER_FEEDER; i++) {
              const type = rnd(); /* <0.4 sunflower, <0.75 grain, else small round seed */
              const L = unit * (type < 0.4 ? 0.045 : type < 0.75 ? 0.03 : 0.018);
              const sx = type < 0.4 ? L : type < 0.75 ? L * 0.9 : L;
              const sy = type < 0.4 ? L * 0.5 : type < 0.75 ? L * 0.4 : L;
              const sz2 = type < 0.4 ? L * 0.25 : type < 0.75 ? L * 0.4 : L;
              const cell = cells.length ? cells[Math.floor(rnd() * cells.length)] : null;
              const jx = rnd() - 0.5;
              const jy = Math.pow(rnd(), 1.5); /* settled on the inner floor, denser at the bottom */
              const jz = rnd() - 0.5;
              if (cell) {
                dummy.position.set(
                  x0 + (cell.gx + 0.5 + jx) * cellX,
                  cell.fl + maxR * 1.15 + jy * Math.min(sz.y * 0.3, cell.ce - cell.fl - maxR * 2.3),
                  z0 + (cell.gz + 0.5 + jz) * cellZ,
                );
              }
              dummy.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
              if (cell) dummy.scale.set(sx, sy, sz2);
              else dummy.scale.setScalar(0); /* no measurable cavity: better no seed than one outside the feeder */
              dummy.updateMatrix();
              m.multiplyMatrices(inv, dummy.matrix);
              mesh.setMatrixAt(i, m);
              const a = tones[Math.floor(rnd() * tones.length)];
              const b = tones[Math.floor(rnd() * tones.length)];
              col.copy(a).lerp(b, rnd() * 0.6).multiplyScalar(0.8 + rnd() * 0.4);
              mesh.setColorAt(i, col);
            }
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
            fd.add(mesh);
            request();
          };
          seedJobs.push({ measure, finish });
        });
        /* Seeds are placed off the critical path: a few ms of probing per frame, shown when each feeder is done. */
        const runSeeds = () => {
          seedRaf = 0;
          if (dead) return;
          const until = performance.now() + SEED_BUDGET_MS;
          while (seedJobs.length && performance.now() < until) {
            if (seedJobs[0].measure(until)) seedJobs.shift().finish();
          }
          if (seedJobs.length) seedRaf = requestAnimationFrame(runSeeds);
        };
        seedRaf = requestAnimationFrame(runSeeds);

        /* Only the feeders separate, both horizontally: the left one to the left, the right one to the right. */
        const cx = feeders.map((f) => boxOf(f).getCenter(new Vector3()).x);
        const [li, ri] = cx[0] <= cx[1] ? [0, 1] : [1, 0];
        const item = (obj, off) => ({ obj, base: obj.position.clone(), off, box: boxOf(obj) });
        feeder = {
          items: [
            item(feeders[li], new Vector3(-size.x * 0.6, 0, 0)),
            item(feeders[ri], new Vector3(size.x * 0.6, 0, 0)),
          ],
          open: 0,
        };
        const ex = boxOf(model);
        for (const it of feeder.items) ex.union(it.box.clone().translate(it.off));
        ex.getSize(extent);
        extBox.copy(ex);

        /* Doors: each one carries a hinge barrel along its top edge (the highest, front-most part of its geometry),
           so both are flaps that swing up and inwards around that horizontal axis. */
        const byX = [d1, d2].sort((a, b) => boxOf(a).getCenter(vA).x - boxOf(b).getCenter(vB).x);
        doors = byX.map((obj, i) => {
          const gm = obj.isMesh ? obj : obj.children.find((c) => c.isMesh);
          gm.geometry.computeBoundingBox();
          const gb = gm.geometry.boundingBox;
          const pivot = new Vector3(0, gb.max.y - HINGE_R, gb.max.z - HINGE_R).multiply(obj.scale);
          return { key: i ? "doorR" : "doorL", obj, p0: obj.position.clone(), q0: obj.quaternion.clone(), pivot, t: 0 };
        });
        pickMap = new Map([...doors.map((d) => [d.obj, d.key]), ...feeders.map((f) => [f, "feeders"])]);

        /* Highlight state per note piece (doors, feeders, battery, main body); seeds keep their own material. */
        pieces = [roof.length ? roof : [top], [under], feeders, [battery], mainBody ? [mainBody] : []].map((objs, i) => {
          const mat = i === 3 ? plastic : dappled(woodMat.clone(), fgDap, 0.5, "std");
          if (i !== 3) woodMats.push(mat);
          for (const o of objs) {
            o.traverse((m) => {
              /* the main body goes last and leaves alone what another piece already claimed */
              if (m instanceof Mesh && m.name !== "seeds" && !(i === 4 && (m.material === plastic || woodMats.includes(m.material) && m.material !== woodMat))) m.material = mat;
            });
          }
          return { mat, base: mat.color.clone(), hi: 0, objs };
        });
        onReady();
        request();
      },
      undefined,
      fail,
    );

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(seedRaf);
      seedJobs.length = 0;
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      controls.removeEventListener("change", request);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost);
      controls.dispose();
      disposeTree(scene);
      disposeTree(bgScene);
      owned.forEach((t) => t.dispose());
      panoTex.dispose();
      rt.depthTexture?.dispose();
      rt.dispose();
      reqRef.current = null;
      draco.onFail = null;
      draco.dispose();
      woodMat.dispose();
      edgeMat.dispose();
      plastic.dispose();
      scene.environment = bgScene.environment = null;
      envTarget.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [trackRef, boxRef, reduced, onReady, onError, onDots, onToggle, onPartsReset, onPickable]);

  return null;
}

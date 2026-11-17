import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping, AmbientLight, Box3, BufferAttribute, BufferGeometry, ClampToEdgeWrapping, Color, DirectionalLight, DoubleSide, Fog, Group,
  HemisphereLight, InstancedMesh, LineBasicMaterial, LoadingManager, MeshLambertMaterial, MeshStandardMaterial,
  Mesh, Object3D, OrthographicCamera, PCFSoftShadowMap, PlaneGeometry, PMREMGenerator, RepeatWrapping, Scene, ShadowMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3, Vector4, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DracoLite } from "../lib/dracoLite.js";
import {
  DRACO_PATH, FAR_DESKTOP, FOREST_DESKTOP, MODEL_URL, PANO_URL, RINGS, SECTORS, SUN, TEX_URL, WOOD_REPEAT,
  blob, buildTrunk, dappled, dressHut, foliageTexture, makeFern, makeOak, makePine, makeShrub, makeTuft, rng, token,
} from "./HardwareModel.jsx";
import "../model-capture.css";

/* Dev-only tool: the Hardware hut with the same pine, outline, light and shadows. Frames marked `scene` hang it from the
   Hardware trunk with the forest behind (laid out like in Hardware); the others are on a transparent background with only a
   soft contact shadow. Texts are fixed English on purpose: this is not site content. */
const W = 1600;
const H = 1200;
const S = 500; /* hut width in world units, so the shadow biases tuned in Hardware behave the same */
const rad = (d) => (d * Math.PI) / 180;

/* az: degrees around the hut (0 = front, + towards the right side); el: degrees above the horizon;
   fit: "all" frames the whole hut, "top" the upper half, closer. */
const FRAMES = [
  { id: "title", file: "title.webp", az: 32, el: 10, fit: "all", margin: 1.04, fade: 0.5, shows: "Three-quarter view of the whole hut, for under the Garuda title" },
  { id: "01", file: "01.webp", az: 0, el: -5, fit: "all", margin: 2, scene: true, shows: "Hut hanging from the trunk, straight front, forest behind" },
  { id: "02", file: "02.webp", az: 38, el: -5, fit: "all", margin: 2, scene: true, shows: "Hut hanging from the trunk, three-quarter, forest behind" },
  { id: "03", file: "03.webp", az: 90, el: 0, fit: "all", margin: 1.3, shows: "Pure right side profile" },
  { id: "04", file: "04.webp", az: 35, el: 28, fit: "all", margin: 1.3, shows: "Whole hut seen from above, doors and roof" },
  { id: "05", file: "05.webp", az: 18, el: -5, fit: "all", margin: 1.6, explode: true, scene: true, shows: "Hut on the trunk, both feeders pulled apart sideways, forest behind" },
];

const VU = 1430; /* virtual stage width of the forest layout (Hardware: the hut is about 35% of the stage) */
const VH = VU * 0.6; /* virtual stage height */
const load = (onDraco) => new Promise((resolve, reject) => {
  const draco = new DracoLite(DRACO_PATH);
  onDraco(draco);
  draco.onFail = reject;
  new GLTFLoader().setDRACOLoader(draco).load(MODEL_URL, resolve, undefined, reject);
});

export default function ModelCapture() {
  const hostRef = useRef(null);
  const urlsRef = useRef(new Map());
  const apiRef = useRef(null);
  const [status, setStatus] = useState("Loading model...");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false;
    /* each mount owns its canvas, so forceContextLoss() on cleanup never leaves StrictMode's remount with a lost context */
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.className = "model-capture__stage";
    canvas.setAttribute("aria-label", "Preview of the last rendered framing");
    hostRef.current.appendChild(canvas);
    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0); /* transparent: no background, the page or card shows through */
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    const scene = new Scene();
    scene.background = null;
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    let panoEnv = null; /* the forest photo as ambient light and reflections, like in Hardware (frames marked `scene`) */
    scene.environment = env.texture;
    scene.environmentIntensity = 0.6;
    scene.add(new HemisphereLight(token("--sky-soft"), token("--ochre"), 0.4));
    scene.add(new AmbientLight(token("--paper"), 0.08));
    const sunBase = token("--sun");
    const key = new DirectionalLight(sunBase, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.5;
    scene.add(key, key.target);
    const fill = new DirectionalLight(token("--paper"), 0.2);
    fill.position.set(3, 1, 2);
    scene.add(fill);
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 40000);
    const holder = new Group();
    scene.add(holder);
    let modelOk = false;
    let texOk = false;
    const settle = () => { if (!dead && modelOk && texOk) { setStatus("Ready. Each button renders that framing and downloads a WebP."); setReady(true); } };
    const manager = new LoadingManager(() => { texOk = true; settle(); });
    const texLoader = new TextureLoader(manager);
    const owned = [];
    const tex = (map, kind = "pine", rx = WOOD_REPEAT, ry = rx) => {
      const t = texLoader.load(TEX_URL(kind, map));
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(rx, ry);
      t.anisotropy = 4;
      if (map === "color") t.colorSpace = SRGBColorSpace;
      owned.push(t);
      return t;
    };
    const fgDap = { value: new Vector4(0, 0, 0, 3.2 / S) };
    const plastic = dappled(new MeshStandardMaterial({ color: token("--slate"), roughness: 0.85, metalness: 0 }), fgDap, 0.5, "std");
    const woodMat = dappled(new MeshStandardMaterial({ map: tex("color"), normalMap: tex("normal"), roughnessMap: tex("roughness"), roughness: 1, metalness: 0 }), fgDap, 0.5, "std");
    const edgeMat = new LineBasicMaterial({ color: token("--ink") });

    /* ---- Forest of the Hardware scene: same pines, oaks, scrub, rocks, needle floor, sun, haze and layout rules (stage = VU x VH, hut at the origin). ---- */
    const sandTone = token("--sand");
    const sunTone = token("--sun").lerp(token("--ochre"), 0.35).lerp(token("--sand"), 0.08); /* warmer, late-afternoon gold, as in Hardware */
    const bgScene = new Scene();
    bgScene.background = sandTone;
    bgScene.fog = new Fog(sandTone, 1, 2);
    bgScene.environmentIntensity = 0.6;
    bgScene.add(new HemisphereLight(token("--sky-soft"), token("--ochre"), 1.1));
    const sun = new DirectionalLight(sunTone, 3.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 2;
    bgScene.add(sun, sun.target);
    const panoTex = texLoader.load(PANO_URL, (t) => {
      if (dead) return;
      panoEnv = pmrem.fromEquirectangular(t);
    }, undefined, () => {});
    panoTex.wrapS = RepeatWrapping;
    panoTex.wrapT = ClampToEdgeWrapping;
    panoTex.colorSpace = SRGBColorSpace;
    owned.push(panoTex);
    const bgDap = { value: new Vector4(0, 0, 0, 9 / VU) };
    const pbr = (kind, rx, ry) => ({ map: tex("color", kind, rx, ry), normalMap: tex("normal", kind, rx, ry), roughnessMap: tex("roughness", kind, rx, ry) });
    const crownMat = dappled(new MeshLambertMaterial({ vertexColors: true, map: foliageTexture(), side: DoubleSide }), bgDap, 0.3, "crown", (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
 if (texture2D(map, vMapUv * 1.7).a < 1.0 - smoothstep(0.0, 0.5, abs(normal.z))) discard;
 if (texture2D(map, vMapUv * 0.9 + 0.31).a < 0.37) discard;
 diffuseColor.rgb *= 0.78 + 0.44 * texture2D(map, vMapUv * 3.7 + 0.17).r;
 if (!gl_FrontFacing) diffuseColor.rgb *= 0.5;`,
      );
    });
    owned.push(crownMat.map);
    const tuftMat = dappled(new MeshLambertMaterial({ vertexColors: true, side: DoubleSide }), bgDap, 0.3, "tuft");
    const barkMaps = pbr("pine-bark", 1, 1);
    const barkTone = token("--bark").lerp(token("--paper"), 0.55);
    const stemMat = dappled(new MeshLambertMaterial({ color: barkTone, map: barkMaps.map }), bgDap, 0.3, "stem");
    const rockMat = dappled(new MeshStandardMaterial({ ...pbr("mossy-rock", 2, 1), roughness: 1, metalness: 0 }), bgDap, 0.3, "std");
    /* floor: the pine-needle photo tinted green (Hardware adds moss, soil and leaf patches on top; here the floor is only a sliver) */
    const groundMat = dappled(new MeshStandardMaterial({ ...pbr("pine-needles", 1, 1), color: token("--holm").lerp(token("--olive"), 0.25).multiplyScalar(2.2), roughness: 1, metalness: 0 }), bgDap, 0.3, "ground");
    const barkMat = dappled(new MeshStandardMaterial({ color: barkTone, ...barkMaps, roughness: 1, metalness: 0 }), fgDap, 0.5, "bark", (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <map_fragment>",
        "#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), 0.35);",
      );
    });
    const { PINES, OAKS, BUSHES, SHRUBS, FERNS, ROCKS, TUFTS } = FOREST_DESKTOP;
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
    const floor = new Mesh(groundGeo, groundMat);
    floor.frustumCulled = false;
    floor.receiveShadow = true;
    forest.add(floor);
    const inst = (geo, mat, n) => {
      const m = new InstancedMesh(geo, mat, n);
      m.frustumCulled = false;
      forest.add(m);
      return m;
    };
    const pines = [11, 23].map((seed) => {
      const g = makePine(seed);
      return { wood: inst(g.wood, stemMat, PINES), crown: inst(g.crown, crownMat, PINES), seed };
    });
    const farPines = pines.map(({ wood, crown }) => ({ wood: inst(wood.geometry, stemMat, FAR_DESKTOP), crown: inst(crown.geometry, crownMat, FAR_DESKTOP) }));
    const oaks = [37, 53].map((seed) => {
      const g = makeOak(seed);
      return { wood: inst(g.wood, stemMat, OAKS), crown: inst(g.crown, crownMat, OAKS + BUSHES), seed };
    });
    const rocks = inst(blob(rng(5), [0, 0, 0], [1, 0.6, 0.85], 2, false), rockMat, ROCKS);
    const tufts = inst(makeTuft(61), tuftMat, TUFTS);
    const shrubs = [[83, 0.42, 0.7], [97, 0.26, 1.05]].map(([seed, spread, squash]) => {
      const g = makeShrub(seed, spread, squash);
      return { wood: inst(g.wood, stemMat, SHRUBS), crown: inst(g.crown, crownMat, SHRUBS), seed };
    });
    const ferns = inst(makeFern(89), tuftMat, FERNS);
    for (const { wood, crown } of [...pines, ...oaks]) {
      for (const m of [wood, crown]) { m.castShadow = true; m.receiveShadow = true; }
    }
    rocks.castShadow = rocks.receiveShadow = true;
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
      for (let t = 0; t < FERNS; t++) ferns.setColorAt(t, tint.copy(olive).lerp(holm, rnd() * 0.5).multiplyScalar(0.9 + rnd() * 0.5));
      shrubs.forEach(({ wood, crown }, v) => {
        for (let t = 0; t < SHRUBS; t++) {
          crown.setColorAt(t, tint.copy(v ? olive : holm).lerp(v ? ochre : olive, rnd() * 0.45).multiplyScalar(0.8 + rnd() * 0.45));
          wood.setColorAt(t, tint.copy(slate).multiplyScalar(1 + rnd() * 0.5));
        }
      });
    }
    farPines.forEach(({ wood, crown }, v) => {
      const rnd = rng(500 + v);
      for (let t = 0; t < FAR_DESKTOP; t++) {
        crown.setColorAt(t, tint.copy(olive).lerp(holm, rnd() * 0.6).multiplyScalar(0.95 + rnd() * 0.4));
        wood.setColorAt(t, tint.setScalar(0.85 + rnd() * 0.3));
      }
    });
    /* Same layout rules as Hardware's layoutForest (yC = 0: the stage centre is the hut). */
    const layoutForest = () => {
      const lerp = (a, b, t) => a + (b - a) * t;
      const U = VU;
      const h = VH;
      const T = Math.min(h, U * 0.62);
      const D = 0.9 * U;
      const y0 = -1.36 * h;
      const yH = -0.62 * h;
      const q = (r) => 1 / (1 + r / D);
      const floorAt = (x, z) => {
        const k = q(Math.hypot(x, z));
        const bumps = Math.sin((x / U) * 7.3 + 1) * Math.cos((z / U) * 5.1) + 0.5 * Math.sin(((x + z) / U) * 13.7)
          + 0.22 * Math.sin((x / U) * 19 + 2) * Math.cos((z / U) * 17 + 0.5);
        return yH - (yH - y0) * k + 0.018 * h * k * bumps;
      };
      const ss = sun.shadow.camera;
      sun.position.copy(SUN).multiplyScalar(3 * U);
      ss.left = ss.bottom = -2.2 * U; ss.right = ss.top = 2.2 * U; ss.near = 0.2 * U; ss.far = 7 * U;
      ss.updateProjectionMatrix();
      const P = groundGeo.attributes.position;
      const V = groundGeo.attributes.uv;
      const tile = 0.35 * T;
      for (let j = 0; j <= RINGS; j++) {
        const r = 10 * U * (j / RINGS) ** 2.2;
        const m = (1 + r / D) / tile;
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
      const dummy2 = new Object3D();
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
          const H0 = 2.6 * T * k * (0.8 + 0.4 * rnd());
          o.position.y = y - H0 * 0.01;
          o.scale.set(H0 * (0.85 + 0.3 * rnd()), H0, H0 * (0.85 + 0.3 * rnd()));
        });
      }
      farPines.forEach(({ wood, crown }, v) => {
        const rnd = rng(900 + v);
        const [oa, or] = [rnd(), rnd()];
        for (let t = 0; t < FAR_DESKTOP; t++) {
          const a = ((t * 0.7548776662 + oa) % 1) * Math.PI * 2;
          const r = U * (1.1 + 2.6 * Math.sqrt((t * 0.569840291 + or) % 1));
          const H0 = h * (0.55 + 0.6 * rnd());
          dummy2.rotation.set(0, rnd() * Math.PI * 2, 0);
          dummy2.position.set(r * Math.cos(a), yH - H0 * 0.01, r * Math.sin(a));
          dummy2.scale.set(H0 * (0.85 + 0.3 * rnd()), H0, H0 * (0.85 + 0.3 * rnd()));
          dummy2.updateMatrix();
          wood.setMatrixAt(t, dummy2.matrix);
          crown.setMatrixAt(t, dummy2.matrix);
        }
        wood.instanceMatrix.needsUpdate = true;
        crown.instanceMatrix.needsUpdate = true;
      });
      for (const { wood, crown, seed } of oaks) {
        put([wood, crown], 0, OAKS, seed, 0.9, 5, (o, rnd, k, y) => {
          const H0 = 1.15 * T * k * (0.75 + 0.5 * rnd());
          o.position.y = y - H0 * 0.01;
          o.scale.set(H0 * (0.9 + 0.3 * rnd()), H0, H0 * (0.9 + 0.3 * rnd()));
        });
        put([crown], OAKS, BUSHES, seed + 7, 0.6, 4.2, (o, rnd, k, y) => {
          const S0 = 0.3 * T * k * (0.6 + 0.8 * rnd());
          o.position.y = y - S0 * 0.32;
          o.scale.set(S0 * 1.2, S0 * 0.8, S0 * 1.2);
        });
      }
      put([rocks], 0, ROCKS, 3, 0.55, 3.4, (o, rnd, k, y) => {
        const S0 = 0.2 * T * k * (0.5 + rnd());
        o.position.y = y + S0 * 0.1;
        o.scale.set(S0 * (0.8 + 0.6 * rnd()), S0 * (0.6 + 0.5 * rnd()), S0);
      });
      put([tufts], 0, TUFTS, 13, 0.5, 3.6, (o, rnd, k, y) => {
        const S0 = 0.075 * T * k * (0.6 + 0.9 * rnd());
        o.position.y = y - S0 * 0.05;
        o.scale.set(S0 * (0.8 + 0.5 * rnd()), S0, S0 * (0.8 + 0.5 * rnd()));
      });
      shrubs.forEach(({ wood, crown, seed }, v) => {
        put([wood, crown], 0, SHRUBS, seed, 0.55, 4, (o, rnd, k, y) => {
          const S0 = (v ? 0.5 : 0.36) * T * k * (0.6 + 0.8 * rnd());
          const W0 = S0 * (0.9 + 0.5 * rnd());
          o.position.y = y - S0 * 0.02;
          o.scale.set(W0, S0, W0);
        });
      });
      put([ferns], 0, FERNS, 29, 0.5, 3.4, (o, rnd, k, y) => {
        const S0 = 0.17 * T * k * (0.6 + 0.8 * rnd());
        o.position.y = y - S0 * 0.03;
        o.scale.set(S0, S0 * (0.8 + 0.4 * rnd()), S0);
      });
    };
    layoutForest();
    let hanging = null; /* { trunk, brackets }: only drawn in the frames marked `scene` */

    const tmp = new Vector3();
    const frame = (f, box) => {
      const c = box.getCenter(new Vector3());
      const d = Math.hypot(...box.getSize(tmp).toArray()) * 4;
      const a = rad(f.az);
      const e = rad(f.el);
      camera.position.set(c.x + d * Math.sin(a) * Math.cos(e), c.y + d * Math.sin(e), c.z + d * Math.cos(a) * Math.cos(e));
      camera.lookAt(c);
      camera.near = d * 0.1;
      camera.far = d * 3;
      camera.updateMatrixWorld(true);
      let region = box;
      if (f.fit === "top") {
        region = box.clone();
        region.min.y = box.max.y - (box.max.y - box.min.y) * 0.45;
      }
      let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
      for (const x of [region.min.x, region.max.x]) {
        for (const y of [region.min.y, region.max.y]) {
          for (const z of [region.min.z, region.max.z]) {
            tmp.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
            x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y);
          }
        }
      }
      const hw = Math.max(((x1 - x0) / 2), ((y1 - y0) / 2) * (W / H)) * f.margin;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      camera.left = cx - hw; camera.right = cx + hw;
      camera.top = cy + hw * (H / W); camera.bottom = cy - hw * (H / W);
      camera.updateProjectionMatrix();
    };

    let loaded = null;
    let exploded = null; /* { box, items: [{ obj, base, off }] }: the Hardware explosion (feeders 0.6 hut widths left and right) */
    let draco = null;
    let groundRef = null;
    const fadeU = { value: new Vector2(1, 1) };
    const fadeBase = new Vector2(1, 1);
    load((d) => { draco = d; }).then((gltf) => {
      if (dead) {
        gltf.scene.traverse((o) => {
          o.geometry?.dispose();
          [].concat(o.material ?? []).forEach((m) => m.dispose());
        });
        return;
      }
      const model = gltf.scene;
      const bb = new Box3().setFromObject(model);
      const size = bb.getSize(new Vector3());
      model.position.sub(bb.getCenter(new Vector3()));
      holder.add(model);
      holder.scale.setScalar(S / size.x);
      holder.updateMatrixWorld(true);
      dressHut(model, size, { plastic, woodMat, edgeMat });
      const box = new Box3().setFromObject(holder);
      const R = box.getSize(new Vector3()).length() * 0.7;
      key.position.copy(SUN).multiplyScalar(R * 2);
      const sc = key.shadow.camera;
      sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = R * 0.1; sc.far = R * 4;
      sc.updateProjectionMatrix();
      loaded = box;
      /* shadow catcher: draws only the soft shadow, everything else stays alpha 0 */
      const shadowMat = new ShadowMaterial({ color: token("--ink"), opacity: 0.3 });
      /* the shadow fades to zero (radial falloff in the plane) well before the frame edge, so it is never cut */
      const bs = box.getSize(new Vector3());
      fadeU.value.set(bs.x * 0.85, bs.z * 0.85 + bs.x * 0.2);
      fadeBase.copy(fadeU.value);
      shadowMat.onBeforeCompile = (sh) => {
        const vs = sh.vertexShader;
        const fs = sh.fragmentShader;
        sh.uniforms.fadeRadius = fadeU;
        const vs2 = vs.replace("void main() {", "varying vec2 vPlane;\nvoid main() {\n  vPlane = position.xy;");
        const fs1 = fs.replace("void main() {", "uniform vec2 fadeRadius;\nvarying vec2 vPlane;\nvoid main() {");
        const fs2 = fs1.replace("opacity * ( 1.0 - getShadowMask() )", "opacity * ( 1.0 - getShadowMask() ) * ( 1.0 - smoothstep( 0.25, 1.0, length( vPlane / fadeRadius ) ) )");
        if (vs2 === vs) console.warn("[ModelCapture] ShadowMaterial: the vertex shader replace had no effect (three chunk changed?). The shadow may be clipped.");
        if (fs1 === fs) console.warn("[ModelCapture] ShadowMaterial: the fragment 'void main' replace had no effect (three chunk changed?). The shadow may be clipped.");
        if (fs2 === fs1) console.warn("[ModelCapture] ShadowMaterial: the opacity replace had no effect (three chunk changed?). The shadow may be clipped.");
        sh.vertexShader = vs2;
        sh.fragmentShader = fs2;
      };
      const ground = new Mesh(new PlaneGeometry(R * 6, R * 6), shadowMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set((box.min.x + box.max.x) / 2, box.min.y - 0.5, (box.min.z + box.max.z) / 2);
      ground.receiveShadow = true;
      scene.add(ground);
      groundRef = ground;
      const fd = ["Comedero_1-1", "Comedero_2-1"].map((n) => model.getObjectByName(n));
      if (fd[0] && fd[1]) {
        const cx = fd.map((f) => new Box3().setFromObject(f).getCenter(new Vector3()).x);
        const [li, ri] = cx[0] <= cx[1] ? [0, 1] : [1, 0];
        const items = [[fd[li], -1], [fd[ri], 1]].map(([obj, k]) => ({ obj, base: obj.position.clone(), off: new Vector3(k * size.x * 0.6, 0, 0) }));
        const push = (t) => { items.forEach((it) => it.obj.position.copy(it.base).addScaledVector(it.off, t)); holder.updateMatrixWorld(true); };
        push(1);
        const eb = new Box3().setFromObject(holder);
        push(0);
        exploded = { box: eb, push };
      }
      /* trunk and brackets are added last: the framing boxes above must not include the 14-hut-high trunk */
      const lb = bb.clone().translate(bb.getCenter(new Vector3()).negate());
      hanging = buildTrunk(size, lb, barkMat, edgeMat);
      hanging.trunk.visible = hanging.brackets.visible = false;
      holder.add(hanging.trunk, hanging.brackets);
      modelOk = true;
      settle();
    }).catch(() => !dead && setStatus("Could not load the model."));

    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const ctx = out.getContext("2d");
    const capture = (f) => new Promise((resolve) => {
      const ex = f.explode && exploded;
      const sc = !!f.scene && !!hanging;
      ex?.push(1);
      fadeU.value.copy(fadeBase).multiplyScalar(f.fade ?? 1); /* tighter shadow falloff for tight framings */
      const target = ex ? ex.box : loaded;
      frame(f, target);
      if (sc) {
        /* forest first with its near plane on the hut plane (nothing of it can stand in front of the hut), then the hut over it */
        const env2 = (panoEnv ?? env).texture;
        scene.environment = env2;
        bgScene.environment = env2;
        key.color.copy(sunTone);
        hanging.trunk.visible = hanging.brackets.visible = true;
        if (groundRef) groundRef.visible = false;
        const dist = camera.position.distanceTo(target.getCenter(new Vector3()));
        bgScene.fog.near = dist + 2 * VU;
        bgScene.fog.far = dist + 40 * VU;
        camera.near = dist;
        camera.far = dist + 14 * VU;
        camera.updateProjectionMatrix();
        renderer.render(bgScene, camera);
        camera.near = dist * 0.1;
        camera.far = dist * 3;
        camera.updateProjectionMatrix();
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(scene, camera);
        renderer.autoClear = true;
        hanging.trunk.visible = hanging.brackets.visible = false;
        if (groundRef) groundRef.visible = true;
        key.color.copy(sunBase);
        scene.environment = env.texture;
      } else {
        renderer.render(scene, camera);
      }
      ctx.clearRect(0, 0, W, H); /* keep alpha: no fill */
      ctx.drawImage(canvas, 0, 0); /* same task as render(): the drawing buffer is still valid */
      ex?.push(0);
      out.toBlob(resolve, "image/webp", 0.92);
    });
    apiRef.current = { capture };

    return () => {
      dead = true;
      apiRef.current = null;
      /* everything below is created in this view (nothing cached or shared with HardwareModel is touched) */
      holder.traverse((o) => {
        o.geometry?.dispose();
        [].concat(o.material ?? []).forEach((m) => m.dispose());
      });
      if (groundRef) { groundRef.geometry.dispose(); groundRef.material.dispose(); }
      bgScene.traverse((o) => {
        o.geometry?.dispose();
        if (o.isInstancedMesh) o.dispose();
        [].concat(o.material ?? []).forEach((m) => m.dispose());
      });
      hanging?.trunk.geometry.dispose();
      hanging?.brackets.geometry.dispose();
      hanging?.brackets.material.dispose();
      barkMat.dispose();
      sun.shadow.map?.dispose();
      panoEnv?.dispose();
      key.shadow.map?.dispose();
      fill.shadow.map?.dispose();
      draco?.dispose();
      env.dispose();
      pmrem.dispose();
      owned.forEach((t) => t.dispose());
      plastic.dispose();
      woodMat.dispose();
      edgeMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url, t) => { clearTimeout(t); URL.revokeObjectURL(url); });
      urls.clear();
    };
  }, []);

  return (
    <section className="model-capture" aria-labelledby="mc-title">
      <h1 id="mc-title" className="model-capture__title">Model capture (development only)</h1>
      <p className="model-capture__status" role="status">{status}</p>
      <div ref={hostRef} />
      <ul className="model-capture__list">
        {FRAMES.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className="model-capture__btn"
              disabled={!ready}
              onClick={async () => {
                const blob = await apiRef.current?.capture?.(f);
                if (!blob || blob.type !== "image/webp") return setStatus("This browser cannot encode WebP (it returned another format). Nothing was downloaded; use a Chromium or Firefox build.");
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = f.file;
                a.click();
                const t = setTimeout(() => { URL.revokeObjectURL(url); urlsRef.current.delete(t); }, 10000);
                urlsRef.current.set(t, url);
                setStatus(`Downloaded ${f.file}.`);
              }}
            >
              Download {f.file}
              <span className="model-capture__desc">{f.shows}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

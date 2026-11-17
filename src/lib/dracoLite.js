import {
  BufferAttribute, BufferGeometry, FileLoader, InterleavedBuffer, InterleavedBufferAttribute,
} from "three";

/*
 * Minimal Draco decoder host for GLTFLoader.
 * three's own DRACOLoader references its bundled decoders with `new URL(..., import.meta.url)`, which makes Vite
 * emit a second copy of them in dist/assets (BUG-147). This class has the same API GLTFLoader uses
 * (preload, decodeDracoFile, dispose) but only ever fetches the decoder from `path` (public/draco/gltf/).
 */
/* SHA-256 of public/draco/gltf/draco_wasm_wrapper.js (SEC-033): update it whenever that file changes. */
const WRAPPER_SHA256 = "8bb2952d2ba7d67e1414f8df819410cb0434a666be53f671fff75f68843d76f6";
/* SHA-256 of public/draco/gltf/draco_decoder.wasm (SEC-042): if the .wasm changes, update this hash. */
const WASM_SHA256 = "a680d927bed9cb864ddbd63521868891af2bfbe755092761b4837487618df8ac";
const INIT_TIMEOUT_MS = 20000; /* wasm never reporting ready (BUG-218) */

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export class DracoLite {
  constructor(path) {
    this.path = path;
    this.pending = null;
    this.url = "";
    this.worker = null;
    this.jobs = {};
    this.nextId = 1;
  }

  setDecoderPath(path) {
    this.path = path;
    return this;
  }

  fetchLib(name, type) {
    return new Promise((resolve, reject) => {
      const l = new FileLoader();
      l.setResponseType(type);
      l.load(this.path + name, resolve, undefined, reject);
    });
  }

  init() {
    if (this.pending) return this.pending;
    this.pending = Promise.all([this.fetchLib("draco_wasm_wrapper.js", "text"), this.fetchLib("draco_decoder.wasm", "arraybuffer")]).then(async ([js, wasm]) => {
      if (this.disposed) throw new Error("DracoLite: disposed");
      if (!globalThis.crypto?.subtle || (await sha256Hex(js)) !== WRAPPER_SHA256) throw new Error("Draco: wrapper integrity check failed");
      if (this.disposed) throw new Error("DracoLite: disposed");
      const wasmHash = await crypto.subtle.digest("SHA-256", wasm);
      if (Array.from(new Uint8Array(wasmHash), (b) => b.toString(16).padStart(2, "0")).join("") !== WASM_SHA256) {
        const err = new Error("Draco: wasm integrity check failed");
        this.fail(err);
        throw err;
      }
      if (this.disposed) throw new Error("DracoLite: disposed");
      const fn = dracoWorker.toString();
      const body = `${js}\n${fn.substring(fn.indexOf("{") + 1, fn.lastIndexOf("}"))}`;
      this.url = URL.createObjectURL(new Blob([body]));
      let worker;
      try {
        worker = new Worker(this.url);
      } catch (err) {
        this.fail(err);
        throw err;
      }
      worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === "ready") {
          clearTimeout(this.readyTimer);
          return;
        }
        if (m.type === "initError") {
          this.fail(new Error(m.error));
          return;
        }
        const job = this.jobs[m.id];
        if (!job) return;
        delete this.jobs[m.id];
        if (m.type === "decode") job.resolve(m.geometry);
        else job.reject(new Error(m.error));
      };
      worker.onerror = (e) => this.fail(new Error(e?.message || "Draco: worker failed"));
      worker.postMessage({ type: "init", decoderConfig: { wasmBinary: wasm } });
      this.worker = worker;
      /* the worker answers "ready" once the wasm is up; no answer in time -> failure */
      this.readyTimer = setTimeout(() => this.fail(new Error("Draco: decoder init timed out")), INIT_TIMEOUT_MS);
    });
    return this.pending;
  }

  /* Rejects every pending decode and makes later calls fail the same way. */
  fail(err) {
    const jobs = this.jobs;
    this.jobs = {};
    clearTimeout(this.readyTimer);
    this.worker?.terminate();
    this.worker = null;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = "";
    this.pending = Promise.reject(err);
    this.pending.catch(() => {});
    for (const id in jobs) jobs[id].reject(err);
  }

  preload() {
    this.init().catch(() => {});
    return this;
  }

  decodeDracoFile(buffer, callback, attributeIDs, attributeTypes, _space, onError) {
    const taskConfig = {
      attributeIDs: attributeIDs || { position: "POSITION", normal: "NORMAL", color: "COLOR", uv: "TEX_COORD" },
      attributeTypes: attributeTypes || { position: "Float32Array", normal: "Float32Array", color: "Float32Array", uv: "Float32Array" },
      useUniqueIDs: !!attributeIDs,
    };
    const result = this.init()
      .then(() => new Promise((resolve, reject) => {
        const id = this.nextId++;
        if (!this.worker) {
          reject(new Error("Draco: decoder unavailable"));
          return;
        }
        this.jobs[id] = { resolve, reject };
        this.worker.postMessage({ type: "decode", id, taskConfig, buffer }, [buffer]);
      }))
      .then((data) => {
        const g = new BufferGeometry();
        if (data.index) g.setIndex(new BufferAttribute(data.index.array, 1));
        for (const { name, array, itemSize, stride } of data.attributes) {
          const attr = itemSize === stride
            ? new BufferAttribute(array, itemSize)
            : new InterleavedBufferAttribute(new InterleavedBuffer(array, stride), itemSize, 0);
          if (name === "color") attr.normalized = !(array instanceof Float32Array);
          g.setAttribute(name, attr);
        }
        return g;
      })
      .then((g) => {
        try {
          callback(g);
        } catch (err) {
          throw err instanceof Error ? err : new Error(String(err));
        }
      })
      .catch((err) => {
        /* One notification per failure: error callback if given, otherwise the onFail hook (never both). */
        if (typeof onError === "function") onError(err);
        else if (typeof this.onFail === "function") this.onFail(err);
        throw err;
      });
    result.catch(() => {}); /* the rejection is reported above; avoid an unhandled-rejection log */
    return result;
  }

  dispose() {
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
    clearTimeout(this.readyTimer);
    this.fail(new Error("DracoLite: disposed"));
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = "";
    this.onFail = null;
    return this;
  }
}

/* Runs inside the worker: its source is stringified, so it must not reference anything outside itself. */
function dracoWorker() {
  let config;
  let ready;
  onmessage = (e) => {
    const m = e.data;
    if (m.type === "init") {
      config = m.decoderConfig;
      ready = new Promise((resolve, reject) => {
        config.onModuleLoaded = (draco) => resolve({ draco });
        try {
          DracoDecoderModule(config); // eslint-disable-line no-undef
        } catch (err) {
          reject(err);
        }
      });
      ready.then(() => self.postMessage({ type: "ready" }), (err) => self.postMessage({ type: "initError", error: err.message }));
    } else if (m.type === "decode") {
      ready.then(({ draco }) => {
        let decoder;
        try {
          decoder = new draco.Decoder();
          const g = decode(draco, decoder, new Int8Array(m.buffer), m.taskConfig);
          const bufs = g.attributes.map((a) => a.array.buffer);
          if (g.index) bufs.push(g.index.array.buffer);
          self.postMessage({ type: "decode", id: m.id, geometry: g }, bufs);
        } catch (err) {
          self.postMessage({ type: "error", id: m.id, error: err.message });
        } finally {
          if (decoder) draco.destroy(decoder);
        }
      });
    }
  };
  function decode(draco, decoder, array, cfg) {
    const type = decoder.GetEncodedGeometryType(array);
    let geo;
    let status;
    if (type === draco.TRIANGULAR_MESH) {
      geo = new draco.Mesh();
      status = decoder.DecodeArrayToMesh(array, array.byteLength, geo);
    } else if (type === draco.POINT_CLOUD) {
      geo = new draco.PointCloud();
      status = decoder.DecodeArrayToPointCloud(array, array.byteLength, geo);
    } else throw new Error("Draco: unexpected geometry type");
    if (!status.ok() || geo.ptr === 0) throw new Error("Draco: decoding failed: " + status.error_msg());
    const out = { index: null, attributes: [] };
    for (const name in cfg.attributeIDs) {
      const T = self[cfg.attributeTypes[name]];
      let attr;
      if (cfg.useUniqueIDs) attr = decoder.GetAttributeByUniqueId(geo, cfg.attributeIDs[name]);
      else {
        const id = decoder.GetAttributeId(geo, draco[cfg.attributeIDs[name]]);
        if (id === -1) continue;
        attr = decoder.GetAttribute(geo, id);
      }
      const count = geo.num_points();
      const size = attr.num_components();
      const dt = T === Float32Array ? draco.DT_FLOAT32 : T === Int8Array ? draco.DT_INT8 : T === Int16Array ? draco.DT_INT16
        : T === Int32Array ? draco.DT_INT32 : T === Uint8Array ? draco.DT_UINT8 : T === Uint16Array ? draco.DT_UINT16 : draco.DT_UINT32;
      const srcStride = size * T.BYTES_PER_ELEMENT;
      const dstStride = Math.ceil(srcStride / 4) * 4;
      const ptr = draco._malloc(count * srcStride);
      decoder.GetAttributeDataArrayForAllPoints(geo, attr, dt, count * srcStride, ptr);
      const src = new T(draco.HEAPF32.buffer, ptr, (count * srcStride) / T.BYTES_PER_ELEMENT);
      let dst;
      const stride = dstStride / T.BYTES_PER_ELEMENT;
      if (srcStride === dstStride) dst = src.slice();
      else {
        dst = new T((count * dstStride) / T.BYTES_PER_ELEMENT);
        for (let i = 0; i < count; i++) for (let j = 0; j < size; j++) dst[i * stride + j] = src[i * size + j];
      }
      draco._free(ptr);
      out.attributes.push({ name, count, itemSize: size, array: dst, stride });
    }
    if (type === draco.TRIANGULAR_MESH) {
      const n = geo.num_faces() * 3;
      const ptr = draco._malloc(n * 4);
      decoder.GetTrianglesUInt32Array(geo, n * 4, ptr);
      out.index = { array: new Uint32Array(draco.HEAPF32.buffer, ptr, n).slice(), itemSize: 1 };
      draco._free(ptr);
    }
    draco.destroy(geo);
    return out;
  }
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes the site work at any address, including
// https://<your-user>.github.io/<your-repo>/ on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: "./",
  // Lazy chunks (3D model, charts) import these; pre-bundling them up front stops the dev server from
  // re-optimizing and fully reloading the page the first time Hardware or Stats opens (BUG-149).
  optimizeDeps: {
    include: [
      "three",
      "three/examples/jsm/loaders/GLTFLoader.js",
      "three/examples/jsm/controls/OrbitControls.js",
      "three/examples/jsm/environments/RoomEnvironment.js",
      "recharts",
    ],
  },
  build: {
    // The three chunk (~663 kB, ~168 kB gzip) is only loaded lazily by the Hardware page,
    // so it is not part of the initial load and the default 500 kB warning does not apply.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // three and recharts are only reached through lazy pages (HardwareModel, StatsChart),
        // so giving them their own chunks keeps them out of index and lets them cache separately.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return "three";
          // Without this, Rollup folds React into the recharts chunk and index loads recharts eagerly.
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
          // recharts 3 has no recharts-scale/react-smooth; its other deps (redux toolkit, react-redux,
          // react-is, use-sync-external-store...) are pulled into this chunk by Rollup because only
          // recharts imports them. If index ever imports one of them, assign it to "react" instead,
          // or index would start loading this chunk eagerly.
          if (/[\\/]node_modules[\\/](recharts|victory-vendor|d3-[^\\/]+)[\\/]/.test(id)) return "recharts";
          return undefined;
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
  },
  preview: {
    host: "127.0.0.1",
  },
});

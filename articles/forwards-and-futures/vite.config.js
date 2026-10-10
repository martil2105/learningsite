import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/*
  Vite is used here as a bundler, not as a dev server for an index.html.

  `public/index.html` is hand-written and ships as-is: it loads `build/bundle.js`
  with a plain <script defer> and `build/bundle.css` as a stylesheet, and every
  path in it is relative so the article works at any base path. Two consequences,
  both deliberate:

  - `build.lib` with `formats: ["iife"]` is what reproduces those two filenames.
    Left to itself Vite emits hashed ES module chunks, `public/index.html` stops
    matching them, and `verify/ship.sh` — which hashes `public/build/bundle.js`
    and calls that hash the identity of the code — has nothing to hash.
  - `publicDir: false` because `outDir` is *inside* `public/`. With Vite's default
    publicDir it would copy `public/` into `public/build/` on every build, which
    means the assets, the fonts and index.html itself, recursively.

  `npm run dev` is `vite build --watch` rather than `vite dev` for the same
  reason: there is no root index.html to serve, and the VM's dev server is not
  reachable from the host anyway. The loop that matters is ./verify/ship.sh.
*/
export default defineConfig({
  plugins: [svelte()],
  publicDir: false,
  build: {
    outDir: "public/build",
    // Must be false. Vite's prepare-out-dir step unlinks the previous output
    // first, and device_bash cannot delete files on this mount: the FIRST build
    // succeeds (nothing to remove) and every build after it dies with
    // "EPERM: operation not permitted, unlink public/build/bundle.css".
    // Rollup 2 never hit this because it overwrote in place. The output
    // filenames here are fixed, so overwriting is all that is wanted anyway and
    // nothing stale can accumulate.
    emptyOutDir: false,
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/main.js",
      formats: ["iife"],
      name: "app",
      fileName: () => "bundle.js",
    },
    rollupOptions: {
      output: { assetFileNames: "bundle.[ext]" },
    },
  },
});

import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "site",
  publicDir: "../public",
  build: {
    target: "es2022",
    outDir: "../dist/site",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "site/index.html"),
        privacy: resolve(import.meta.dirname, "site/privacy/index.html"),
        terms: resolve(import.meta.dirname, "site/terms/index.html"),
        demo: resolve(import.meta.dirname, "site/demo/index.html"),
        notFound: resolve(import.meta.dirname, "site/404.html"),
      },
    },
  },
});

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    outDir: "dist/app",
    emptyOutDir: true,
    sourcemap: true,
  },
  clearScreen: false,
  server: { strictPort: true, port: 1420 },
});

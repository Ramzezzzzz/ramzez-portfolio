import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 7, interlaced: false },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80, progressive: true },
      pngquant: { quality: [0.7, 0.9], speed: 4 },
      svgo: { plugins: [{ removeViewBox: false }] },
      webp: { quality: 80 },
    }),
  ],
  base: "/portfolio/",
});

import imagemin from "imagemin";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import fs from "fs";

const inputDir = "public/images";
const outputDir = "dist/images";

// Создаём выходную папку
fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  // Шаблон только для файлов в корне inputDir, без подпапок
  const files = await imagemin([`${inputDir}/*.{jpg,png,webp}`], {
    destination: outputDir,
    plugins: [
      imageminMozjpeg({ quality: 80 }),
      imageminPngquant({ quality: [0.7, 0.9] }),
    ],
  });
  console.log("Сжатые изображения (без originals):", files.length);
})();

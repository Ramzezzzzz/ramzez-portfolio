import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import fs from 'fs';

const inputDir = 'public/images';
const outputDir = 'dist/images';

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const files = await imagemin(
    [
      `${inputDir}/*.{jpg,png,webp}`,
      `!${inputDir}/originals/**`, // ← исключаем папку с оригиналами
    ],
    {
      destination: outputDir,
      plugins: [
        imageminMozjpeg({ quality: 80 }),
        imageminPngquant({ quality: [0.7, 0.9] }),
      ],
    }
  );
  console.log('Сжатые изображения (без originals):', files.length);
})();
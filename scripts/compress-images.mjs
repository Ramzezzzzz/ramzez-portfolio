import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import fs from 'fs';
import path from 'path';

const inputDir = 'public/images';
const outputDir = 'public/images/compress';

// Убедимся, что выходная папка существует
fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const files = await imagemin([`${inputDir}/*.{jpg,png,webp}`], {
    destination: outputDir,
    plugins: [
      imageminMozjpeg({ quality: 80 }),
      imageminPngquant({ quality: [0.7, 0.9] }),
    ],
  });
  console.log('Сжатые изображения:', files.map(f => path.basename(f.destinationPath)).join(', '));
})();
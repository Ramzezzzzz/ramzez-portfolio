import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import fs from 'fs';

const inputDir = 'public/images';
const outputDir = 'public/images/compress';

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  // —жимаем “ќЋ№ ќ фон Ц его подмена будет заметнее
  const files = await imagemin([`${inputDir}/portfolio_background.png`], {
    destination: outputDir,
    plugins: [
      imageminPngquant({ quality: [0.001, 0.005] }), // очень низкое качество
    ],
  });
  console.log('‘айлы агрессивно сжаты:', files.map(f => f.destinationPath).join(', '));
})();
// Generate all required Expo icon/splash assets from a single source image
// Usage: node scripts/generate-icons.js <source-image-path>

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

async function generate(sourcePath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.error('Usage: node scripts/generate-icons.js <path-to-logo.png>');
    process.exit(1);
  }

  const src = sharp(sourcePath);
  const meta = await src.metadata();
  console.log(`Source image: ${meta.width}x${meta.height}`);

  // App icon (1024x1024, no transparency for iOS)
  await sharp(sourcePath)
    .resize(1024, 1024, { fit: 'cover' })
    .flatten({ background: '#0B1610' })
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // Favicon (48x48)
  await sharp(sourcePath)
    .resize(48, 48, { fit: 'cover' })
    .flatten({ background: '#0B1610' })
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // Android adaptive icon foreground (1024x1024 with padding for safe zone)
  // Adaptive icons need ~66% of the image in the center safe zone
  const fgSize = 1024;
  const innerSize = Math.round(fgSize * 0.66);
  const resized = await sharp(sourcePath)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: fgSize,
      height: fgSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
  console.log('✓ android-icon-foreground.png (1024x1024)');

  // Android adaptive icon background (solid color)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: '#0B1610',
    },
  })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png (1024x1024)');

  // Monochrome icon (grayscale silhouette)
  await sharp(sourcePath)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .grayscale()
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png (1024x1024)');

  // Splash icon (centered logo, 200x200 for splash screen)
  await sharp(sourcePath)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('✓ splash-icon.png (200x200)');

  console.log('\nAll icons generated in assets/');
}

const sourcePath = process.argv[2];
generate(sourcePath).catch(console.error);

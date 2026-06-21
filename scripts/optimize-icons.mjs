/**
 * Regenerate brand assets from public/*.svg
 * Keep in sync with src/config/theme.ts
 *
 * Usage: npm run icons
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const iconSource = path.join(publicDir, "icon.svg");
const thumbnailSource = path.join(publicDir, "thumbnail.svg");

/** Farcaster / Base app thumbnail — 1.91:1 (1200÷628 ≈ 1.91) */
const THUMB_WIDTH = 1200;
const THUMB_HEIGHT = 628;
const ICON_BACKGROUND = "#131313";

async function writePng(buffer, filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await sharp(buffer).png({ compressionLevel: 9 }).toFile(filePath);
}

/** Square icons — 1:1 (Farcaster iconUrl requires 1024×1024 PNG, no alpha) */
const iconPng = sharp(iconSource).resize(1024, 1024, {
  fit: "contain",
  background: ICON_BACKGROUND,
});
const iconRgb = iconPng.clone().flatten({ background: ICON_BACKGROUND });

await writePng(
  await iconRgb.clone().toBuffer(),
  path.join(publicDir, "icon.png"),
);
await writePng(
  await iconRgb.clone().resize(512, 512).toBuffer(),
  path.join(publicDir, "splash.png"),
);
await writePng(
  await iconPng.clone().resize(192, 192).toBuffer(),
  path.join(publicDir, "icon-192.png"),
);
await writePng(
  await sharp(iconSource)
    .resize(180, 180, { fit: "contain", background: ICON_BACKGROUND })
    .toBuffer(),
  path.join(publicDir, "apple-touch-icon.png"),
);
await writePng(
  await sharp(iconSource)
    .resize(32, 32, { fit: "contain", background: ICON_BACKGROUND })
    .toBuffer(),
  path.join(publicDir, "favicon.png"),
);

/** Wide thumbnail — 1.91:1 */
const thumbnail = await sharp(thumbnailSource)
  .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "fill" })
  .png({ compressionLevel: 9, palette: true })
  .toBuffer();

await writePng(thumbnail, path.join(publicDir, "thumbnail.png"));
await writePng(thumbnail, path.join(publicDir, "image.png"));

console.log("Generated:");
console.log("  icon.png, splash.png, icon-192.png, apple-touch-icon.png, favicon.png (1:1)");
console.log(`  thumbnail.png, image.png ${THUMB_WIDTH}x${THUMB_HEIGHT} (1.91:1)`);

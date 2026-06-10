import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const source = path.join(publicDir, "icon.svg");

async function writePng(buffer, filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await sharp(buffer).png().toFile(filePath);
}

const base = await sharp(source)
  .resize(1024, 1024, { fit: "contain" })
  .png()
  .toBuffer();

await writePng(
  await sharp(base).resize(180, 180).toBuffer(),
  path.join(publicDir, "apple-touch-icon.png"),
);

// Farcaster / Base mini app assets
await writePng(
  await sharp(base).resize(512, 512).toBuffer(),
  path.join(publicDir, "icon.png"),
);
await writePng(
  await sharp(base).resize(512, 512).toBuffer(),
  path.join(publicDir, "splash.png"),
);

const thumbnailSource = path.join(publicDir, "thumbnail.svg");
const thumbnail = await sharp(thumbnailSource)
  .resize(1200, 630, { fit: "fill" })
  .png({ compressionLevel: 9, palette: false })
  .toBuffer();

await writePng(thumbnail, path.join(publicDir, "thumbnail.png"));
await writePng(thumbnail, path.join(publicDir, "image.png"));

console.log("Icons written to public/");

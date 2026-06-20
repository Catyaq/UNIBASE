import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public", "screenshots");
const sourcesDir = path.join(root, "scripts", "screenshot-sources");

/** Base mini app store — portrait 1284×2778, max 5 MB */
const WIDTH = 1284;
const HEIGHT = 2778;
const BACKGROUND = "#131313";

const sources = [
  { file: "01-home.png", out: "screenshot-1-home.png" },
  { file: "02-badges.png", out: "screenshot-2-badges.png" },
  { file: "03-milestones.png", out: "screenshot-3-milestones.png" },
];

await mkdir(publicDir, { recursive: true });

for (const { file, out } of sources) {
  const input = path.join(sourcesDir, file);
  const output = path.join(publicDir, out);

  const resized = await sharp(input)
    .resize(WIDTH, HEIGHT, {
      fit: "contain",
      background: BACKGROUND,
      position: "centre",
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(resized).toFile(output);

  const meta = await sharp(output).metadata();
  const { size } = await import("node:fs/promises").then((fs) =>
    fs.stat(output),
  );
  console.log(`${out}: ${meta.width}x${meta.height}, ${(size / 1024).toFixed(0)} KB`);
}

console.log("Screenshots written to public/screenshots/");

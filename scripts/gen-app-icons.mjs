/**
 * Rasterizes `src/assets/brand/galaxy_runner_logo.png` into Android mipmaps + iOS AppIcon.appiconset.
 * Run: npm run gen-app-icons
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOGO = join(ROOT, "src", "assets", "brand", "galaxy_runner_logo.png");
/** Matches home screen chrome (`#040816`) so the logo reads clearly on device grids. */
const BG = { r: 4, g: 8, b: 22, alpha: 1 };
const PADDING = 0.12;

async function renderIcon(size) {
  const inner = Math.max(1, Math.floor(size * (1 - 2 * PADDING)));
  const logoBuf = await sharp(LOGO)
    .resize(inner, inner, { fit: "contain", background: BG })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  }).composite([{ input: logoBuf, gravity: "center" }]);
}

const android = [
  ["mipmap-mdpi", 48],
  ["mipmap-hdpi", 72],
  ["mipmap-xhdpi", 96],
  ["mipmap-xxhdpi", 144],
  ["mipmap-xxxhdpi", 192],
];

for (const [folder, s] of android) {
  const dir = join(ROOT, "android", "app", "src", "main", "res", folder);
  const png = await renderIcon(s);
  const buf = await png.png().toBuffer();
  await writeFile(join(dir, "ic_launcher.png"), buf);
  await writeFile(join(dir, "ic_launcher_round.png"), buf);
}

const iosSet = join(ROOT, "ios", "StackHouse", "Images.xcassets", "AppIcon.appiconset");
const iosSizes = [
  ["Icon-20@2x.png", 40],
  ["Icon-20@3x.png", 60],
  ["Icon-29@2x.png", 58],
  ["Icon-29@3x.png", 87],
  ["Icon-40@2x.png", 80],
  ["Icon-40@3x.png", 120],
  ["Icon-60@2x.png", 120],
  ["Icon-60@3x.png", 180],
  ["Icon-1024.png", 1024],
];

for (const [name, s] of iosSizes) {
  const png = await renderIcon(s);
  await png.png().toFile(join(iosSet, name));
}

const contents = {
  images: [
    {
      filename: "Icon-20@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "20x20",
    },
    {
      filename: "Icon-20@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "20x20",
    },
    {
      filename: "Icon-29@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "29x29",
    },
    {
      filename: "Icon-29@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "29x29",
    },
    {
      filename: "Icon-40@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "40x40",
    },
    {
      filename: "Icon-40@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "40x40",
    },
    {
      filename: "Icon-60@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "60x60",
    },
    {
      filename: "Icon-60@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "60x60",
    },
    {
      filename: "Icon-1024.png",
      idiom: "ios-marketing",
      scale: "1x",
      size: "1024x1024",
    },
  ],
  info: { author: "xcode", version: 1 },
};

await writeFile(join(iosSet, "Contents.json"), `${JSON.stringify(contents, null, 2)}\n`);
console.log("App icons written from galaxy_runner_logo.png (Android + iOS).");

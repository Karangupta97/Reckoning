/**
 * Generates the PWA icons (icon-192.png, icon-512.png) and favicon-friendly
 * assets from an inline SVG using sharp. Run with: `node scripts/generate-icons.mjs`.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1C2B3A"/>
      <stop offset="1" stop-color="#2A3144"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- Road -->
  <path d="M176 416 L224 128 L288 128 L336 416 Z" fill="#3A4658"/>
  <!-- Dashed center line -->
  <g fill="#F59E0B">
    <rect x="247" y="150" width="18" height="44" rx="6"/>
    <rect x="247" y="222" width="18" height="48" rx="6"/>
    <rect x="247" y="300" width="18" height="52" rx="6"/>
  </g>
  <!-- Warning marker -->
  <circle cx="256" cy="392" r="30" fill="#F59E0B"/>
  <rect x="250" y="372" width="12" height="26" rx="6" fill="#1C2B3A"/>
  <circle cx="256" cy="404" r="6" fill="#1C2B3A"/>
</svg>`;

async function main() {
  const buffer = Buffer.from(svg);
  await fs.mkdir(publicDir, { recursive: true });

  await sharp(buffer).resize(192, 192).png().toFile(path.join(publicDir, "icon-192.png"));
  await sharp(buffer).resize(512, 512).png().toFile(path.join(publicDir, "icon-512.png"));
  await sharp(buffer).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));

  console.log("Generated icon-192.png, icon-512.png, apple-touch-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

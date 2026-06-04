/**
 * Generates a branded 16:9 placeholder AVIF for the Smart Hazard Detection card
 * (public/images/ai-detection.avif). Replace with the real detection photo when
 * available. Run: node scripts/generate-detection-image.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "images");

const W = 1280;
const H = 720;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#222838"/>
      <stop offset="1" stop-color="#1A1F2E"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- road -->
  <path d="M470 720 L560 340 L720 340 L810 720 Z" fill="#2A3144"/>
  <g fill="#5C6E82">
    <rect x="632" y="360" width="16" height="40" rx="6"/>
    <rect x="628" y="430" width="20" height="46" rx="6"/>
    <rect x="622" y="520" width="26" height="54" rx="6"/>
    <rect x="614" y="624" width="34" height="64" rx="6"/>
  </g>
  <!-- pothole detection box -->
  <rect x="430" y="520" width="220" height="150" rx="8" fill="none" stroke="#3B82F6" stroke-width="4"/>
  <rect x="430" y="486" width="120" height="30" rx="6" fill="#3B82F6"/>
  <text x="442" y="508" font-family="DM Sans, sans-serif" font-size="20" fill="#EDF1F7" font-weight="600">Pothole</text>
  <ellipse cx="540" cy="600" rx="86" ry="40" fill="#11151f"/>
  <!-- flooding detection box -->
  <rect x="720" y="430" width="240" height="120" rx="8" fill="none" stroke="#F59E0B" stroke-width="4"/>
  <rect x="720" y="396" width="120" height="30" rx="6" fill="#F59E0B"/>
  <text x="732" y="418" font-family="DM Sans, sans-serif" font-size="20" fill="#1C2B3A" font-weight="600">Flooding</text>
  <path d="M724 500 q60 -24 120 0 t116 0" fill="none" stroke="#3B82F6" stroke-width="5" opacity="0.7"/>
  <!-- label -->
  <text x="64" y="100" font-family="DM Mono, monospace" font-size="26" fill="#A8B6C8">AI HAZARD DETECTION</text>
  <circle cx="74" cy="140" r="7" fill="#22C55E"/>
  <text x="92" y="148" font-family="DM Sans, sans-serif" font-size="22" fill="#5C6E82">live inference</text>
</svg>`;

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await sharp(Buffer.from(svg))
    .avif({ quality: 60 })
    .toFile(path.join(outDir, "ai-detection.avif"));
  console.log("Generated public/images/ai-detection.avif");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

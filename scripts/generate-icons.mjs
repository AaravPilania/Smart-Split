import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const svgBuf = readFileSync(join(__dir, '../public/favicon.svg'));

await sharp(svgBuf).resize(512, 512).png().toFile(join(__dir, '../public/pwa-512x512.png'));
await sharp(svgBuf).resize(192, 192).png().toFile(join(__dir, '../public/pwa-192x192.png'));
await sharp(svgBuf).resize(180, 180).png().toFile(join(__dir, '../public/apple-touch-icon.png'));

console.log('PWA icons generated successfully.');

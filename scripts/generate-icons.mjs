import sharp from 'sharp';
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'public', 'icons');

mkdirSync(iconsDir, { recursive: true });

const icon = readFileSync(path.join(__dirname, 'icon.svg'));
const iconMaskable = readFileSync(path.join(__dirname, 'icon-maskable.svg'));

async function render(svgBuffer, size, outPath) {
  await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
  console.log('generated', outPath);
}

await render(icon, 192, path.join(iconsDir, 'icon-192.png'));
await render(icon, 512, path.join(iconsDir, 'icon-512.png'));
await render(iconMaskable, 192, path.join(iconsDir, 'icon-maskable-192.png'));
await render(iconMaskable, 512, path.join(iconsDir, 'icon-maskable-512.png'));
await render(icon, 180, path.join(iconsDir, 'apple-touch-icon.png'));

copyFileSync(path.join(__dirname, 'icon.svg'), path.join(root, 'public', 'favicon.svg'));
console.log('copied favicon.svg');

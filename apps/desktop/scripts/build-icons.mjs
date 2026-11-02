// Builds the app icon from the logo drawings in assets/brand (the "쌓이는 E" logo spec).
// Usage: npm run icons   (writes assets/icon.ico with eight layers and assets/icon.png, the 256 tile)
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const assets = path.join(import.meta.dirname, '..', 'assets');

// Icon-only blue: 4.12:1 on the light taskbar, 3.56:1 on the dark one, 4.57:1 under the white mark.
const TILE = '#5474bb';
const ON_TILE = '#ffffff';

// px is the drawing's box inside the layer, centred. Tiles aim for two thirds on whole pixels; bare layers have no tile.
const LAYERS = [
  { size: 16, mark: 'mark-16.svg', px: 16, tile: false },
  // The title bar icon at 125%, so bare like 16; two thirds of a 20 tile is 13.3px, which no drawing fills on whole pixels.
  { size: 20, mark: 'mark-20.svg', px: 20, tile: false },
  { size: 24, mark: 'mark-16.svg', px: 16, tile: true },
  { size: 32, mark: 'mark-20.svg', px: 20, tile: true },
  // Two thirds is 26.7px; the 24 drawing at 1x is the closest on whole pixels (the 16 drawing at 2x would fill 80%).
  { size: 40, mark: 'mark-24.svg', px: 24, tile: true },
  // The 24 tile at exactly 2x.
  { size: 48, mark: 'mark-16.svg', px: 32, tile: true },
  // Two thirds is 42.7px; the 20 drawing at 2x (40px, 4px strokes) is the closest on whole pixels, which is the 32 tile at exactly 2x.
  { size: 64, mark: 'mark-20.svg', px: 40, tile: true },
  // The master at exactly two thirds; at this size its off-pixel edges do not show.
  { size: 256, mark: 'mark.svg', px: (256 * 2) / 3, tile: true },
];

async function drawing(file) {
  const svg = await readFile(path.join(assets, 'brand', file), 'utf8');
  const root = /<svg\b([^>]*)>([\s\S]*)<\/svg>/.exec(svg);
  if (!root) throw new Error(`${file} has no <svg> root`);
  return {
    attrs: root[1].replace(/\s(?:xmlns|width|height)="[^"]*"/g, ''),
    body: root[2],
  };
}

function layerSvg({ size, px, tile }, mark) {
  const at = (size - px) / 2;
  const back = tile
    ? `<rect width="${size}" height="${size}" rx="${(size * 11) / 48}" fill="${TILE}"/>`
    : '';
  const color = tile ? ON_TILE : TILE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${back}<svg x="${at}" y="${at}" width="${px}" height="${px}" color="${color}"${mark.attrs}>${mark.body}</svg></svg>`;
}

const pngs = [];
for (const layer of LAYERS) {
  const svg = layerSvg(layer, await drawing(layer.mark));
  const image = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
  if (image.width !== layer.size || image.height !== layer.size)
    throw new Error(
      `layer ${layer.size} rendered ${image.width}x${image.height}`,
    );
  pngs.push(image.asPng());
}

const ico = await pngToIco(pngs);
// Read the directory back: 6-byte header, then a 16-byte entry per image whose first two bytes are width and height (0 means 256).
const count = ico.readUInt16LE(2) === 1 ? ico.readUInt16LE(4) : 0;
const sizes = Array.from({ length: count }, (_, i) => {
  const [w, h] = [ico[6 + 16 * i] || 256, ico[7 + 16 * i] || 256];
  return w === h ? w : `${w}x${h}`;
});
if (sizes.join() !== LAYERS.map((layer) => layer.size).join())
  throw new Error(`icon.ico holds [${sizes.join(', ')}]`);

await writeFile(path.join(assets, 'icon.ico'), ico);
await writeFile(path.join(assets, 'icon.png'), pngs.at(-1));
console.log(
  `assets/icon.ico holds ${sizes.join(', ')}; assets/icon.png is 256`,
);

// Generates PWA icons (no external deps) — dumbbell motif on brand background.
// Run: node scripts/gen-icons.mjs
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const outDir = fileURLToPath(new URL('../public', import.meta.url));
mkdirSync(outDir, { recursive: true });

// --- tiny PNG encoder (RGBA, no filtering) ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // raw with filter byte 0 per row
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- drawing helpers ---
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}
const FIRE_FROM = [0xff, 0x8a, 0x3d];
const FIRE_TO = [0xf4, 0x3f, 0x5e];
const BG_TOP = [0x12, 0x16, 0x24];
const BG_BOT = [0x07, 0x09, 0x12];

function makeIcon(size, { padding = 0 } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const ia = a / 255;
    buf[i] = lerp(buf[i], r, ia);
    buf[i + 1] = lerp(buf[i + 1], g, ia);
    buf[i + 2] = lerp(buf[i + 2], b, ia);
    buf[i + 3] = Math.max(buf[i + 3], a);
  };

  // rounded-rect background with vertical brand gradient
  const radius = size * 0.22;
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const col = [lerp(BG_TOP[0], BG_BOT[0], t), lerp(BG_TOP[1], BG_BOT[1], t), lerp(BG_TOP[2], BG_BOT[2], t)];
    for (let x = 0; x < size; x++) {
      // rounded corners mask
      const dx = Math.max(radius - x, x - (size - 1 - radius), 0);
      const dy = Math.max(radius - y, y - (size - 1 - radius), 0);
      if (dx * dx + dy * dy <= radius * radius) set(x, y, col);
    }
  }

  // dumbbell, drawn rotated 45deg using filled rounded capsules.
  // We build it in icon space then place along a diagonal.
  const cx = size / 2;
  const cy = size / 2;
  const inner = size - padding * 2;
  const scale = inner / size;

  // fire gradient colour by position along the bar axis (diagonal)
  const fireAt = (s) => [lerp(FIRE_FROM[0], FIRE_TO[0], s), lerp(FIRE_FROM[1], FIRE_TO[1], s), lerp(FIRE_FROM[2], FIRE_TO[2], s)];

  // axis: from bottom-left to top-right (45deg)
  const ax = Math.SQRT1_2;
  const ay = -Math.SQRT1_2;
  // perpendicular
  const px = -ay;
  const py = ax;

  const barLen = size * 0.46 * scale; // half-length of bar
  const barW = size * 0.055 * scale;
  const plateW = size * 0.10 * scale; // thickness along axis
  const plateLenInner = size * 0.16 * scale; // half-height of inner plate
  const plateLenOuter = size * 0.115 * scale;
  const plateGap = size * 0.30 * scale; // distance from center to inner plate center
  const plateGapOuter = size * 0.40 * scale;

  // sample super-sampled for smooth edges
  const SS = 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      let accS = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS - cx;
          const fy = y + (sy + 0.5) / SS - cy;
          const along = fx * ax + fy * ay; // position along bar
          const perp = fx * px + fy * py;
          let inside = false;
          // bar
          if (Math.abs(along) <= barLen && Math.abs(perp) <= barW) inside = true;
          // inner plates (both sides)
          if (Math.abs(Math.abs(along) - plateGap) <= plateW && Math.abs(perp) <= plateLenInner) inside = true;
          // outer plates
          if (Math.abs(Math.abs(along) - plateGapOuter) <= plateW && Math.abs(perp) <= plateLenOuter) inside = true;
          if (inside) {
            hits++;
            accS += (along / (barLen * 2)) + 0.5;
          }
        }
      }
      if (hits) {
        const a = Math.round((hits / (SS * SS)) * 255);
        const s = Math.min(1, Math.max(0, accS / hits));
        set(x, y, fireAt(s), a);
      }
    }
  }

  return encodePNG(size, size, buf);
}

const targets = [
  ['pwa-192x192.png', 192, 0],
  ['pwa-512x512.png', 512, 0],
  ['maskable-512x512.png', 512, 64], // safe-area padding for maskable
  ['apple-touch-icon.png', 180, 0],
  ['favicon-64.png', 64, 0],
];

for (const [name, size, padding] of targets) {
  writeFileSync(`${outDir}/${name}`, makeIcon(size, { padding }));
  console.log('wrote', name);
}

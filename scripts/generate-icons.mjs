// Generates simple PNG icons using native Node.js zlib (no extra deps needed)
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function createPNG(size) {
  // Draw a dark background with a white clock icon
  const img = new Uint8Array(size * size * 4); // RGBA

  // Background: #0a0a0a
  for (let i = 0; i < size * size; i++) {
    img[i * 4] = 10;     // R
    img[i * 4 + 1] = 10; // G
    img[i * 4 + 2] = 10; // B
    img[i * 4 + 3] = 255; // A
  }

  // Draw a rounded-rect background in accent blue for the icon area (centered 70%)
  const padding = Math.floor(size * 0.15);
  const innerSize = size - padding * 2;
  const radius = Math.floor(innerSize * 0.22);

  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    img[i] = r;
    img[i + 1] = g;
    img[i + 2] = b;
    img[i + 3] = 255;
  }

  // Fill rounded rect with accent blue #3b82f6
  for (let y = padding; y < size - padding; y++) {
    for (let x = padding; x < size - padding; x++) {
      const lx = x - padding;
      const ly = y - padding;

      // Check if inside rounded rect
      const inCornerTL = lx < radius && ly < radius;
      const inCornerTR = lx >= innerSize - radius && ly < radius;
      const inCornerBL = lx < radius && ly >= innerSize - radius;
      const inCornerBR = lx >= innerSize - radius && ly >= innerSize - radius;

      let inside = true;
      if (inCornerTL) {
        const dx = lx - radius;
        const dy = ly - radius;
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (inCornerTR) {
        const dx = lx - (innerSize - radius);
        const dy = ly - radius;
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (inCornerBL) {
        const dx = lx - radius;
        const dy = ly - (innerSize - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (inCornerBR) {
        const dx = lx - (innerSize - radius);
        const dy = ly - (innerSize - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      }

      if (inside) setPixel(x, y, 59, 130, 246); // #3b82f6
    }
  }

  // Draw clock face (circle outline) in white
  const cx = size / 2;
  const cy = size / 2;
  const clockR = Math.floor(innerSize * 0.3);
  const strokeW = Math.max(2, Math.floor(size * 0.025));

  for (let angle = 0; angle < 360; angle += 0.5) {
    const rad = (angle * Math.PI) / 180;
    for (let r = clockR - strokeW; r <= clockR; r++) {
      const px = Math.round(cx + r * Math.cos(rad));
      const py = Math.round(cy + r * Math.sin(rad));
      setPixel(px, py, 255, 255, 255);
    }
  }

  // Hour hand (pointing to ~10 o'clock)
  const hourLen = Math.floor(clockR * 0.55);
  const hourAngle = (-60 * Math.PI) / 180;
  for (let i = 0; i < hourLen; i++) {
    const frac = i / hourLen;
    const px = Math.round(cx + frac * hourLen * Math.cos(hourAngle));
    const py = Math.round(cy + frac * hourLen * Math.sin(hourAngle));
    for (let dx = -strokeW; dx <= strokeW; dx++) {
      for (let dy = -strokeW; dy <= strokeW; dy++) {
        setPixel(px + dx, py + dy, 255, 255, 255);
      }
    }
  }

  // Minute hand (pointing to ~2 o'clock)
  const minLen = Math.floor(clockR * 0.72);
  const minAngle = (60 * Math.PI) / 180;
  for (let i = 0; i < minLen; i++) {
    const frac = i / minLen;
    const px = Math.round(cx + frac * minLen * Math.cos(minAngle));
    const py = Math.round(cy + frac * minLen * Math.sin(minAngle));
    for (let dx = -(strokeW - 1); dx <= strokeW - 1; dx++) {
      for (let dy = -(strokeW - 1); dy <= strokeW - 1; dy++) {
        setPixel(px + dx, py + dy, 255, 255, 255);
      }
    }
  }

  // Center dot
  for (let dx = -strokeW; dx <= strokeW; dx++) {
    for (let dy = -strokeW; dy <= strokeW; dy++) {
      setPixel(Math.round(cx) + dx, Math.round(cy) + dy, 255, 255, 255);
    }
  }

  // Encode as PNG
  return encodePNG(img, size, size);
}

function crc32(data) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodePNG(rgba, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build raw scanlines (filter byte 0 + RGB)
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 3) + 1 + x * 3;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
    }
  }

  const compressed = deflateSync(raw, { level: 6 });
  const idat = Buffer.from(compressed);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", iend),
  ]);
}

// Generate icons
const iconsDir = join(__dirname, "../public/icons");
mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  const png = createPNG(size);
  writeFileSync(join(iconsDir, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${png.length} bytes)`);
}
console.log("Icons generated successfully.");

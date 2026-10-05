// png-clean: elimina el "velo" de los iconos generados: píxeles con alfa casi 0 (1..THR) que forman un rectángulo tenue
// con borde nítido alrededor del dibujo (el vídeo comprimido lo deja ver como un "recuadro mal cortado").
// Solo zlib (sin dependencias). Soporta PNG RGBA 8-bit sin entrelazar (lo que devuelve gpt-image); otro formato → se deja igual.
//   import { cleanAlphaPng } from "./png-clean.mjs";   cleanAlphaPng(buffer, 12) -> Buffer
//   CLI: node scripts/png-clean.mjs <carpeta|fichero.png> [umbral]
import fs from "node:fs"; import path from "node:path"; import zlib from "node:zlib";

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };

export function cleanAlphaPng(buf, thr = 12) {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(SIG)) return buf;
  let pos = 8, w = 0, h = 0, depth = 0, ctype = 0, inter = 0; const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("latin1", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; inter = data[12]; }
    else if (type === "IDAT") idat.push(data); else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (depth !== 8 || ctype !== 6 || inter !== 0 || !idat.length) return buf; // solo RGBA 8-bit sin entrelazar
  const raw = zlib.inflateSync(Buffer.concat(idat)); const bpp = 4, stride = w * bpp; const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, b = y > 0 ? out[dst - stride + x] : 0, c = (x >= bpp && y > 0) ? out[dst - stride + x - bpp] : 0; let v = raw[src + x];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      out[dst + x] = v & 255;
    }
  }
  let changed = 0;
  for (let i = 0; i < w * h; i++) { const o = i * 4; if (out[o + 3] > 0 && out[o + 3] <= thr) { out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0; changed++; } }
  // BORDE CORTADO: si el dibujo toca el borde de la imagen (gpt-image lo recorta a veces) se vería una línea recta.
  //   En los lados afectados la opacidad se desvanece con un degradado suave (smoothstep) en vez de cortar en seco.
  const F = Math.max(8, Math.round(Math.min(w, h) * 0.055)); const touch = { t: false, b: false, l: false, r: false };
  const edgeMean = (get, len) => { let s = 0; for (let i = 0; i < len; i++) { let m = 0; for (let k = 0; k < 3; k++) m = Math.max(m, get(i, k)); s += m > 40 ? 1 : 0; } return s / len; };
  const A = (x, y) => out[(y * w + x) * 4 + 3];
  touch.t = edgeMean((i, k) => A(i, k), w) > 0.01; touch.b = edgeMean((i, k) => A(i, h - 1 - k), w) > 0.01;
  touch.l = edgeMean((i, k) => A(k, i), h) > 0.01; touch.r = edgeMean((i, k) => A(w - 1 - k, i), h) > 0.01;
  if (touch.t || touch.b || touch.l || touch.r) {
    const sm = (d) => { const u = Math.min(1, d / F); return u * u * (3 - 2 * u); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let f = 1; if (touch.t) f = Math.min(f, sm(y)); if (touch.b) f = Math.min(f, sm(h - 1 - y)); if (touch.l) f = Math.min(f, sm(x)); if (touch.r) f = Math.min(f, sm(w - 1 - x));
      if (f < 1) { const o = (y * w + x) * 4 + 3; if (out[o]) { out[o] = Math.round(out[o] * f); changed++; } }
    }
  }
  if (!changed) return buf; // nada que limpiar: se devuelve el original intacto
  const rows = Buffer.alloc(h * (stride + 1)); for (let y = 0; y < h; y++) { rows[y * (stride + 1)] = 0; out.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(rows, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// CLI
if (process.argv[1] && process.argv[1].endsWith("png-clean.mjs")) {
  const target = process.argv[2], thr = +(process.argv[3] || 12);
  const files = fs.statSync(target).isDirectory() ? fs.readdirSync(target).filter(f => /\.png$/i.test(f)).map(f => path.join(target, f)) : [target];
  let cleaned = 0, same = 0;
  for (const f of files) { const b = fs.readFileSync(f); const o = cleanAlphaPng(b, thr); if (o !== b) { fs.writeFileSync(f, o); cleaned++; } else same++; }
  console.log(`png-clean: ${cleaned} limpiados, ${same} ya estaban limpios (umbral alfa ≤ ${thr})`);
}

// Pista de pops colocados en cada cambio de beat de TODO el vídeo real.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "public", "voz1deep", "manifest.json"), "utf8"));
const FPS = 30, PAD = 6, SR = 44100;
// nº de beats por segmento
const BEATS = { intro: 4, grupos: 3, cierre: 3 };
const times = [];
let accFr = 0;
for (const m of manifest) {
  const n = BEATS[m.label] || 12;
  const len = m.frames / n;
  for (let k = 0; k < n; k++) times.push((accFr + k * len) / FPS + 0.05);
  accFr += m.frames + PAD;
}
const DUR = accFr / FPS + 0.5, N = Math.floor(SR * DUR);
const out = new Float32Array(N);
function pop(dur = 0.12) { const n = Math.floor(SR * dur), b = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; const f = 480 + 480 * Math.exp(-t * 30); b[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 26) * 0.5; } return b; }
const Pp = pop();
for (const t of times) { const o = Math.floor(t * SR); for (let i = 0; i < Pp.length && o + i < N; i++) out[o + i] += Pp[i] * 0.7; }
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(out[i])); const g = pk > 0 ? Math.pow(10, -3 / 20) / pk : 1;
const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) { let s = Math.max(-1, Math.min(1, out[i] * g)); buf.writeInt16LE((s * 32767) | 0, 44 + i * 2); }
fs.writeFileSync(path.join(__dirname, "public", "voz", "sfx_full.wav"), buf);
console.log("🔊 sfx_full.wav ok · " + times.length + " pops · " + DUR.toFixed(1) + "s");

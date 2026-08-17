// Genera una pista de efectos de sonido (whoosh/pop/ding) colocados en los tiempos de cada beat.
// Salida: public/voz/sfx_track.wav (dura lo que el clip)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SR = 44100;
const DUR = 43.0;                       // segundos (cubre el clip de 42.4s)
const N = Math.floor(SR * DUR);
const out = new Float32Array(N);

// --- síntesis de efectos ---
function whoosh(dur = 0.4) {
  const n = Math.floor(SR * dur); const b = new Float32Array(n); let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = t < 0.05 ? t / 0.05 : Math.exp(-(t - 0.05) * 9);
    let noise = Math.random() * 2 - 1;
    prev = prev * 0.6 + noise * 0.4;    // lowpass suave → "aire"
    const sweep = 0.6 + 0.4 * Math.sin(2 * Math.PI * (2 - t * 3) * t); // movimiento
    b[i] = prev * env * sweep * 0.5;
  }
  return b;
}
function pop(dur = 0.12) {
  const n = Math.floor(SR * dur); const b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; const f = 500 + 500 * Math.exp(-t * 30); b[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 26) * 0.5; }
  return b;
}
function ding(dur = 0.35) {
  const n = Math.floor(SR * dur); const b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * 1050 * t) + 0.5 * Math.sin(2 * Math.PI * 1575 * t)) * Math.exp(-t * 7) * 0.4; }
  return b;
}
function place(buf, atSec, gain = 1) { const off = Math.floor(atSec * SR); for (let i = 0; i < buf.length && off + i < N; i++) if (off + i >= 0) out[off + i] += buf[i] * gain; }

// --- tiempos de beat del clip (Paranoide, 12 beats) ---
// clip empieza en frame 1690; Paranoide en 1696, beat len ~132.5 frames (30fps)
const beatTimes = [];
for (let k = 0; k < 12; k++) beatTimes.push(0.2 + k * (132.5 / 30));
const senalBeats = [4, 5, 6]; // beats con check → ding

const W = whoosh(), P = pop(), D = ding();
for (let k = 0; k < beatTimes.length; k++) {
  const t = beatTimes[k]; if (t > DUR) break;
  place(W, t, 0.9);              // whoosh en la transición
  place(P, t + 0.28, 0.8);       // pop cuando aterarriza el elemento
  if (senalBeats.includes(k)) place(D, t + 0.45, 0.9); // ding en señales
}

// normalizar pico
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
const g = peak > 0 ? Math.pow(10, -3 / 20) / peak : 1;

const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) { let s = Math.max(-1, Math.min(1, out[i] * g)); buf.writeInt16LE((s * 32767) | 0, 44 + i * 2); }
fs.writeFileSync(path.join(__dirname, "public", "voz", "sfx_track.wav"), buf);
console.log("🔊 sfx_track.wav generado (" + DUR + "s, " + beatTimes.length + " transiciones)");

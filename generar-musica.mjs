// Genera una pista de música de fondo ORIGINAL (libre de derechos) tipo explainer.
// Pad de acordes suaves + arpegio ligero. Salida: public/voz/bg_music.wav
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SR = 44100;
const DUR = 18;               // segundos
const N = SR * DUR;
const out = new Float32Array(N);

// Notas (Hz)
const NOTE = { C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.0, A3:220.0, B3:246.94,
               C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.0, A4:440.0, B4:493.88, C5:523.25 };

// Progresión I–V–vi–IV en Do (cálido, positivo, típico de explainer)
const prog = [
  { bass: NOTE.C3, chord: [NOTE.C4, NOTE.E4, NOTE.G4] }, // C
  { bass: NOTE.G3, chord: [NOTE.G3, NOTE.B3, NOTE.D4] }, // G
  { bass: NOTE.A3, chord: [NOTE.A3, NOTE.C4, NOTE.E4] }, // Am
  { bass: NOTE.F3, chord: [NOTE.F3, NOTE.A3, NOTE.C4] }, // F
];
const CHORD_LEN = 2.0;        // seg por acorde
const ARP_STEP = 0.5;         // seg por nota del arpegio

function softOsc(t, f) {
  // sine + un poco de 2º armónico para calidez
  return Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * 2 * f * t);
}

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const seg = Math.floor(t / CHORD_LEN) % prog.length;
  const tin = t - Math.floor(t / CHORD_LEN) * CHORD_LEN; // tiempo dentro del acorde
  const p = prog[seg];

  // envolvente suave por acorde (fade in/out para que respire)
  const env = Math.min(1, tin / 0.35) * Math.min(1, (CHORD_LEN - tin) / 0.5);

  // pad: bajo + acorde
  let pad = 0.6 * softOsc(t, p.bass);
  for (const f of p.chord) pad += 0.33 * softOsc(t, f);
  pad *= env * 0.18;

  // arpegio ligero (nota de plucks sobre el acorde, una octava arriba)
  const arpIdx = Math.floor(t / ARP_STEP) % p.chord.length;
  const tarp = t - Math.floor(t / ARP_STEP) * ARP_STEP;
  const arpEnv = Math.exp(-tarp * 6);           // pluck que decae
  const arp = 0.12 * Math.sin(2 * Math.PI * p.chord[arpIdx] * 2 * t) * arpEnv;

  out[i] = pad + arp;
}

// fade global de entrada/salida
for (let i = 0; i < SR * 1.0; i++) out[i] *= i / (SR * 1.0);
for (let i = 0; i < SR * 1.5; i++) out[N - 1 - i] *= i / (SR * 1.5);

// normalizar a pico -3 dBFS
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
const target = Math.pow(10, -3 / 20);
const g = peak > 0 ? target / peak : 1;

// escribir WAV 16-bit mono
const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) {
  let s = Math.max(-1, Math.min(1, out[i] * g));
  buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
}
const dest = path.join(__dirname, "public", "voz", "bg_music.wav");
fs.writeFileSync(dest, buf);
console.log("🎵 música generada:", dest, `(${DUR}s)`);

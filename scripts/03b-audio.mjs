// 03b-audio: mezcla el AUDIO final. Un "pop" suave CADA vez que entra un dibujo (image/stickman) +
//   música de fondo en bucle a -23dB bajo la voz. Sin whoosh. Lee scenes.json para los tiempos.
//   Entrada: out/VIDEO_RAW.mp4  ->  Salida: out/VIDEO_FINAL.mp4
// Uso: node scripts/03b-audio.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = process.argv[2] || (fs.existsSync("episodes/active.txt") ? fs.readFileSync("episodes/active.txt", "utf8").trim() : "episodes/test-cpu");
const RAW = "out/VIDEO_RAW.mp4", OUT = "out/VIDEO_FINAL.mp4";
const POP = "public/voz/pop.wav";
// Música de fondo POR EPISODIO: si el episodio trae su propia pista (music.mp3/.wav), se usa esa
//   (p.ej. guerra/suspense); si no, la global public/voz/bg_music.wav. Volumen bajito configurable.
const epMusic = ["music.mp3", "music.wav"].map(f => path.join(dir, f)).find(f => fs.existsSync(f));
const MUSIC = epMusic || "public/voz/bg_music.wav";
const MUSIC_DB = process.env.MUSIC_DB || "-23dB";  // "bajita" bajo la voz; súbela/bájala con MUSIC_DB
if (!fs.existsSync(RAW)) { console.error("Falta " + RAW); process.exit(1); }

const scenes = JSON.parse(fs.readFileSync(path.join(dir, "scenes.json"), "utf8"));
// tiempos de ENTRADA de cada dibujo (icono/stickman). Evita duplicados muy juntos (<0.12s).
let times = scenes.elements.filter(e => (e.type === "image" || e.type === "stickman") && e.in != null).map(e => +e.in).sort((a, b) => a - b);
times = times.filter((t, i) => i === 0 || t - times[i - 1] > 0.12);

const hasPop = fs.existsSync(POP), hasMusic = fs.existsSync(MUSIC);
if (!hasPop && !hasMusic) { fs.copyFileSync(RAW, OUT); console.log("sin pop ni música → copia directa"); process.exit(0); }

// filtro: pop.wav (input1) repetido y adelayado en cada entrada; música (input2) en bucle a -23dB.
const args = ["-y", "-v", "error", "-i", RAW];
let idxPop = -1, idxMusic = -1, n = 1;
if (hasPop) { args.push("-i", POP); idxPop = n++; }
if (hasMusic) { args.push("-stream_loop", "-1", "-i", MUSIC); idxMusic = n++; }

let fc = "", labels = ["[0:a]"];
if (hasPop && times.length) {
  const N = times.length;
  // asplit: duplica el pop en N salidas (uso portable; el ffmpeg estricto no deja reusar el pad de entrada)
  fc += `[${idxPop}:a]asplit=${N}` + times.map((_, i) => `[s${i}]`).join("") + ";";
  times.forEach((t, i) => { const d = Math.max(1, Math.round(t * 1000)); fc += `[s${i}]adelay=${d}|${d}[p${i}];`; labels.push(`[p${i}]`); });
}
if (hasMusic) { fc += `[${idxMusic}:a]volume=${MUSIC_DB}[m];`; labels.push("[m]"); }
fc += labels.join("") + `amix=inputs=${labels.length}:duration=first:normalize=0[a]`;

// filtro EN LÍNEA (un solo argumento; execFileSync no pasa por shell → sin límite ni escapes).
// -filter_complex_script daba "Error splitting the argument list" en el ffmpeg estricto de la CI.
args.push("-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", OUT);
console.log(`pops: ${times.length} | música: ${hasMusic ? "sí" : "no"} → ${OUT}`);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("✔ audio mezclado (pop por entrada + música)");

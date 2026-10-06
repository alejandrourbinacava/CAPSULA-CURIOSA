// 03b-audio: mezcla el AUDIO final. Un "pop" suave CADA vez que entra un dibujo (image/stickman) +
//   música de fondo en bucle a -23dB bajo la voz. Lee scenes.json para los tiempos.
//   Además (escenas de diagrama): "tick" muy bajo al dibujarse cada flecha, "ding" cuando un contador llega a su valor y
//   whoosh suave SOLO al cambiar de capítulo (no en cada escena). Desactivar: SFX_EXTRA=0.
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
// BIBLIOTECA DE MÚSICA: si existe public/music/ con varias pistas, cada episodio coge UNA distinta
//   de forma ESTABLE (hash del nombre → el mismo vídeo siempre suena igual en re-renders). Así no
//   todos los vídeos llevan la misma canción. Prioridad: pista del episodio > biblioteca > global.
const pickLibraryTrack = () => {
  const md = "public/music"; if (!fs.existsSync(md)) return null;
  const tracks = fs.readdirSync(md).filter(f => /\.(mp3|wav|m4a|ogg)$/i.test(f)).sort();
  if (!tracks.length) return null;
  const name = path.basename(dir); let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return path.join(md, tracks[h % tracks.length]);
};
const MUSIC = epMusic || pickLibraryTrack() || "public/voz/bg_music.wav";
console.log(`🎵 música: ${MUSIC}`);
const MUSIC_DB = process.env.MUSIC_DB || "-23dB";  // "bajita" bajo la voz; súbela/bájala con MUSIC_DB
if (!fs.existsSync(RAW)) { console.error("Falta " + RAW); process.exit(1); }

const scenes = JSON.parse(fs.readFileSync(path.join(dir, "scenes.json"), "utf8"));
// tiempos de ENTRADA de cada dibujo (icono/stickman). Evita duplicados muy juntos (<0.12s).
let times = scenes.elements.filter(e => (e.type === "image" || e.type === "stickman") && e.in != null).map(e => +e.in).sort((a, b) => a - b);
times = times.filter((t, i) => i === 0 || t - times[i - 1] > 0.12);

// SFX EXTRA (tick de flecha · ding de contador · whoosh de capítulo). Cada uno: fichero, tiempos, ganancia en dB sobre su volumen base.
const EXTRA = process.env.SFX_EXTRA === "0" ? [] : [
  { f: "public/voz/tick.wav", db: -4, t: scenes.elements.filter(e => e.type === "arrow" && /^ar/.test(e.id || "")).map(e => +e.in + 0.05) },
  { f: "public/voz/ding.wav", db: -3, t: scenes.elements.filter(e => e.type === "stat").map(e => +e.in + 1.4) },
  { f: "public/voz/whoosh.wav", db: 9, t: scenes.elements.filter(e => /^chaplabel/.test(e.id || "")).map(e => +e.in - 0.05) },
].map(c => ({ ...c, t: c.t.filter(x => x > 0.2).sort((a, b) => a - b) })).filter(c => c.t.length && fs.existsSync(c.f));
const hasPop = fs.existsSync(POP), hasMusic = fs.existsSync(MUSIC);
if (!hasPop && !hasMusic) { fs.copyFileSync(RAW, OUT); console.log("sin pop ni música → copia directa"); process.exit(0); }

// filtro: pop.wav (input1) repetido y adelayado en cada entrada; música (input2) en bucle a -23dB.
const args = ["-y", "-v", "error", "-i", RAW];
let idxPop = -1, idxMusic = -1, n = 1;
if (hasPop) { args.push("-i", POP); idxPop = n++; }
if (hasMusic) { args.push("-stream_loop", "-1", "-i", MUSIC); idxMusic = n++; }
for (const c of EXTRA) { args.push("-i", c.f); c.idx = n++; }

let fc = "", labels = ["[0:a]"];
if (hasPop && times.length) {
  const N = times.length;
  // asplit: duplica el pop en N salidas (uso portable; el ffmpeg estricto no deja reusar el pad de entrada)
  fc += `[${idxPop}:a]asplit=${N}` + times.map((_, i) => `[s${i}]`).join("") + ";";
  times.forEach((t, i) => { const d = Math.max(1, Math.round(t * 1000)); fc += `[s${i}]adelay=${d}|${d}[p${i}];`; labels.push(`[p${i}]`); });
}
EXTRA.forEach((c, k) => { // un asplit por tipo de efecto, cada copia retrasada a su instante
  const N = c.t.length; fc += `[${c.idx}:a]volume=${c.db}dB,asplit=${N}` + c.t.map((_, i) => `[x${k}_${i}]`).join("") + ";";
  c.t.forEach((t, i) => { const d = Math.max(1, Math.round(t * 1000)); fc += `[x${k}_${i}]adelay=${d}|${d}[y${k}_${i}];`; labels.push(`[y${k}_${i}]`); });
});
if (hasMusic) { fc += `[${idxMusic}:a]volume=${MUSIC_DB}[m];`; labels.push("[m]"); }
fc += labels.join("") + `amix=inputs=${labels.length}:duration=first:normalize=0[a]`;

// filtro EN LÍNEA (un solo argumento; execFileSync no pasa por shell → sin límite ni escapes).
// -filter_complex_script daba "Error splitting the argument list" en el ffmpeg estricto de la CI.
args.push("-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", OUT);
console.log(`extra: ${EXTRA.map(c => path.basename(c.f, ".wav") + " ×" + c.t.length).join(", ") || "ninguno"}`);
console.log(`pops: ${times.length} | música: ${hasMusic ? "sí" : "no"} → ${OUT}`);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("✔ audio mezclado (pop por entrada + música)");

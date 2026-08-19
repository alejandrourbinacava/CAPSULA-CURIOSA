// 01-tts: script.md -> texto limpio (sin etiquetas) -> voz (genaipro) -> audio.mp3 -> Whisper -> words.json
// Uso: node scripts/01-tts.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const dir = process.argv[2] || "episodes/test-cpu";
const VOICE_ID = "851ejYcv2BoNPjrkw93G", SPEED = 1.05, MODEL = "eleven_multilingual_v2";
const BASE = "https://genaipro.io/api/v1";
function envKey(n) { if (process.env[n]) return process.env[n].trim(); const p = ".env"; if (fs.existsSync(p)) { const m = fs.readFileSync(p, "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const GEN = envKey("GENAIPRO_API_KEY");
const H = () => ({ Authorization: `Bearer ${GEN}`, "Content-Type": "application/json" });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pick = (o, ks) => { for (const k of ks) { let v = o; for (const p of k.split(".")) v = v?.[p]; if (v != null) return v; } };

// texto limpio: quita todas las etiquetas [[...]] y el frontmatter
let raw = fs.readFileSync(path.join(dir, "script.md"), "utf8");
raw = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
const clean = raw.replace(/\[\[[^\]]*\]\]/g, "").replace(/\s+/g, " ").trim();
console.log(`texto: ${clean.split(/\s+/).length} palabras`);

const audio = path.join(dir, "audio.mp3");
const wordsFile = path.join(dir, "words.json");

async function tts(text) {
  const r = await fetch(`${BASE}/labs/task`, { method: "POST", headers: H(), body: JSON.stringify({ input: text, voice_id: VOICE_ID, model_id: MODEL, speed: SPEED }) });
  const t = await r.text(); if (!r.ok) throw new Error(t); const id = pick(JSON.parse(t), ["task_id", "id", "data.task_id", "data.id"]);
  for (let i = 0; i < 180; i++) { const rr = await fetch(`${BASE}/labs/task?task_id=${encodeURIComponent(id)}`, { headers: H() }); const tt = await rr.text(); let j; try { j = JSON.parse(tt); } catch { j = null; } let it = j; const l = pick(j || {}, ["data", "items", "results", "tasks"]); if (Array.isArray(l)) it = l.find(x => pick(x, ["task_id", "id"]) === id) || l[0]; const st = pick(it || {}, ["status", "state"]); const u = pick(it || {}, ["result", "audio_url", "url", "output"]); if (st && /complete|success|done|finished/i.test(st) && u) return u; if (st && /fail|error/i.test(st)) throw new Error(tt); await sleep(3000); }
  throw new Error("TTS timeout");
}
const dl = async (url, dest) => { const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }); if (!r.ok) throw new Error("dl " + r.status); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); };

// PASO 1 · VOZ (de PAGO). Solo se llama a genaipro si NO existe ya el audio del episodio.
//   Así los re-renders NUNCA gastan saldo. (FORCE_TTS=1 fuerza regenerar la voz a propósito.)
if (fs.existsSync(audio) && !process.env.FORCE_TTS) {
  console.log("♻️  audio.mp3 ya existe -> se REUTILIZA la voz (0 gasto de genaipro).");
} else {
  let url, ok = false;
  for (let a = 1; a <= 3 && !ok; a++) { try { url = await tts(clean); await dl(url, path.join(dir, "_raw.mp3")); ok = true; } catch (e) { console.log(`reintento ${a}: ${(e.message || "").slice(0, 60)}`); await sleep(5000); } }
  if (!ok) throw new Error("no se pudo generar la voz");
  // recorta silencios de inicio/fin
  execSync(`ffmpeg -y -v error -i "${path.join(dir, "_raw.mp3")}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse" "${audio}"`);
  console.log("🎙️  audio.mp3 generado");
}

// PASO 2 · SINCRONÍA (GRATIS). Whisper saca words.json del audio. Solo si falta (o FORCE).
if (fs.existsSync(wordsFile) && !process.env.FORCE_TTS) {
  console.log("♻️  words.json ya existe -> se reutiliza la sincronía.");
} else {
  try {
    execSync(`python scripts/whisper_words.py "${audio}" "${wordsFile}"`, { stdio: "inherit" });
    console.log("⏱️  words.json (Whisper) listo");
  } catch (e) { console.log("⚠️  Whisper no disponible; se usará timing proporcional"); }
}

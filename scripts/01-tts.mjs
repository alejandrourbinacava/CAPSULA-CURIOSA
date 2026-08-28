// 01-tts: script.md -> texto limpio (sin etiquetas) -> voz (ai33.pro) -> audio.mp3 -> Whisper -> words.json
// Uso: node scripts/01-tts.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const dir = process.argv[2] || "episodes/test-cpu";
// Voz "Tony" de ElevenLabs a través de ai33.pro (prefijo elevenlabs_). Mismo timbre del canal.
const VOICE_ID = "elevenlabs_851ejYcv2BoNPjrkw93G", SPEED = 1.0;
const BASE = "https://api.ai33.pro/v3";
function envKey(n) { if (process.env[n]) return process.env[n].trim(); const p = ".env"; if (fs.existsSync(p)) { const m = fs.readFileSync(p, "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const AI33 = envKey("AI33_API_KEY");
const H = () => ({ "xi-api-key": AI33 });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pick = (o, ks) => { for (const k of ks) { let v = o; for (const p of k.split(".")) v = v?.[p]; if (v != null) return v; } };

// texto limpio: quita todas las etiquetas [[...]] y el frontmatter
let raw = fs.readFileSync(path.join(dir, "script.md"), "utf8");
raw = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
const clean = raw.replace(/\[\[[^\]]*\]\]/g, "").replace(/\*\*|==/g, "").replace(/\s+/g, " ").trim();
console.log(`texto: ${clean.split(/\s+/).length} palabras`);

const audio = path.join(dir, "audio.mp3");
const wordsFile = path.join(dir, "words.json");

async function tts(text) {
  const fd = new FormData();
  fd.append("text", text); fd.append("voice_id", VOICE_ID); fd.append("speed", String(SPEED)); fd.append("with_transcript", "false");
  const r = await fetch(`${BASE}/text-to-speech`, { method: "POST", headers: H(), body: fd });
  const t = await r.text(); if (!r.ok) throw new Error(t);
  const id = pick(JSON.parse(t), ["task_id", "id", "data.task_id", "data.id"]); if (!id) throw new Error(t);
  for (let i = 0; i < 200; i++) {
    const rr = await fetch(`${BASE}/task/${encodeURIComponent(id)}`, { headers: H() }); const tt = await rr.text();
    let j; try { j = JSON.parse(tt); } catch { j = null; }
    const st = pick(j || {}, ["data.status", "status", "state"]);
    if (st && /done|complete|success|finished/i.test(st)) { const u = (tt.match(/https?:\/\/cdn\.ai33\.pro\/[^"\\ ]+/) || [])[0]; if (u) return u; throw new Error("done sin URL: " + tt.slice(0, 200)); }
    if (st && /fail|error/i.test(st)) throw new Error(tt);
    await sleep(3000);
  }
  throw new Error("TTS timeout");
}
const dl = async (url, dest) => { const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }); if (!r.ok) throw new Error("dl " + r.status); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); };

// PASO 1 · VOZ (de PAGO, ai33.pro). Solo se llama si NO existe ya el audio del episodio.
//   Así los re-renders NUNCA gastan saldo. (FORCE_TTS=1 fuerza regenerar la voz a propósito.)
if (fs.existsSync(audio) && !process.env.FORCE_TTS) {
  console.log("♻️  audio.mp3 ya existe -> se REUTILIZA la voz (0 gasto).");
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

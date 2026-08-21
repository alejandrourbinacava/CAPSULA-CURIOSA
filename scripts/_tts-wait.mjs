// _tts-wait: espera a que genaipro (voz) se recupere y genera audio.mp3 + words.json.
//   Reintenta cada 4 min; cada intento sondea hasta ~2,5 min. Al lograrlo: recorta silencios + Whisper.
// Uso: node scripts/_tts-wait.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const dir = process.argv[2];
const VOICE_ID = "851ejYcv2BoNPjrkw93G", SPEED = 1.05, MODEL = "eleven_multilingual_v2", BASE = "https://genaipro.io/api/v1";
const GEN = (() => { const m = fs.readFileSync(".env", "utf8").match(/GENAIPRO_API_KEY\s*=\s*(.+)/); return m ? m[1].trim().replace(/^["']|["']$/g, "") : ""; })();
const H = { Authorization: `Bearer ${GEN}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const audio = path.join(dir, "audio.mp3"), wordsFile = path.join(dir, "words.json");

let raw = fs.readFileSync(path.join(dir, "script.md"), "utf8").replace(/^---\n[\s\S]*?\n---\n?/, "");
const clean = raw.replace(/\[\[[^\]]*\]\]/g, "").replace(/\*\*|==/g, "").replace(/\s+/g, " ").trim();

async function attempt() {
  const r = await fetch(`${BASE}/labs/task`, { method: "POST", headers: H, body: JSON.stringify({ input: clean, voice_id: VOICE_ID, model_id: MODEL, speed: SPEED }) });
  if (!r.ok) throw new Error("submit " + r.status);
  const id = (await r.json()).task_id; if (!id) throw new Error("sin task_id");
  for (let i = 0; i < 26; i++) { // ~2,6 min
    await sleep(6000);
    const j = await (await fetch(`${BASE}/labs/task?task_id=${id}`, { headers: H })).json();
    const it = (j.tasks || []).find(x => x.id === id);
    if (it && it.result) return it.result;
    if (it && /fail|error/i.test(it.status || "")) throw new Error("task fail");
  }
  throw new Error("processing (genaipro lento)");
}

const run = async () => {
  if (fs.existsSync(audio) && fs.existsSync(wordsFile)) { console.log("VOZ LISTA (ya existía)"); return; }
  const deadline = Date.now() + 90 * 60 * 1000;
  let url = null, n = 0;
  while (Date.now() < deadline && !url) {
    n++;
    try { url = await attempt(); }
    catch (e) { console.log(`intento ${n}: ${(e.message || "").slice(0, 40)} — reintento en 4 min`); await sleep(4 * 60 * 1000); }
  }
  if (!url) { console.log("SONDA AGOTADA: genaipro sigue caído tras 90 min"); process.exit(2); }
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  fs.writeFileSync(path.join(dir, "_raw.mp3"), Buffer.from(await r.arrayBuffer()));
  execSync(`ffmpeg -y -v error -i "${path.join(dir, "_raw.mp3")}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse" "${audio}"`);
  console.log("🎙️ audio.mp3 generado — sacando words.json (Whisper)...");
  execSync(`python scripts/whisper_words.py "${audio}" "${wordsFile}"`, { stdio: "inherit" });
  console.log("VOZ LISTA");
};
run().catch(e => { console.error("✗", e.message); process.exit(1); });

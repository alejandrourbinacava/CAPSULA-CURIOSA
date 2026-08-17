// Genera la narración del Vídeo 1 (Trastornos de personalidad), recorta silencios,
// mide duración y escribe un manifest JSON para la composición Remotion.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadKey() {
  if (process.env.GENAIPRO_API_KEY) return process.env.GENAIPRO_API_KEY.trim();
  const p = path.join(__dirname, ".env");
  const m = fs.existsSync(p) && fs.readFileSync(p, "utf8").match(/GENAIPRO_API_KEY\s*=\s*(.+)/);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}
const API_KEY = loadKey();
const BASE = "https://genaipro.io/api/v1";
const VOICE_ID = "851ejYcv2BoNPjrkw93G";
const MODEL_ID = "eleven_multilingual_v2";
const SPEED = 1.08;
const FPS = 30;
const OUT = path.join(__dirname, "public", "voz1");
const TMP = path.join(OUT, "_raw");

const LINES = [
  ["v01", "intro", "Todos conocemos a alguien así. Quizá tú mismo. Existen diez trastornos de la personalidad reconocidos, y hoy te los explico todos, uno por uno. Vamos."],
  ["v02", "Paranoide", "El paranoide vive convencido de que todos quieren engañarlo o hacerle daño. Desconfía hasta de sus seres queridos y guarda rencores durante años."],
  ["v03", "Esquizoide", "El esquizoide no busca compañía: prefiere estar solo. Le dan igual los elogios y las críticas, y casi nunca muestra sus emociones."],
  ["v04", "Esquizotípico", "El esquizotípico tiene creencias y percepciones extrañas: pensamiento mágico, supersticiones intensas y una forma de hablar peculiar."],
  ["v05", "Antisocial", "El antisocial ignora las normas y los derechos de los demás. Miente, manipula y no siente culpa. Es el perfil asociado a la psicopatía."],
  ["v06", "Límite", "El límite vive las emociones al extremo: pasa del amor al odio en minutos. Un miedo intenso al abandono y la impulsividad marcan su día a día."],
  ["v07", "Histriónico", "El histriónico necesita ser el centro de atención siempre. Dramatiza, seduce, y se siente incómodo cuando no todos lo miran."],
  ["v08", "Narcisista", "El narcisista se cree superior y especial. Busca admiración constante y le cuesta enormemente ponerse en el lugar de los demás."],
  ["v09", "Evitativo", "El evitativo se muere de ganas de conectar, pero el miedo al rechazo lo paraliza. Se siente inferior y evita el contacto social."],
  ["v10", "Dependiente", "El dependiente necesita que otros decidan por él. Teme la soledad y hace lo que sea para no quedarse sin apoyo."],
  ["v11", "Obsesivo", "Y el obsesivo de la personalidad busca el orden y el control perfectos. Rígido, perfeccionista y adicto al trabajo, hasta paralizarse."],
  ["v12", "cierre", "Estos son los diez. ¿Reconociste a alguien? Suscríbete a Cápsula Curiosa para más."],
];

const H = () => ({ Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (o, ks) => { for (const k of ks) { let v = o; for (const p of k.split(".")) v = v?.[p]; if (v != null) return v; } };

async function createTask(text) {
  const res = await fetch(`${BASE}/labs/task`, { method: "POST", headers: H(), body: JSON.stringify({ input: text, voice_id: VOICE_ID, model_id: MODEL_ID, speed: SPEED }) });
  const t = await res.text(); if (!res.ok) throw new Error(`POST ${res.status}: ${t}`);
  const j = JSON.parse(t); const id = pick(j, ["task_id", "id", "data.task_id", "data.id"]);
  if (!id) throw new Error("sin task_id: " + t); return id;
}
async function poll(id) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`${BASE}/labs/task?task_id=${encodeURIComponent(id)}`, { headers: H() });
    const t = await res.text(); let j; try { j = JSON.parse(t); } catch { j = null; }
    let item = j; const list = pick(j || {}, ["data", "items", "results", "tasks"]);
    if (Array.isArray(list)) item = list.find((x) => pick(x, ["task_id", "id"]) === id) || list[0];
    else if (Array.isArray(j)) item = j.find((x) => pick(x, ["task_id", "id"]) === id) || j[0];
    const st = pick(item || {}, ["status", "state"]); const url = pick(item || {}, ["result", "audio_url", "url", "output"]);
    if (st && /complete|success|done|finished/i.test(st) && url) return url;
    if (st && /fail|error/i.test(st)) throw new Error("fallo: " + JSON.stringify(item));
    await sleep(3000);
  }
  return `https://files.genaipro.vn/${id}.mp3`;
}
async function download(url, dest) { const r = await fetch(url); if (!r.ok) throw new Error("dl " + r.status); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); }

async function main() {
  if (!API_KEY) { console.error("Falta GENAIPRO_API_KEY en .env"); process.exit(1); }
  fs.mkdirSync(TMP, { recursive: true });
  const manifest = [];
  for (const [id, label, text] of LINES) {
    process.stdout.write(`▶ ${id} (${label})... `);
    const taskId = await createTask(text);
    const url = await poll(taskId);
    const raw = path.join(TMP, `${id}.mp3`);
    await download(url, raw);
    // recortar silencios de inicio/fin
    const final = path.join(OUT, `${id}.mp3`);
    execSync(`ffmpeg -y -v error -i "${raw}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse" "${final}"`);
    const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${final}"`).toString().trim());
    const frames = Math.ceil(dur * FPS);
    manifest.push({ id, label, text, durSec: dur, frames });
    console.log(`${dur.toFixed(2)}s`);
  }
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  const total = manifest.reduce((a, m) => a + m.frames, 0);
  console.log(`\n🎉 ${manifest.length} clips · ${(total / FPS).toFixed(1)}s de narración · manifest.json escrito`);
}
main().catch((e) => { console.error("💥 " + e.message); process.exit(1); });

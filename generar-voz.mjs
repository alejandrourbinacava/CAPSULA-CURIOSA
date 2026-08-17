// Generador de voz TTS con genaipro (voz Tony) para el canal explicativo.
// Uso:  GENAIPRO_API_KEY=xxxx node generar-voz.mjs
// o crea un archivo .env con:  GENAIPRO_API_KEY=xxxx
//
// Descarga linea1.mp3 ... lineaN.mp3 en public/voz/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- cargar API key desde entorno o .env ---
function loadKey() {
  if (process.env.GENAIPRO_API_KEY) return process.env.GENAIPRO_API_KEY.trim();
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, "utf8").match(/GENAIPRO_API_KEY\s*=\s*(.+)/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const API_KEY = loadKey();
const BASE = process.env.GENAIPRO_BASE || "https://genaipro.io/api/v1";
const VOICE_ID = process.env.GENAIPRO_VOICE || "851ejYcv2BoNPjrkw93G"; // Tony
const MODEL_ID = process.env.GENAIPRO_MODEL || "eleven_multilingual_v2";
const OUT_DIR = path.join(__dirname, "public", "voz");

const LINES = [
  { file: "linea1.mp3", text: "Tu PC tiene ocho piezas clave. Vamos a conocerlas." },
  { file: "linea2.mp3", text: "La placa madre es la base: conecta la tarjeta gráfica y el procesador." },
  { file: "linea3.mp3", text: "Y también decide cuántos discos SSD puedes poner." },
  { file: "linea4.mp3", text: "Viene en tres tamaños: Mini I.T.X., Micro A.T.X. y A.T.X." },
  { file: "linea5.mp3", text: "Y si eliges mal, acabas con un pisapapeles de cuatrocientos dólares." },
];

const H = () => ({ Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pick(obj, keys) {
  for (const k of keys) {
    const parts = k.split(".");
    let v = obj;
    for (const p of parts) v = v?.[p];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

async function createTask(text) {
  const res = await fetch(`${BASE}/labs/task`, {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ input: text, voice_id: VOICE_ID, model_id: MODEL_ID, speed: 1.0 }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`POST /labs/task ${res.status}: ${body}`);
  let json;
  try { json = JSON.parse(body); } catch { throw new Error(`Respuesta no-JSON: ${body}`); }
  const id = pick(json, ["task_id", "id", "data.task_id", "data.id", "result.task_id"]);
  if (!id) throw new Error(`No encontré task_id en: ${JSON.stringify(json)}`);
  return id;
}

async function poll(taskId, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${BASE}/labs/task?task_id=${encodeURIComponent(taskId)}`, { headers: H() });
    const body = await res.text();
    let json; try { json = JSON.parse(body); } catch { json = null; }
    // la respuesta puede ser un objeto o una lista (historial)
    let item = json;
    const list = pick(json || {}, ["data", "items", "results", "tasks"]);
    if (Array.isArray(list)) item = list.find((t) => pick(t, ["task_id", "id"]) === taskId) || list[0];
    else if (Array.isArray(json)) item = json.find((t) => pick(t, ["task_id", "id"]) === taskId) || json[0];
    const status = pick(item || {}, ["status", "state"]);
    const url = pick(item || {}, ["result", "audio_url", "url", "output", "file_url"]);
    process.stdout.write(`   estado: ${status || "?"}\r`);
    if (status && /complete|success|done|finished/i.test(String(status)) && url) return url;
    if (status && /fail|error/i.test(String(status))) throw new Error(`Tarea fallida: ${JSON.stringify(item)}`);
    await sleep(3000);
  }
  // último recurso: URL determinista
  return `https://files.genaipro.vn/${taskId}.mp3`;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Descarga ${res.status} de ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  if (!API_KEY) {
    console.error("\n❌ Falta la API key. Crea remotion-canal/.env con:  GENAIPRO_API_KEY=tu_clave\n");
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Base: ${BASE}\nVoz: ${VOICE_ID}\nModelo: ${MODEL_ID}\n`);
  for (const l of LINES) {
    console.log(`▶ ${l.file}: "${l.text}"`);
    const id = await createTask(l.text);
    console.log(`   task_id: ${id}`);
    const url = await poll(id);
    const bytes = await download(url, path.join(OUT_DIR, l.file));
    console.log(`   ✅ guardado (${(bytes / 1024).toFixed(0)} KB)\n`);
  }
  console.log("🎉 Listo. Los 5 MP3 están en public/voz/");
}

main().catch((e) => { console.error("\n💥 " + e.message); process.exit(1); });

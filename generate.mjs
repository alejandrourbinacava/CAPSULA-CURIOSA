// FASE 2 — motor de generación: lee video.config.json y regenera TODO (voz, manifest,
// sincronía, fotos y vídeos). Pensado para correr en GitHub Actions con las API keys en Secrets.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "video.config.json"), "utf8"));

function envKey(name) {
  if (process.env[name]) return process.env[name].trim();
  const p = path.join(__dirname, ".env");
  if (fs.existsSync(p)) { const m = fs.readFileSync(p, "utf8").match(new RegExp(name + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); }
  return null;
}
const GEN = envKey("GENAIPRO_API_KEY"), PIX = envKey("PIXABAY_KEY"), PEX = envKey("PEXELS_KEY"), GIPHY = envKey("GIPHY_KEY");
const BASE = "https://genaipro.io/api/v1", MODEL = "eleven_multilingual_v2", FPS = cfg.fps || 30;
const VOZ = path.join(__dirname, "public", "voz1deep"), TMP = path.join(VOZ, "_raw");
const MEDIA = path.join(__dirname, "public", "media");
fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(MEDIA, { recursive: true });
const H = () => ({ Authorization: `Bearer ${GEN}`, "Content-Type": "application/json" });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pick = (o, ks) => { for (const k of ks) { let v = o; for (const p of k.split(".")) v = v?.[p]; if (v != null) return v; } };
const durOf = (f) => parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString().trim());

async function tts(text) {
  const r = await fetch(`${BASE}/labs/task`, { method: "POST", headers: H(), body: JSON.stringify({ input: text, voice_id: cfg.voiceId, model_id: MODEL, speed: cfg.speed || 1.0 }) });
  const t = await r.text(); if (!r.ok) throw new Error(t); const id = pick(JSON.parse(t), ["task_id", "id", "data.task_id", "data.id"]);
  for (let i = 0; i < 90; i++) { const rr = await fetch(`${BASE}/labs/task?task_id=${encodeURIComponent(id)}`, { headers: H() }); const tt = await rr.text(); let j; try { j = JSON.parse(tt); } catch { j = null; } let it = j; const l = pick(j || {}, ["data", "items", "results", "tasks"]); if (Array.isArray(l)) it = l.find(x => pick(x, ["task_id", "id"]) === id) || l[0]; const st = pick(it || {}, ["status", "state"]); const u = pick(it || {}, ["result", "audio_url", "url", "output"]); if (st && /complete|success|done|finished/i.test(st) && u) return u; if (st && /fail|error/i.test(st)) throw new Error(tt); await sleep(3000); }
  return `https://files.genaipro.vn/${id}.mp3`;
}
async function dl(url, dest) { const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }); if (!r.ok) throw new Error("dl " + r.status); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); }

// 1) VOZ + MANIFEST (orden: intro, grupos, items..., outro)
const segs = [{ id: cfg.intro.id, label: "intro", text: cfg.intro.narration }, { id: cfg.grupos.id, label: "grupos", text: cfg.grupos.narration }, ...cfg.items.map(it => ({ id: it.id, label: it.key, text: it.narration })), { id: cfg.outro.id, label: "cierre", text: cfg.outro.narration }];
const manifest = [];
for (const sg of segs) {
  process.stdout.write(`🎙️  ${sg.id} (${sg.label})... `);
  const url = await tts(sg.text); const raw = path.join(TMP, `${sg.id}.mp3`); await dl(url, raw);
  const fin = path.join(VOZ, `${sg.id}.mp3`);
  execSync(`ffmpeg -y -v error -i "${raw}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse" "${fin}"`);
  const d = durOf(fin); manifest.push({ id: sg.id, label: sg.label, frames: Math.ceil(d * FPS), durSec: d }); console.log(`${d.toFixed(1)}s`);
}
fs.writeFileSync(path.join(VOZ, "manifest.json"), JSON.stringify(manifest, null, 2));

// 2) ANCHORS (por item, sincronizando con la narración)
const norm = (w) => w.toLowerCase().replace(/[.,;:¿?¡!«»]/g, "");
const anchors = {};
for (const it of cfg.items) {
  const words = it.narration.split(/\s+/), N = words.length, low = words.map(norm), du = manifest.find(m => m.id === it.id).durSec;
  const t = (i) => i < 0 ? -1 : Math.round((i / N) * du * FPS);
  const idx = (w) => low.indexOf(w);
  const sen = idx("señales"); let causa = -1; for (let i = sen > 0 ? sen : 0; i < low.length; i++) if (["qué", "dónde", "causa"].includes(low[i])) { causa = i; break; }
  let cons = -1; for (let i = low.length - 1; i >= 0; i--) if (low[i] === "cómo") { cons = i; break; }
  anchors[it.id] = { fuera: t(idx("fuera")), dentro: t(idx("dentro")), senales: t(sen), causa: t(causa), ejemplo: t(idx("ejemplo")), consejo: t(cons) };
}
fs.writeFileSync(path.join(VOZ, "anchors.json"), JSON.stringify(anchors, null, 2));

// 3) MEDIA (foto + clip de vídeo por item, Pixabay)
async function pixVideos(q, n = 2) { try { const j = await (await fetch(`https://pixabay.com/api/videos/?key=${PIX}&q=${encodeURIComponent(q)}&per_page=12&safesearch=true`)).json(); return (j.hits || []).slice(0, n).map(h => h.videos.small?.url || h.videos.medium?.url || h.videos.tiny.url); } catch { return []; } }
async function pixPhoto(q) { try { const j = await (await fetch(`https://pixabay.com/api/?key=${PIX}&q=${encodeURIComponent(q)}&image_type=photo&per_page=8&safesearch=true&orientation=horizontal`)).json(); const h = (j.hits || [])[0]; return h ? (h.largeImageURL || h.webformatURL) : null; } catch { return null; } }
async function pexVideos(q, n = 2) { if (!PEX) return []; try { const j = await (await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=6&orientation=landscape`, { headers: { Authorization: PEX } })).json(); return (j.videos || []).slice(0, n).map(v => { const f = (v.video_files || []).filter(x => /mp4/.test(x.file_type || "")); return (f.find(x => x.height >= 540 && x.height <= 1080) || f[0])?.link; }).filter(Boolean); } catch { return []; } }
async function pexPhoto(q) { if (!PEX) return null; try { const j = await (await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=6&orientation=landscape`, { headers: { Authorization: PEX } })).json(); const h = (j.photos || [])[0]; return h ? (h.src.large || h.src.landscape) : null; } catch { return null; } }
async function giphyGif(q) { if (!GIPHY) return null; try { const j = await (await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY}&q=${encodeURIComponent(q)}&limit=10&rating=pg-13&lang=es`)).json(); const h = (j.data || [])[0]; return h ? (h.images.downsized_medium?.url || h.images.fixed_height?.url || h.images.original?.url) : null; } catch { return null; } }
const mediaFlags = {};
for (const it of cfg.items) {
  let vids = await pixVideos(it.videoQuery, 2);
  if (vids.length < 2) vids = vids.concat(await pexVideos(it.videoQuery, 2 - vids.length));
  if (vids[0]) await dl(vids[0], path.join(MEDIA, `${it.key}_vid.mp4`));
  if (vids[1] || vids[0]) await dl(vids[1] || vids[0], path.join(MEDIA, `${it.key}_vid2.mp4`));
  let photo = await pixPhoto(it.photoQuery); if (!photo) photo = await pexPhoto(it.photoQuery);
  if (photo) await dl(photo, path.join(MEDIA, `${it.key}_photo.jpg`));
  let gif = false; const gu = await giphyGif(it.gifQuery || it.photoQuery || it.name); if (gu) { try { await dl(gu, path.join(MEDIA, `${it.key}.gif`)); gif = true; } catch {} }
  mediaFlags[it.key] = { gif };
  // GARANTIZAR que existan foto + 2 clips (el nuevo diseño usa fondo real en cada escena): si falta, fallback
  const P = (s) => path.join(MEDIA, `${it.key}${s}`);
  const ph = P("_photo.jpg"), v1 = P("_vid.mp4"), v2 = P("_vid2.mp4");
  if (!fs.existsSync(v1) && fs.existsSync(v2)) fs.copyFileSync(v2, v1);
  if (!fs.existsSync(ph) && fs.existsSync(v1)) { try { execSync(`ffmpeg -y -v error -ss 0.5 -i "${v1}" -frames:v 1 "${ph}"`); } catch {} }
  if (!fs.existsSync(ph)) { execSync(`ffmpeg -y -v error -f lavfi -i color=c=0x1b2735:s=1280x720:d=1 -frames:v 1 "${ph}"`); }
  if (!fs.existsSync(v1)) { execSync(`ffmpeg -y -v error -loop 1 -i "${ph}" -t 3 -c:v libx264 -pix_fmt yuv420p -vf scale=1280:720 "${v1}"`); }
  if (!fs.existsSync(v2)) fs.copyFileSync(v1, v2);
  console.log(`🖼️  ${it.key}: ${vids.length} vídeo(s)${photo ? " + foto" : ""}${gif ? " + gif" : ""}`);
}
fs.writeFileSync(path.join(MEDIA, "media.json"), JSON.stringify(mediaFlags, null, 2));

// 4) MÚSICA (reutiliza script determinista) + SFX de pops en cada cambio de escena
execSync("node generar-musica.mjs", { cwd: __dirname, stdio: "inherit" });
{
  const SR = 44100, PAD = 6; let acc = 0; const times = [];
  for (const m of manifest) { const isItem = cfg.items.find(i => i.id === m.id); if (isItem) { const a = anchors[m.id]; for (const b of [0, a.fuera, a.senales, a.causa, a.ejemplo, a.consejo]) times.push((acc + b) / FPS + 0.05); } else { times.push(acc / FPS + 0.05); } acc += m.frames + PAD; }
  const DUR = acc / FPS + 0.5, Ns = Math.floor(SR * DUR), out = new Float32Array(Ns);
  const pop = (() => { const n = Math.floor(SR * 0.12), b = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * (480 + 480 * Math.exp(-t * 30)) * t) * Math.exp(-t * 26) * 0.5; } return b; })();
  for (const tt of times) { const o = Math.floor(tt * SR); for (let i = 0; i < pop.length && o + i < Ns; i++) out[o + i] += pop[i] * 0.7; }
  let pk = 0; for (let i = 0; i < Ns; i++) pk = Math.max(pk, Math.abs(out[i])); const g = pk > 0 ? Math.pow(10, -3 / 20) / pk : 1;
  const buf = Buffer.alloc(44 + Ns * 2); buf.write("RIFF", 0); buf.writeUInt32LE(36 + Ns * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(Ns * 2, 40);
  for (let i = 0; i < Ns; i++) buf.writeInt16LE((Math.max(-1, Math.min(1, out[i] * g)) * 32767) | 0, 44 + i * 2);
  fs.writeFileSync(path.join(__dirname, "public", "voz", "sfx_full.wav"), buf);
}
console.log(`\n✅ Generado todo desde config · ${manifest.length} clips · ${(manifest.reduce((a, m) => a + m.frames, 0) / FPS / 60).toFixed(1)} min`);

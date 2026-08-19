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
  for (let i = 0; i < 180; i++) { const rr = await fetch(`${BASE}/labs/task?task_id=${encodeURIComponent(id)}`, { headers: H() }); const tt = await rr.text(); let j; try { j = JSON.parse(tt); } catch { j = null; } let it = j; const l = pick(j || {}, ["data", "items", "results", "tasks"]); if (Array.isArray(l)) it = l.find(x => pick(x, ["task_id", "id"]) === id) || l[0]; const st = pick(it || {}, ["status", "state"]); const u = pick(it || {}, ["result", "audio_url", "url", "output"]); if (st && /complete|success|done|finished/i.test(st) && u) return u; if (st && /fail|error/i.test(st)) throw new Error(tt); await sleep(3000); }
  throw new Error("TTS timeout (sin URL tras 9 min) task=" + id);
}
async function dl(url, dest) { const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }); if (!r.ok) throw new Error("dl " + r.status); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); }
// genera + descarga una voz con reintentos (la API a veces tarda o falla puntualmente)
async function ttsToFile(text, dest) {
  let lastErr;
  for (let a = 1; a <= 3; a++) {
    try { const url = await tts(text); await dl(url, dest); return; }
    catch (e) { lastErr = e; process.stdout.write(`(reintento ${a}: ${(e.message || "").slice(0, 60)}) `); await sleep(5000); }
  }
  throw lastErr;
}

// 1) VOZ + MANIFEST (orden: intro, grupos, items..., outro)
const segs = [{ id: cfg.intro.id, label: "intro", text: cfg.intro.narration }, { id: cfg.grupos.id, label: "grupos", text: cfg.grupos.narration }, ...cfg.items.map(it => ({ id: it.id, label: it.key, text: it.narration })), { id: cfg.outro.id, label: "cierre", text: cfg.outro.narration }];
const manifest = [];
for (const sg of segs) {
  process.stdout.write(`🎙️  ${sg.id} (${sg.label})... `);
  const raw = path.join(TMP, `${sg.id}.mp3`); await ttsToFile(sg.text, raw);
  const fin = path.join(VOZ, `${sg.id}.mp3`);
  execSync(`ffmpeg -y -v error -i "${raw}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:detection=peak,areverse" "${fin}"`);
  const d = durOf(fin); manifest.push({ id: sg.id, label: sg.label, frames: Math.ceil(d * FPS), durSec: d }); console.log(`${d.toFixed(1)}s`);
}
fs.writeFileSync(path.join(VOZ, "manifest.json"), JSON.stringify(manifest, null, 2));

// 2) BEATS: cronometrar cada beat por palabras del "say" + bajar su media (lo que se ve = lo que se oye)
async function pixVideos(q, n = 2) { try { const j = await (await fetch(`https://pixabay.com/api/videos/?key=${PIX}&q=${encodeURIComponent(q)}&per_page=12&safesearch=true`)).json(); return (j.hits || []).slice(0, n).map(h => h.videos.small?.url || h.videos.medium?.url || h.videos.tiny.url); } catch { return []; } }
async function pixPhoto(q) { try { const j = await (await fetch(`https://pixabay.com/api/?key=${PIX}&q=${encodeURIComponent(q)}&image_type=photo&per_page=8&safesearch=true&orientation=horizontal`)).json(); const h = (j.hits || [])[0]; return h ? (h.largeImageURL || h.webformatURL) : null; } catch { return null; } }
async function pexVideos(q, n = 2) { if (!PEX) return []; try { const j = await (await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=6&orientation=landscape`, { headers: { Authorization: PEX } })).json(); return (j.videos || []).slice(0, n).map(v => { const f = (v.video_files || []).filter(x => /mp4/.test(x.file_type || "")); return (f.find(x => x.height >= 540 && x.height <= 1080) || f[0])?.link; }).filter(Boolean); } catch { return []; } }
async function pexPhoto(q) { if (!PEX) return null; try { const j = await (await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=6&orientation=landscape`, { headers: { Authorization: PEX } })).json(); const h = (j.photos || [])[0]; return h ? (h.src.large || h.src.landscape) : null; } catch { return null; } }
async function giphyGif(q) { if (!GIPHY) return null; try { const j = await (await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY}&q=${encodeURIComponent(q)}&limit=10&rating=pg-13`)).json(); const h = (j.data || [])[0]; return h ? (h.images.downsized_medium?.url || h.images.fixed_height?.url || h.images.original?.url) : null; } catch { return null; } }
// imagen REAL y relevante de algo con nombre propio (consola, juego, animal, lugar, persona, objeto) vía Wikipedia
async function wikiImage(q) { for (const lang of ["en", "es"]) { try { const s = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=1&origin=*`)).json(); const t = s?.query?.search?.[0]?.title; if (!t) continue; const r = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=1600&format=json&origin=*`)).json(); const p = Object.values(r?.query?.pages || {})[0]; const u = p?.thumbnail?.source || p?.original?.source; if (u) return u; } catch { } } return null; }
const extOf = (u) => /\.png(\?|$)/i.test(u) ? "png" : /\.svg(\?|$)/i.test(u) ? "svg" : /\.gif(\?|$)/i.test(u) ? "gif" : "jpg";
// generación con IA (Pollinations, gratis y sin key) como último recurso para cosas concretas
async function aiImage(q, dest) { try { const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(q + ", clean illustration, white background")}?width=900&height=520&nologo=true&model=flux`; const r = await fetch(url); if (!r.ok) return false; const b = await r.arrayBuffer(); if (b.byteLength < 3000) return false; fs.writeFileSync(dest, Buffer.from(b)); return true; } catch { return false; } }
// icono/dibujo VECTORIAL relevante del concepto (Iconify: cientos de miles, muchos a color estilo sticker)
const COLORFUL = ["twemoji", "noto", "fluent-emoji", "fluent-emoji-flat", "fxemoji", "emojione", "openmoji", "streamline-emojis"];
const ICON_JUNK = /question|help|unknown|not-?found|circle-help|block-helper|placeholder|dots|comment-question/i;
async function iconifyIcon(q, dest) {
  const tryq = async (query) => { try { const j = await (await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=24`)).json(); return (j.icons || []).filter(i => !ICON_JUNK.test(i)); } catch { return []; } };
  try {
    let icons = await tryq(q);
    if (!icons.length && q.includes(" ")) icons = await tryq(q.split(/\s+/).slice(-1)[0]);
    if (!icons.length) return null;
    const pick = icons.find(i => COLORFUL.some(p => i.startsWith(p + ":"))) || icons[0];
    const colorful = COLORFUL.some(p => pick.startsWith(p + ":"));
    const [prefix, name] = pick.split(":");
    const svg = await (await fetch(`https://api.iconify.design/${prefix}/${name}.svg?height=260`)).text();
    if (!svg.includes("<svg")) return null;
    fs.writeFileSync(dest, svg); return { colorful };
  } catch { return null; }
}
const wc = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;
const beatsOut = {};
for (const it of cfg.items) {
  const itFrames = manifest.find(m => m.id === it.id).frames;
  const totW = it.beats.reduce((a, b) => a + wc(b.say), 0) || 1;
  // foto ancla (arriba-izda) = imagen real del ítem (Wikipedia; si no, IA)
  let ref = null;
  try { const rw = await wikiImage(it.name); if (rw) { const rf = `${it.key}_ref.${extOf(rw)}`; await dl(rw, path.join(MEDIA, rf)); ref = "media/" + rf; } } catch { }

  let cum = 0; const arr = [];
  for (let i = 0; i < it.beats.length; i++) {
    const b = it.beats[i];
    const f = Math.round((cum / totW) * itFrames); cum += wc(b.say);
    let file = null, kind = null;
    // marca conocida -> logo VECTORIAL (SimpleIcons); tiene prioridad sobre foto
    if (b.brand) {
      const slug = String(b.brand).toLowerCase().replace(/[^a-z0-9]/g, "");
      try { const r = await fetch(`https://cdn.simpleicons.org/${slug}`); const t = await r.text(); if (r.ok && t.includes("<svg")) { const f = `${it.key}_b${i}_logo.svg`; fs.writeFileSync(path.join(MEDIA, f), t); file = "media/" + f; kind = "logo"; } } catch {}
    }
    // Baja imagen RELEVANTE si Claude pidió media; si es "none", queda como ICONO SVG grande
    if (!file && b.media && b.media !== "none" && b.query) {
      const base = `${it.key}_b${i}`;
      const saveImg = async (url) => { const f = `${base}.${extOf(url)}`; await dl(url, path.join(MEDIA, f)); return "media/" + f; };
      try {
        if (b.media === "gif") {
          const g = await giphyGif(b.query); if (g) { const f = `${base}.gif`; await dl(g, path.join(MEDIA, f)); file = "media/" + f; kind = "gif"; }
          if (!file) { const w = await wikiImage(b.query); if (w) { file = await saveImg(w); kind = "img"; } }
        } else {
          // cosa con nombre propio -> Wikipedia (imagen real), luego Giphy (juegos/cultura pop), luego stock
          const w = await wikiImage(b.query); if (w) { file = await saveImg(w); kind = "img"; }
          if (!file) { const g = await giphyGif(b.query); if (g) { const f = `${base}.gif`; await dl(g, path.join(MEDIA, f)); file = "media/" + f; kind = "gif"; } }
          if (!file && b.media === "clip") { const v = (await pixVideos(b.query, 1))[0] || (await pexVideos(b.query, 1))[0]; if (v) { await dl(v, path.join(MEDIA, base + ".mp4")); file = "media/" + base + ".mp4"; kind = "vid"; } }
          if (!file) { const p = await pixPhoto(b.query) || await pexPhoto(b.query); if (p) { await dl(p, path.join(MEDIA, base + ".jpg")); file = "media/" + base + ".jpg"; kind = "img"; } }
        }
      } catch { }
      // si no hay imagen REAL relevante, se queda como ICONO/palabra (NUNCA imagen IA cutre ni foto sin relación)
    }
    const bullets = Array.isArray(b.bullets) ? b.bullets.filter(x => x && x.trim()).slice(0, 3) : [];
    // dibujo/icono vectorial relevante del concepto (Iconify)
    let iconFile = null, iconColorful = false;
    try { const ic = await iconifyIcon(b.icon || b.text, path.join(MEDIA, `${it.key}_b${i}_ic.svg`)); if (ic) { iconFile = `media/${it.key}_b${i}_ic.svg`; iconColorful = ic.colorful; } } catch { }
    arr.push({ f, text: b.text, iconFile, iconColorful, file, kind, bullets });
  }
  beatsOut[it.id] = { ref, beats: arr };
  console.log(`🎬 ${it.key}: ${arr.length} beats · ${arr.filter(x => x.file).length} con imagen`);
}
fs.writeFileSync(path.join(VOZ, "beats.json"), JSON.stringify(beatsOut, null, 2));

// 4) MÚSICA (reutiliza script determinista) + SFX de pops en cada cambio de escena
execSync("node generar-musica.mjs", { cwd: __dirname, stdio: "inherit" });
{
  const SR = 44100, PAD = 6; let acc = 0; const times = [];
  for (const m of manifest) { const isItem = cfg.items.find(i => i.id === m.id); if (isItem) { for (const bt of (beatsOut[m.id]?.beats || [])) times.push((acc + bt.f) / FPS + 0.02); } else { times.push(acc / FPS + 0.05); } acc += m.frames + PAD; }
  const DUR = acc / FPS + 0.5, Ns = Math.floor(SR * DUR), out = new Float32Array(Ns);
  const pop = (() => { const n = Math.floor(SR * 0.12), b = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * (480 + 480 * Math.exp(-t * 30)) * t) * Math.exp(-t * 26) * 0.5; } return b; })();
  for (const tt of times) { const o = Math.floor(tt * SR); for (let i = 0; i < pop.length && o + i < Ns; i++) out[o + i] += pop[i] * 0.7; }
  let pk = 0; for (let i = 0; i < Ns; i++) pk = Math.max(pk, Math.abs(out[i])); const g = pk > 0 ? Math.pow(10, -3 / 20) / pk : 1;
  const buf = Buffer.alloc(44 + Ns * 2); buf.write("RIFF", 0); buf.writeUInt32LE(36 + Ns * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(Ns * 2, 40);
  for (let i = 0; i < Ns; i++) buf.writeInt16LE((Math.max(-1, Math.min(1, out[i] * g)) * 32767) | 0, 44 + i * 2);
  fs.writeFileSync(path.join(__dirname, "public", "voz", "sfx_full.wav"), buf);
}
console.log(`\n✅ Generado todo desde config · ${manifest.length} clips · ${(manifest.reduce((a, m) => a + m.frames, 0) / FPS / 60).toFixed(1)} min`);

// 02-build-scenes: script.md (con etiquetas [[...]]) + words.json (tiempos por palabra)
//   -> scenes.json (contrato del renderizador, spec §7). Cada etiqueta se ancla a la palabra SIGUIENTE.
// Uso: node scripts/02-build-scenes.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "episodes/test-cpu";
const scriptPath = path.join(dir, "script.md");
const wordsPath = path.join(dir, "words.json");
const assetsPath = path.join(dir, "assets.json"); // { id: {file, kind} }  (rutas relativas a /public)

const raw = fs.readFileSync(scriptPath, "utf8");
// frontmatter
let title = "Episodio", body = raw;
const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (fm) { const mt = fm[1].match(/title:\s*"?(.+?)"?\s*$/m); if (mt) title = mt[1]; body = raw.slice(fm[0].length); }

const assets = fs.existsSync(assetsPath) ? JSON.parse(fs.readFileSync(assetsPath, "utf8")) : {};
const assetFile = (id) => assets[id]?.file || `assets/icons/${id}.svg`;

// --- extraer etiquetas y anclarlas a la palabra siguiente (índice 0-based en el texto limpio)
const tags = []; let clean = ""; let last = 0;
const re = /\[\[([^\]]+)\]\]/g; let m;
while ((m = re.exec(body))) {
  clean += body.slice(last, m.index);
  const wordIdx = clean.trim().split(/\s+/).filter(Boolean).length; // nº de palabras ya emitidas = índice de la siguiente
  tags.push({ raw: m[1].trim(), word: wordIdx });
  last = m.index + m[0].length;
}
clean += body.slice(last);
const cleanWords = clean.trim().split(/\s+/).filter(Boolean);

// --- tiempos por palabra (Whisper). Fallback proporcional si falta.
let words = [];
if (fs.existsSync(wordsPath)) words = JSON.parse(fs.readFileSync(wordsPath, "utf8"));
const meta = { fps: 30, width: 1920, height: 1080, duration: 0, audio: "scene/audio.mp3", title };
if (words.length) meta.duration = Math.max(...words.map(w => w.end)) + 0.6;
else { const wpsec = 2.6; meta.duration = cleanWords.length / wpsec + 0.6; } // ~156 wpm
const timeOf = (wordIdx) => {
  if (words.length) { const w = words[Math.min(wordIdx, words.length - 1)]; return w ? w.start : meta.duration; }
  return Math.min(wordIdx / cleanWords.length * (meta.duration - 0.6), meta.duration - 0.6);
};

// --- procesar etiquetas en orden, resolviendo show/hide/clear/text/arrow/stickman
const elements = [];
const active = new Map(); // id -> element (para cerrar con hide/clear)
let autoId = 0;
const RED = "#E5342A";
const parseSlot = (s) => (s.match(/@([a-z0-9-]+)/) || [])[1] || "center";
const enterFor = (type) => type === "text" ? { kind: "handwrite", duration: 0.8 } : type === "arrow" ? { kind: "draw", duration: 0.55 } : type === "stickman" ? { kind: "fade-in", duration: 0.3 } : { kind: "pop", duration: 0.45 };

for (const tg of tags) {
  const t = +timeOf(tg.word).toFixed(2);
  const s = tg.raw;
  const verb = s.split(/[:\s]/)[0];
  if (verb === "clear") { for (const [, el] of active) el.out = t; active.clear(); continue; }
  if (verb === "hide") { const id = s.replace(/^hide:?\s*/, "").trim(); const el = active.get(id); if (el) { el.out = t; active.delete(id); } continue; }
  if (verb === "show") { const rest = s.replace(/^show:?\s*/, ""); const id = rest.split(/[@\s]/)[0].trim(); const slot = parseSlot(rest); const el = { id, type: "image", src: assetFile(id), slot, in: t, out: meta.duration, enter: enterFor("image"), exit: { kind: "fade-out", duration: 0.3 } }; elements.push(el); active.set(id, el); continue; }
  if (verb === "text") { const cm = s.match(/text:\s*"([^"]*)"/); const content = cm ? cm[1] : ""; const slot = parseSlot(s); const color = /color\s*=\s*red/.test(s) ? RED : "#111"; const size = (s.match(/size\s*=\s*(sm|md|lg)/) || [])[1] || "md"; const id = "t" + (autoId++); const el = { id, type: "text", content, slot, color, size, in: t, out: meta.duration, enter: enterFor("text"), exit: { kind: "fade-out", duration: 0.3 } }; elements.push(el); active.set(id, el); continue; }
  if (verb === "arrow") { const am = s.match(/arrow:\s*([a-z0-9-]+)\s*->\s*([a-z0-9-]+)/); if (!am) continue; const id = "a" + (autoId++); const el = { id, type: "arrow", from: am[1], to: am[2], style: "hand-drawn-red", in: t, out: meta.duration, enter: enterFor("arrow"), exit: { kind: "fade-out", duration: 0.2 } }; elements.push(el); active.set(id, el); continue; }
  if (verb === "stickman") { const rest = s.replace(/^stickman:?\s*/, ""); const pose = rest.split(/[@\s,]/)[0].trim() || "neutral"; const slot = parseSlot(rest); const head = (rest.match(/head\s*=\s*([a-z0-9-]+)/) || [])[1]; const id = "s" + (autoId++); const el = { id, type: "stickman", pose, slot, in: t, out: meta.duration, enter: enterFor("stickman"), exit: { kind: "fade-out", duration: 0.3 } }; if (head) el.head = assetFile(head); elements.push(el); active.set(id, el); continue; }
}
// escalonar entradas que caen casi juntas (spec §8): +0.12s entre las que estén a <0.2s
const byIn = [...elements].sort((a, b) => a.in - b.in);
for (let i = 1; i < byIn.length; i++) { if (byIn[i].in - byIn[i - 1].in < 0.2) byIn[i].in = +(byIn[i - 1].in + 0.12).toFixed(2); }
// mínimo 1.2s en pantalla
for (const el of elements) if (el.out - el.in < 1.2) el.out = +(el.in + 1.2).toFixed(2);

const out = { meta, elements };
fs.writeFileSync(path.join(dir, "scenes.json"), JSON.stringify(out, null, 2));
console.log(`✔ scenes.json: ${elements.length} elementos · ${meta.duration.toFixed(1)}s · "${title}"`);

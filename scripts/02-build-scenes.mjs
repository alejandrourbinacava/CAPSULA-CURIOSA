// 02-build-scenes: script.md (etiquetas [[...]] agrupadas en BEATS) + words.json -> scenes.json
//   Addendum 1: beats + 11 plantillas + tipos clip/gif/shape/stat + capas z-order + colisiones
//   + variedad (anima/flechas alternas) + lint. Cada etiqueta se ancla a la palabra SIGUIENTE.
// Uso: node scripts/02-build-scenes.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { TEMPLATES, boxOf, slotExists, zOf, TEMPLATE_MAX } from "../src/scenes/templates.mjs";

const dir = process.argv[2] || "episodes/test-cpu";
const raw = fs.readFileSync(path.join(dir, "script.md"), "utf8");
let title = "Episodio", body = raw;
const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (fm) { const mt = fm[1].match(/title:\s*"?(.+?)"?\s*$/m); if (mt) title = mt[1]; body = raw.slice(fm[0].length); }

const assets = fs.existsSync(path.join(dir, "assets.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "assets.json"), "utf8")) : {};
const assetFile = (id) => { const f = assets[id]?.file; if (f && fs.existsSync(path.join("public", f))) return f; const g = `assets/icons/${id}.svg`; return fs.existsSync(path.join("public", g)) ? g : null; };

// --- extraer etiquetas ancladas a la palabra siguiente (índice en el texto limpio) ---
const tags = []; let clean = ""; let last = 0;
const re = /\[\[([^\]]+)\]\]/g; let m;
while ((m = re.exec(body))) { clean += body.slice(last, m.index); const wordIdx = clean.trim().split(/\s+/).filter(Boolean).length; tags.push({ raw: m[1].trim(), word: wordIdx }); last = m.index + m[0].length; }
clean += body.slice(last);
const cleanWords = clean.trim().split(/\s+/).filter(Boolean);

// --- tiempos por palabra (Whisper) o proporcional ---
let words = [];
if (fs.existsSync(path.join(dir, "words.json"))) words = JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8"));
const meta = { fps: 30, width: 1920, height: 1080, duration: 0, audio: "active/audio.mp3", title };
if (words.length) meta.duration = Math.max(...words.map(w => w.end)) + 0.6;
else meta.duration = cleanWords.length / 2.6 + 0.6;
const timeOf = (i) => { if (words.length) { const w = words[Math.min(i, words.length - 1)]; return w ? w.start : meta.duration; } return Math.min(i / cleanWords.length * (meta.duration - 0.6), meta.duration - 0.6); };

const RED = "#E5342A";
const verbOf = (s) => s.split(/[:\s]/)[0];
const slotIn = (s) => (s.match(/@([a-z0-9-]+)/) || [])[1] || null;
const kv = (s, k) => (s.match(new RegExp(k + '\\s*=\\s*"([^"]*)"')) || s.match(new RegExp(k + "\\s*=\\s*([a-z0-9-]+)", "i")) || [])[1];

// --- PASO 1: agrupar etiquetas en beats. Frontera = [[beat]] o [[clear]] ---
const beats = []; let cur = null;
const startBeat = (tpl, word) => { cur = { template: tpl || null, explicit: !!tpl, tags: [], word }; beats.push(cur); };
for (const tg of tags) {
  const v = verbOf(tg.raw);
  if (v === "beat") { startBeat(kv(tg.raw, "beat") || tg.raw.replace(/^beat:?\s*/, "").trim(), tg.word); continue; }
  if (!cur) startBeat(null, tg.word);
  cur.tags.push(tg);
  if (v === "clear") cur = null; // el próximo tag abre un beat nuevo
}

// --- inferir plantilla por los slots usados en el beat ---
const STRONG = { focus: "single-focus", label: "single-focus", left: "compare-2", right: "compare-2", "label-left": "compare-2", "label-right": "compare-2", divider: "compare-2", "item-1": "list-3", "item-2": "list-3", "item-3": "list-3", "step-1": "flow-3", "step-2": "flow-3", "step-3": "flow-3", photo: "photo-focus", "caption-top": "photo-focus", "caption-bottom": "photo-focus", number: "stat-card", unit: "stat-card", figure: "stickman-reaction", content: "stickman-reaction", main: "zoom-detail", detail: "zoom-detail", bleed: "full-bleed-clip", title: "title-card" };
const inferTemplate = (slots) => {
  for (const s of slots) if (/^cell-[5-8]$/.test(s)) return "grid-8";
  for (const s of slots) if (/^cell-[1-4]$/.test(s)) return "grid-4";
  for (const s of slots) if (STRONG[s]) return STRONG[s];
  return "single-focus";
};

// --- PASO 2: resolver cada beat ---
const elements = [];
const active = new Map();   // id -> element vivo (para hide/clear/beat)
let badge = null;           // corner-badge persistente
let autoId = 0;
const ENTERS = ["pop", "slide-in-left", "slide-in-bottom", "stamp", "slide-in-right", "fade-in"];
let prevTemplate = null, prevEnter = null, arrowFlip = false;
const usage = {};           // conteo de plantillas
const beatTemplates = [];   // plantilla por beat (para lint:variety)
const warns = [];
const closeActive = (t) => { for (const [, el] of active) el.out = t; active.clear(); };

for (let bi = 0; bi < beats.length; bi++) {
  const beat = beats[bi];
  const slotsUsed = beat.tags.map(tg => slotIn(tg.raw)).filter(Boolean);
  let template = beat.template || inferTemplate(slotsUsed);
  if (!TEMPLATES[template]) { warns.push(`plantilla desconocida "${template}" en beat ${bi} -> single-focus`); template = "single-focus"; }
  const bt = +timeOf(beat.word).toFixed(2);
  closeActive(bt); // el beat nuevo limpia lo anterior (menos el badge)

  // variedad: animación de entrada distinta a la del beat previo
  let enterKind = ENTERS[bi % ENTERS.length];
  if (enterKind === prevEnter) enterKind = ENTERS[(bi + 1) % ENTERS.length];
  if (template === prevTemplate) warns.push(`plantilla repetida en beats consecutivos (${bi - 1}->${bi}): ${template}`);
  usage[template] = (usage[template] || 0) + 1;
  if (usage[template] > TEMPLATE_MAX(template)) warns.push(`plantilla "${template}" usada ${usage[template]} veces (máx ${TEMPLATE_MAX(template)})`);
  prevTemplate = template; prevEnter = enterKind; beatTemplates.push(template);

  const box = (slot) => boxOf(template, slot);
  const push = (el) => { el.z = zOf(el); elements.push(el); if (el.slot === "corner-badge") { if (badge) badge.out = bt; badge = el; active.delete(el.id); } else active.set(el.id, el); return el; };
  const stdEnter = (kind) => ({ kind, duration: kind === "handwrite" ? 0.8 : kind === "draw" ? 0.55 : 0.42 });
  const stdExit = { kind: "fade-out", duration: 0.3 };

  for (const tg of beat.tags) {
    const s = tg.raw, v = verbOf(s), t = +timeOf(tg.word).toFixed(2);
    if (v === "clear") { closeActive(t); continue; }
    if (v === "hide") { const id = s.replace(/^hide:?\s*/, "").trim(); const el = active.get(id); if (el) { el.out = t; active.delete(id); } continue; }
    const slot = slotIn(s);
    if (slot && !slotExists(template, slot)) { warns.push(`slot "${slot}" no existe en "${template}" (beat ${bi}); se omite`); continue; }

    if (v === "show" || v === "clip" || v === "gif") {
      const id = s.replace(/^(show|clip|gif):?\s*/, "").split(/[@\s,]/)[0].trim();
      let type = "image", src = assetFile(id); const frame = kv(s, "frame");
      if (v === "clip" || v === "gif") { type = v; src = assets[id]?.file && fs.existsSync(path.join("public", assets[id].file)) ? assets[id].file : null; }
      if (!src) { warns.push(`asset ausente: "${id}" (beat ${bi}) -> se omite`); continue; }
      const defSlot = type === "clip" ? "photo" : "center";
      push({ id: id + "_" + autoId++, type, src, slot: slot || defSlot, box: box(slot || defSlot), frame, in: t, out: meta.duration, enter: stdEnter(type === "gif" ? "stamp" : enterKind), exit: stdExit });
      continue;
    }
    if (v === "text") {
      const content = (s.match(/text:\s*"([^"]*)"/) || [])[1] || "";
      push({ id: "t" + autoId++, type: "text", content, slot: slot || "bottom", box: box(slot || "bottom"), color: /color\s*=\s*red/.test(s) ? RED : "#111", size: kv(s, "size") || "md", in: t, out: meta.duration, enter: stdEnter("handwrite"), exit: stdExit });
      continue;
    }
    if (v === "stat") {
      const content = (s.match(/stat:\s*"([^"]*)"/) || [])[1] || "";
      push({ id: "n" + autoId++, type: "stat", content, unit: kv(s, "unit") || "", slot: slot || "number", box: box(slot || "number"), color: RED, in: t, out: meta.duration, enter: stdEnter("stamp"), exit: stdExit });
      continue;
    }
    if (v === "stickman") {
      const rest = s.replace(/^stickman:?\s*/, ""); const pose = rest.split(/[@\s,]/)[0].trim() || "neutral"; const head = kv(s, "head");
      const el = { id: "s" + autoId++, type: "stickman", pose, slot: slot || "figure", box: box(slot || "figure"), in: t, out: meta.duration, enter: stdEnter("fade-in"), exit: stdExit };
      if (head && assetFile(head)) el.head = assetFile(head);
      push(el); continue;
    }
    if (v === "shape") {
      const rest = s.replace(/^shape:?\s*/, ""); let kind = rest.split(/[@\s,]/)[0].trim();
      kind = ({ circle: "circle-highlight", cross: "cross-out", check: "checkmark" })[kind] || kind;
      const tb = box(slot || "center"); const per = 2 * (tb.w + tb.h) * 1.6 + 400;
      push({ id: "h" + autoId++, type: "shape", kind, slot: slot || "center", box: tb, _len: per, color: RED, in: t, out: meta.duration, enter: stdEnter("draw"), exit: { kind: "fade-out", duration: 0.25 } });
      continue;
    }
    if (v === "arrow") {
      const am = s.match(/arrow:\s*([a-z0-9-]+)\s*->\s*([a-z0-9-]+)/); if (!am) continue;
      const fb = box(am[1]), tb = box(am[2]); let a, b;
      if (Math.abs(tb.cx - fb.cx) >= Math.abs(tb.cy - fb.cy)) { const dir = Math.sign(tb.cx - fb.cx) || 1; a = { x: fb.cx + dir * (fb.w / 2 - 8), y: fb.cy }; b = { x: tb.cx - dir * (tb.w / 2 - 8), y: tb.cy }; }
      else { const dir = Math.sign(tb.cy - fb.cy) || 1; a = { x: fb.cx, y: fb.cy + dir * (fb.h / 2 - 8) }; b = { x: tb.cx, y: tb.cy - dir * (tb.h / 2 - 8) }; }
      let curve = arrowFlip ? "down" : "up"; arrowFlip = !arrowFlip;
      const midx = (a.x + b.x) / 2, midy = (a.y + b.y) / 2;
      for (const [, e] of active) { if ((e.type === "image" || e.type === "clip" || e.type === "gif") && e.box && Math.abs(e.box.cx - midx) < e.box.w / 2 && Math.abs(e.box.cy - midy) < e.box.h / 2) curve = e.box.cy > 540 ? "up" : "down"; }
      push({ id: "a" + autoId++, type: "arrow", a, b, curve, color: RED, slot: null, in: t, out: meta.duration, enter: stdEnter("draw"), exit: { kind: "fade-out", duration: 0.2 } });
      continue;
    }
  }
}

// --- escalonar entradas casi simultáneas (+0.12s si <0.2s) y mínimo 1.2s en pantalla ---
const byIn = [...elements].sort((a, b) => a.in - b.in);
for (let i = 1; i < byIn.length; i++) if (byIn[i].in - byIn[i - 1].in < 0.2) byIn[i].in = +(byIn[i - 1].in + 0.12).toFixed(2);
for (const el of elements) if (el.out - el.in < 1.2) el.out = +(el.in + 1.2).toFixed(2);

// --- colisión de texto: text/stat no se solapa con stickman ni otro text (nudge vertical) ---
const overlaps = (p, q) => p.box && q.box && Math.abs(p.box.cx - q.box.cx) < (p.box.w + q.box.w) / 2 - 40 && Math.abs(p.box.cy - q.box.cy) < (p.box.h + q.box.h) / 2 - 30;
const timeOverlap = (p, q) => p.in < q.out && q.in < p.out;
for (const tx of elements.filter(e => e.type === "text" || e.type === "stat")) {
  for (let guard = 0; guard < 6; guard++) {
    const hit = elements.find(e => e !== tx && (e.type === "stickman" || e.type === "text" || e.type === "stat") && timeOverlap(tx, e) && overlaps(tx, e));
    if (!hit) break;
    const dir = tx.box.cy <= hit.box.cy ? -1 : 1; tx.box = { ...tx.box, cy: tx.box.cy + dir * 44 };
  }
}

// --- audio ---
const activeDir = path.join("public", "active"); fs.mkdirSync(activeDir, { recursive: true });
const epAudio = path.join(dir, "audio.mp3");
if (fs.existsSync(epAudio)) { fs.copyFileSync(epAudio, path.join(activeDir, "audio.mp3")); meta.audio = "active/audio.mp3"; } else delete meta.audio;

meta.variety = { templates: usage, beats: beatTemplates, warns: warns.length };
const out = { meta, elements };
fs.writeFileSync(path.join(dir, "scenes.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(activeDir, "scenes.json"), JSON.stringify(out, null, 2));
console.log(`✔ scenes.json: ${elements.length} elementos · ${beats.length} beats · ${meta.duration.toFixed(1)}s · "${title}"`);
console.log(`   plantillas: ${Object.entries(usage).map(([k, v]) => k + "×" + v).join(", ")}`);
if (warns.length) { console.log(`   ⚠ ${warns.length} avisos:`); for (const w of warns.slice(0, 12)) console.log("     - " + w); }

// 02-build-scenes (ADDENDUM 2): LIENZO ACUMULATIVO. Los elementos se apilan durante toda una
//   SECCIÓN y solo se vacían (salida escalonada) al cambiar de sección. Colocación orgánica con
//   JITTER (posición/escala/rotación semilla=id). TEXTO-ECO: **negro** / ==rojo== salen del guion.
//   Registro de 6 kinds con animación y vida propias. Badge + título subrayado + marca de agua.
// Uso: node scripts/02-build-scenes.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { boxOf, slotExists } from "../src/scenes/templates.mjs";

const dir = process.argv[2] || "episodes/test-cpu";
const PROFILE = JSON.parse(fs.readFileSync("style-profile.json", "utf8"));
const ACCENT = PROFILE.accent || "#EE2B37", STROKE = PROFILE.stroke || "#111111";
const J = PROFILE.jitter || { position: 0.06, scale: [0.75, 1.35], rotation: 3 };
const W = 1920, H = 1080;

const raw = fs.readFileSync(path.join(dir, "script.md"), "utf8");
let title = "Episodio", body = raw;
const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (fm) { const mt = fm[1].match(/title:\s*"?(.+?)"?\s*$/m); if (mt) title = mt[1]; body = raw.slice(fm[0].length); }

const assets = fs.existsSync(path.join(dir, "assets.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "assets.json"), "utf8")) : {};
const assetFile = (id) => { const f = assets[id]?.file; if (f && fs.existsSync(path.join("public", f))) return f; const g = `assets/icons/${id}.svg`; return fs.existsSync(path.join("public", g)) ? g : null; };
// kind del asset -> familia visual del ADDENDUM 2 (mapea kinds antiguos)
const KIND_MAP = { icon: "vector", photo: "cutout", clip: "meme", gif: "meme" };
const kindOf = (id, src) => { let k = assets[id]?.kind || (src && /\.svg/i.test(src) ? "vector" : "cutout"); return KIND_MAP[k] || k; };

// --- jitter reproducible (semilla = id) ---
function rngOf(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;

// --- tokenización: [[...]] tags (ancla=palabra siguiente) sobre "prose" que conserva **/== ---
const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;
let prose = "", lastI = 0; const tags = [];
const re = /\[\[([^\]]+)\]\]/g; let m;
while ((m = re.exec(body))) { prose += body.slice(lastI, m.index); tags.push({ raw: m[1].trim(), wi: wc(prose) }); lastI = m.index + m[0].length; }
prose += body.slice(lastI);

// --- ECO: **negro** y ==rojo== -> fragmentos de texto anclados a su palabra ---
const echoes = [];
for (const mm of prose.matchAll(/\*\*([^*]+?)\*\*/g)) echoes.push({ wi: wc(prose.slice(0, mm.index)), text: mm[1].trim(), red: false });
for (const mm of prose.matchAll(/==([^=]+?)==/g)) echoes.push({ wi: wc(prose.slice(0, mm.index)), text: mm[1].trim(), red: true });

const cleanWords = prose.replace(/\*\*|==/g, "").trim().split(/\s+/).filter(Boolean);

// --- tiempos ---
let words = [];
if (fs.existsSync(path.join(dir, "words.json"))) words = JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8"));
const meta = { fps: 30, width: W, height: H, duration: 0, audio: "active/audio.mp3", title, profile: PROFILE.name };
if (words.length) meta.duration = Math.max(...words.map(w => w.end)) + 0.6; else meta.duration = cleanWords.length / 2.6 + 0.6;
const timeOf = (i) => { if (words.length) { const w = words[Math.min(i, words.length - 1)]; return w ? w.start : meta.duration; } return Math.min(i / cleanWords.length * (meta.duration - 0.6), meta.duration - 0.6); };

// --- SECCIONES: frontera = [[section]] o [[clear]] ---
const sections = []; let cur = null;
const verbOf = (s) => s.split(/[:\s]/)[0];
const openSection = (raw, wi) => { const label = (raw && raw.match(/section:\s*"([^"]*)"/) || [])[1] || ""; const badge = (raw && raw.match(/badge\s*=\s*([a-z0-9_-]+)/) || [])[1]; cur = { label, badge, tags: [], start: wi, template: "single-focus" }; sections.push(cur); };
for (const tg of tags) {
  const v = verbOf(tg.raw);
  if (v === "section") { openSection(tg.raw, tg.wi); continue; }
  if (!cur) openSection(null, tg.wi);
  if (v === "clear") { cur = null; continue; }
  cur.tags.push(tg);
}
for (let i = 0; i < sections.length; i++) { sections[i].t0 = +timeOf(sections[i].start).toFixed(2); sections[i].t1 = i + 1 < sections.length ? +timeOf(sections[i + 1].start).toFixed(2) : meta.duration; }
const sectionAt = (t) => { for (let i = sections.length - 1; i >= 0; i--) if (t >= sections[i].t0 - 0.01) return sections[i]; return sections[0]; };

// --- kinds: animación de entrada y vida útil ---
const ENTER = { doodle: { kind: "draw", duration: 0.8 }, vector: { kind: "pop", duration: 0.4 }, cutout: { kind: "slide-in-bottom", duration: 0.4 }, screenshot: { kind: "pop", duration: 0.45 }, meme: { kind: "stamp", duration: 0.25 }, clip: { kind: "slide-in-bottom", duration: 0.45 }, logo: { kind: "fade-in", duration: 0.35 } };
const lifetime = (kind, t, hero, secEnd) => kind === "meme" ? Math.min(t + 3.2, secEnd) : (kind === "screenshot" && !hero) ? Math.min(t + 6, secEnd) : secEnd;
const ROT_KINDS = new Set(["cutout", "screenshot"]);
// tamaño nominal por kind (Addendum 2: cada asset es un objeto discreto, no llena el slot)
const NOMINAL = { vector: [230, 230], cutout: [380, 380], screenshot: [500, 320], meme: [340, 280], clip: [560, 340], logo: [210, 150], doodle: [300, 300], stickman: [300, 430] };
const nomOf = (kind, hero) => { const n = NOMINAL[kind] || [280, 280]; return hero ? [n[0] * 1.35, n[1] * 1.35] : n; };

// --- construir elementos ---
const elements = [];
const RED = ACCENT;
const slotIn = (s) => (s.match(/@([a-z0-9-]+)/) || [])[1] || null;
const kv = (s, k) => (s.match(new RegExp(k + '\\s*=\\s*"([^"]*)"')) || s.match(new RegExp(k + "\\s*=\\s*([a-z0-9-]+)", "i")) || [])[1];
let autoId = 0;
const warns = [];
const stagger = new Map(); // section -> contador de salida escalonada

// marca de agua (siempre presente)
if (PROFILE.watermark && fs.existsSync(path.join("public", PROFILE.watermark)))
  elements.push({ id: "watermark", type: "watermark", src: PROFILE.watermark, box: { cx: 1810, cy: 1000, w: 150, h: 150 }, opacity: PROFILE.watermarkOpacity || 0.5, z: 5, in: 0, out: meta.duration, enter: { kind: "fade-in", duration: 0.5 } });

for (const sec of sections) {
  const secEnd = sec.t1;
  const box = (slot) => boxOf(sec.template, slot);
  const rng = (id) => rngOf(id);
  const lastVisual = { cx: 960, cy: 500, w: 380, h: 380 };
  // posición = centro del slot (zona de atracción) + jitter; tamaño = nominal del kind * jitter de escala
  const jitterBox = (id, center, nw, nh, hero) => {
    const r = rng(id);
    const jx = (r() * 2 - 1) * J.position * W, jy = (r() * 2 - 1) * J.position * H;
    const sc = hero ? (PROFILE.jitter?.heroScale || 1.6) : lerp(J.scale[0], J.scale[1], r());
    let cx = center.cx + jx, cy = center.cy + jy;
    const halfW = nw * sc / 2, halfH = nh * sc / 2, off = 0.15; // se permite salirse hasta 15%
    cx = Math.max(halfW * (1 - 2 * off), Math.min(W - halfW * (1 - 2 * off), cx));
    cy = Math.max(halfH * (1 - 2 * off) + 60, Math.min(H - halfH * (1 - 2 * off), cy)); // deja hueco arriba al título
    return { box: { cx, cy, w: nw * sc, h: nh * sc } };
  };

  // badge de capítulo + etiqueta + título subrayado
  if (sec.badge && assetFile(sec.badge)) elements.push({ id: "badge_" + autoId++, type: "image", kind: "logo", src: assetFile(sec.badge), box: boxOf("x", "corner-badge"), z: 70, in: sec.t0, out: secEnd, enter: { kind: "fade-in", duration: 0.4 } });
  if (sec.label) {
    if (sec.badge) elements.push({ id: "blabel_" + autoId++, type: "text", content: sec.label, structural: true, box: { cx: 190, cy: 205, w: 300, h: 70 }, color: STROKE, size: "sm", z: 71, in: sec.t0 + 0.1, out: secEnd, enter: { kind: "fade-in", duration: 0.3 } });
    elements.push({ id: "title_" + autoId++, type: "title", content: sec.label, structural: true, box: { cx: 960, cy: 120, w: 1500, h: 150 }, color: STROKE, size: "title", underline: true, z: 62, in: sec.t0, out: secEnd, enter: { kind: "handwrite", duration: 0.6 } });
  }

  // eventos ordenados por tiempo (tags + ecos de esta sección)
  const evs = [];
  for (const tg of sec.tags) evs.push({ kind: "tag", t: +timeOf(tg.wi).toFixed(2), raw: tg.raw });
  for (const e of echoes) if (e.wi >= sec.start && timeOf(e.wi) < secEnd) evs.push({ kind: "echo", t: +timeOf(e.wi).toFixed(2), text: e.text, red: e.red });
  evs.sort((a, b) => a.t - b.t);

  let echoSizeTurn = 0; const echoAlt = ["md", "lg", "sm"]; const liveFloating = [];
  // SPEC regla 4: MÁX 4 textos simultáneos EN TOTAL (labels + ecos + stat + box). Estructurales (title/badge) no cuentan.
  const floatCap = (el, tt) => { liveFloating.push(el); if (liveFloating.length > 4) { const old = liveFloating.shift(); old.out = Math.min(old.out, tt + 0.05); } };
  for (const ev of evs) {
    if (ev.kind === "echo") {
      // colocar cerca del último visual, con jitter, tamaños alternos, máx 5 simultáneos
      const id = "e" + autoId++;
      let size = echoAlt[echoSizeTurn % echoAlt.length]; echoSizeTurn++;
      const r = rngOf(id);
      const ang = r() * Math.PI * 2, rad = 180 + r() * 160;
      let cx = lastVisual.cx + Math.cos(ang) * rad, cy = lastVisual.cy + Math.sin(ang) * rad;
      cx = Math.max(180, Math.min(W - 180, cx)); cy = Math.max(120, Math.min(H - 80, cy));
      const el = { id, type: "text", content: ev.text, box: { cx, cy, w: 640, h: 130 }, color: ev.red ? RED : STROKE, size, echo: true, z: 60, in: ev.t, out: secEnd, enter: { kind: ev.red ? "stamp" : "handwrite", duration: ev.red ? 0.3 : 0.6 }, exit: { kind: "fade-out", duration: 0.25 } };
      elements.push(el); floatCap(el, ev.t);
      continue;
    }
    const s = ev.raw, v = verbOf(s), t = ev.t, slot = slotIn(s);
    if (v === "hide") continue;
    if (slot && !slotExists(sec.template, slot)) { warns.push(`slot "${slot}" no existe (sección "${sec.label}")`); }

    if (v === "beat") { sec.template = kv(s, "beat") || s.replace(/^beat:?\s*/, "").trim(); continue; }
    if (v === "box") {
      const content = (s.match(/box:\s*"([^"]*)"/) || [])[1] || "";
      const bb = jitterBox("b" + autoId, box(slot || "center"), 420, 120, false);
      const _bx = { id: "bx" + autoId++, type: "boxtext", content, box: bb.box, z: 60, in: t, out: secEnd, enter: { kind: "pop", duration: 0.3 }, exit: { kind: "fade-out", duration: 0.25 } };
      elements.push(_bx); floatCap(_bx, t);
      continue;
    }
    if (v === "text") {
      const content = (s.match(/text:\s*"([^"]*)"/) || [])[1] || "";
      const bb = jitterBox("t" + autoId, box(slot || "bottom"), 640, 130, false);
      const _tx = { id: "t" + autoId++, type: "text", content, box: bb.box, color: /color\s*=\s*red/.test(s) ? RED : STROKE, size: kv(s, "size") || "md", z: 60, in: t, out: secEnd, enter: { kind: "handwrite", duration: 0.6 }, exit: { kind: "fade-out", duration: 0.25 } };
      elements.push(_tx); floatCap(_tx, t);
      continue;
    }
    if (v === "stat") {
      const content = (s.match(/stat:\s*"([^"]*)"/) || [])[1] || "";
      const _st = { id: "n" + autoId++, type: "stat", content, unit: kv(s, "unit") || "", box: box(slot || "number"), color: RED, z: 60, in: t, out: secEnd, enter: { kind: "stamp", duration: 0.3 }, exit: { kind: "fade-out", duration: 0.25 } };
      elements.push(_st); floatCap(_st, t);
      continue;
    }
    if (v === "stickman") {
      const pose = s.replace(/^stickman:?\s*/, "").split(/[@\s,]/)[0].trim() || "neutral"; const head = kv(s, "head");
      const bb = jitterBox("s" + autoId, box(slot || "figure"), NOMINAL.stickman[0], NOMINAL.stickman[1], false);
      const el = { id: "s" + autoId++, type: "stickman", pose, box: bb.box, z: 50, in: t, out: secEnd, enter: { kind: "fade-in", duration: 0.3 }, exit: { kind: "fade-out", duration: 0.3 } };
      if (head && assetFile(head)) el.head = assetFile(head);
      elements.push(el); lastVisual.cx = bb.box.cx; lastVisual.cy = bb.box.cy; lastVisual.w = bb.box.w; lastVisual.h = bb.box.h;
      continue;
    }
    if (v === "shape") {
      let kind = s.replace(/^shape:?\s*/, "").split(/[@\s,]/)[0].trim();
      kind = ({ circle: "circle-highlight", cross: "cross-out", check: "checkmark" })[kind] || kind;
      const c = box(slot || "center"); const tb = { cx: c.cx, cy: c.cy, w: 380, h: 340 }; const per = 2 * (tb.w + tb.h) * 1.6 + 400;
      elements.push({ id: "h" + autoId++, type: "shape", kind, box: tb, _len: per, color: RED, z: 30, in: t, out: secEnd, enter: { kind: "draw", duration: 0.55 }, exit: { kind: "fade-out", duration: 0.25 } });
      continue;
    }
    if (v === "arrow") {
      const am = s.match(/arrow:\s*([a-z0-9-]+)\s*->\s*([a-z0-9-]+)/); if (!am) continue;
      const fb = box(am[1]), tb = box(am[2]); let a, b;
      if (Math.abs(tb.cx - fb.cx) >= Math.abs(tb.cy - fb.cy)) { const d = Math.sign(tb.cx - fb.cx) || 1; a = { x: fb.cx + d * (fb.w / 2 - 8), y: fb.cy }; b = { x: tb.cx - d * (tb.w / 2 - 8), y: tb.cy }; }
      else { const d = Math.sign(tb.cy - fb.cy) || 1; a = { x: fb.cx, y: fb.cy + d * (fb.h / 2 - 8) }; b = { x: tb.cx, y: tb.cy - d * (tb.h / 2 - 8) }; }
      elements.push({ id: "a" + autoId++, type: "arrow", a, b, curve: (autoId % 2 ? "up" : "down"), color: RED, z: 40, in: t, out: secEnd, enter: { kind: "draw", duration: 0.55 }, exit: { kind: "fade-out", duration: 0.2 } });
      continue;
    }
    // show / clip / gif -> imagen/clip/gif con su kind
    if (v === "show" || v === "clip" || v === "gif") {
      const id = s.replace(/^(show|clip|gif):?\s*/, "").split(/[@\s,]/)[0].trim();
      let type = "image", src = assetFile(id);
      if (v === "clip" || v === "gif") { type = v; src = assets[id]?.file && fs.existsSync(path.join("public", assets[id].file)) ? assets[id].file : null; }
      if (!src) { warns.push(`asset ausente: "${id}" (sección "${sec.label}") -> se omite`); continue; }
      const kind = v === "gif" ? "meme" : v === "clip" ? "clip" : kindOf(id, src);
      const hero = /hero/.test(s);
      const [nw, nh] = nomOf(kind, hero);
      const bb = jitterBox(id + autoId, box(slot || "center"), nw, nh, hero);
      const rot = ROT_KINDS.has(kind) ? Math.round((rngOf(id + autoId)() * 2 - 1) * (J.rotation || 3)) : 0;
      elements.push({ id: id + "_" + autoId++, type, kind, src, box: bb.box, rotate: rot, frame: kv(s, "frame"), z: type === "gif" || type === "clip" ? 55 : 20, in: t, out: lifetime(kind, t, hero, secEnd), enter: ENTER[kind] || ENTER.vector, exit: { kind: "fade-out", duration: 0.3 } });
      lastVisual.cx = bb.box.cx; lastVisual.cy = bb.box.cy; lastVisual.w = bb.box.w; lastVisual.h = bb.box.h;
      continue;
    }
  }
}

// --- salida escalonada al final de cada sección (0.08s entre elementos) ---
const bySecExit = {};
for (const el of elements) { if (el.type === "watermark") continue; const s = sectionAt(el.in); const k = s.t1; (bySecExit[k] = bySecExit[k] || []).push(el); }
// salida escalonada HACIA ATRÁS: los elementos se van justo ANTES del corte, nunca invaden la sección siguiente
for (const k of Object.keys(bySecExit)) { const arr = bySecExit[k].filter(e => Math.abs(e.out - +k) < 0.06); arr.forEach((e, i) => { e.out = +Math.max(e.in + 0.5, +k - Math.min(i, 6) * 0.06).toFixed(2); }); }

// mínimo en pantalla
for (const el of elements) if (el.type !== "watermark" && el.out - el.in < 1.0) el.out = +(el.in + 1.0).toFixed(2);

// --- SPEC regla 3: el texto NUNCA se solapa con otro texto (incl. título). Nudge vertical 46px ---
const isText = (e) => e.type === "text" || e.type === "stat" || e.type === "boxtext" || e.type === "title";
const tOverlap = (p, q) => p.in < q.out && q.in < p.out;
const boxOverlap = (p, q) => p.box && q.box && Math.abs(p.box.cx - q.box.cx) < (p.box.w + q.box.w) / 2 - 30 && Math.abs(p.box.cy - q.box.cy) < (p.box.h + q.box.h) / 2 - 18;
for (const tx of elements.filter(e => (e.type === "text" || e.type === "stat" || e.type === "boxtext") && !e.structural)) {
  for (let guard = 0; guard < 10; guard++) {
    const hit = elements.find(e => e !== tx && isText(e) && tOverlap(tx, e) && boxOverlap(tx, e));
    if (!hit) break;
    const dir = tx.box.cy <= hit.box.cy ? -1 : 1;
    tx.box = { ...tx.box, cy: Math.max(230, Math.min(H - 60, tx.box.cy + dir * 46)) };
  }
}

// --- validador de DENSIDAD por sección (sustituye al de colisiones) ---
const densReport = [];
for (const sec of sections) {
  const mid = (sec.t0 + sec.t1) / 2;
  const live = elements.filter(e => e.type !== "watermark" && e.in <= mid && e.out > mid && e.box);
  const area = live.reduce((a, e) => a + e.box.w * e.box.h, 0) / (W * H);
  const d = +area.toFixed(2); densReport.push({ label: sec.label || "(intro)", d, n: live.length });
  if (d > (PROFILE.density?.warnAbove || 0.8)) warns.push(`densidad ${d} > 0.8 en "${sec.label}" (saturada)`);
  if (d < 0.15) warns.push(`densidad ${d} < 0.15 en "${sec.label}" (vacía)`);
}

// --- audio ---
const activeDir = path.join("public", "active"); fs.mkdirSync(activeDir, { recursive: true });
const epAudio = path.join(dir, "audio.mp3");
if (fs.existsSync(epAudio)) { fs.copyFileSync(epAudio, path.join(activeDir, "audio.mp3")); meta.audio = "active/audio.mp3"; } else delete meta.audio;

meta.variety = { sections: sections.length, echoes: echoes.length, density: densReport, warns: warns.length };
const out = { meta, elements };
fs.writeFileSync(path.join(dir, "scenes.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(activeDir, "scenes.json"), JSON.stringify(out, null, 2));
console.log(`✔ scenes.json: ${elements.length} elementos · ${sections.length} secciones · ${echoes.length} ecos · ${meta.duration.toFixed(1)}s`);
console.log(`   densidad: ${densReport.map(r => r.label + "=" + r.d).join(", ")}`);
if (warns.length) { console.log(`   ⚠ ${warns.length} avisos:`); for (const w of warns.slice(0, 10)) console.log("     - " + w); }

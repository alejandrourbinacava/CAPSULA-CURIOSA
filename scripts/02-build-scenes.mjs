// 02-build-scenes (ADDENDUM 2): LIENZO ACUMULATIVO. Los elementos se apilan durante toda una
//   SECCIÓN y solo se vacían (salida escalonada) al cambiar de sección. Colocación orgánica con
//   JITTER (posición/escala/rotación semilla=id). TEXTO-ECO: **negro** / ==rojo== salen del guion.
//   Registro de 6 kinds con animación y vida propias. Badge + título subrayado + marca de agua.
// Uso: node scripts/02-build-scenes.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { boxOf, slotExists } from "../src/scenes/templates.mjs";
import { bboxOf, interArea, area, ZONES, TEXT_TYPES, isPhoto, hitsZone, coexist } from "./geometry.mjs";

const dir = process.argv[2] || "episodes/test-cpu";
const PROFILE = JSON.parse(fs.readFileSync("style-profile.json", "utf8"));
const ACCENT = PROFILE.accent || "#EE2B37", STROKE = PROFILE.stroke || "#111111";
const J = PROFILE.jitter || { position: 0.06, scale: [0.75, 1.35], rotation: 3 };
const W = 1920, H = 1080;

const raw = fs.readFileSync(path.join(dir, "script.md"), "utf8");
let title = "Episodio", body = raw, contentType = "conceptual";
const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (fm) { const mt = fm[1].match(/title:\s*"?(.+?)"?\s*$/m); if (mt) title = mt[1]; const ct = fm[1].match(/contentType:\s*(\w+)/); if (ct) contentType = ct[1]; body = raw.slice(fm[0].length); }
const HISTORICAL = contentType === "historical";

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

// --- FRASES: unidad de composición (VERIFICACION). Segmenta por . ? ! y saltos de línea ---
const phraseTexts = prose.replace(/\*\*|==/g, "").split(/(?<=[.?!…])\s+|\n+/).map(s => s.trim()).filter(Boolean);
const phrases = []; { let acc = 0; for (const pt of phraseTexts) { const n = pt.split(/\s+/).filter(Boolean).length || 1; phrases.push({ wStart: acc, wEnd: acc + n, text: pt, t0: +timeOf(acc).toFixed(2) }); acc += n; } }
const phraseIdxOf = (wi) => { for (let i = phrases.length - 1; i >= 0; i--) if (wi >= phrases[i].wStart) return i; return 0; };
const phraseIdxOfTime = (t) => { let idx = 0; for (let i = 0; i < phrases.length; i++) if (phrases[i].t0 <= t + 0.01) idx = i; return idx; };
const phraseTime = (idx) => idx >= phrases.length ? meta.duration : phrases[Math.max(0, idx)].t0;
const fmtSec = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

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
// tamaño nominal por kind. Las FOTOS/archivo son grandes (protagonistas); los iconos, pequeños.
const NOMINAL = { vector: [230, 230], cutout: [560, 430], archive: [600, 460], screenshot: [600, 380], meme: [360, 300], clip: [640, 380], logo: [210, 150], doodle: [320, 320], stickman: [300, 430] };
const nomOf = (kind) => NOMINAL[kind] || [280, 280];
const PHOTO_KIND = /^(cutout|archive|screenshot)$/;

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
  let heroPlaced = false; // la primera foto de la sección es la BASE (hero): grande y central
  // posición = centro del slot (zona de atracción) + jitter; tamaño = nominal del kind * jitter de escala
  const jitterBox = (id, center, nw, nh, hero) => {
    const r = rng(id);
    const jf = hero ? 0.3 : 1; // el hero jitterea menos: se queda centrado como base
    const jx = (r() * 2 - 1) * J.position * W * jf, jy = (r() * 2 - 1) * J.position * H * jf;
    const sc = hero ? (PROFILE.jitter?.heroScale || 1.6) : lerp(J.scale[0], J.scale[1], r());
    let cx = center.cx + jx, cy = center.cy + jy;
    const halfW = nw * sc / 2, halfH = nh * sc / 2, off = 0.15; // se permite salirse hasta 15%
    cx = Math.max(halfW * (1 - 2 * off), Math.min(W - halfW * (1 - 2 * off), cx));
    cy = Math.max(halfH * (1 - 2 * off) + 60, Math.min(H - halfH * (1 - 2 * off), cy)); // deja hueco arriba al título
    return { box: { cx, cy, w: nw * sc, h: nh * sc } };
  };

  // badge de capítulo. historical: si el badge es un ICONO, se usa la 1ª FOTO de la sección; si no hay, sin badge.
  let badgeId = sec.badge;
  if (HISTORICAL && badgeId && /vector|icon/.test(assets[badgeId]?.kind || "")) {
    const photoTag = sec.tags.map(t => t.raw).find(r => /^show:/.test(r) && /cutout|photo|screenshot|archive/.test(assets[r.replace(/^show:?\s*/, "").split(/[@\s,]/)[0].trim()]?.kind || ""));
    badgeId = photoTag ? photoTag.replace(/^show:?\s*/, "").split(/[@\s,]/)[0].trim() : null;
  }
  if (badgeId && assetFile(badgeId)) elements.push({ id: "badge_" + autoId++, type: "image", kind: "logo", src: assetFile(badgeId), box: boxOf("x", "corner-badge"), z: 70, in: sec.t0, out: secEnd, enter: { kind: "fade-in", duration: 0.4 } });
  if (sec.label) {
    if (badgeId) { const blFs = Math.min(28, Math.max(14, Math.floor(300 / Math.max(1, (sec.label || "").length * 0.5)))); elements.push({ id: "blabel_" + autoId++, type: "text", content: sec.label, structural: true, fontSize: blFs, box: { cx: 175, cy: 205, w: 320, h: 60 }, color: STROKE, size: "sm", z: 71, in: sec.t0 + 0.1, out: secEnd, enter: { kind: "fade-in", duration: 0.3 } }); }
    const titleFs = Math.min(96, Math.floor(1200 / Math.max(1, (sec.label || "").length * 0.6))); // cabe en la zona del título
    elements.push({ id: "title_" + autoId++, type: "title", content: sec.label, structural: true, fontSize: titleFs, box: { cx: 960, cy: 120, w: 1240, h: 150 }, color: STROKE, size: "title", underline: true, z: 62, in: sec.t0, out: secEnd, enter: { kind: "handwrite", duration: 0.6 } });
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
    if (HISTORICAL && (v === "shape" || v === "arrow")) continue; // historical: nada de flechas/marcas decorativas (quedan huérfanas sin iconos)
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
      // historical: 0 ICONOS. Icono vector -> se DESCARTA (mejor hueco que icono aleatorio) y avisa con segundo + frase.
      if (HISTORICAL && kind === "vector") { const pi = phraseIdxOfTime(t); warns.push(`SIN MATERIAL ${fmtSec(t)} · icono "${id}" descartado · frase: "${(phrases[pi]?.text || "").slice(0, 60)}"`); continue; }
      const photoKind = PHOTO_KIND.test(kind);
      const hero = /hero/.test(s) || (photoKind && !heroPlaced); // 1ª foto de la sección = base grande
      if (hero && photoKind) heroPlaced = true;
      const [nw, nh] = nomOf(kind);
      const bb = jitterBox(id + autoId, box(hero ? "center" : (slot || "center")), nw, nh, hero);
      const rot = ROT_KINDS.has(kind) ? Math.round((rngOf(id + autoId)() * 2 - 1) * (J.rotation || 3)) : 0;
      elements.push({ id: id + "_" + autoId++, type, kind, src, box: bb.box, rotate: rot, frame: kv(s, "frame"), hero: hero && photoKind, z: type === "gif" || type === "clip" ? 55 : 20, in: t, out: lifetime(kind, t, hero, secEnd), enter: ENTER[kind] || ENTER.vector, exit: { kind: "fade-out", duration: 0.3 } });
      lastVisual.cx = bb.box.cx; lastVisual.cy = bb.box.cy; lastVisual.w = bb.box.w; lastVisual.h = bb.box.h;
      continue;
    }
  }
}

const structuralEl = (e) => e.structural || e.type === "title" || e.type === "watermark";
const hashId = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

// --- A) VIDA POR FRASES (VERIFICACION): un elemento vive 2-4 frases (el hero hasta 6, con Ken Burns) ---
for (const el of elements) {
  if (structuralEl(el) || el.type === "watermark" || !el.box) continue;
  const pIn = phraseIdxOfTime(el.in);
  const secEndOf = sectionAt(el.in).t1;
  if (el.hero) { el.out = +Math.min(el.out, secEndOf).toFixed(2); el.kenburns = true; } // la foto-base es el LIENZO: dura toda la sección + Ken Burns (no se congela)
  else { const life = 2 + (hashId(el.id) % 3); el.out = +Math.min(el.out, secEndOf, phraseTime(pIn + life)).toFixed(2); }
}
// mínimo 1s en pantalla
for (const el of elements) if (el.type !== "watermark" && el.out - el.in < 1.0) el.out = +(el.in + 1.0).toFixed(2);

// --- B) MONIGOTE (VERIFICACION): solo explícito, máx 4/vídeo, ≥90s aparte, vida ≤5s ---
{
  const sm = elements.filter(e => e.type === "stickman").sort((a, b) => a.in - b.in);
  const others = elements.filter(e => !structuralEl(e) && e.type !== "watermark" && e.type !== "stickman" && e.box);
  let last = -999, kept = 0; const drop = new Set();
  for (const s of sm) {
    const anchored = others.some(o => o.in <= s.in + 0.5 && o.out > s.in + 0.5); // SIEMPRE anclado a otro elemento, nunca solo
    if (kept >= 4 || s.in - last < 90 || !anchored) { drop.add(s); continue; }
    last = s.in; kept++; s.out = +Math.min(s.out, s.in + 5).toFixed(2);
  }
  for (let i = elements.length - 1; i >= 0; i--) if (drop.has(elements[i])) elements.splice(i, 1);
}

// --- C) CAP: nunca más de 4 elementos dinámicos a la vez (rotación por frase). Protege al hero. ---
const capLive = (list, max) => {
  const arr = list.sort((a, b) => a.in - b.in); const live = [];
  for (const e of arr) {
    for (let i = live.length - 1; i >= 0; i--) if (live[i].out <= e.in + 1e-6) live.splice(i, 1);
    live.push(e);
    while (live.length > max) { live.sort((a, b) => (a.hero ? 1 : 0) - (b.hero ? 1 : 0) || a.in - b.in); const old = live.shift(); old.out = Math.min(old.out, +e.in.toFixed(2)); }
  }
};
capLive(elements.filter(e => TEXT_TYPES.has(e.type) && !structuralEl(e) && e.box), 4);
capLive(elements.filter(e => !structuralEl(e) && e.type !== "watermark" && e.box), 4);

// pre-encuadre: cada texto arranca DENTRO del frame (por su ancho real); el solver luego resuelve solapes
for (const el of elements) {
  if (!TEXT_TYPES.has(el.type) || structuralEl(el) || !el.box) continue;
  const bb = bboxOf(el); const hw = (bb[2] - bb[0]) / 2, hh = (bb[3] - bb[1]) / 2;
  el.box = { ...el.box, cx: Math.max(hw + 14, Math.min(W - hw - 14, el.box.cx)), cy: Math.max(hh + 14, Math.min(H - hh - 14, el.box.cy)) };
}

// --- SOLVER DE OCUPACIÓN (VERIFICACION 2.2): UNA pasada consciente de la vida útil. Cada elemento
//     se coloca evitando a TODOS los que coexisten en el tiempo (texto-texto cero, foto-foto <35%) y
//     las zonas reservadas. Búsqueda: ideal -> espiral 24px -> bajar tamaño -> acortar texto -> descartar. ---
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
const isTextT = (e) => TEXT_TYPES.has(e.type);
{
  const dynamics = elements.filter(e => !structuralEl(e) && e.type !== "watermark" && e.box).sort((a, b) => a.in - b.in);
  const placed = elements.filter(e => structuralEl(e) && e.type !== "watermark" && e.box); // estructurales = obstáculos fijos
  const validAt = (el, cx, cy, rivals) => {
    const bb = bboxOf({ ...el, box: { ...el.box, cx, cy } });
    if (hitsZone(bb)) return false;
    if (isTextT(el) && (bb[0] < 6 || bb[1] < 6 || bb[2] > W - 6 || bb[3] > H - 6)) return false;
    for (const p of rivals) {
      const pb = bboxOf(p);
      if (isTextT(el) && TEXT_TYPES.has(p.type)) { if (interArea(bb, pb) > 0) return false; }
      else if (isPhoto(el) && isPhoto(p)) { const ia = interArea(bb, pb), mn = Math.min(area(bb), area(pb)); if (mn > 0 && ia / mn > 0.35) return false; }
    }
    return true;
  };
  for (const el of dynamics) {
    const rivals = placed.filter(p => coexist(el, p));
    const seek = () => {
      if (validAt(el, el.box.cx, el.box.cy, rivals)) return true;
      for (let r = 1; r <= 14; r++) for (const [dx, dy] of DIRS) { const cx = el.box.cx + dx * 24 * r, cy = el.box.cy + dy * 24 * r; if (validAt(el, cx, cy, rivals)) { el.box = { ...el.box, cx, cy }; return true; } }
      return false;
    };
    if (seek()) { placed.push(el); continue; }
    if (isTextT(el)) { const dn = { xl: "lg", lg: "md", md: "sm" }[el.size]; if (dn) { el.size = dn; if (seek()) { placed.push(el); continue; } } }
    else if (isPhoto(el)) { el.box = { ...el.box, w: el.box.w * 0.72, h: el.box.h * 0.72 }; if (seek()) { placed.push(el); continue; } }
    if (isTextT(el) && el.content) { const sh = el.content.split(/\s+/).slice(0, 3).join(" "); if (sh !== el.content) { el.content = sh; if (seek()) { placed.push(el); continue; } } }
    el._discard = true; warns.push(`descartado sin hueco: "${el.id}"`);
  }
  for (let i = elements.length - 1; i >= 0; i--) if (elements[i]._discard) elements.splice(i, 1);
}

// --- validador de DENSIDAD por sección (sustituye al de colisiones) ---
const densReport = [];
for (const sec of sections) {
  const mid = (sec.t0 + sec.t1) / 2;
  const live = elements.filter(e => e.type !== "watermark" && e.in <= mid && e.out > mid && e.box);
  const occ = live.reduce((a, e) => a + e.box.w * e.box.h, 0) / (W * H);
  const d = +occ.toFixed(2); densReport.push({ label: sec.label || "(intro)", d, n: live.length });
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

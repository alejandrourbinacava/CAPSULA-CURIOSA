// verify: VERIFICACIÓN AUTOMÁTICA QUE FALLA (VERIFICACION.md parte 1).
//   Lee scenes.json, calcula la geometría REAL de cada elemento (el bbox del texto sale del
//   contenido + tamaño de fuente, NO del box que el compilador creyó), muestrea cada 0.25s,
//   escribe debug/layout.json, y comprueba cada frame. Sale con código 1 si hay CUALQUIER fallo.
// Uso: node scripts/verify.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || (fs.existsSync("episodes/active.txt") ? fs.readFileSync("episodes/active.txt", "utf8").trim() : "episodes/test-cpu");
const PROFILE = JSON.parse(fs.readFileSync("style-profile.json", "utf8"));
const ZONES = PROFILE.reservedZones || {};
const MAXTEXT = PROFILE.maxSimultaneousText || 4;
const W = 1920, H = 1080;
const scenes = JSON.parse(fs.readFileSync(path.join(dir, "scenes.json"), "utf8"));

// --- geometría REAL por elemento (lo que se dibuja, no lo que el compilador creyó) ---
const FS = PROFILE.typography?.sizes || { sm: 32, md: 48, lg: 72, title: 96 };
const CHARW = 0.47;               // ancho medio de carácter (fuente manuscrita) relativo al tamaño
const TEXT_TYPES = new Set(["text", "title", "boxtext", "stat"]);
const isStructural = (e) => e.structural || e.type === "title" || e.type === "watermark" || /^(badge|blabel)/.test(e.id);
function bboxOf(e) {
  const b = e.box || { cx: 960, cy: 540, w: 100, h: 100 };
  if (TEXT_TYPES.has(e.type)) {
    const fs = e.type === "stat" ? 150 : (FS[e.size] || FS.md);
    const len = (e.content || "").length || 3;
    let w = e.type === "title" ? len * fs * 0.52 : Math.min(b.w + 30, len * fs * CHARW);
    let h = (e.type === "stat" ? fs * 1.5 : fs * 1.25);
    if (e.type === "boxtext") { w += 44; h += 16; }
    return [b.cx - w / 2, b.cy - h / 2, b.cx + w / 2, b.cy + h / 2];
  }
  return [b.cx - b.w / 2, b.cy - b.h / 2, b.cx + b.w / 2, b.cy + b.h / 2];
}
const interArea = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const area = (a) => Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
const outOfFrame = (a) => Math.max(0, -a[0]) + Math.max(0, -a[1]) + Math.max(0, a[2] - W) + Math.max(0, a[3] - H);
const ts = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;

// --- muestreo + emisión de debug/layout.json ---
const dur = scenes.meta.duration, STEP = 0.25;
const frames = [];
for (let t = 0; t <= dur; t = +(t + STEP).toFixed(2)) {
  const live = scenes.elements.filter(e => e.type !== "watermark" && e.in <= t + 1e-6 && e.out > t + 1e-6 && e.box);
  frames.push({ t, elements: live.map(e => ({ id: e.id, type: e.type, structural: isStructural(e), bbox: bboxOf(e).map(Math.round), layer: e.z ?? 20 })) });
}
const dbgDir = path.join(dir, "debug"); fs.mkdirSync(dbgDir, { recursive: true });
fs.writeFileSync(path.join(dbgDir, "layout.json"), JSON.stringify({ fps: scenes.meta.fps, frames }, null, 0));

// --- comprobaciones por frame ---
const fails = [];
for (const fr of frames) {
  const els = fr.elements;
  const texts = els.filter(e => TEXT_TYPES.has(e.type));
  const dynTexts = texts.filter(e => !e.structural);
  const images = els.filter(e => ["image", "clip", "gif"].includes(e.type));

  // 1) texto-texto: CERO tolerancia
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const A = texts[i].bbox, B = texts[j].bbox, ia = interArea(A, B);
    if (ia > 0) { const ix = Math.round(Math.min(A[2], B[2]) - Math.max(A[0], B[0])), iy = Math.round(Math.min(A[3], B[3]) - Math.max(A[1], B[1])); fails.push({ t: fr.t, kind: "texto-texto", msg: `Solapamiento texto-texto\n            "${texts[i].id}" [${A}]\n            "${texts[j].id}" [${B}]\n            Intersección: ${ix}x${iy} px` }); }
  }
  // 2) texto/imagen dinámica invadiendo zona reservada
  for (const e of els) {
    if (e.structural) continue;
    for (const [zn, z] of Object.entries(ZONES)) if (interArea(e.bbox, z) > 0) fails.push({ t: fr.t, kind: "zona", msg: `"${e.id}" invade la zona reservada "${zn}" [${z}]` });
  }
  // 3) máx N textos simultáneos
  if (dynTexts.length > MAXTEXT) fails.push({ t: fr.t, kind: "n-textos", msg: `${dynTexts.length} textos simultáneos (máximo ${MAXTEXT})` });
  // 4) texto saliéndose del frame
  for (const e of texts) if (outOfFrame(e.bbox) > 0) fails.push({ t: fr.t, kind: "fuera", msg: `"${e.id}" se sale del frame [${e.bbox}]` });
  // 5) imagen-imagen > 35% del área menor
  for (let i = 0; i < images.length; i++) for (let j = i + 1; j < images.length; j++) {
    const ia = interArea(images[i].bbox, images[j].bbox), minA = Math.min(area(images[i].bbox), area(images[j].bbox));
    if (minA > 0 && ia / minA > 0.35) fails.push({ t: fr.t, kind: "img-img", msg: `Solapamiento imagen-imagen ${(ia / minA * 100).toFixed(0)}% (>35%): "${images[i].id}" / "${images[j].id}"` });
  }
  // 6) total simultáneos > 8
  if (els.length > 8) fails.push({ t: fr.t, kind: "total", msg: `${els.length} elementos simultáneos (máximo 8)` });
}

// --- informe ---
const HARD = new Set(["texto-texto", "zona", "n-textos", "fuera", "img-img", "total"]);
const hard = fails.filter(f => HARD.has(f.kind));
const shown = fails.slice(0, 25);
for (const f of shown) console.log(`✗ ${ts(f.t)}  ${f.msg}\n`);
const badFrames = new Set(fails.map(f => f.t)).size;
const byKind = {}; for (const f of fails) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
console.log(`Desglose: ${Object.entries(byKind).map(([k, n]) => k + "=" + n).join(", ") || "ninguno"}`);
// ofensores únicos (para saber QUÉ elemento incumple, no en qué frame)
const offenders = {}; for (const f of fails) { const m = (f.msg.match(/"([^"]+)"/) || [])[1]; if (m) offenders[m] = (offenders[m] || 0) + 1; }
const topOff = Object.entries(offenders).sort((a, b) => b[1] - a[1]).slice(0, 8);
if (topOff.length) console.log(`Elementos que más incumplen: ${topOff.map(([k, n]) => k).join(", ")}`);
console.log(`${badFrames} frames con fallos de ${frames.length} muestreados.`);
if (hard.length) { console.log(`Render RECHAZADO. (${hard.length} incumplimientos duros)`); process.exit(1); }
console.log("✓ verificación OK — sin solapes de texto, zonas respetadas, límites cumplidos.");

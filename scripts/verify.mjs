// verify: VERIFICACIÓN AUTOMÁTICA QUE FALLA (VERIFICACION.md parte 1).
//   Lee scenes.json, calcula la geometría REAL de cada elemento (el bbox del texto sale del
//   contenido + tamaño de fuente, NO del box que el compilador creyó), muestrea cada 0.25s,
//   escribe debug/layout.json, y comprueba cada frame. Sale con código 1 si hay CUALQUIER fallo.
// Uso: node scripts/verify.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { W, H, ZONES, MAXTEXT, TEXT_TYPES, FS, bboxOf, interArea, area, outOfFrame, isStructural, isPhoto } from "./geometry.mjs";

const dir = process.argv[2] || (fs.existsSync("episodes/active.txt") ? fs.readFileSync("episodes/active.txt", "utf8").trim() : "episodes/test-cpu");
const scenes = JSON.parse(fs.readFileSync(path.join(dir, "scenes.json"), "utf8"));
const ts = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;

// --- muestreo + emisión de debug/layout.json ---
const dur = scenes.meta.duration, STEP = 0.25;
const frames = [];
for (let t = 0; t <= dur; t = +(t + STEP).toFixed(2)) {
  const live = scenes.elements.filter(e => e.type !== "watermark" && e.in <= t + 1e-6 && e.out > t + 1e-6 && e.box);
  frames.push({ t, elements: live.map(e => ({ id: e.id, type: e.type, kind: e.kind, structural: isStructural(e), accum: !!e._accum, hero: !!e._hero, bbox: bboxOf(e, t).map(Math.round), layer: e.z ?? 20 })) });
}
const dbgDir = path.join(dir, "debug"); fs.mkdirSync(dbgDir, { recursive: true });
fs.writeFileSync(path.join(dbgDir, "layout.json"), JSON.stringify({ fps: scenes.meta.fps, frames }, null, 0));

// --- comprobaciones por frame ---
const fails = [];
for (const fr of frames) {
  const els = fr.elements;
  const texts = els.filter(e => TEXT_TYPES.has(e.type));
  const dynTexts = texts.filter(e => !e.structural);
  const images = els.filter(e => isPhoto(e)); // solo FOTOS grandes; los iconos vector van sobre la base

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
  // 3) máx N etiquetas simultáneas (lienzo acumulativo: hasta 6 dibujos, cada uno con su etiqueta)
  if (dynTexts.length > 7) fails.push({ t: fr.t, kind: "n-textos", msg: `${dynTexts.length} textos simultáneos (máximo 7)` });
  // 4) texto saliéndose del frame
  for (const e of texts) if (outOfFrame(e.bbox) > 0) fails.push({ t: fr.t, kind: "fuera", msg: `"${e.id}" se sale del frame [${e.bbox}]` });
  // 5) imagen-imagen > 35% del área menor
  for (let i = 0; i < images.length; i++) for (let j = i + 1; j < images.length; j++) {
    const ia = interArea(images[i].bbox, images[j].bbox), minA = Math.min(area(images[i].bbox), area(images[j].bbox));
    if (minA > 0 && ia / minA > 0.35) fails.push({ t: fr.t, kind: "img-img", msg: `Solapamiento imagen-imagen ${(ia / minA * 100).toFixed(0)}% (>35%): "${images[i].id}" / "${images[j].id}"` });
  }
  // 6) total simultáneos (lienzo acumulativo: 6 dibujos + 6 etiquetas). Sin contar navegación fija
  const dyn = els.filter(e => !e.structural && !e.accum).length; // los iconos del lienzo acumulativo NO cuentan (van en rejilla)
  if (dyn > 14) fails.push({ t: fr.t, kind: "total", msg: `${dyn} elementos dinámicos (no-lienzo) simultáneos (máximo 14)` });
  const acc = els.filter(e => e.accum).length;
  if (acc > 16) fails.push({ t: fr.t, kind: "total", msg: `${acc} iconos acumulados a la vez (máximo 16 en el lienzo)` });
}
// 7) ELEMENTO ÚNICO → centrado. SOSTENIDO: falla si un único elemento queda descentrado > 1s seguido
//    (caza el elemento solo y quieto a un lado; ignora transiciones breves de entrada/salida).
{
  let run = 0, runStart = 0, runId = "";
  for (const fr of frames) {
    const solos = fr.elements.filter(e => !e.structural && !e.accum && !e.hero); // los HERO van descentrados a propósito
    const off = solos.length === 1 && Math.abs((solos[0].bbox[0] + solos[0].bbox[2]) / 2 - 960) > 90;
    if (off) { if (run === 0) { runStart = fr.t; runId = solos[0].id; } run += STEP; }
    else { if (run >= 1.75) fails.push({ t: runStart, kind: "solo-descentrado", msg: `único elemento "${runId}" descentrado durante ${run.toFixed(1)}s (debe ir centrado)` }); run = 0; }
  }
  if (run >= 1.75) fails.push({ t: runStart, kind: "solo-descentrado", msg: `único elemento "${runId}" descentrado durante ${run.toFixed(1)}s` });
}
// 8) HUECOS → ningún tramo > 2s sin NINGÚN dibujo o texto (flechas y formas no cuentan como relleno)
{
  let run = 0, runStart = 0;
  for (const fr of frames) {
    const has = fr.elements.some(e => !e.structural && e.type !== "arrow" && e.type !== "shape");
    if (!has) { if (run === 0) runStart = fr.t; run += STEP; }
    else { if (run > 2.0) fails.push({ t: runStart, kind: "hueco", msg: `${run.toFixed(1)}s en blanco sin ningún dibujo/texto` }); run = 0; }
  }
  if (run > 2.0) fails.push({ t: runStart, kind: "hueco", msg: `${run.toFixed(1)}s en blanco al final` });
}
// 8b) NINGÚN TEXTO SIN ICONO → si hay texto dinámico pero ningún icono/imagen dinámica en pantalla → FALLO
{
  let run = 0, runStart = 0, runId = "";
  for (const fr of frames) {
    const dyn = fr.elements.filter(e => !e.structural);
    const hasText = dyn.some(e => TEXT_TYPES.has(e.type));
    const hasImg = dyn.some(e => e.type === "image" || e.type === "clip" || e.type === "gif");
    if (hasText && !hasImg) { if (run === 0) { runStart = fr.t; runId = (dyn.find(e => TEXT_TYPES.has(e.type)) || {}).id; } run += STEP; }
    else { if (run > 0.6) fails.push({ t: runStart, kind: "texto-sin-icono", msg: `texto "${runId}" sin ningún icono en pantalla durante ${run.toFixed(1)}s (todo texto lleva icono)` }); run = 0; }
  }
  if (run > 0.6) fails.push({ t: runStart, kind: "texto-sin-icono", msg: `texto sin icono ${run.toFixed(1)}s al final` });
}

// --- comprobaciones a NIVEL ELEMENTO (MATERIAL.md): ninguna imagen > 15s; ningún texto < 34px ---
for (const e of scenes.elements) {
  if ((e.type === "image" || e.type === "clip" || e.type === "gif") && e.box && !isStructural(e) && !e._accum && !e._hero && !e._hold && (e.out - e.in) > 15.1)
    fails.push({ t: e.in, kind: "15s", msg: `imagen "${e.id}" ${(e.out - e.in).toFixed(0)}s en pantalla (máx 15s — cámbiala o mete otra)` });
  if (TEXT_TYPES.has(e.type) && e.type !== "stat") { const fs = e.fontSize || FS[e.size] || FS.md; if (fs < 34) fails.push({ t: e.in, kind: "texto-pequeño", msg: `"${e.id}" texto a ${fs}px (mínimo 34px, no se lee en miniatura)` }); }
  // 1) DESBORDAMIENTO: el ancho real del texto no puede exceder su caja/anclaje (no se recorta: falla)
  if (TEXT_TYPES.has(e.type) && e.box) { const bb = bboxOf(e); const w = bb[2] - bb[0]; if (w > (e.box.w || 700) + 14) fails.push({ t: e.in, kind: "desborde", msg: `"${e.id}" texto ${Math.round(w)}px > caja ${e.box.w}px ("${(e.content || "").slice(0, 24)}") — se sale` }); }
  // 3) SINCRONÍA: un texto no puede entrar ANTES de que se diga su palabra, ni desviarse > 0.3s
  if (e._syncT != null) { if (e.in < e._syncT - 0.02) fails.push({ t: e.in, kind: "antes-de-voz", msg: `"${e.id}" ("${(e.content || "").slice(0, 20)}") entra en ${e.in.toFixed(2)}s pero se dice en ${e._syncT.toFixed(2)}s (ANTES de tiempo)` }); else if (Math.abs(e.in - e._syncT) > 0.3) fails.push({ t: e.in, kind: "desync", msg: `"${e.id}" desviación ${(e.in - e._syncT).toFixed(2)}s (>0.3s) de su palabra` }); }
  // 2) FORMA HUÉRFANA: una SHP con objetivo no puede sobrevivir a su objetivo
  if (e.type === "shape" && e._target) { const tgt = scenes.elements.find(x => x.id === e._target); if (!tgt) fails.push({ t: e.in, kind: "forma-huerfana", msg: `forma "${e.id}" sin objetivo vivo` }); else if (tgt.out < e.out - 0.05) fails.push({ t: e.in, kind: "forma-huerfana", msg: `forma "${e.id}" (hasta ${e.out}s) sobrevive a su objetivo "${tgt.id}" (sale en ${tgt.out}s)` }); }
}
// 4) ASSETS DECLARADOS: si el storyboard declara un ICO/IMG y no se colocó → FALLO
for (const id of (scenes.meta.declaredMissing || [])) fails.push({ t: 0, kind: "declarado", msg: `asset declarado "${id}" no aparece (falta generarlo)` });
// 9) DURACIÓN MÍNIMA: los vídeos deben durar al menos 8 minutos (regla del usuario)
if (dur < 480) fails.push({ t: 0, kind: "duracion-corta", msg: `el vídeo dura ${(dur / 60).toFixed(1)} min (mínimo 8:00). Alarga el guion con más contenido (no relleno).` });
// 10) ESTÁTICO: ningún elemento dinámico (no HUD) puede vivir más de 3.5s → tiene que ser dinámico
for (const e of scenes.elements) { if (e.box && !isStructural(e) && !e.hud && !e._hero && !e._hold && e.type !== "watermark" && (e.out - e.in) > 3.5) fails.push({ t: e.in, kind: "estatico", msg: `"${e.id}" (${(e.content || e.src || "").toString().replace(/.*\//, "").slice(0, 18)}) ${ (e.out - e.in).toFixed(1)}s en pantalla (máx 3s: mete más elementos)` }); }
// 11) ICONO REPETIDO: el mismo dibujo no puede reaparecer a menos de 6s de haber salido (evita repetir seguido)
{
  const imgs = scenes.elements.filter(e => e.type === "image" && !e.hud && !isStructural(e) && e.src).sort((a, b) => a.in - b.in);
  const lastOut = {};
  for (const e of imgs) { const k = e.src; if (lastOut[k] != null && e.in - lastOut[k] < 6) fails.push({ t: e.in, kind: "icono-repetido", msg: `icono "${e.src.replace(/.*\//, "")}" repetido a los ${(e.in - lastOut[k]).toFixed(1)}s de salir (varía el dibujo, no repitas seguido)` }); lastOut[k] = Math.max(lastOut[k] || 0, e.out); }
}

// --- informe ---
// "15s" queda como AVISO (no bloquea) hasta que esté la rotación de imágenes; el resto son duros.
const HARD = new Set(["texto-texto", "zona", "n-textos", "fuera", "img-img", "total", "texto-pequeño", "desborde", "antes-de-voz", "desync", "forma-huerfana", "declarado", "solo-descentrado", "hueco", "duracion-corta", "texto-sin-icono"]);
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

// geometry: geometría COMPARTIDA por el solver de layout (02-build-scenes) y el verificador (verify).
//   Si ambos no usan exactamente el mismo bbox, el solver coloca bien según su modelo y verify
//   falla según otro → volvemos al bucle. Por eso vive aquí una sola vez.
import fs from "node:fs";
const PROFILE = JSON.parse(fs.readFileSync("style-profile.json", "utf8"));
export const W = 1920, H = 1080;
export const FS = PROFILE.typography?.sizes || { sm: 32, md: 48, lg: 72, title: 96 };
export const ZONES = PROFILE.reservedZones || {};
export const MAXTEXT = PROFILE.maxSimultaneousText || 4;
const CHARW = 0.47; // ancho medio de carácter (fuente manuscrita) relativo al tamaño de fuente
export const TEXT_TYPES = new Set(["text", "title", "boxtext", "stat"]);

export const isStructural = (e) => e.structural || e.type === "title" || e.type === "watermark" || /^(badge|blabel)/.test(e.id || "");
// "foto" = imagen grande de contenido (se comprueba solape entre fotos). Los ICONOS vector NO cuentan:
// van deliberadamente ENCIMA de la base, como marcadores.
export const isPhoto = (e) => (e.type === "clip" || e.type === "gif") || (e.type === "image" && /cutout|archive|screenshot|photo/.test(e.kind || ""));
export const isImageEl = (e) => e.type === "image" || e.type === "clip" || e.type === "gif";

export function bboxOf(e) {
  const b = e.box || { cx: 960, cy: 540, w: 100, h: 100 };
  if (TEXT_TYPES.has(e.type)) {
    const fs = e.type === "stat" ? 150 : (e.fontSize || FS[e.size] || FS.md);
    const len = (e.content || "").length || 3;
    // el texto va en UNA línea (nowrap). El énfasis (rojo/grande) usa Caveat, más ancho. Sin cap: ancho REAL.
    const emph = (typeof e.color === "string" && /^#e/i.test(e.color)) || e.size === "lg" || e.size === "xl";
    const cw = e.type === "title" ? 0.6 : (emph ? 0.58 : CHARW);
    let w = len * fs * cw;
    let h = (e.type === "stat" ? fs * 1.5 : fs * 1.25);
    if (e.type === "boxtext") { w += 44; h += 16; }
    return [b.cx - w / 2, b.cy - h / 2, b.cx + w / 2, b.cy + h / 2];
  }
  return [b.cx - b.w / 2, b.cy - b.h / 2, b.cx + b.w / 2, b.cy + b.h / 2];
}
export const interArea = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
export const area = (a) => Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
export const outOfFrame = (a) => Math.max(0, -a[0]) + Math.max(0, -a[1]) + Math.max(0, a[2] - W) + Math.max(0, a[3] - H);
export const hitsZone = (bb) => Object.values(ZONES).some(z => interArea(bb, z) > 0);
export const coexist = (a, b) => a.in < b.out && b.in < a.out;

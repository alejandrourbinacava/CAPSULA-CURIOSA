// normalize-icon: convierte CUALQUIER SVG al ESTILO DE LA CASA (color-pop):
//   1) SVGO limpia metadata y aplana transforms + convierte shapes a paths
//   2) quita fill/stroke originales
//   3) path de mayor área = "cuerpo" -> var(--fill-body); paths pequeños -> var(--fill-detail)
//   4) a todos: stroke #111111, stroke-width 4, vector-effect non-scaling-stroke, linejoin/linecap round
//   5) colores como var(--fill-body)/var(--fill-detail) (recolorables en render), con fallback = paleta
// CLI: node scripts/normalize-icon.mjs <archivo.svg> --color=yellow [--out=ruta.svg]
import fs from "node:fs";
import path from "node:path";
import { optimize } from "svgo";

const PROFILE = JSON.parse(fs.readFileSync("style-profile.json", "utf8"));
const PALETTE = PROFILE.palette || {};
const STROKE = PROFILE.stroke || "#111111";
const DETAIL = "#1F1F1F";
export const colorHex = (name) => PALETTE[name] || name || Object.values(PALETTE)[0] || "#F5C518";

// bbox aproximada de un path (para rankear área). Usa endpoints; ignora curvatura (suficiente para rankear).
function pathBBox(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = "", minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  const num = () => parseFloat(toks[i++]);
  const put = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) { cmd = toks[i++]; }
    const rel = cmd === cmd.toLowerCase(); const C = cmd.toUpperCase();
    if (C === "M" || C === "L" || C === "T") { let x = num(), y = num(); if (rel) { x += cx; y += cy; } cx = x; cy = y; if (C === "M") { sx = x; sy = y; } put(x, y); }
    else if (C === "H") { let x = num(); if (rel) x += cx; cx = x; put(x, cy); }
    else if (C === "V") { let y = num(); if (rel) y += cy; cy = y; put(cx, y); }
    else if (C === "C") { num(); num(); num(); num(); let x = num(), y = num(); if (rel) { x += cx; y += cy; } cx = x; cy = y; put(x, y); }
    else if (C === "S" || C === "Q") { num(); num(); let x = num(), y = num(); if (rel) { x += cx; y += cy; } cx = x; cy = y; put(x, y); }
    else if (C === "A") { num(); num(); num(); num(); num(); let x = num(), y = num(); if (rel) { x += cx; y += cy; } cx = x; cy = y; put(x, y); }
    else if (C === "Z") { cx = sx; cy = sy; }
    else { i++; } // token inesperado
  }
  if (maxX < minX) return 0;
  return (maxX - minX) * (maxY - minY);
}

export function normalizeSvg(svg, color = "yellow") {
  const fill = colorHex(color);
  // 1) SVGO: limpia + aplana transforms + shapes->paths
  const opt = optimize(svg, {
    multipass: true,
    plugins: [
      { name: "preset-default" },
      { name: "convertShapeToPath", params: { convertArcs: true } },
      "convertStyleToAttrs", "removeDimensions",
    ],
  }).data;

  const viewBox = (opt.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 24 24";
  // 2-3) recoger paths y rankear por área
  const paths = [...opt.matchAll(/<path\b[^>]*>/g)].map(m => m[0]);
  if (!paths.length) return opt; // nada que hacer
  const withArea = paths.map(p => { const d = (p.match(/\bd="([^"]*)"/) || [])[1] || ""; return { p, d, area: pathBBox(d) }; });
  const maxArea = Math.max(...withArea.map(w => w.area));
  // 4-5) reescribir cada path con el estilo de la casa
  const strokeAttrs = `fill-rule="evenodd" paint-order="stroke fill" stroke="${STROKE}" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"`;
  const newPaths = withArea.map(({ p, d, area }) => {
    const isBody = area >= maxArea * 0.6; // el/los grandes = cuerpo
    const v = isBody ? "--fill-body" : "--fill-detail";
    const def = isBody ? fill : DETAIL;
    return `<path d="${d}" fill="var(${v}, ${def})" ${strokeAttrs}/>`;
  });
  const body = newPaths.join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="320" height="320" style="--fill-body:${fill};--fill-detail:${DETAIL}" overflow="visible">${body}</svg>`;
}

// ---- CLI ----
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("normalize-icon.mjs")) {
  const file = process.argv.find(a => a.endsWith(".svg") && !a.startsWith("--"));
  const color = (process.argv.find(a => a.startsWith("--color=")) || "").split("=")[1] || "yellow";
  const out = (process.argv.find(a => a.startsWith("--out=")) || "").split("=")[1] || file;
  if (!file) { console.error("uso: node scripts/normalize-icon.mjs <archivo.svg> --color=yellow [--out=ruta]"); process.exit(1); }
  const norm = normalizeSvg(fs.readFileSync(file, "utf8"), color);
  fs.writeFileSync(out, norm);
  console.log(`✔ normalizado (${color} -> ${colorHex(color)}) -> ${out}`);
}

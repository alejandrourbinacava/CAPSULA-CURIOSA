// assets:check — Addendum 1 · F. Recorre el guion, lista los asset_id usados (show/clip/gif/head)
//   y marca los que NO tienen fichero descargado, ANTES de gastar en TTS. Sale con código 1 si faltan.
// Uso: node scripts/assets-check.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "episodes/test-cpu";
const body = fs.readFileSync(path.join(dir, "script.md"), "utf8");
const assets = fs.existsSync(path.join(dir, "assets.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "assets.json"), "utf8")) : {};

const used = new Set();
const re = /\[\[([^\]]+)\]\]/g; let m;
while ((m = re.exec(body))) {
  const s = m[1].trim(); const v = s.split(/[:\s]/)[0];
  if (v === "show" || v === "clip" || v === "gif") used.add(s.replace(/^(show|clip|gif):?\s*/, "").split(/[@\s,]/)[0].trim());
  const head = (s.match(/head\s*=\s*([a-z0-9_-]+)/) || [])[1]; if (head) used.add(head);
}

const has = (id) => { const f = assets[id]?.file; if (f && fs.existsSync(path.join("public", f))) return true; return fs.existsSync(path.join("public", "assets", "icons", id + ".svg")); };
const missing = [...used].filter(id => !has(id));
const ids = Object.keys(assets);
const similar = (id) => ids.filter(k => k !== id && (k.includes(id.slice(0, 4)) || id.includes(k.slice(0, 4)))).slice(0, 3);

console.log(`assets:check ${dir} — ${used.size} usados, ${missing.length} faltan`);
for (const id of missing) console.log(`  ✗ "${id}" (kind=${assets[id]?.kind || "?"})  sugerencias: ${similar(id).join(", ") || "—"}`);

// GATE (Addendum: normalizador): todo asset kind:"vector" DEBE haber pasado por el normalizador.
const unnorm = Object.entries(assets).filter(([, a]) => a.kind === "vector" && a.file && !a.normalized).map(([id]) => id);
if (unnorm.length) {
  console.log(`\n  ✗ BUILD FALLA: ${unnorm.length} asset(s) kind:"vector" SIN normalizar: ${unnorm.join(", ")}`);
  console.log(`    Ejecuta 01-assets (normaliza automáticamente) o "npm run normalize -- <svg> --color=<paleta>".`);
  process.exit(1);
}

if (missing.length) { console.log(`\n  Añade estos assets o corrige el guion antes de renderizar.`); process.exit(process.argv.includes("--strict") ? 1 : 0); }
console.log("  ✓ todos los assets presentes · vectores normalizados ✓");

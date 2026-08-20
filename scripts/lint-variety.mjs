// lint:variety — Addendum 1 · C. Analiza scenes.json y da un informe de variedad:
//   reparto de plantillas, plantillas repetidas en beats consecutivos, segundos sin movimiento,
//   direcciones de flecha y assets más repetidos. Sale 1 si incumple criterios "duros".
// Uso: node scripts/lint-variety.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "episodes/test-cpu";
const scenes = JSON.parse(fs.readFileSync(path.join(dir, "scenes.json"), "utf8"));
const els = scenes.elements, dur = scenes.meta.duration;
const V = scenes.meta.variety || { templates: {}, beats: [] };

const distinct = Object.keys(V.templates || {}).length;
let consec = 0; for (let i = 1; i < (V.beats || []).length; i++) if (V.beats[i] === V.beats[i - 1]) consec++;

// movimiento = clip/gif/stickman (animación) — regla: nada más de 45s sin movimiento
const moving = els.filter(e => e.type === "clip" || e.type === "gif" || e.type === "stickman").map(e => e.in).sort((a, b) => a - b);
let maxGap = moving.length ? moving[0] : dur, prev = moving[0] || 0;
for (const t of moving) { maxGap = Math.max(maxGap, t - prev); prev = t; }
maxGap = Math.max(maxGap, dur - prev);

const dirs = new Set(els.filter(e => e.type === "arrow").map(e => (e.a && e.b) ? (Math.abs(e.b.x - e.a.x) >= Math.abs(e.b.y - e.a.y) ? (e.b.x >= e.a.x ? "→" : "←") : (e.b.y >= e.a.y ? "↓" : "↑")) : "?"));
const nClip = els.filter(e => e.type === "clip").length, nGif = els.filter(e => e.type === "gif").length, nShape = new Set(els.filter(e => e.type === "shape").map(e => e.kind)).size;
const counts = {}; for (const e of els) if (e.src) { const k = e.src.split("/").pop(); counts[k] = (counts[k] || 0) + 1; }
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

console.log(`── lint:variety · ${dir} (${dur.toFixed(0)}s, ${(V.beats || []).length} beats) ──`);
console.log(`plantillas (${distinct} distintas): ${Object.entries(V.templates || {}).map(([k, v]) => k + "×" + v).join(", ")}`);
console.log(`repetidas en beats consecutivos: ${consec}`);
console.log(`mayor tramo sin movimiento: ${maxGap.toFixed(1)}s`);
console.log(`direcciones de flecha: ${[...dirs].join(" ") || "—"}`);
console.log(`clips: ${nClip} · gifs: ${nGif} · tipos de shape: ${nShape}`);
console.log(`assets más repetidos: ${top.map(([k, v]) => k + "×" + v).join(", ")}`);

const fails = [];
if (distinct < 6) fails.push(`solo ${distinct} plantillas distintas (mín 6)`);
if (consec > 0) fails.push(`${consec} plantillas repetidas en beats consecutivos`);
if (maxGap > 45) fails.push(`tramo de ${maxGap.toFixed(0)}s sin movimiento (máx 45)`);
if (dirs.size < 3 && els.some(e => e.type === "arrow")) fails.push(`solo ${dirs.size} direcciones de flecha (mín 3)`);
if (fails.length) { console.log("✗ incumple: " + fails.join(" · ")); process.exit(process.argv.includes("--strict") ? 1 : 0); }
console.log("✓ variedad OK");

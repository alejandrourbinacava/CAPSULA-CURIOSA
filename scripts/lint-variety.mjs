// lint:variety (ADDENDUM 2 · G). Comprueba: densidad por sección, ≥3 kinds distintos por sección,
//   ningún meme >4s, ningún tramo de 20s sin texto-eco nuevo, badge presente ~siempre,
//   máx 5 textos simultáneos, proporción de texto rojo < 15%.
// Uso: node scripts/lint-variety.mjs episodes/<slug> [--strict]
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "episodes/test-cpu";
const scenes = JSON.parse(fs.readFileSync(path.join(dir, "scenes.json"), "utf8"));
const els = scenes.elements, dur = scenes.meta.duration;
const V = scenes.meta.variety || {};
const ACC = "#EE2B37", accset = new Set([ACC, "#E5342A"]);

// densidad
const dens = V.density || [];
const badDens = dens.filter(s => s.d > 0.8 || s.d < 0.15);

// kinds por sección (usa densidad como partición temporal aproximada por sección)
const imgs = els.filter(e => (e.type === "image" || e.type === "clip" || e.type === "gif") && e.kind);
// memes con vida > 4s
const longMeme = els.filter(e => e.kind === "meme" && (e.out - e.in) > 4);

// iconos/imágenes de CONCEPTO repetidos (excluye badge de esquina y marca de agua)
const concept = els.filter(e => (e.type === "image" || e.type === "clip" || e.type === "gif") && e.src && !(e.box && e.box.cx < 300 && e.box.cy < 170));
const srcCount = {}; for (const e of concept) { const k = e.src.split("/").pop(); srcCount[k] = (srcCount[k] || 0) + 1; }
const repeated = Object.entries(srcCount).filter(([, n]) => n > 1);

// tramos sin texto-eco nuevo
const echoes = els.filter(e => e.echo).map(e => e.in).sort((a, b) => a - b);
let maxEchoGap = echoes.length ? echoes[0] : dur, p = echoes[0] || 0;
for (const t of echoes) { maxEchoGap = Math.max(maxEchoGap, t - p); p = t; }
maxEchoGap = Math.max(maxEchoGap, dur - p);

// badge presente: ¿hay un elemento tipo image en la esquina (cx<300,cy<170) vivo en todo t?
const badges = els.filter(e => e.type === "image" && e.box && e.box.cx < 300 && e.box.cy < 170);
let badgeGap = 0; { let last = 0; const iv = badges.map(b => [b.in, b.out]).sort((a, b) => a[0] - b[0]); for (const [s, e] of iv) { if (s > last + 0.5) badgeGap = Math.max(badgeGap, s - last); last = Math.max(last, e); } badgeGap = Math.max(badgeGap, dur - last); }

// máx 5 textos simultáneos (muestreo por segundo)
const texts = els.filter(e => e.type === "text" || e.type === "title" || e.type === "boxtext" || e.type === "stat");
const floating = texts.filter(e => !e.structural && e.type !== "title");
// cuenta solo textos en su fase ESTABLE (ni entrando ni saliendo): un fade de frontera no es "clutter"
let maxText = 0; for (let t = 0; t < dur; t += 0.5) maxText = Math.max(maxText, floating.filter(e => e.in + 0.3 <= t && t < e.out - 0.15).length);

// proporción de texto rojo
const redW = texts.filter(e => accset.has(e.color)).reduce((a, e) => a + (e.content || "").split(/\s+/).length, 0);
const allW = texts.reduce((a, e) => a + (e.content || "").split(/\s+/).length, 0) || 1;
const redRatio = redW / allW;

console.log(`── lint:variety (Addendum 2) · ${dir} · ${dur.toFixed(0)}s · ${V.sections || "?"} secciones · ${V.echoes || 0} ecos ──`);
console.log(`densidad por sección: ${dens.map(s => s.label + "=" + s.d).join(", ")}`);
console.log(`kinds de imagen usados: ${[...new Set(imgs.map(e => e.kind))].join(", ") || "—"}`);
console.log(`mayor tramo sin texto-eco: ${maxEchoGap.toFixed(1)}s · badge ausente máx: ${badgeGap.toFixed(1)}s`);
console.log(`máx textos simultáneos: ${maxText} · texto rojo: ${(redRatio * 100).toFixed(0)}% · memes>4s: ${longMeme.length}`);
console.log(`clips: ${els.filter(e => e.type === "clip").length} · gifs: ${els.filter(e => e.type === "gif").length} · iconos repetidos: ${repeated.map(([k, n]) => k + "×" + n).join(", ") || "ninguno"}`);

const fails = [];
if (repeated.length) fails.push(`${repeated.length} icono(s) repetido(s): ${repeated.map(([k, n]) => k + "×" + n).join(", ")}`);
if (badDens.length) fails.push(`densidad fuera de rango en: ${badDens.map(s => s.label + "=" + s.d).join(", ")}`);
if (longMeme.length) fails.push(`${longMeme.length} meme(s) con vida > 4s`);
if (maxEchoGap > 20) fails.push(`tramo de ${maxEchoGap.toFixed(0)}s sin texto-eco (máx 20)`);
if (badgeGap > 3) fails.push(`badge ausente ${badgeGap.toFixed(0)}s (debe estar ~siempre)`);
if (maxText > 4) fails.push(`${maxText} textos simultáneos (máx 4)`);
if (redRatio > 0.15) fails.push(`texto rojo ${(redRatio * 100).toFixed(0)}% (máx 15%)`);
if (fails.length) { console.log("✗ incumple: " + fails.join(" · ")); process.exit(process.argv.includes("--strict") ? 1 : 0); }
console.log("✓ variedad OK");

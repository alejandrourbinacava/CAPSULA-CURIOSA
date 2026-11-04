// align-words: reescribe episodes/<slug>/words.json con las PALABRAS DEL GUION (script.md) y los TIEMPOS de Whisper.
//   Problema que resuelve: Whisper transcribe cifras como dígitos ("1944", "5 %") y cambia nombres propios; el guion las
//   tiene en letras -> el alineado greedy de 02s-storyboard se desfasaba 5-9 s. Aquí se alinea por programación dinámica
//   (Needleman-Wunsch sobre tokens normalizados) y las palabras sin pareja se interpolan entre sus vecinas.
// Uso: node scripts/align-words.mjs episodes/<slug>      (guarda el original en words.whisper-original.json)
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2]; if (!dir) { console.log("uso: node scripts/align-words.mjs episodes/<slug>"); process.exit(1); }
const wp = path.join(dir, "words.json"), orig = path.join(dir, "words.whisper-original.json");
if (!fs.existsSync(orig)) fs.copyFileSync(wp, orig);                       // la base SIEMPRE es la transcripción original de Whisper
const W = JSON.parse(fs.readFileSync(orig, "utf8"));
let raw = fs.readFileSync(path.join(dir, "script.md"), "utf8").replace(/\r\n/g, "\n");
raw = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
const S = raw.replace(/\[\[[^\]]*\]\]/g, "").replace(/\*\*|==/g, "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const sn = S.map(norm), wn = W.map(x => norm(x.word));
const n = S.length, m = W.length;
// puntuación: 0 igual, 1 distinto (sustitución), 1 hueco
const idx = (i, j) => i * (m + 1) + j; const D = new Uint16Array((n + 1) * (m + 1)); const P = new Uint8Array((n + 1) * (m + 1));
for (let i = 1; i <= n; i++) { D[idx(i, 0)] = i; P[idx(i, 0)] = 1; } for (let j = 1; j <= m; j++) { D[idx(0, j)] = j; P[idx(0, j)] = 2; }
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
  const a = sn[i - 1], b = wn[j - 1]; const sub = D[idx(i - 1, j - 1)] + (a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a))) ? 0 : 1);
  const up = D[idx(i - 1, j)] + 1, left = D[idx(i, j - 1)] + 1; let best = sub, p = 0; if (up < best) { best = up; p = 1; } if (left < best) { best = left; p = 2; }
  D[idx(i, j)] = best; P[idx(i, j)] = p;
}
// retroceso: pareja[i] = índice de Whisper o -1
const pair = new Array(n).fill(-1); let i = n, j = m;
while (i > 0 || j > 0) { const p = P[idx(i, j)]; if (i > 0 && j > 0 && p === 0) { pair[i - 1] = j - 1; i--; j--; } else if (i > 0 && (j === 0 || p === 1)) { i--; } else { j--; } }
// tiempos: las parejas toman el tiempo de Whisper; el resto se interpola entre vecinas
const out = S.map((w, k) => pair[k] >= 0 ? { word: w, start: W[pair[k]].start, end: W[pair[k]].end } : { word: w, start: null, end: null });
for (let k = 0; k < n;) {
  if (out[k].start != null) { k++; continue; }
  let e = k; while (e < n && out[e].start == null) e++;
  const t0 = k > 0 ? out[k - 1].end : 0, t1 = e < n ? out[e].start : (W.length ? W[m - 1].end : t0 + 0.3); const cnt = e - k, span = Math.max(0.1, t1 - t0);
  for (let q = 0; q < cnt; q++) { out[k + q].start = +(t0 + (span * q) / cnt).toFixed(2); out[k + q].end = +(t0 + (span * (q + 1)) / cnt).toFixed(2); }
  k = e;
}
for (let k = 1; k < n; k++) if (out[k].start < out[k - 1].start) { out[k].start = out[k - 1].start; if (out[k].end < out[k].start) out[k].end = out[k].start + 0.1; }
fs.writeFileSync(wp, JSON.stringify(out));
const matched = pair.filter(x => x >= 0).length;
console.log(`align-words: ${n} palabras del guion · ${m} de Whisper · ${matched} emparejadas (${Math.round(100 * matched / n)} %) · original en words.whisper-original.json`);

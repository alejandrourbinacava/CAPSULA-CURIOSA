// 02s-storyboard: COMPILA un storyboard ANOTADO A MANO (storyboard.md) a scenes.json.
//   "El compilador solo ejecuta lo escrito": lee cada BEAT (narración + eventos +t/-t TIPO asset @ancla),
//   sincroniza el inicio del beat a su narración REAL (words.json) y coloca cada elemento en su anclaje.
// Uso: node scripts/02s-storyboard.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
const PROFILE = JSON.parse(fs.readFileSync("style-profile.json", "utf8"));
const RED = PROFILE.accent || "#EE2B37", STROKE = PROFILE.stroke || "#111111";
const W = 1920, H = 1080;

const raw = fs.readFileSync(path.join(dir, "script.md"), "utf8");
let title = "Episodio"; const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/); let body = raw;
if (fm) { const mt = fm[1].match(/title:\s*"?(.+?)"?\s*$/m); if (mt) title = mt[1]; body = raw.slice(fm[0].length); }
const cleanWords = body.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
const words = JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8"));
const dur = Math.max(...words.map(w => w.end)) + 0.6;
const assets = fs.existsSync(path.join(dir, "assets.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "assets.json"), "utf8")) : {};
const assetFile = (id) => { const f = assets[id]?.file; if (f && fs.existsSync(path.join("public", f))) return f; for (const e of ["png", "jpg", "svg"]) { const g = `assets/icons/${id}.${e}`; if (fs.existsSync(path.join("public", g))) return g; } return null; };
const nz = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
const wn = words.map(w => nz(w.word));

// --- ANCLAJES → coordenadas (cubren las plantillas T1/T2/T5/T6/T0 del storyboard) ---
const A = {
  main: [960, 520], center: [960, 520], left: [540, 520], right: [1380, 520],
  top: [960, 390], top2: [960, 470], top3: [960, 550],
  cap: [960, 830], cap2: [960, 905],
  num: [610, 480], num2: [1320, 480], sub: [960, 730], sub2: [960, 850],
  a: [450, 470], b: [960, 470], c: [1470, 470], d: [450, 740], e: [960, 740], f: [1470, 740],
  la: [450, 660], lb: [960, 660], lc: [1470, 660], la2: [560, 690], lb2: [1050, 690],
  a1: [560, 360], a2: [560, 520], a3: [560, 680], c1: [1360, 360], c2: [1360, 520], c3: [1360, 680],
  b2: [960, 660],
  t1: [1400, 360], t2: [1400, 490], t3: [1400, 620], t4: [1400, 740], t5: [1400, 300], t5: [1400, 390], t6: [1400, 840], t1b: [1400, 430],
  g1: [400, 420], g2: [800, 420], g3: [1200, 420], g4: [1600, 420], g5: [400, 730], g6: [800, 730], g7: [1200, 730], g8: [1600, 730],
  lg1: [400, 590], lg2: [800, 590], lg3: [1200, 590], lg4: [1600, 590], lg8: [1600, 890],
};
const anchorXY = (a) => A[a] || A.center;
const FS = { stat: 140, lg: 60, md: 46, sm: 36, cap: 34 };
const COL = { red: RED, yellow: "#E9A400", green: "#2F9E44", cyan: "#1098AD", magenta: "#C2255C" };
const ENTER = { pop: { kind: "pop", duration: 0.4 }, fade: { kind: "fade-in", duration: 0.4 }, "slide-l": { kind: "slide-in-left", duration: 0.4 }, "slide-r": { kind: "slide-in-right", duration: 0.4 }, "slide-t": { kind: "slide-in-top", duration: 0.4 }, draw: { kind: "draw", duration: 0.6 }, handwrite: { kind: "handwrite", duration: 0.6 }, stamp: { kind: "stamp", duration: 0.3 }, whip: { kind: "stamp", duration: 0.25 } };
const enterOf = (e) => ENTER[(e || "pop").toLowerCase()] || ENTER.pop;

// --- PARSEAR BEATS (del storyboard, no del guion) ---
const sbText = fs.readFileSync(path.join(dir, "storyboard.md"), "utf8");
const beats = [];
const chunks = sbText.split(/^###\s+BEAT\s+/m).slice(1);
for (const ch of chunks) {
  const head = ch.split(/\r?\n/)[0];
  const num = parseInt(head, 10);
  const tmpl = (head.match(/·\s*(T\d)/) || [])[1] || "T1";
  const nar = (ch.match(/Narraci[oó]n:\s*\*?"?([^"\n]+?)"?\*?\s*$/mi) || [])[1] || "";
  const code = (ch.match(/```([\s\S]*?)```/) || [])[1] || "";
  const lines = code.split(/\r?\n/).map(l => l.trim()).filter(l => /^[+-]\d/.test(l));
  beats.push({ num, tmpl, nar: nar.replace(/\*/g, "").trim(), lines });
}

// --- ALINEACIÓN guion↔audio (greedy): el audio ES el guion leído; Whisper tokeniza distinto (i5, 285K...) ---
const P = cleanWords.map(nz);
const PMAP = new Array(P.length); { let pi = 0, wi = 0;
  while (pi < P.length && wi < wn.length) {
    if (P[pi] === wn[wi]) { PMAP[pi++] = wi++; continue; }
    if (wn[wi + 1] === P[pi]) { wi++; continue; }
    if (P[pi + 1] === wn[wi]) { PMAP[pi++] = wi; continue; }
    if (wn[wi + 2] === P[pi]) { wi += 2; continue; }
    if (P[pi + 2] === wn[wi]) { PMAP[pi] = wi; PMAP[pi + 1] = wi; pi += 2; continue; }
    PMAP[pi++] = wi++;
  }
  for (let k = pi; k < P.length; k++) PMAP[k] = wn.length - 1;
}
const timeOfProse = (pi) => { const j = PMAP[Math.min(pi, PMAP.length - 1)] ?? pi; return +(words[Math.min(j, words.length - 1)]?.start ?? dur).toFixed(2); };
// --- SINCRONIZAR cada beat: localizar su narración en la PROSA del guion (mismo texto) → índice → tiempo ---
let cursor = 0;
for (const b of beats) {
  const seq = b.nar.split(/\s+/).map(nz).filter(Boolean);
  let found = -1;
  if (seq.length >= 2) for (let i = cursor; i < P.length - 1; i++) { if (P[i] === seq[0] && P[i + 1] === seq[1]) { found = i; break; } }
  if (found < 0 && seq.length) for (let i = cursor; i < P.length; i++) { if (P[i] === seq[0]) { found = i; break; } }
  b.pIdx = found >= 0 ? found : cursor;
  b.t0 = timeOfProse(b.pIdx);
  if (found >= 0) cursor = found + 1;
}
for (let i = 0; i < beats.length; i++) beats[i].t1 = i + 1 < beats.length ? Math.max(beats[i].t0 + 1, beats[i + 1].t0) : dur;

// --- COMPILAR EVENTOS ---
const elements = [];
if (PROFILE.watermark && fs.existsSync(path.join("public", PROFILE.watermark)))
  elements.push({ id: "watermark", type: "watermark", src: PROFILE.watermark, box: { cx: 1810, cy: 1000, w: 150, h: 150 }, opacity: PROFILE.watermarkOpacity || 0.5, z: 5, in: 0, out: dur, enter: { kind: "fade-in", duration: 0.5 } });

const warns = []; let auto = 0; const live = {}; // anchor/id → element (para OUT/CLEAR)
const closeAll = (t) => { for (const k in live) { live[k].out = Math.min(live[k].out, t); delete live[k]; } };
const parseTargets = (s) => [...s.matchAll(/([a-z0-9]+)\s*(?:→|->)\s*([a-z0-9]+)/gi)].map(m => [m[1], m[2]]);

for (const b of beats) {
  const clamp = (off) => Math.min(b.t1 - 0.05, Math.max(b.t0, b.t0 + off));
  for (const ln of b.lines) {
    const m = ln.match(/^([+-])(\d[\d.]*)\s+([A-Z]{3})\s*(.*)$/);
    if (!m) continue;
    const [, , offs, type, rest0] = m; const t = +clamp(parseFloat(offs)).toFixed(2); const rest = rest0.trim();
    if (type === "OUT") { const id = rest.split(/\s+/)[0]; if (live[id]) { live[id].out = t; delete live[id]; } continue; }
    if (type === "CLEAR" || /^CLEAR/i.test(rest)) { closeAll(t); continue; }
    // TXT "literal" @anchor entrada size [color]
    if (type === "TXT") {
      const q = rest.match(/"([^"]*)"/); const content = q ? q[1] : rest.split("@")[0].trim();
      const anc = (rest.match(/@([a-z0-9]+)/i) || [])[1] || "center";
      const sizeK = (rest.match(/\b(stat|lg|md|sm|cap)\b/) || [])[1] || "md";
      const colK = (rest.match(/\b(red|yellow|green|cyan|magenta)\b/) || [])[1];
      const ent = (rest.match(/\b(pop|fade|slide-[lrt]|draw|handwrite|stamp|whip)\b/i) || [])[1];
      const [cx, cy] = anchorXY(anc);
      const el = { id: "t" + auto++, type: "text", content, fontSize: FS[sizeK] || 48, box: { cx, cy, w: 700, h: 90 }, color: colK ? (COL[colK] || RED) : STROKE, z: 60, in: t, out: b.t1, enter: enterOf(ent || "fade"), exit: { kind: "fade-out", duration: 0.25 } };
      elements.push(el); live["txt_" + anc + "_" + el.id] = el;
      continue;
    }
    if (type === "IMG" || type === "ICO" || type === "GIF") {
      const id = rest.split(/[\s@]/)[0].trim();
      const anc = (rest.match(/@([a-z0-9]+)/i) || [])[1] || (type === "GIF" ? "center" : "main");
      const ent = (rest.match(/\b(pop|fade|slide-[lrt]|draw|handwrite|stamp|whip)\b/i) || [])[1];
      const src = assetFile(id);
      if (!src) { warns.push(`asset ausente: "${id}" (beat ${b.num})`); continue; }
      const [cx, cy] = anchorXY(anc);
      const big = anc === "main" || anc === "center";
      const sz = type === "GIF" ? 360 : (big ? 460 : 300);
      const el = { id: id + "_" + auto++, type: "image", kind: type === "GIF" ? "meme" : "vector", src, box: { cx, cy, w: sz, h: sz }, z: type === "GIF" ? 55 : 30, in: t, out: type === "GIF" ? Math.min(b.t1, t + 3) : b.t1, auto: true, enter: enterOf(ent || "pop"), exit: { kind: "fade-out", duration: 0.3 } };
      elements.push(el); live[id] = el;
      continue;
    }
    if (type === "ARR") {
      const tg = parseTargets(rest)[0]; if (!tg) continue;
      const [pa, pb] = tg.map(anchorXY);
      elements.push({ id: "ar" + auto++, type: "arrow", a: { x: pa[0], y: pa[1] }, b: { x: pb[0], y: pb[1] }, curve: "none", color: RED, z: 40, in: t, out: b.t1, enter: { kind: "draw", duration: 0.5 }, exit: { kind: "fade-out", duration: 0.2 } });
      continue;
    }
    if (type === "SHP") {
      const kind = rest.split(/\s+/)[0];
      const tgt = (rest.match(/(?:→|->)\s*(?:"[^"]*"|([a-z0-9]+))/i) || [])[1] || "main";
      const [cx, cy] = anchorXY(tgt);
      const colK = (rest.match(/\b(red|yellow|green|cyan|magenta)\b/) || [])[1];
      const map = { "circle-highlight": "circle-highlight", circle: "circle-highlight", "cross-out": "cross-out", cross: "cross-out", underline: "underline", box: "box", bracket: "bracket" };
      elements.push({ id: "sh" + auto++, type: "shape", kind: map[kind] || "circle-highlight", box: { cx, cy, w: 360, h: 240 }, color: colK ? (COL[colK] || RED) : RED, z: 45, in: t, out: b.t1, enter: { kind: "draw", duration: 0.5 }, exit: { kind: "fade-out", duration: 0.2 } });
      continue;
    }
  }
  closeAll(b.t1); // por defecto, cada beat limpia al terminar (salvo lo ya cerrado)
}

const meta = { fps: 30, width: W, height: H, duration: +dur.toFixed(2), audio: "active/audio.mp3", title, profile: PROFILE.name };
const activeDir = path.join("public", "active"); fs.mkdirSync(activeDir, { recursive: true });
const epAudio = path.join(dir, "audio.mp3"); if (fs.existsSync(epAudio)) fs.copyFileSync(epAudio, path.join(activeDir, "audio.mp3"));
const out = { meta, elements };
fs.writeFileSync(path.join(dir, "scenes.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(activeDir, "scenes.json"), JSON.stringify(out, null, 2));
console.log(`✔ scenes.json (storyboard): ${elements.length} elementos · ${beats.length} beats · ${dur.toFixed(0)}s`);
if (warns.length) console.log(`⚠ ${warns.length} avisos:\n  ` + [...new Set(warns)].slice(0, 15).join("\n  "));

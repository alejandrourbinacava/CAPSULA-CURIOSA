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
const assetFile = (id) => { const f = assets[id]?.file; if (f && fs.existsSync(path.join("public", f))) return f; for (const e of ["png", "jpg", "svg"]) { const g = `assets/icons/${id}.${e}`; if (fs.existsSync(path.join("public", g))) return g; } const lib = `assets/library/${id}.png`; if (fs.existsSync(path.join("public", lib))) return lib; return null; }; // ← cualquier doodle de la librería versionada sirve directo (coste 0)
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
  hero: [960, 540], g11: [250, 380], g12: [250, 610], g13: [250, 840],
  heroL: [480, 515], heroR: [1150, 515], heroC: [960, 515], herolabel: [480, 815], mark: [1790, 150],
  htitle: [960, 120], hsub: [960, 210],
  lg1: [400, 560], lg2: [800, 560], lg3: [1200, 560], lg4: [1600, 560], lg5: [400, 880], lg6: [800, 880], lg7: [1200, 880], lg8: [1600, 880],
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

// sincroniza un texto a SU palabra en la voz (busca su 1ª palabra en la prosa cerca del beat) → tiempo real
const syncWordTime = (content, b) => {
  const toks = content.split(/\s+/).map(nz).filter(x => x.length >= 2); if (!toks.length) return null;
  const key = toks[0]; const lo = Math.max(0, b.pIdx - 2), hi = Math.min(P.length, b.pIdx + 45);
  for (let i = lo; i < hi; i++) if (P[i] === key) return timeOfProse(i);
  return null;
};
// tamaño de fuente que NO se sale del marco (auto-ajuste; nunca corta)
const fitFont = (content, fs) => { const maxW = 1720, cw = 0.6, w = content.length * fs * cw; return w > maxW ? Math.max(30, Math.floor(maxW / (content.length * cw))) : fs; };

// --- COMPILAR EVENTOS ---
const elements = [];
if (PROFILE.watermark && fs.existsSync(path.join("public", PROFILE.watermark)))
  elements.push({ id: "watermark", type: "watermark", src: PROFILE.watermark, box: { cx: 1810, cy: 1000, w: 150, h: 150 }, opacity: PROFILE.watermarkOpacity || 0.5, z: 5, in: 0, out: dur, enter: { kind: "fade-in", duration: 0.5 } });

const warns = []; let auto = 0; const live = {}; // anchor/id → element (para OUT/CLEAR)
const closeAll = (t, force) => { for (const k in live) { if (!force && live[k]._keep) continue; live[k].out = Math.min(live[k].out, t); delete live[k]; } }; // KEEP sobrevive al fin de beat; solo CLEAR/OUT lo cierra
const parseTargets = (s) => [...s.matchAll(/([a-z0-9]+)\s*(?:→|->)\s*([a-z0-9]+)/gi)].map(m => [m[1], m[2]]);

const chapters = []; // HUD de capítulo: {label, icon, t} — icono+texto fijos del sub-tema actual
const markers = [];  // MARCADOR de sección arriba-derecha: {icon, t} — dibujo del sujeto, persistente en la sección
const iconLastOut = {}; // src → out del último uso, para no repetir el mismo dibujo a menos de 6s

for (const b of beats) {
  const clamp = (off) => Math.min(b.t1 - 0.05, Math.max(b.t0, b.t0 + off));
  let liveByAnchor = {}, lastBig = null; b._els = [];
  for (const ln of b.lines) {
    const m = ln.match(/^([+-])(\d[\d.]*)\s+([A-Z]{3,})\s*(.*)$/);
    if (!m) continue;
    const [, , offs, type, rest0] = m; const t = +clamp(parseFloat(offs)).toFixed(2); const rest = rest0.trim();
    if (type === "OUT") { const id = rest.split(/\s+/)[0]; if (live[id]) { live[id].out = t; delete live[id]; } continue; }
    if (type === "CLEAR" || /^CLEAR/i.test(rest)) { closeAll(t, true); continue; }
    if (type === "CHAP") { const q = rest.match(/"([^"]*)"/); const ic = (rest.match(/"[^"]*"\s+([a-z0-9-]+)/) || [])[1]; chapters.push({ label: q ? q[1] : "", icon: ic || null, t: b.t0 }); continue; }
    if (type === "MARK") { const ic = rest.split(/[\s@]/)[0].trim(); if (ic) markers.push({ icon: ic, t: b.t0 }); continue; }
    // TXT "literal" @anchor entrada size [color]
    if (type === "TXT") {
      const q = rest.match(/"([^"]*)"/); const content = q ? q[1] : rest.split("@")[0].trim();
      const anc = (rest.match(/@([a-z0-9]+)/i) || [])[1] || "center";
      const sizeK = (rest.match(/\b(stat|lg|md|sm|cap)\b/) || [])[1] || "md";
      const colK = (rest.match(/\b(red|yellow|green|cyan|magenta)\b/) || [])[1];
      const ent = (rest.match(/\b(pop|fade|slide-[lrt]|draw|handwrite|stamp|whip)\b/i) || [])[1];
      let [cx, cy] = anchorXY(anc);
      const wordT = syncWordTime(content, b);                 // tiempo REAL en que se dice
      const usedWord = (wordT != null && wordT >= b.t0 - 1 && wordT <= b.t1 + 2);
      const inT = usedWord ? wordT : t;
      const fs = fitFont(content, FS[sizeK] || 48);           // auto-ajuste: nunca se corta
      const bw = Math.min(1760, Math.round(content.length * fs * 0.62) + 40);
      cx = Math.max(bw / 2 + 16, Math.min(W - bw / 2 - 16, cx)); // clamp: el texto nunca se sale del marco
      const keep = /\bKEEP\b/.test(rest);
      const hold = /\bHOLD\b/.test(rest); // persiste hasta el fin de sección (p.ej. nombre+rol del sujeto)
      const heroTitle = anc === "htitle" || anc === "hsub"; // nombre/rol del sujeto: rótulo fijo arriba, como el HUD (exento de zona)
      const el = { id: "t" + auto++, type: "text", content, fontSize: fs, box: { cx, cy, w: bw, h: 90 }, color: colK ? (COL[colK] || RED) : STROKE, z: heroTitle ? 82 : 60, in: +inT.toFixed(2), out: keep ? dur : b.t1, _syncT: heroTitle ? null : (usedWord ? wordT : null), _keep: keep, _hold: hold, _herotitle: heroTitle, structural: heroTitle, hud: heroTitle, enter: enterOf(ent || "fade"), exit: { kind: "fade-out", duration: 0.25 } };
      elements.push(el); live["txt_" + anc + "_" + el.id] = el; liveByAnchor[anc] = el; b._els.push(el); if (sizeK === "stat" || sizeK === "lg") lastBig = el;
      continue;
    }
    if (type === "IMG" || type === "ICO" || type === "GIF") {
      const id = rest.split(/[\s@]/)[0].trim();
      const anc = (rest.match(/@([a-z0-9]+)/i) || [])[1] || (type === "GIF" ? "center" : "main");
      const ent = (rest.match(/\b(pop|fade|slide-[lrt]|draw|handwrite|stamp|whip)\b/i) || [])[1];
      const src = assetFile(id);
      if (!src) { warns.push(`asset ausente: "${id}" (beat ${b.num})`); continue; }
      const [cx, cy] = anchorXY(anc);
      // TAMAÑO: explícito (hero≈grande / big / mini) o derivado del ancla. hero/big = elemento HERO fijo y grande.
      const sizeTok = (rest.match(/\b(hero|big|mini)\b/) || [])[1];
      const anchBig = anc === "main" || anc === "center" || anc === "hero" || anc === "heroC";
      let sz;
      if (sizeTok === "hero") sz = 500; else if (sizeTok === "big") sz = 430; else if (sizeTok === "mini") sz = 210;
      else sz = type === "GIF" ? 360 : (anchBig ? 460 : (/^g\d/.test(anc) ? 200 : 300));
      const keep = /\bKEEP\b/.test(rest);
      const hold = /\bHOLD\b/.test(rest); // persiste hasta el fin de sección (se resuelve en el bloque de lienzo)
      const isHero = sizeTok === "hero" || sizeTok === "big"; // pieza hero: grande, posición fija, NO se acumula
      // tipo REAL del asset: si es foto/cutout/captura, se trata como FOTO (marco + sombra); si no, doodle vector
      const akind = assets[id]?.kind || "";
      const isPhotoAsset = /photo|cutout|screenshot|archive/.test(akind);
      const kind = type === "GIF" ? "meme" : (isPhotoAsset ? "cutout" : "vector");
      const psz = isPhotoAsset ? (sizeTok === "hero" ? 520 : sizeTok === "big" ? 460 : Math.round(sz * 1.25)) : sz; // fotos algo más grandes
      // ~palabra: el icono ENTRA justo cuando se dice esa palabra (sincronía, como el texto). Si no, tiempo del beat.
      const wsync = (rest.match(/~([a-záéíóúñ0-9]+)/i) || [])[1];
      const wt = wsync ? syncWordTime(wsync, b) : null;
      // los HERO entran al INICIO de su beat (llenan toda la escena); los apoyos peq. sí sincronizan a su palabra
      const inT = isHero ? +t.toFixed(2) : +(wt != null && wt >= b.t0 - 0.5 && wt <= b.t1 + 1 ? wt : t).toFixed(2);
      const accum = type === "ICO" && !isPhotoAsset && !keep && !isHero; // doodles peq./mini se ACUMULAN; hero/big van fijos
      const el = { id: id + "_" + auto++, type: "image", kind, src, box: { cx, cy, w: psz, h: psz }, z: type === "GIF" ? 55 : (isHero ? (isPhotoAsset ? 24 : 26) : (isPhotoAsset ? 25 : 30)), in: inT, out: type === "GIF" ? Math.min(b.t1, inT + 3) : (keep ? dur : b.t1), auto: true, _keep: keep, _accum: accum, _hero: isHero, _hold: hold, enter: enterOf(ent || "pop"), exit: { kind: "fade-out", duration: 0.3 } };
      elements.push(el); live[id] = el; liveByAnchor[anc] = el; b._els.push(el); if (anchBig || isHero) lastBig = el;
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
      const isWord = /(?:→|->)\s*"/.test(rest);                       // →"palabra" apunta a un texto
      const wordM = isWord ? (rest.match(/(?:→|->)\s*"([^"]*)"/) || [])[1] : null;
      const tgt = (rest.match(/(?:→|->)\s*(?:"[^"]*"|([a-z0-9]+))/i) || [])[1] || "main";
      // objetivo por PALABRA → busca un texto VIVO que la contenga (incluye persistentes KEEP) y coloca la forma bajo esa parte concreta
      let tgtEl = null, cx, cy;
      if (isWord) {
        tgtEl = (wordM && Object.values(live).find(e => e.type === "text" && e.content && e.content.toLowerCase().includes(wordM.toLowerCase()))) || lastBig;
        if (tgtEl && wordM) {
          const s = tgtEl.content, fsz = tgtEl.fontSize || 60, cw = fsz * 0.62, idx = s.toLowerCase().indexOf(wordM.toLowerCase());
          const startX = tgtEl.box.cx - (s.length * cw) / 2;
          cx = idx >= 0 ? startX + (idx + wordM.length / 2) * cw : tgtEl.box.cx;
          cy = tgtEl.box.cy + fsz * 0.6;                              // justo debajo de la palabra
        } else if (tgtEl) { cx = tgtEl.box.cx; cy = tgtEl.box.cy + 40; }
      } else { tgtEl = liveByAnchor[tgt] || lastBig; if (tgtEl) { cx = tgtEl.box.cx; cy = tgtEl.box.cy; } }
      if (cx == null) { const p = anchorXY(tgt); cx = p[0]; cy = p[1]; }
      const colK = (rest.match(/\b(red|yellow|green|cyan|magenta)\b/) || [])[1];
      const map = { "circle-highlight": "circle-highlight", circle: "circle-highlight", "cross-out": "cross-out", cross: "cross-out", underline: "underline", box: "box", bracket: "bracket" };
      const uw = Math.max(120, (wordM ? wordM.length : 4) * ((tgtEl && tgtEl.fontSize) || 60) * 0.62 + 30);
      const sh = { id: "sh" + auto++, type: "shape", kind: map[kind] || "circle-highlight", box: { cx, cy, w: kind === "underline" ? uw : 360, h: kind === "underline" ? 40 : 240 }, color: colK ? (COL[colK] || RED) : RED, z: 45, in: t, out: b.t1, __t: tgtEl || null, enter: { kind: "draw", duration: 0.5 }, exit: { kind: "fade-out", duration: 0.2 } };
      elements.push(sh); b._els.push(sh);
      continue;
    }
  }
  closeAll(b.t1); // por defecto, cada beat limpia al terminar (salvo lo ya cerrado)
  // ELEMENTO ÚNICO → centrado y grande (regla del usuario). Si el beat solo tiene un visual, va al centro.
  const visE = b._els.filter(e => e.type === "image" || e.type === "text" || e.type === "shape");
  const hasHero = b._els.some(e => e._hero); // si el beat trae un HERO, él manda la composición: no auto-centrar
  if (!hasHero && visE.length === 1) { const e = visE[0]; e.box.cx = 960; e.box.cy = e.type === "text" ? 500 : 500; if (e._target) e._target = null; }
}
// FORMAS no sobreviven a su objetivo (nada de tachones/círculos huérfanos)
for (const e of elements) { if (e.type === "shape" && e.__t) { e.out = Math.min(e.out, e.__t.out); e._target = e.__t.id; delete e.__t; } else if (e.__t) delete e.__t; }

// HUD DE CAPÍTULO → icono + texto FIJOS del sub-tema actual (arriba a la izquierda), persistente
//   hasta el siguiente CHAP. Estructural: el gate lo ignora y no cuenta para huecos/centrado.
chapters.forEach((c, i) => {
  const inT = +c.t.toFixed(2), outT = +(i + 1 < chapters.length ? chapters[i + 1].t : dur).toFixed(2);
  const src = c.icon ? assetFile(c.icon) : null;
  let tx = 150;
  if (src) { elements.push({ id: "chapicon" + i, type: "image", kind: "vector", src, box: { cx: 105, cy: 145, w: 130, h: 130 }, z: 80, in: inT, out: outT, structural: true, hud: true, enter: { kind: "fade-in", duration: 0.4 }, exit: { kind: "fade-out", duration: 0.3 } }); tx = 190; }
  else if (c.icon) warns.push(`CHAP icono ausente: "${c.icon}"`);
  if (c.label) { const fs = fitFont(c.label, 42); const w = Math.round(c.label.length * fs * 0.6) + 20; elements.push({ id: "chaplabel" + i, type: "text", content: c.label, fontSize: fs, box: { cx: tx + w / 2, cy: 145, w, h: 64 }, color: STROKE, z: 80, in: inT, out: outT, structural: true, hud: true, enter: { kind: "fade-in", duration: 0.4 }, exit: { kind: "fade-out", duration: 0.3 } }); }
});

// MARCADOR DE SECCIÓN → dibujo del sujeto FIJO arriba a la derecha, persistente hasta el siguiente MARK.
//   Estructural (el gate lo ignora, como el HUD). Da continuidad al sub-tema, como en la referencia.
markers.forEach((mk, i) => {
  const src = assetFile(mk.icon); if (!src) { warns.push(`MARK icono ausente: "${mk.icon}"`); return; }
  const inT = +mk.t.toFixed(2), outT = +(i + 1 < markers.length ? markers[i + 1].t : dur).toFixed(2);
  const [cx, cy] = A.mark;
  elements.push({ id: "mark" + i, type: "image", kind: "vector", src, box: { cx, cy, w: 150, h: 150 }, z: 80, in: inT, out: outT, structural: true, hud: true, enter: { kind: "pop", duration: 0.4 }, exit: { kind: "fade-out", duration: 0.3 } });
});

// LIENZO VIVO → los doodles entran Y SALEN (vida ~6s, rodando), y se RECOLOCAN/REESCALAN según cuántos
//   haya a la vez: 1 = grande centrado; al entrar otro se encoge y se aparta; combinación variada, no rígida.
{
  const bounds = [...new Set([0, ...chapters.map(c => +c.t.toFixed(2)), +dur.toFixed(2)])].sort((a, b) => a - b);
  const sectionEnd = (t) => { for (const b of bounds) if (b > t + 0.1) return b; return dur; };
  const LIFE = 6.0;
  for (const e of elements) if (e._accum) e.out = +Math.min(e.in + LIFE, sectionEnd(e.in)).toFixed(2);
  // HERO con HOLD → persiste hasta el fin de su sección (es el "backdrop" grande del sub-tema)
  for (const e of elements) if (e._hold) e.out = +sectionEnd(e.in).toFixed(2);
  // TOPE HERO: ningún visual grande vive más de 12s (raro; solo beats con narración muy larga). Con
  //   movimiento continuo no se percibe estático, y así apenas se generan huecos de relevo.
  for (const e of elements) if (e._hero && !e._hold) e.out = Math.min(e.out, +(e.in + 12).toFixed(2));
  // MOVIMIENTO DE HERO: entra GRANDE, luego se ENCOGE y va DERIVANDO durante TODA su vida, con keyframes
  //   cada ~2.6s (regla del usuario: "grande en el centro, después pequeño y se mueve"). Nunca queda quieto.
  for (const e of elements) {
    if (!e._hero || (e.frames && e.frames.length)) continue;
    const life = e.out - e.in; if (life < 1.0) continue;
    const { cx, cy, w, h } = e.box;
    const centered = Math.abs(cx - 960) < 120;
    const steps = centered
      ? [[-45, -55, 0.82], [40, -35, 0.80], [-25, -70, 0.78], [30, -45, 0.80]]  // grande→pequeño y a los lados
      : [[0, 20, 0.97], [0, 4, 1.0], [0, 24, 0.96], [0, 8, 0.99]];               // lateral: deriva abajo + pulso (lejos del badge)
    const fr = [{ t: +e.in.toFixed(2), cx, cy, w, h }];
    let k = 0; for (let tt = e.in + Math.min(2.2, life * 0.35); tt < e.out - 0.25 && k < steps.length; tt += 2.6, k++) {
      const [dx, dy, sc] = steps[k]; fr.push({ t: +tt.toFixed(2), cx: cx + dx, cy: cy + dy, w: Math.round(w * sc), h: Math.round(h * sc) });
    }
    e.frames = fr; e.box = { cx: fr[0].cx, cy: fr[0].cy, w: fr[0].w, h: fr[0].h };
  }
  // ¿hay una pieza HERO en pantalla en el instante t? Si la hay, los apoyos peq. se van a las columnas laterales.
  const heroEls = elements.filter(e => e._hero);
  const heroLiveAt = (t) => heroEls.some(e => e.in <= t + 1e-6 && e.out > t + 1e-6);
  const heroPhotoAt = (t) => heroEls.some(e => e.kind === "cutout" && e.in <= t + 1e-6 && e.out > t + 1e-6);
  const RCOL = [[1600, 400, 210], [1600, 630, 220], [1600, 850, 190]]; // columna derecha (siempre libre con hero)
  const LCOL = [[490, 400, 200], [490, 630, 210], [490, 850, 190]];    // izquierda: solo si el hero va centrado (sin foto); despejada del badge [0,0,340,250]
  const marginSlot = (i, hasPhoto) => { const seq = hasPhoto ? RCOL : [RCOL[0], LCOL[0], RCOL[1], LCOL[1], RCOL[2], LCOL[2]]; return seq[i % seq.length]; };
  // layout por Nº de iconos vivos (posiciones orgánicas, un poco distintas cada vez → no cuadriculado)
  const jit = (i) => ((i * 53) % 40) - 20; // desплазamiento determinista pequeño
  const slot = (N, i) => { // banda segura: y 280..880 (bajo el título 210, sobre subtítulo 980), x 210..1710
    if (N <= 1) return [960, 560, 470];
    if (N === 2) return [[610, 560, 380], [1310, 560, 380]][i];
    if (N === 3) return [[960, 430, 300], [610, 730, 300], [1310, 730, 300]][i];
    if (N === 4) return [[660, 440, 290], [1260, 440, 290], [660, 740, 290], [1260, 740, 290]][i];
    if (N === 5) return [[960, 420, 250], [600, 610, 250], [1320, 610, 250], [720, 800, 250], [1200, 800, 250]][i];
    const cols = Math.ceil(N / 2), cw = 1320 / cols, ch = 560 / 2, sz = Math.max(150, Math.round(Math.min(cw, ch) * 0.82));
    const c = i % cols, r = Math.floor(i / cols); return [Math.round(300 + (c + 0.5) * cw), Math.round(300 + (r + 0.5) * ch), sz];
  };
  const acc = elements.filter(e => e._accum).sort((a, b) => a.in - b.in);
  const times = [...new Set(acc.flatMap(e => [+e.in.toFixed(2), +e.out.toFixed(2)]))].sort((a, b) => a - b);
  acc.forEach(e => e.frames = []);
  for (const t of times) {
    const live = acc.filter(x => x.in <= t + 1e-6 && x.out > t + 1e-6).sort((a, b) => a.in - b.in);
    const N = live.length; if (!N) continue;
    const hero = heroLiveAt(t), hp = heroPhotoAt(t); // con hero → apoyos a los márgenes; sin hero → lienzo central
    live.forEach((e, i) => {
      const [cx, cy, sz] = hero ? marginSlot(i, hp) : slot(N, i);
      const dy = (!hero && N > 1) ? jit(i) : 0;
      const f = { t, cx, cy: cy + dy, w: sz, h: sz };
      const p = e.frames[e.frames.length - 1];
      if (!p || p.cx !== cx || p.w !== sz) e.frames.push(f);
    });
  }
  for (const e of acc) if (e.frames.length) e.box = { cx: e.frames[0].cx, cy: e.frames[0].cy, w: e.frames[0].w, h: e.frames[0].h };
}

// TOPE (anti-hold largo) para TEXTOS y FOTOS (no para los doodles acumulativos, que persisten en el lienzo)
const MAXLIFE = 5.0;
for (const e of elements) if (e.box && !e.structural && e.type !== "watermark" && !e._keep && !e._accum && !e._hold && !e._hero) e.out = Math.min(e.out, +(e.in + MAXLIFE).toFixed(2));

// SIN HUECOS (limitado) → un elemento puede alargarse para tapar un microhueco, pero NUNCA más de 3.5s total.
//   Va ANTES del centrado. Si un beat es tan pobre que deja hueco > tope, lo cazará el gate y hay que densificar.
{
  const vis = elements.filter(e => e.box && !e.structural && (e.type === "image" || e.type === "text")).sort((a, b) => a.in - b.in);
  let coverEnd = 0, lastEl = null;
  for (const e of vis) {
    if (lastEl && e.in > coverEnd + 0.05) lastEl.out = Math.max(lastEl.out, Math.min(+e.in.toFixed(2), +(lastEl.in + 5.0).toFixed(2)));
    if (e.out >= coverEnd) { coverEnd = e.out; lastEl = e; }
  }
}

// COBERTURA CON ICONO → NUNCA texto sin icono, NUNCA blanco. En cualquier tramo sin ningún icono en
//   pantalla, se rellena con el ICONO DEL CAPÍTULO actual (relevante). Nada de texto flotando solo.
{
  const STEP = 0.25;
  const imgLive = (t) => elements.some(e => !e.structural && e.type === "image" && e.in <= t + 1e-6 && e.out > t + 1e-6);
  // fallback SIEMPRE disponible en el episodio: primer icono que resuelva (nunca uno de otro vídeo)
  const epFallback = (() => { for (const k in assets) { const f = assetFile(k); if (f) return f; } return null; })();
  // capítulo con icono más cercano ANTES de t (ignora CHAP vacío); si no hay, el más cercano DESPUÉS
  const chAt = (t) => { let before = null, after = null; for (const c of chapters) { if (!c.icon) continue; if (c.t <= t + 0.01) before = c; else if (!after) after = c; } return before || after; };
  for (let t = 0; t <= dur;) {
    if (imgLive(t)) { t = +(t + STEP).toFixed(2); continue; }
    let e2 = t; while (e2 <= dur && !imgLive(e2)) e2 = +(e2 + STEP).toFixed(2);
    const ch = chAt(t), src = (ch && ch.icon && assetFile(ch.icon)) || epFallback;
    if (src) for (let s = t; s < e2 - 0.01;) { const seg = Math.min(8, +(e2 - s).toFixed(2)); const s0 = +s.toFixed(2), s1 = +(s + seg).toFixed(2); elements.push({ id: "cov" + auto++, type: "image", kind: "vector", src, box: { cx: 960, cy: 505, w: 460, h: 460 }, z: 28, in: s0, out: s1, frames: seg > 1.2 ? [{ t: s0, cx: 960, cy: 505, w: 460, h: 460 }, { t: +(s0 + Math.min(2.4, seg * 0.5)).toFixed(2), cx: 960, cy: 475, w: 410, h: 410 }] : undefined, enter: { kind: "fade-in", duration: 0.35 }, exit: { kind: "fade-out", duration: 0.3 }, _autoIco: true }); s = s1; }
    t = e2;
  }
}

// ELEMENTO ÚNICO (GLOBAL) → mientras un elemento sea el ÚNICO en pantalla, va centrado.
//   Cubre huecos ENTRE beats (un beat vacía y el siguiente aún no ha entrado): el que queda solo
//   se centra con keyframes suaves y vuelve a su anclaje cuando llega compañía. Regla del usuario.
{
  const STEP = 0.25, CX = 960, CY = 500;
  const dyn = elements.filter(e => e.box && e.type !== "watermark" && !e.structural && !e._accum);
  const nAt = (t) => dyn.filter(x => x.in <= t + 1e-6 && x.out > t + 1e-6).length;
  for (const e of dyn) {
    const w = e.box.w, h = e.box.h, ax = e.box.cx, ay = e.box.cy;
    // muestreo de su vida: ¿está solo en cada instante?
    const S = [];
    for (let t = +e.in.toFixed(2); t <= e.out - 1e-6; t = +(t + STEP).toFixed(2)) S.push({ t, alone: nAt(t) === 1 });
    if (!S.length || !S.some(s => s.alone)) continue;
    if (S.every(s => s.alone)) { e.box.cx = CX; e.box.cy = CY; continue; } // solo toda su vida → centro estático
    // tramos "solo" contiguos; solo se centran los que duran ≥0.75s
    const runs = []; let cur = null;
    for (const s of S) { if (s.alone) { cur = cur || { s: s.t, e: s.t, before: false, after: false }; cur.e = s.t; } else if (cur) { cur.after = true; runs.push(cur); cur = null; } }
    if (cur) runs.push(cur);
    for (let i = 0; i < runs.length; i++) if (runs[i].s > S[0].t + 1e-6) runs[i].before = true; // había compañía antes
    const kf = [{ t: +e.in.toFixed(2), cx: (S[0].alone && (runs[0] && runs[0].e - runs[0].s >= 0.75)) ? CX : ax, cy: (S[0].alone && (runs[0] && runs[0].e - runs[0].s >= 0.75)) ? CY : ay, w, h }];
    const add = (t, cx, cy) => { t = +Math.max(e.in, Math.min(e.out, t)).toFixed(2); const p = kf[kf.length - 1]; if (t <= p.t + 1e-3) { if (p.cx === cx && p.cy === cy) return; p.t = Math.min(p.t, t); p.cx = cx; p.cy = cy; return; } if (p.cx === cx && p.cy === cy) return; kf.push({ t, cx, cy, w, h }); };
    for (const r of runs) {
      if (r.e - r.s < 0.75) continue;              // tramo corto → no vale la pena centrar
      if (r.before) add(r.s, CX, CY);              // se queda solo (compañía ya salió) → al centro
      else { kf[0].cx = CX; kf[0].cy = CY; }        // ya empieza solo → nace centrado
      if (r.after) add(r.e - 0.45, ax, ay);        // vuelve al ancla ANTES de que entre la compañía
    }
    if (kf.length > 1) e.frames = kf; else { e.box.cx = kf[0].cx; e.box.cy = kf[0].cy; }
  }
}

// assets DECLARADOS en el storyboard (para el gate: si falta alguno → FALLO)
const declared = [...new Set([...sbText.matchAll(/^\s*[+-]\d[\d.]*\s+(?:IMG|ICO|GIF)\s+([a-z0-9-]+)/gmi)].map(m => m[1]).filter(x => x !== "asset-id"))];
const placedIds = new Set(elements.filter(e => e.src).map(e => (e.id.replace(/_\d+$/, ""))));
const missing = declared.filter(id => !placedIds.has(id) && !assetFile(id));
const meta = { fps: 30, width: W, height: H, duration: +dur.toFixed(2), audio: "active/audio.mp3", title, profile: PROFILE.name, storyboard: true, declaredMissing: missing };
const activeDir = path.join("public", "active"); fs.mkdirSync(activeDir, { recursive: true });
const epAudio = path.join(dir, "audio.mp3"); if (fs.existsSync(epAudio)) fs.copyFileSync(epAudio, path.join(activeDir, "audio.mp3"));
// ANTI-SOLAPE DE TEXTOS: dos captions en la misma banda vertical nunca coinciden en el tiempo.
// Cada texto (no-KEEP, no-HUD) se recorta para terminar cuando entra el siguiente de su misma banda.
const deconflict = (list) => {
  const band = new Map();
  for (const e of list) { const k = Math.round((e.box?.cy ?? 0) / 60); if (!band.has(k)) band.set(k, []); band.get(k).push(e); }
  for (const arr of band.values()) {
    arr.sort((a, b) => a.in - b.in);
    for (let i = 0; i < arr.length - 1; i++) {
      const cur = arr[i], nxt = arr[i + 1];
      if (cur.out > nxt.in - 0.1) cur.out = +Math.max(cur.in + 0.5, nxt.in - 0.1).toFixed(2);
    }
  }
};
// captions/textos normales
deconflict(elements.filter(e => e.type === "text" && !e._keep && !e.structural && !e.hud));
// títulos/roles hero (son structural, pero entre secciones no deben solaparse en su banda)
deconflict(elements.filter(e => e.type === "text" && e._herotitle));
const out = { meta, elements };
fs.writeFileSync(path.join(dir, "scenes.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(activeDir, "scenes.json"), JSON.stringify(out, null, 2));
console.log(`✔ scenes.json (storyboard): ${elements.length} elementos · ${beats.length} beats · ${dur.toFixed(0)}s`);
if (warns.length) console.log(`⚠ ${warns.length} avisos:\n  ` + [...new Set(warns)].slice(0, 15).join("\n  "));

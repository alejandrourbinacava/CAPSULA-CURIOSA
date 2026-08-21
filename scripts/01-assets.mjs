// 01-assets: baja cada asset de assets.json.
//   kind icon/vector -> @iconify-json/* OFFLINE (solar/ph/streamline/mingcute) + NORMALIZADOR de estilo
//                       -> SVG estilo casa (trazo grueso + relleno de paleta). Registra licencia.
//   kind photo        -> Wikipedia (imagen real). El renderer la trata como cutout.
// Uso: node scripts/01-assets.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { getIconData, iconToSVG } from "@iconify/utils";
import { normalizeSvg, colorHex } from "./normalize-icon.mjs";
const require = createRequire(import.meta.url);
const PROFILE = require("../style-profile.json");
const PAL_KEYS = Object.keys(PROFILE.palette || { yellow: 1 });
function envKey(n) { if (process.env[n]) return process.env[n].trim(); if (fs.existsSync(".env")) { const m = fs.readFileSync(".env", "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const OPENAI = envKey("OPENAI_API_KEY");
const OPENAI_MODEL = envKey("OPENAI_MODEL") || "gpt-4o";

const dir = process.argv[2] || "episodes/test-cpu";
const assetsPath = path.join(dir, "assets.json");
const assets = JSON.parse(fs.readFileSync(assetsPath, "utf8"));
const OUT = path.join("public", "assets", "icons");
fs.mkdirSync(OUT, { recursive: true });
const UA = "CapsulaCuriosaBot/1.0 (https://github.com/alejandrourbinacava/CAPSULA-CURIOSA; alejandrourbinacava@gmail.com)";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- sets OFFLINE por prioridad de grosor de trazo (rellenos, no línea fina) ---
const SETS_OFF = [];
for (const prefix of ["solar", "ph", "streamline", "mingcute"]) {
  try {
    const data = require(`@iconify-json/${prefix}/icons.json`);
    const info = require(`@iconify-json/${prefix}/info.json`);
    SETS_OFF.push({ prefix, data, names: Object.keys(data.icons).concat(Object.keys(data.aliases || {})), license: info.license, name: info.name });
  } catch (e) { console.log(`(set ${prefix} no disponible)`); }
}
const paletteFor = (id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PAL_KEYS[h % PAL_KEYS.length]; };

// busca el mejor icono en los sets offline; prefiere variantes de RELLENO/negrita, penaliza línea fina
function offlineIcon(query) {
  const ql = query.toLowerCase(); const words = ql.split(/[^a-z0-9]+/).filter(Boolean); if (!words.length) return null;
  let best = null;
  for (let si = 0; si < SETS_OFF.length; si++) {
    const set = SETS_OFF[si];
    for (const name of set.names) {
      const nl = name.toLowerCase();
      if (!words.some(w => w.length > 2 && nl.includes(w))) continue;
      const base = nl.replace(/-(bold|fill|filled|duotone|line|linear|outline|thin|broken|light|regular|solid).*/, "");
      let score = 0;
      if (/(-bold|-fill|-filled|-solid)(?!.*line)/.test(nl)) score += 5;
      if (/-bold-duotone/.test(nl)) score += 6;
      if (/(-line|-linear|-outline|-thin|-broken|-light)/.test(nl)) score -= 4;
      if (words.includes(base)) score += 7;
      if (base.startsWith(words[0])) score += 2;
      score -= Math.abs(base.length - ql.length) * 0.05;
      score += (SETS_OFF.length - si) * 0.4;
      if (!best || score > best.score) best = { set, name, score };
    }
  }
  if (!best) return null;
  const data = getIconData(best.set.data, best.name); if (!data) return null;
  const b = iconToSVG(data, { height: "320" });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${Object.entries(b.attributes).map(([k, v]) => `${k}="${v}"`).join(" ")}>${b.body}</svg>`;
  return { svg, set: best.set.prefix, name: best.name, license: best.set.license };
}

// OpenAI dibuja el SVG del icono (Addendum 4 · E nivel 2: restricciones geométricas de icono limpio)
async function openaiIcon(query) {
  if (!OPENAI) return null;
  const sys = "You are an expert icon designer. Output ONLY valid SVG code for a single flat pictogram. No markdown, no explanation.";
  const user = `Flat vector ICON representing "${query}". Bold solid FILLED shapes (not thin outlines). Designed on a 48x48 grid, uniform stroke weight, rounded caps and joins, minimum 2px corner radius, NO thin details, readable at 64px, MAXIMUM 8 distinct shapes. viewBox="0 0 24 24", single fill color #000000, transparent background, no text, no gradients, no frame. Return ONLY the <svg>...</svg>.`;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: OPENAI_MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: user }], temperature: 0.4, max_tokens: 1600 }) });
    const j = await r.json(); if (!r.ok) { console.log(`  (openai: ${(j.error?.message || r.status).toString().slice(0, 50)})`); return null; }
    const txt = j.choices?.[0]?.message?.content || ""; const m = txt.match(/<svg[\s\S]*?<\/svg>/i); if (!m) return null;
    const svg = m[0]; if (!/<(path|circle|rect|polygon|ellipse|line)\b/i.test(svg)) return null;
    return { svg, set: "openai", name: query, license: { title: "IA (OpenAI " + OPENAI_MODEL + ")", url: "" } };
  } catch { return null; }
}

// fallback HTTP (keyless) SOLO si offline no encuentra nada; también se normaliza
async function httpIcon(q) {
  try {
    const j = await (await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=30`, { headers: { "User-Agent": UA } })).json();
    const pick = (j.icons || []).find(i => /(solar|ph|streamline|mingcute|mdi|tabler):/.test(i) && !/logos|flag|brand/.test(i)) || (j.icons || [])[0];
    if (!pick) return null; const [p, n] = pick.split(":");
    const svg = await (await fetch(`https://api.iconify.design/${p}/${n}.svg?height=320`, { headers: { "User-Agent": UA } })).text();
    return svg.includes("<svg") ? { svg, set: p, name: n, license: null } : null;
  } catch { return null; }
}

const dl = async (url, dest) => { const r = await fetch(url, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error("dl " + r.status); const b = Buffer.from(await r.arrayBuffer()); if (b.length < 800) throw new Error("img vacia"); fs.writeFileSync(dest, b); };
async function wiki(q, base) {
  for (const lang of ["en", "es"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const s = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=1&origin=*`, { headers: { "User-Agent": UA } })).json();
        const t = s?.query?.search?.[0]?.title; if (!t) break;
        const r = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*`, { headers: { "User-Agent": UA } })).json();
        const p = Object.values(r?.query?.pages || {})[0]; const u = p?.thumbnail?.source || p?.original?.source;
        if (u) { const ext = /\.png/i.test(u) ? "png" : "jpg"; await dl(u, path.join(OUT, base + "." + ext)); return "assets/icons/" + base + "." + ext; }
        break;
      } catch (e) { await sleep(800 * (attempt + 1)); }
    }
  }
  return null;
}

// procesa un icono: busca (offline > http), NORMALIZA, guarda, registra licencia
function saveIcon(id, ico) {
  const color = paletteFor(id);
  const norm = normalizeSvg(ico.svg, color);
  const rel = "assets/icons/" + id + ".svg";
  fs.writeFileSync(path.join("public", rel), norm);
  const L = ico.license || {};
  return { file: rel, kind: "vector", normalized: true, color, attribution: { source: ico.set + ":" + ico.name, license: L.title || L.spdx || "?", url: L.url || "" } };
}

// --- REGISTRO GLOBAL de iconos generados con GPT (se generan UNA vez, se reutilizan en todos los vídeos) ---
const LIB = path.join("public", "assets", "library"); fs.mkdirSync(LIB, { recursive: true });
const conceptSlug = (q) => q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
async function gptImageIcon(query, id) {
  const rel = "assets/icons/" + id + ".png", libFile = path.join(LIB, conceptSlug(query) + ".png");
  if (fs.existsSync(libFile)) { fs.copyFileSync(libFile, path.join("public", rel)); return { file: rel, reused: true }; } // reutiliza ($0, incluso sin clave)
  if (!OPENAI) return null;
  const prompt = `2D vector doodle illustration of ${query}. Hand-drawn whiteboard explainer style, bold clean black outline, flat minimal saturated colors, clear and simple, centered composition. Historically accurate to the era described (never modern). Fully TRANSPARENT background. No text, no labels, no caption, no shadow, no border, no frame.`;
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", background: "transparent", output_format: "png", quality: "medium", n: 1 }) });
    const j = await r.json(); if (!r.ok) { console.log(`  (gpt-image: ${(j.error?.message || r.status).toString().slice(0, 60)})`); return null; }
    const b = Buffer.from(j.data[0].b64_json, "base64"); fs.writeFileSync(libFile, b); fs.writeFileSync(path.join("public", rel), b);
    return { file: rel, reused: false };
  } catch { return null; }
}

for (const [id, a] of Object.entries(assets)) {
  const q = a.query || id;
  if (a.kind === "clip" || a.kind === "gif") continue; // los maneja 00-fetch-media; NO tocarlos aquí
  try {
    if (a.kind === "photo" || a.kind === "cutout" || a.kind === "screenshot") {
      await sleep(300);
      const f = await wiki(q, id);
      if (f) { a.file = f; if (!a.kind || a.kind === "photo") a.kind = "cutout"; console.log(`🖼️  ${id} (foto) ✓`); continue; }
      // sin foto -> icono como reserva
    }
    // 1º: GPT Image (doodle, transparente, reutilizable). 2º: reserva SVG offline.
    if (OPENAI) { const img = await gptImageIcon(q, id); if (img) { a.file = img.file; a.kind = "vector"; a.normalized = true; a.gpt = true; console.log(`🎨 ${id} (gpt-image${img.reused ? " ♻" : ""}) ✓`); continue; } }
    let ico = offlineIcon(q) || (await (async () => { await sleep(150); return httpIcon(q); })());
    if (ico) { const meta = saveIcon(id, ico); Object.assign(a, meta); console.log(`▲ ${id} (svg reserva) ✓`); }
    else { a.file = null; console.log(`✗ ${id} sin asset`); }
  } catch (e) { a.file = null; console.log(`✗ ${id} error ${(e.message || "").slice(0, 50)}`); }
}
fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
console.log("✔ assets.json actualizado (iconos normalizados al estilo de la casa)");

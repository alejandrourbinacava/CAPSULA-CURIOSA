// 01f-labels: etiquetas CORTAS en español para cada dibujo, generadas con CLAUDE (Anthropic).
//   NO toca imágenes ni OpenAI. Lee auto-visuals.json (queries en inglés), pide a Claude una etiqueta
//   de 1-3 palabras por dibujo y la escribe de vuelta en auto-visuals.json (campo "label").
// Uso: node scripts/01f-labels.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";
function envKey(n) { if (process.env[n]) return process.env[n].trim(); if (fs.existsSync(".env")) { const m = fs.readFileSync(".env", "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const ANTH = envKey("ANTHROPIC_API_KEY");
const MODEL = envKey("ANTHROPIC_MODEL") || "claude-haiku-4-5-20251001";

const dir = process.argv[2] || "episodes/test-cpu";
const avPath = path.join(dir, "auto-visuals.json");
const auto = JSON.parse(fs.readFileSync(avPath, "utf8"));
const queries = [...new Set(auto.map(a => a.query).filter(Boolean))];

const run = async () => {
  if (auto.length && auto.filter(a => a.label && a.label.length).length >= auto.length - 1 && !process.argv.includes("--fresh")) { console.log("♻️  etiquetas ya presentes -> se REUTILIZAN (--fresh para regenerar). 0 gasto."); return; }
  if (!ANTH) throw new Error("ANTHROPIC_API_KEY requerido");
  const list = queries.map((q, i) => `${i}. ${q}`).join("\n");
  const prompt = `Eres etiquetador de un canal de historia estilo pizarra. Te doy una lista de DIBUJOS (en inglés). Para cada uno dame una ETIQUETA muy corta en ESPAÑOL (1-3 palabras) que irá justo debajo del dibujo en el vídeo. Natural, sin artículos innecesarios, con mayúscula inicial. Ej: "roman soldier"->"Soldado romano", "ancient Persian soldiers clashing with Greek hoplites"->"Persia vs Grecia", "gold coin"->"Monedas de oro".\n\nLista:\n${list}\n\nDevuelve SOLO un objeto JSON {"labels": ["<etiqueta 0>","<etiqueta 1>", ...]} con una etiqueta por índice, en el mismo orden.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": ANTH, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages: [{ role: "user", content: prompt }] }) });
  const j = await res.json(); if (!res.ok) throw new Error("anthropic: " + (j.error?.message || res.status));
  const txt = (j.content || []).map(c => c.text || "").join("");
  const obj = JSON.parse(txt.startsWith("{") ? txt : (txt.match(/\{[\s\S]*\}/) || ["{}"])[0]);
  const labels = obj.labels || [];
  const map = {}; queries.forEach((q, i) => { map[q] = (labels[i] || "").toString().trim(); });
  let n = 0;
  for (const a of auto) { const l = map[a.query]; if (l) { a.label = l; n++; } }
  fs.writeFileSync(avPath, JSON.stringify(auto, null, 2));
  console.log(`✔ ${n}/${auto.length} etiquetas escritas (Claude ${MODEL}). Conceptos únicos etiquetados: ${queries.length}.`);
  console.log("  muestra:", auto.slice(0, 8).map(a => `${a.query} -> ${a.label}`).join(" | "));
};
run().catch(e => { console.error("✗", e.message); process.exit(1); });

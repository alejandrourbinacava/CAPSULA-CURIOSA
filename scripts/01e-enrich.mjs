// 01e-enrich: DENSIDAD + RELEVANCIA sin tocar la voz.
//   Segmenta la narración (words.json, voz YA cacheada) en FRASES con su tiempo. Para CADA frase pide a
//   GPT el SUJETO clave que se menciona y que se pueda mostrar (persona/lugar/objeto/animal), usando el
//   NOMBRE PROPIO real cuando lo haya (Alejandro Magno -> "Alexander the Great"). Escribe:
//     - assets.json  += icon_auto_N  (kind photo para personas/lugares -> imagen REAL de Wikipedia;
//                                      kind icon para objetos/animales -> icono doodle con GPT)
//     - auto-visuals.json = [{ id, t, kind, query }]  -> 02-build-scenes los coloca sincronizados a la voz
//   Objetivo: lo que se DICE aparece en pantalla. NO cambia el texto -> la voz sigue valiendo.
// Uso: node scripts/01e-enrich.mjs episodes/<slug> [--fresh]
import fs from "node:fs";
import path from "node:path";
function envKey(n) { if (process.env[n]) return process.env[n].trim(); if (fs.existsSync(".env")) { const m = fs.readFileSync(".env", "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const OPENAI = envKey("OPENAI_API_KEY");
const OPENAI_MODEL = envKey("OPENAI_TEXT_MODEL") || "gpt-4o";

const dir = process.argv[2] || "episodes/test-cpu";
const words = JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8"));
const assetsPath = path.join(dir, "assets.json");
const assets = JSON.parse(fs.readFileSync(assetsPath, "utf8"));
const totalDur = Math.max(...words.map(w => w.end));

// --- FRASES a partir del stream de palabras (con su tiempo de inicio) ---
const sentences = [];
{ let cur = [], start = 0;
  for (let i = 0; i < words.length; i++) {
    if (!cur.length) start = words[i].start;
    cur.push(words[i].word);
    if (/[.?!…]$/.test(words[i].word) || i === words.length - 1) {
      const text = cur.join(" ").trim();
      if (text.split(/\s+/).length >= 2) sentences.push({ t: +start.toFixed(2), text });
      cur = [];
    }
  }
}

async function extract() {
  if (!OPENAI) throw new Error("OPENAI_API_KEY requerido");
  const numbered = sentences.map((s, i) => `${i}. ${s.text}`).join("\n");
  const sys = "Eres el director visual de un canal explainer. Por cada frase decides QUÉ imagen mostrar para ilustrar lo que se dice.";
  const user = `Narración numerada por frases (canal de historia, estilo PIZARRA/DOODLE):\n"""\n${numbered}\n"""\n\nPara CADA frase decides QUÉ DIBUJAR (ilustración doodle 2D) para ilustrar EXACTAMENTE lo que dice. Por frase: un dibujo PRINCIPAL + hasta 2 EXTRA.\nFormato: {"i": <nº>, "kind": "animal"|"person"|"place"|"scene"|"object", "en": "<qué mostrar, en INGLÉS>", "es": "<etiqueta CORTA en español, 1-3 palabras>", "extra": [{"en":"<objeto en inglés>","es":"<etiqueta corta español>"}]}.
- Si el sujeto es un ANIMAL, PERSONA o LUGAR real y concreto → kind="animal"/"person"/"place" y "en" = su NOMBRE simple en inglés para buscar FOTO real (p.ej. "mosquito","saltwater crocodile","box jellyfish","king cobra","hippopotamus"). NADA de descripción larga aquí, solo el nombre.
- Si lo mejor es una ESCENA o un OBJETO/concepto → kind="scene"/"object" y "en" = descripción para DIBUJARLO en doodle (con contexto claro).\nREGLAS CLAVE:\n- "en" describe una ESCENA o SUJETO concreto y DIBUJABLE, con contexto de ÉPOCA para que no salga nada moderno. Ejemplos:\n   · Persona histórica → "Alexander the Great, ancient Macedonian king with helmet", "Cleopatra ancient Egyptian queen", "Genghis Khan mongol warrior".\n   · Acción/evento → describe la ESCENA: "Persia intentó conquistar Grecia" → "ancient Persian soldiers attacking Greek hoplites"; "cayó Roma" → "ancient Rome city in ruins burning"; "comercio por la ruta de la seda" → "camel caravan on the silk road".\n   · Lugar/monumento → "the Colosseum of ancient Rome", "Persepolis ancient ruins", "Great Wall of China".\n   · Objeto → el objeto simple ("roman sword", "gold coin", "papyrus scroll").\n- NUNCA uses un nombre suelto ambiguo (mal: "Marathon"; bien: "ancient Greek hoplite soldiers at the battle of Marathon"). SIEMPRE con contexto histórico/antiguo.\n- "es": etiqueta CORTA en español (1-3 palabras) que resume lo que se dibuja y lo que se está diciendo (irá como texto debajo del dibujo). Ej: "Batalla de Maratón", "Rey persa", "Ruta de la seda".\n- "extra": 0 a 2 OBJETOS concretos que se mencionen además (armas, animales, monedas...), cada uno con su "en" (inglés) y "es" (etiqueta corta español).\n- Si la frase es 100% abstracta (sin nada dibujable) usa "en":"".\nIMPORTANTE: devuelve UN objeto JSON con la clave "list", un ARRAY con UNA entrada por CADA frase (de 0 a ${sentences.length - 1}). Ej: {"list":[{"i":0,"en":"","es":"","extra":[]},{"i":1,"en":"Alexander the Great ancient king with helmet","es":"Alejandro Magno","extra":[{"en":"sword","es":"espada"}]}]}.`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: OPENAI_MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: user }], temperature: 0.2, max_tokens: 8000, response_format: { type: "json_object" } }) });
  const j = await r.json(); if (!r.ok) throw new Error("openai: " + (j.error?.message || r.status));
  const obj = JSON.parse(j.choices[0].message.content.trim());
  if (Array.isArray(obj)) return obj;
  for (const v of Object.values(obj)) if (Array.isArray(v)) return v;             // {list:[...]}
  // objeto keyed por índice de frase
  return Object.entries(obj).map(([k, v]) => (v && typeof v === "object") ? { i: v.i != null ? v.i : +k, kind: v.kind, en: v.en, es: v.es, extra: v.extra } : null).filter(x => x && x.en);
}

const run = async () => {
  const avOut = path.join(dir, "auto-visuals.json");
  if (fs.existsSync(avOut) && !process.argv.includes("--fresh")) { console.log(`♻️  ${avOut} ya existe -> se REUTILIZA (--fresh para regenerar). 0 gasto.`); return; }
  for (const k of Object.keys(assets)) if (assets[k]?.auto) delete assets[k]; // idempotente
  const cacheF = path.join(dir, "phrase-subjects.json");
  let items;
  if (fs.existsSync(cacheF) && !process.argv.includes("--fresh")) { items = JSON.parse(fs.readFileSync(cacheF, "utf8")); console.log(`(usando ${cacheF} cacheado; --fresh para regenerar)`); }
  else { items = await extract(); fs.writeFileSync(cacheF, JSON.stringify(items, null, 2)); }
  console.log(`Frases: ${sentences.length} | sujetos GPT: ${items.length}`);

  const auto = []; let n = 0, lastT = -99, photos = 0, doodles = 0; const lastSeen = new Map();
  const PHOTO_KINDS = new Set(["animal", "person", "place"]);
  const push = (en, es, kind, big, t) => {
    en = String(en || "").trim(); if (!en || en.length < 3) return;
    const key = en.toLowerCase();
    if (t - (lastSeen.get(key) ?? -99) < 12) return;   // no repetir el MISMO en <12s
    if (t - lastT < 2.2) { if (big) t = lastT + 2.2; else return; } // protege los sujetos principales
    lastSeen.set(key, t); lastT = t;
    const isPhoto = PHOTO_KINDS.has(kind);
    const id = "icon_auto_" + (n++);
    assets[id] = { kind: isPhoto ? "photo" : "icon", query: en, auto: true }; // foto real (Wikipedia/Pexels) o doodle GPT
    auto.push({ id, t: +t.toFixed(2), big: !!big, photo: isPhoto, query: en, label: String(es || "").trim() });
    if (isPhoto) photos++; else doodles++;
  };
  for (const it of items) {
    if (!it || it.i == null) continue;
    const s = sentences[it.i]; if (!s) continue;
    const nextT = sentences[it.i + 1] ? sentences[it.i + 1].t : totalDur;
    const span = Math.max(1.5, nextT - s.t);
    if (it.en) push(it.en, it.es, it.kind || "scene", true, s.t);
    const extras = Array.isArray(it.extra) ? it.extra.slice(0, 1) : [];
    extras.forEach((ex, k) => { const eo = typeof ex === "string" ? { en: ex, es: "" } : ex; push(eo.en, eo.es, "object", false, s.t + span * (k + 1) / (extras.length + 1)); });
  }
  auto.sort((a, b) => a.t - b.t);
  fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
  fs.writeFileSync(path.join(dir, "auto-visuals.json"), JSON.stringify(auto, null, 2));
  console.log(`✔ ${auto.length} visuales sincronizados: ${photos} FOTOS reales + ${doodles} doodles GPT.`);
  console.log(`  ${(auto.length / (totalDur / 60)).toFixed(1)}/min · conceptos únicos: ${new Set(auto.map(a => a.query)).size}`);
};
run().catch(e => { console.error("✗", e.message); process.exit(1); });

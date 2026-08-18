// FASE 3 — coge el siguiente tema de topics.json, pide a Gemini el guion completo,
// baja los iconos elegidos y escribe video.config.json. Avanza el puntero del tema.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function envKey(n) { if (process.env[n]) return process.env[n].trim(); const p = path.join(__dirname, ".env"); if (fs.existsSync(p)) { const m = fs.readFileSync(p, "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const GKEY = envKey("GEMINI_API_KEY");
const ANTH = envKey("ANTHROPIC_API_KEY");
if (!GKEY && !ANTH) { console.error("Falta ANTHROPIC_API_KEY o GEMINI_API_KEY (en .env o Secret)"); process.exit(1); }

const topicsPath = path.join(__dirname, "topics.json");
const state = JSON.parse(fs.readFileSync(topicsPath, "utf8"));
const topic = state.topics[state.nextIndex % state.topics.length];
console.log(`▶ Tema: ${topic.title} (${topic.n} elementos)`);

const ICONS = "brain,eye,shield-alert,shield,hourglass,dna,handshake,user,users,snowflake,volume-x,sparkles,shirt,venetian-mask,ban,heart-off,heart-crack,heart,door-open,door-closed,zap,anchor,megaphone,star,scale,crown,arrow-down,arrow-up,footprints,circle-help,circle-check,baby,graduation-cap,ruler,list-checks,briefcase,trophy,moon,sun,frown,smile,angry,laugh,ghost,lock,unlock,target,flame,pill,syringe,skull,bed,clock,coins,banknote,trending-up,trending-down,scan-face,glasses,mask,bug,microscope,atom,lightbulb,map,globe,phone,message-circle,thumbs-up,thumbs-down,award,gauge,puzzle,drama,hand,ear,activity,alert-triangle";

const schema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    introNarration: { type: "STRING" },
    gruposNarration: { type: "STRING" },
    outroNarration: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" }, narration: { type: "STRING" }, def: { type: "STRING" },
          fueraIcon: { type: "STRING" }, fueraText: { type: "STRING" }, dentroIcon: { type: "STRING" }, dentroText: { type: "STRING" },
          s1Icon: { type: "STRING" }, s1: { type: "STRING" }, s2Icon: { type: "STRING" }, s2: { type: "STRING" }, s3Icon: { type: "STRING" }, s3: { type: "STRING" },
          causaIcon: { type: "STRING" }, causaText: { type: "STRING" }, ejemploTitle: { type: "STRING" },
          consejoIcon: { type: "STRING" }, consejoText: { type: "STRING" }, mainIcon: { type: "STRING" },
          videoQuery: { type: "STRING" }, photoQuery: { type: "STRING" }
        },
        required: ["name", "narration", "def", "fueraIcon", "fueraText", "dentroIcon", "dentroText", "s1Icon", "s1", "s2Icon", "s2", "s3Icon", "s3", "causaIcon", "causaText", "ejemploTitle", "consejoIcon", "consejoText", "mainIcon", "videoQuery", "photoQuery"]
      }
    }
  },
  required: ["title", "introNarration", "gruposNarration", "outroNarration", "items"]
};

const prompt = `Eres guionista de un canal de YouTube faceless en español ("Cápsula Curiosa") estilo divulgativo. Crea el guion COMPLETO del vídeo sobre este tema:
TÍTULO: ${topic.title}
DESCRIPCIÓN: ${topic.brief}
Genera EXACTAMENTE ${topic.n} elementos (items).

REGLAS ESTRICTAS:
- Todo en ESPAÑOL de España, tono cercano y divulgativo. NADA de diagnósticos; marco explicativo.
- "narration" de cada item = lo que dice la voz en off, DESARROLLADO y con detalle (~210-240 palabras por item, para que el vídeo dure 10-12 minutos en total), y DEBE contener SÍ o SÍ estas palabras/estructura en este orden: primero la definición desarrollada; luego "Por fuera ... por dentro ..."; luego "Las señales" (explica las 3 con ejemplos); luego una frase que empiece con "¿Por qué" (la causa, con detalle); luego "Un ejemplo:" (una anécdota concreta y vívida); y al final "¿Cómo ...?" (el consejo práctico). Estas palabras exactas (fuera, dentro, señales, por qué, ejemplo, cómo) son obligatorias porque marcan la sincronía.
- Los textos en pantalla (def, fueraText, dentroText, s1/s2/s3, causaText, ejemploTitle, consejoText) MUY cortos (2-5 palabras).
- Iconos (mainIcon, fueraIcon, dentroIcon, s1Icon, s2Icon, s3Icon, causaIcon, consejoIcon): elige SOLO de esta lista, el más representativo de cada concepto: ${ICONS}
- videoQuery y photoQuery: en INGLÉS, términos concretos y realistas para stock (Pixabay) que ilustren el ejemplo de ese item.
- introNarration: gancho de ~40s que enganche. gruposNarration: ~15s "vamos a verlos". outroNarration: ~20s cierre + "Suscríbete a Cápsula Curiosa".
Devuelve SOLO el JSON.`;

async function callClaude() {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": ANTH, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 32000, messages: [{ role: "user", content: prompt + "\n\nDevuelve SOLO el objeto JSON (sin texto extra ni ```)." }] })
  });
  const j = await res.json();
  if (!res.ok) throw new Error("Claude: " + JSON.stringify(j).slice(0, 400));
  if (j.stop_reason === "max_tokens") throw new Error("Claude: respuesta truncada (max_tokens). Sube el límite o acorta el guion.");
  // coger TODOS los bloques de tipo texto (el modelo puede devolver antes un bloque de razonamiento)
  const txt = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  const m = txt.match(/\{[\s\S]*\}/); // quedarse con el objeto JSON aunque venga con texto alrededor
  let t = (m ? m[0] : txt).replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  return JSON.parse(t);
}
async function callGemini() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GKEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 } })
  });
  const j = await res.json(); if (!res.ok) throw new Error("Gemini: " + JSON.stringify(j).slice(0, 400));
  return JSON.parse(j.candidates?.[0]?.content?.parts?.[0]?.text);
}
let g, usado;
try { g = ANTH ? await callClaude() : await callGemini(); usado = ANTH ? "Claude" : "Gemini"; }
catch (e) {
  console.error("⚠️ IA primaria falló:", (e.message || "").slice(0, 200));
  if (ANTH && GKEY) { console.log("→ probando con Gemini…"); g = await callGemini(); usado = "Gemini (fallback)"; }
  else throw e;
}
console.log(`✔ ${usado} generó ${g.items.length} items`);

// asegurar iconos (descargar de Lucide; si no existe, fallback)
const ICONDIR = path.join(__dirname, "public", "icons");
async function ensureIcon(name) {
  name = (name || "").toLowerCase().trim().replace(/\s+/g, "-");
  const f = path.join(ICONDIR, `${name}.svg`);
  if (fs.existsSync(f)) return name;
  try { const r = await fetch(`https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${name}.svg`); const t = await r.text(); if (r.ok && t.includes("<svg")) { fs.writeFileSync(f, t); return name; } } catch {}
  return "circle-help";
}
await ensureIcon("circle-help");

const ITEM_COLORS = ["#e57373", "#90a4ae", "#ba68c8", "#607d8b", "#f06292", "#ffb300", "#ffd54f", "#4db6ac", "#7986cb", "#4dd0e1", "#8bc34a", "#ff8c1a"];
const SP = ["#ffd54f", "#ff8c1a", "#4db6ac"];
const items = [];
for (let i = 0; i < g.items.length; i++) {
  const it = g.items[i];
  const [main, fu, de, i1, i2, i3, ca, co] = await Promise.all([it.mainIcon, it.fueraIcon, it.dentroIcon, it.s1Icon, it.s2Icon, it.s3Icon, it.causaIcon, it.consejoIcon].map(ensureIcon));
  items.push({
    id: "v" + String(i + 2).padStart(2, "0"), key: "item" + (i + 1),
    name: (it.name || it.title || it.nombre || "").toUpperCase(), group: "", color: ITEM_COLORS[i % ITEM_COLORS.length], main, def: it.def || "",
    fuera: [fu, it.fueraText || ""], dentro: [de, it.dentroText || ""],
    senales: [{ icon: i1, color: SP[0], label: it.s1 || "" }, { icon: i2, color: SP[1], label: it.s2 || "" }, { icon: i3, color: SP[2], label: it.s3 || "" }],
    causa: [ca, it.causaText || ""], ejemploTitle: it.ejemploTitle || "", consejo: [co, it.consejoText || ""],
    videoQuery: it.videoQuery || it.name || "", photoQuery: it.photoQuery || it.name || "", narration: it.narration || ""
  });
}
const outroId = "v" + String(items.length + 2).padStart(2, "0");
const config = {
  title: g.title || topic.title, fps: 30, voiceId: "851ejYcv2BoNPjrkw93G", speed: 1.08,
  cornerIcon: await ensureIcon(g.items[0]?.mainIcon || "brain"), handle: "@CapsulaCuriosa",
  intro: { id: "v00", narration: g.introNarration }, grupos: { id: "v01", narration: g.gruposNarration }, outro: { id: outroId, narration: g.outroNarration },
  items
};
fs.writeFileSync(path.join(__dirname, "video.config.json"), JSON.stringify(config, null, 2));

// avanzar el puntero para el próximo run
state.nextIndex = (state.nextIndex + 1) % state.topics.length;
fs.writeFileSync(topicsPath, JSON.stringify(state, null, 2));
console.log(`✅ video.config.json listo para "${config.title}" · próximo tema index ${state.nextIndex}`);

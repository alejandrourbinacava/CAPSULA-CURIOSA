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
          name: { type: "STRING" }, mainIcon: { type: "STRING" }, def: { type: "STRING" },
          photoQuery: { type: "STRING" }, videoQuery: { type: "STRING" },
          beats: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { say: { type: "STRING" }, text: { type: "STRING" }, icon: { type: "STRING" }, media: { type: "STRING" }, query: { type: "STRING" }, brand: { type: "STRING" }, bullets: { type: "ARRAY", items: { type: "STRING" } } },
              required: ["say", "text", "icon", "media"]
            }
          }
        },
        required: ["name", "mainIcon", "def", "beats", "photoQuery", "videoQuery"]
      }
    }
  },
  required: ["title", "introNarration", "gruposNarration", "outroNarration", "items"]
};

const prompt = `Eres guionista y storyboarder de un canal de YouTube faceless en español ("Cápsula Curiosa"), estilo divulgativo dinámico (como "Explainer Chris"). Crea el guion COMPLETO del vídeo sobre este tema:
TÍTULO: ${topic.title}
DESCRIPCIÓN: ${topic.brief}
Genera EXACTAMENTE ${topic.n} elementos (items).

CLAVE — cada item es una SECCIÓN contada como una secuencia de "beats" (momentos), EN ORDEN. Cada beat es un trozo de la locución con SU visual, de modo que LO QUE SE VE COINCIDE EXACTAMENTE CON LO QUE SE OYE.

REGLAS ESTRICTAS:
- Todo en ESPAÑOL de España, tono cercano y divulgativo. NADA de diagnósticos; marco explicativo.
- Cada item tiene "beats": un array de 16 a 20 beats EN ORDEN, CORTOS. Cada beat es UNA sola idea (una frase corta) con SU icono, de modo que los iconos entran y salen rápido (uno cada ~2-3 segundos), NUNCA un icono quieto mientras la voz suelta varias frases. La sección se cuenta entera a través de esos beats (definición → cómo se ve por fuera/por dentro → señales → por qué ocurre, con detalle → un ejemplo concreto → qué hacer).
- Cada beat tiene:
  - "say": lo que dice la VOZ en ese momento: UNA idea corta, ~7-11 palabras (NO metas varias frases en un beat; si una explicación es larga, PÁRTELA en varios beats con iconos distintos). La SUMA de todos los "say" del item debe dar ~180-210 palabras.
  - "text": 2 a 4 palabras que RESUMEN literalmente lo que dice ese "say" (rótulo en pantalla; DEBE coincidir con lo que se oye en ese beat).
  - "icon": UN OBJETO FÍSICO concreto y dibujable (1-2 palabras EN INGLÉS) que sea METÁFORA VISUAL de la idea del beat, para buscar su icono/vector. NUNCA pongas una frase abstracta (mal: "industry collapse", "gain ground"; bien: para eso usa "falling chart", "flag"). Elige objetos que existan como icono: crown, trophy, sword, boxing gloves, money bag, gold coin, rocket, fire, muscle, flag, bomb, chart, lightning, shield, star, clock, brain, heart, skull, gamepad, chip, medal, target, handshake, thumbs up. Varía en cada beat.
  - "media": elige según lo que se PUEDA MOSTRAR de verdad:
      · "photo" SOLO cuando el beat habla de algo con NOMBRE PROPIO que existe y se puede enseñar: una consola, un videojuego, un personaje, un animal, un lugar, una persona, un producto, un objeto concreto (p.ej. la PlayStation 2, el juego GTA San Andreas, Super Mario, el Coliseo, un tiburón). Se buscará su imagen REAL en Wikipedia.
      · "gif" para juegos en movimiento, memes o reacciones con gracia (2-3 por sección).
      · "none" para CONCEPTOS ABSTRACTOS (dominio, marketing, era dorada, saturación, ventajas...) → se mostrará un ICONO SVG. NO uses "photo" para conceptos abstractos: quedaría una foto sin relación.
  - "query": si media != "none", el NOMBRE PROPIO EXACTO de eso (como saldría en Wikipedia), p.ej. "PlayStation 2", "Grand Theft Auto: San Andreas", "Super Mario Bros.", "Nintendo 64", "GoldenEye 007". NADA de términos genéricos tipo "aggressive marketing". Si media = "none", cadena vacía.
  - "brand" (OPCIONAL): si el beat menciona una MARCA o empresa conocida (AMD, Intel, NVIDIA, Sony, PlayStation, Xbox, Nintendo, Apple, Samsung, Google, etc.), pon aquí su slug en minúsculas sin espacios (p.ej. "amd", "playstation", "nvidia"); se mostrará su LOGO vectorial. Si no hay marca, omítelo o cadena vacía.
  - "bullets" (OPCIONAL): en 3-4 beats clave (specs, cifras, características), incluye un array de 2-3 datos MUY cortos (3-6 palabras cada uno), estilo lista de Chris (p.ej. ["8 núcleos","5 GHz","Sin gráfica integrada"]). En esos beats pon media="none". En el resto NO pongas bullets (array vacío u omítelo).
- El PRIMER beat presenta la sección: su "text" es el nombre corto del elemento.
- "name": nombre corto del elemento en MAYÚSCULAS (p.ej. "EL NARCISISTA"). "mainIcon": icono principal (de la lista). "def": definición en 3-5 palabras (para la miniatura).
- "photoQuery"/"videoQuery": términos EN INGLÉS de reserva para la miniatura del item.
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
const items = [];
for (let i = 0; i < g.items.length; i++) {
  const it = g.items[i];
  const main = await ensureIcon(it.mainIcon);
  const rawBeats = Array.isArray(it.beats) ? it.beats.filter(b => b && b.say) : [];
  const beats = [];
  for (const b of rawBeats) {
    const icon = await ensureIcon(b.icon);
    beats.push({ say: b.say, text: (b.text || "").toUpperCase(), icon, media: (b.media || "none").toLowerCase(), query: b.query || "" });
  }
  const narration = beats.map(b => b.say).join(" ");
  items.push({
    id: "v" + String(i + 2).padStart(2, "0"), key: "item" + (i + 1),
    name: (it.name || it.title || "").toUpperCase(), color: ITEM_COLORS[i % ITEM_COLORS.length], main, def: it.def || "",
    beats, narration, videoQuery: it.videoQuery || it.name || "", photoQuery: it.photoQuery || it.name || ""
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

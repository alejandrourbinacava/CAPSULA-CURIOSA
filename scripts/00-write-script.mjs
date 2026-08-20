// 00-write-script: coge el tema de topics.json y hace que CLAUDE escriba UNA vez el guion
//   con etiquetas inline [[...]] + assets.json. Escribe episodes/<slug>/ y avanza el puntero.
//   El guion NO se reescribe en re-renders: solo se ejecuta este paso al pedir vídeo nuevo.
import fs from "node:fs";
import path from "node:path";

function envKey(n) { if (process.env[n]) return process.env[n].trim(); if (fs.existsSync(".env")) { const m = fs.readFileSync(".env", "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const ANTH = envKey("ANTHROPIC_API_KEY");
if (!ANTH) { console.error("Falta ANTHROPIC_API_KEY"); process.exit(1); }

const state = JSON.parse(fs.readFileSync("topics.json", "utf8"));
const topic = state.topics[state.nextIndex % state.topics.length];
const slug = String(state.nextIndex + 1).padStart(3, "0") + "-" + topic.title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
const dir = path.join("episodes", slug);
console.log(`▶ ${topic.title}  ->  ${dir}`);

const prompt = `Eres guionista y "storyboarder" de un canal explainer en español estilo pizarra (whiteboard doodle): fondo blanco, iconos vectoriales, monigotes de palo, flechas dibujadas a mano, texto manuscrito. Escribe el guion COMPLETO del episodio con VARIEDAD de composición.

TEMA: ${topic.title}
DESCRIPCIÓN: ${topic.brief}
Cubre ${topic.n} elementos/apartados.

Devuelve SOLO un objeto JSON con estas claves:
- "title": el título.
- "assets": objeto { "<id>": { "kind": "photo"|"icon"|"clip"|"gif", "query": "<término EN INGLÉS>" } } con TODOS los ids que uses.
    · "photo": cosa concreta con nombre propio (planetas, animales, hardware, lugares) → query = su nombre exacto (Wikipedia).
    · "icon": concepto/objeto genérico → query = objeto concreto en inglés ("crown", "money bag", "boxing gloves").
    · "clip": vídeo real de archivo (Pexels/Pixabay) → query en inglés ("volcano eruption", "ocean waves").
    · "gif": reacción/humor (Giphy) → query en inglés ("mind blown", "shocked").
- "script": la locución en ESPAÑOL de España (divulgativa, con gancho), con ETIQUETAS INLINE justo ANTES de la palabra donde deben aparecer.

El guion se divide en BEATS (unidades de 4-12s). Cada apartado = 1 o 2 beats. Abre cada beat con [[beat: <plantilla>]].
PLANTILLAS (elige la que encaje con el contenido del beat) y sus SLOTS:
- title-card        → title, icon                         (apertura/cierre de sección)
- single-focus      → focus, label                        (presentar UN concepto)
- compare-2         → left, right, label-left, label-right (comparar A vs B)
- list-3            → item-1..3, label-1..3               (enumerar 3)
- grid-4 / grid-8   → cell-1..N, label-1..N               (catálogo)
- photo-focus       → photo, caption-top, caption-bottom  (una foto/clip grande manda)
- stat-card         → number, unit, label                 (un DATO impactante enorme)
- stickman-reaction → figure, content, label              (reacción/opinión/chiste)
- flow-3            → step-1..3, label-1..3               (proceso/cadena)
- zoom-detail       → main, detail, label                 (detalle de una parte)
- full-bleed-clip   → bleed, text                         (clip a pantalla completa, respiro)
SLOTS UNIVERSALES (válidos en TODAS): center, top, bottom, top-left, top-right, bottom-left, bottom-right, corner-badge.

ETIQUETAS (sintaxis EXACTA):
- [[beat: <plantilla>]]                        abre un beat con su plantilla.
- [[show: <id> @<slot>]]                       icono o foto.
- [[clip: <id> @<slot>, frame=polaroid]]       vídeo. frame: none|polaroid|tv-crt|browser|phone.
- [[gif: <id> @<slot>]]                        gif (reacciones).
- [[stat: "<número>" @number, unit="<unidad>"]]  número gigante (úsalo con stat-card).
- [[text: "<máx 6 palabras>" @<slot>, color=red, size=lg]]   texto manuscrito.
- [[shape: <tipo> @<slot>]]                    marca dibujada sobre ese slot. tipos: circle, underline, cross, check, box, bracket, magnifier.
- [[arrow: <slotA> -> <slotB>]]                flecha entre dos slots.
- [[stickman: <pose> @<slot>]]                 monigote. Poses: neutral, pointing-right, pointing-left, shrug, thinking, angry, cheer.
- [[hide: <id>]] / [[clear]]                   quita uno / vacía la pantalla.

REGLAS DE VARIEDAD (obligatorias):
- Usa AL MENOS 6 plantillas distintas en el episodio. NUNCA repitas la misma plantilla en beats seguidos.
- No uses una misma plantilla más de 3 veces (single-focus máx 5).
- Alterna direcciones de flecha (izq→der, der→izq, arriba→abajo). No más de 2 seguidas igual.
- Cada 45s como máximo debe haber algo en MOVIMIENTO: un [[clip]], un [[gif]] o un [[stickman]]. Incluye al menos 2 clips y 1 gif.
- Usa [[shape]] a menudo (círculos rojos, tachones, checks) para dar vida: al menos 4 distintos.
- CADA idea/frase = UN visual. Texto en pantalla SIEMPRE corto (máx 6 palabras), palabras clave en color=red.
- Pon [[show: <id-del-tema> @corner-badge]] al empezar cada apartado (miniatura de contexto).
- Usa fotos reales (photo) para lo concreto; iconos para conceptos; stat-card para cifras; clips/gifs para movimiento.
- Locución total ~1200-1600 palabras (8-10 min). Cierra invitando a suscribirse.
Devuelve SOLO el JSON.`;

async function callClaude() {
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": ANTH, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 32000, messages: [{ role: "user", content: prompt }] }) });
  const j = await res.json(); if (!res.ok) throw new Error(JSON.stringify(j).slice(0, 300));
  if (j.stop_reason === "max_tokens") throw new Error("truncado (max_tokens)");
  const txt = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  const m = txt.match(/\{[\s\S]*\}/); return JSON.parse(m ? m[0] : txt);
}

const g = await callClaude();
fs.mkdirSync(dir, { recursive: true });
const front = `---\ntitle: "${(g.title || topic.title).replace(/"/g, "")}"\nvoice: "tony"\n---\n`;
fs.writeFileSync(path.join(dir, "script.md"), front + (g.script || "").trim() + "\n");
fs.writeFileSync(path.join(dir, "assets.json"), JSON.stringify(g.assets || {}, null, 2));
fs.writeFileSync("episodes/active.txt", dir.split(path.sep).join("/"));
state.nextIndex = (state.nextIndex + 1) % state.topics.length;
fs.writeFileSync("topics.json", JSON.stringify(state, null, 2));
const nAssets = Object.keys(g.assets || {}).length;
console.log(`✔ script.md + assets.json (${nAssets} assets) · próximo tema ${state.nextIndex}`);

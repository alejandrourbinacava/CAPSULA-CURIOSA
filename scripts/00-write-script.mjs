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

const SLOTS = "center, left, right, top, bottom, top-left, top-right, bottom-left, bottom-right, center-below, left-below, right-below, corner-badge";
const prompt = `Eres guionista y "storyboarder" de un canal explainer en español estilo pizarra (whiteboard doodle): fondo blanco, iconos vectoriales, monigotes de palo, flechas dibujadas a mano, texto manuscrito. Escribe el guion COMPLETO del episodio.

TEMA: ${topic.title}
DESCRIPCIÓN: ${topic.brief}
Cubre ${topic.n} elementos/apartados.

Devuelve SOLO un objeto JSON con estas claves:
- "title": el título.
- "assets": objeto { "<id>": { "kind": "photo"|"icon", "query": "<término EN INGLÉS>" } } con TODOS los ids que uses en show/head. "photo" para cosas concretas con nombre propio (consolas, juegos, hardware, animales, lugares) → query = su nombre exacto (Wikipedia). "icon" para conceptos/objetos genéricos → query = objeto concreto en inglés (ej "boxing gloves", "crown", "money bag").
- "script": la locución en ESPAÑOL de España (divulgativa, con gancho), con ETIQUETAS INLINE colocadas JUSTO ANTES de la palabra en la que deben aparecer.

ETIQUETAS (respeta la sintaxis EXACTA):
- [[show: <id> @<slot>]]        muestra un asset en un slot.
- [[hide: <id>]]                lo quita.
- [[text: "<max 6 palabras>" @<slot>, color=red, size=lg]]   texto manuscrito (color y size opcionales).
- [[arrow: <slot> -> <slot>]]   flecha entre dos slots.
- [[stickman: <pose> @<slot>]]  monigote. Poses: neutral, pointing-right, shrug, thinking, angry.
- [[clear]]                     vacía la pantalla (úsalo entre cada apartado).

SLOTS: ${SLOTS}

REGLAS DE ORO (estilo pizarra):
- CADA idea/frase = UN elemento visual (un icono, un texto, un monigote o una imagen). Nada de párrafos sin visual.
- MÁXIMO 4-5 elementos a la vez en pantalla. Usa [[clear]] al terminar cada apartado.
- El texto en pantalla SIEMPRE corto (máx 6 palabras). Palabras clave/impactantes en color=red.
- Usa imágenes reales (kind photo) para lo concreto con nombre; iconos para conceptos.
- Usa flechas para relacionar cosas y monigotes para reacciones (poca frecuencia).
- Pon [[show: <id-del-tema> @corner-badge]] al empezar cada apartado como miniatura de contexto.
- La locución total ~1200-1600 palabras (unos 8-10 min). Cierra invitando a suscribirse.
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
fs.writeFileSync("episodes/active.txt", dir);
state.nextIndex = (state.nextIndex + 1) % state.topics.length;
fs.writeFileSync("topics.json", JSON.stringify(state, null, 2));
const nAssets = Object.keys(g.assets || {}).length;
console.log(`✔ script.md + assets.json (${nAssets} assets) · próximo tema ${state.nextIndex}`);

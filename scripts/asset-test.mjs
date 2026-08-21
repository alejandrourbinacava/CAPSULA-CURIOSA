// asset-test: PRUEBA de generación de assets con GPT Image (estilo lámina técnica SATA/M.2).
//   Usa el prompt de referencia (2D vector cartoon, trazo negro grueso, color plano) con FONDO
//   TRANSPARENTE para poder colocar el asset sobre cualquier cosa. Guarda en out/asset-test/.
// Uso: node scripts/asset-test.mjs "motherboard" "graphics card" "thermometer" "VGA connector"
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function envKey(n) { if (process.env[n]) return process.env[n].trim(); if (fs.existsSync(".env")) { const m = fs.readFileSync(".env", "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const OPENAI = envKey("OPENAI_API_KEY");
if (!OPENAI) { console.error("Falta OPENAI_API_KEY en .env"); process.exit(1); }

const OUT = "out/asset-test"; fs.mkdirSync(OUT, { recursive: true });
// mezcla de prueba: objetos (estilo SATA) + stickman (prompt maestro). "sm:" marca un stickman.
const items = process.argv.slice(2).length ? process.argv.slice(2)
  : ["motherboard top view", "graphics card", "thermometer", "sm:thinking, hand on chin", "sm:pointing to the right"];

// prompt de referencia (el que te dio ChatGPT) + fondo TRANSPARENTE en vez de blanco
const PROMPT = (obj) => `Create a clean 2D vector-style illustration of ${obj}.

VISUAL STYLE:
- modern educational technology infographic
- flat vector illustration
- bold black outlines around every major shape
- thick consistent stroke
- simple geometric construction
- solid saturated colors
- minimal shading
- no gradients, no photorealism, no textures, no realistic lighting
- simplified but recognizable technical details
- slightly cartoonized proportions
- clean professional explainer-video aesthetic
- visually clear at small size

COMPOSITION:
- isolated single object, centered
- front-facing or technically appropriate orthographic view
- entire object visible, generous empty space around it
- fully TRANSPARENT background
- no shadows extending outside the object

Do NOT include: text, labels, numbers, letters, logos, brands, watermark, interface elements, background objects, realistic reflections, complex shadows, gradients.

The final image should look like an asset extracted from a high-quality animated educational technology explainer video.`;

// prompt maestro de STICKMAN (el tuyo), con fondo transparente
const STICKMAN = (action) => `Create a simple 2D explainer-style stickman illustration, hand-drawn vector aesthetic. Fully transparent background. Minimal black line art with clean, smooth outlines. A simple stick figure with a round white head, thin black body and limbs, minimal facial features, and expressive body language. Flat colors only, no gradients, no realistic textures, no shadows, no 3D rendering.

The character should look like a professional educational YouTube explainer graphic: simple, friendly, slightly cartoonish, visually clear and instantly understandable. Use consistent proportions, line thickness and visual style. Clean vector asset to be placed on a white background in an animated explainer video.

Composition: isolated character, centered, full body visible, plenty of empty space around the character. No text, no labels, no background elements.

Action/pose: ${action}.`;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);

async function genImage(item, dest) {
  const isSm = item.startsWith("sm:");
  const prompt = isSm ? STICKMAN(item.slice(3).trim()) : PROMPT(item);
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST", headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", background: "transparent", output_format: "png", quality: "high", n: 1 }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error?.message || r.status).toString().slice(0, 120));
  const b64 = j.data?.[0]?.b64_json; if (!b64) throw new Error("sin imagen");
  fs.writeFileSync(dest, Buffer.from(b64, "base64"));
}

const files = [];
for (const c of items) {
  const dest = path.join(OUT, (c.startsWith("sm:") ? "stickman-" : "") + slug(c) + ".png");
  try { await genImage(c, dest); files.push(dest); console.log(`🎨 ${c} ✓`); }
  catch (e) { console.log(`✗ ${c}: ${e.message}`); }
}
// montaje sobre un tablero blanco (para ver cómo quedan sobre el lienzo del canal)
if (files.length) {
  const inputs = files.map(f => `-i "${f}"`).join(" ");
  const scaled = files.map((_, i) => `[${i}]scale=380:380:force_original_aspect_ratio=decrease,pad=400:400:(ow-iw)/2:(oh-ih)/2:color=white[s${i}]`).join(";");
  const stack = files.map((_, i) => `[s${i}]`).join("") + `hstack=inputs=${files.length}`;
  execSync(`ffmpeg -y -v error ${inputs} -filter_complex "${scaled};${stack}" out/asset-test/_montaje.png`, { stdio: "inherit" });
  console.log("✔ montaje: out/asset-test/_montaje.png");
}

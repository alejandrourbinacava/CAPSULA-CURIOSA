import fs from "node:fs";
const FPS = 30;
const src = fs.readFileSync(new URL("./generar-voz-video1-deep.mjs", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("./public/voz1deep/manifest.json", import.meta.url), "utf8"));
const dur = Object.fromEntries(manifest.map(m => [m.id, m.durSec]));
// extraer [id, label, "texto"] del array DEEP
const re = /\["(v\d+)","([^"]+)","([^"]+)"\]/g;
const norm = (w) => w.toLowerCase().replace(/[.,;:¿?¡!«»]/g, "");
const out = {};
let m;
while ((m = re.exec(src))) {
  const [, id, , text] = m;
  if (!/^v(0[2-9]|1[01])$/.test(id)) continue; // solo trastornos v02..v11
  const words = text.split(/\s+/); const N = words.length; const low = words.map(norm);
  const t = (idx) => idx < 0 ? -1 : Math.round((idx / N) * dur[id] * FPS);
  const idxOf = (w, from = 0) => { for (let i = from; i < low.length; i++) if (low[i] === w) return i; return -1; };
  const fuera = idxOf("fuera");
  const dentro = idxOf("dentro");
  const senales = idxOf("señales");
  let causa = -1;
  for (let i = senales > 0 ? senales : 0; i < low.length; i++) { if (["qué", "dónde", "causa"].includes(low[i])) { causa = i; break; } }
  const ejemplo = idxOf("ejemplo");
  let consejo = -1; for (let i = low.length - 1; i >= 0; i--) if (low[i] === "cómo") { consejo = i; break; }
  out[id] = { fuera: t(fuera), dentro: t(dentro), senales: t(senales), causa: t(causa), ejemplo: t(ejemplo), consejo: t(consejo), total: manifest.find(x => x.id === id).frames };
  console.log(id, JSON.stringify(out[id]));
}
fs.writeFileSync(new URL("./public/voz1deep/anchors.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("✅ anchors.json escrito");

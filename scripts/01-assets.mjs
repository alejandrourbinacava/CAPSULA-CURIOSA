// 01-assets: baja cada asset de assets.json.
//   kind "icon"  -> Iconify (packs flat-outline coherentes) SVG.
//   kind "photo" -> Wikipedia (imagen real de hardware/producto concreto).
// Guarda en public/assets/icons/<id>.<ext> y actualiza assets.json con la ruta.
// Uso: node scripts/01-assets.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "episodes/test-cpu";
const assetsPath = path.join(dir, "assets.json");
const assets = JSON.parse(fs.readFileSync(assetsPath, "utf8"));
const OUT = path.join("public", "assets", "icons");
fs.mkdirSync(OUT, { recursive: true });

// UA descriptivo: Wikipedia BLOQUEA/limita peticiones sin User-Agent propio (era la causa de que
// Saturno/Urano/Neptuno/Plutón fallaran en CI y cayeran a iconos basura).
const UA = "CapsulaCuriosaBot/1.0 (https://github.com/alejandrourbinacava/CAPSULA-CURIOSA; alejandrourbinacava@gmail.com)";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// packs de iconos de LÍNEA (nunca logos de marca: excluimos logos/skill-icons/devicon/flags/emoji-color)
const SETS = ["streamline", "solar", "hugeicons", "ph", "proicons", "tabler", "carbon", "mdi", "material-symbols", "lucide"];
const BADSET = /^(logos|skill-icons|devicon|cif|flag|circle-flags|flagpack|twemoji|noto|fxemoji|emojione|openmoji|fluent-emoji|vscode-icons|catppuccin|token|cryptocurrency|arcticons|simple-icons|brandico|fa-brands|line-md):/i;
const dl = async (url, dest) => { const r = await fetch(url, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error("dl " + r.status); const b = Buffer.from(await r.arrayBuffer()); if (b.length < 800) throw new Error("img vacia"); fs.writeFileSync(dest, b); };
async function iconify(q, dest) {
  const j = await (await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=40`, { headers: { "User-Agent": UA } })).json();
  const ic = (j.icons || []).filter(i => !BADSET.test(i) && !/question|help|unknown|placeholder|no-image|error/i.test(i));
  let pick; for (const s of SETS) { pick = ic.find(i => i.startsWith(s + ":")); if (pick) break; }
  pick = pick || ic[0]; if (!pick) return false;
  const [p, n] = pick.split(":");
  const svg = await (await fetch(`https://api.iconify.design/${p}/${n}.svg?height=320`, { headers: { "User-Agent": UA } })).text();
  if (!svg.includes("<svg")) return false; fs.writeFileSync(dest, svg); return true;
}
async function wiki(q, base) {
  for (const lang of ["en", "es"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const s = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=1&origin=*`, { headers: { "User-Agent": UA } })).json();
        const t = s?.query?.search?.[0]?.title; if (!t) break;
        const r = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*`, { headers: { "User-Agent": UA } })).json();
        const p = Object.values(r?.query?.pages || {})[0]; const u = p?.thumbnail?.source || p?.original?.source;
        if (u) { const ext = /\.png/i.test(u) ? "png" : "jpg"; await dl(u, path.join(OUT, base + "." + ext)); return "assets/icons/" + base + "." + ext; }
        break; // hubo respuesta pero sin imagen -> probar siguiente idioma
      } catch (e) { await sleep(800 * (attempt + 1)); } // rate-limit u error: espera y reintenta
    }
  }
  return null;
}

for (const [id, a] of Object.entries(assets)) {
  const q = a.query || id;
  await sleep(300); // espacia peticiones (evita rate-limit de Wikipedia/Iconify)
  try {
    if (a.kind === "photo") {
      const f = await wiki(q, id);
      if (f) { a.file = f; console.log(`🖼️  ${id} (foto) ✓`); continue; }
      // sin foto -> icono como reserva
    }
    const svgPath = path.join(OUT, id + ".svg");
    if (await iconify(q, svgPath)) { a.file = "assets/icons/" + id + ".svg"; console.log(`▲ ${id} (icono) ✓`); }
    else { a.file = null; console.log(`✗ ${id} sin asset`); }
  } catch (e) { a.file = null; console.log(`✗ ${id} error ${(e.message || "").slice(0, 40)}`); }
}
fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
console.log("✔ assets.json actualizado");

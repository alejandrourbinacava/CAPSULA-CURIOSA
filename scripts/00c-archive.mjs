// 00c-archive (MATERIAL.md D): resolutor de MATERIAL DE ARCHIVO desde Wikimedia Commons (sin clave).
//   Para cada sección busca 5 categorías: mapa histórico, retrato, grabado de arquitectura, objeto,
//   escena. Sesga la búsqueda a material antiguo (engraving/map/portrait...), NO foto de stock.
//   Guarda en public/assets/archive/ y escribe archive.json (con institución + licencia para créditos).
// Uso: node scripts/00c-archive.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "episodes/003-cada-imperio-que-domino-el-mundo";
const script = fs.readFileSync(path.join(dir, "script.md"), "utf8");
const OUT = path.join("public", "assets", "archive"); fs.mkdirSync(OUT, { recursive: true });
const UA = "CapsulaCuriosaBot/1.0 (https://github.com/alejandrourbinacava/CAPSULA-CURIOSA; alejandrourbinacava@gmail.com)";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// semilla EN inglés por imperio (Commons rinde mejor en inglés para historia)
const SEED = { egipcio: "Ancient Egypt", persa: "Achaemenid Persia", persia: "Achaemenid Persia", romano: "Roman Empire", roma: "Roman Empire", chino: "Imperial China", china: "Imperial China", mongol: "Mongol Empire", otomano: "Ottoman Empire", inca: "Inca Empire", britanico: "British Empire", "británico": "British Empire", espanol: "Spanish Empire", "español": "Spanish Empire", griego: "Ancient Greece", azteca: "Aztec Empire", bizantino: "Byzantine Empire", ruso: "Russian Empire", japones: "Empire of Japan" };
const seedFor = (label) => {
  const norm = label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const k of Object.keys(SEED)) if (norm.includes(k)) return SEED[k];
  return label.replace(/el imperio/i, "").trim() + " history";
};
// 5 categorías con términos que sesgan hacia ARCHIVO
const CATS = (seed) => [
  { cat: "mapa", q: `${seed} old map` },
  { cat: "retrato", q: `${seed} portrait engraving` },
  { cat: "arquitectura", q: `${seed} architecture engraving` },
  { cat: "objeto", q: `${seed} artifact` },
  { cat: "escena", q: `${seed} historical illustration` },
];
const BAD = /\b(flag|logo|icon|svg|map of the world blank|locator|orthographic|animation|diagram simple)\b/i;

async function commons(q) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1400&format=json&origin=*`;
  try {
    const j = await (await fetch(url, { headers: { "User-Agent": UA } })).json();
    const pages = Object.values(j?.query?.pages || {});
    for (const p of pages.sort((a, b) => (a.index || 0) - (b.index || 0))) {
      const ii = p.imageinfo?.[0]; if (!ii) continue;
      const title = p.title || ""; if (BAD.test(title) || /\.svg$/i.test(title)) continue;
      if (!/\.(jpe?g|png|tif|tiff)$/i.test(title)) continue;
      const meta = ii.extmetadata || {};
      const lic = (meta.LicenseShortName?.value || meta.License?.value || "").toString();
      const artist = (meta.Artist?.value || "").replace(/<[^>]+>/g, "").slice(0, 60);
      return { url: ii.thumburl || ii.url, page: ii.descriptionurl, title, license: lic || "dominio público (antigüedad)", artist };
    }
  } catch { }
  return null;
}
const dl = async (url, dest) => { const r = await fetch(url, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error("dl " + r.status); const b = Buffer.from(await r.arrayBuffer()); if (b.length < 6000) throw new Error("img pequeña"); fs.writeFileSync(dest, b); };

// secciones del guion
const sections = [...script.matchAll(/\[\[section:\s*"([^"]*)"/g)].map(m => m[1]);
const archive = {};
let n = 0;
for (const label of sections) {
  const seed = seedFor(label);
  const slug = label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 28);
  archive[label] = [];
  for (const { cat, q } of CATS(seed)) {
    await sleep(350);
    const hit = await commons(q);
    if (!hit) { console.log(`  ✗ ${label} · ${cat}: sin resultado (${q})`); continue; }
    const file = `assets/archive/${slug}-${cat}.jpg`;
    try { await dl(hit.url, path.join("public", file)); archive[label].push({ cat, file, source: "Wikimedia Commons", page: hit.page, license: hit.license, artist: hit.artist, query: q }); n++; console.log(`  🖼️  ${label} · ${cat} ✓`); }
    catch (e) { console.log(`  ✗ ${label} · ${cat}: ${(e.message || "").slice(0, 30)}`); }
  }
}
fs.writeFileSync(path.join(dir, "archive.json"), JSON.stringify(archive, null, 2));
console.log(`✔ archive.json: ${n} imágenes de archivo para ${sections.length} secciones`);

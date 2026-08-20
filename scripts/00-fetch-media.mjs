// 00-fetch-media: resuelve los assets de tipo "clip" y "gif" del assets.json y los cachea en local.
//   Addendum 1 · G. clip -> Pexels/Pixabay (mp4) · gif -> Giphy. Cachea y versiona la ruta+origen.
// Uso: node scripts/00-fetch-media.mjs episodes/<slug>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "episodes/test-cpu";
const assetsPath = path.join(dir, "assets.json");
const assets = JSON.parse(fs.readFileSync(assetsPath, "utf8"));
function envKey(n) { if (process.env[n]) return process.env[n].trim(); if (fs.existsSync(".env")) { const m = fs.readFileSync(".env", "utf8").match(new RegExp(n + "\\s*=\\s*(.+)")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } return null; }
const PEXELS = envKey("PEXELS_KEY"), PIXABAY = envKey("PIXABAY_KEY"), GIPHY = envKey("GIPHY_KEY");
const UA = "CapsulaCuriosaBot/1.0 (+https://github.com/alejandrourbinacava/CAPSULA-CURIOSA)";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CLIPS = path.join("public", "assets", "clips"), GIFS = path.join("public", "assets", "gifs");
fs.mkdirSync(CLIPS, { recursive: true }); fs.mkdirSync(GIFS, { recursive: true });
const dl = async (url, dest) => { const r = await fetch(url, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error("dl " + r.status); const b = Buffer.from(await r.arrayBuffer()); if (b.length < 2000) throw new Error("vacío"); fs.writeFileSync(dest, b); };

async function pexelsClip(q, dest) {
  if (!PEXELS) return false;
  const j = await (await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`, { headers: { Authorization: PEXELS } })).json();
  const v = (j.videos || [])[0]; if (!v) return false;
  const files = (v.video_files || []).filter(f => f.file_type === "video/mp4").sort((a, b) => (a.width || 0) - (b.width || 0));
  const pick = files.find(f => (f.width || 0) >= 960) || files[files.length - 1]; if (!pick) return false;
  await dl(pick.link, dest); return { source: "Pexels", credit: v.user?.name, url: v.url };
}
async function pixabayClip(q, dest) {
  if (!PIXABAY) return false;
  const j = await (await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY}&q=${encodeURIComponent(q)}&per_page=3`, { headers: { "User-Agent": UA } })).json();
  const h = (j.hits || [])[0]; if (!h) return false; const u = h.videos?.medium?.url || h.videos?.small?.url; if (!u) return false;
  await dl(u, dest); return { source: "Pixabay", credit: h.user, url: h.pageURL };
}
async function giphyGif(q, dest) {
  if (!GIPHY) return false;
  const j = await (await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY}&q=${encodeURIComponent(q)}&limit=1&rating=g`)).json();
  const g = (j.data || [])[0]; if (!g) return false; const u = g.images?.downsized_medium?.url || g.images?.original?.url; if (!u) return false;
  await dl(u, dest); return { source: "Giphy", credit: g.username || "giphy", url: g.url };
}

let n = 0;
for (const [id, a] of Object.entries(assets)) {
  if (a.kind !== "clip" && a.kind !== "gif") continue;
  const q = a.query || id;
  const ext = a.kind === "gif" ? "gif" : "mp4";
  const rel = `assets/${a.kind === "gif" ? "gifs" : "clips"}/${id}.${ext}`;
  const dest = path.join("public", rel);
  if (fs.existsSync(dest) && a.file === rel) { console.log(`♻️  ${id} (${a.kind}) ya cacheado`); continue; }
  await sleep(300);
  try {
    let meta = false;
    if (a.kind === "gif") meta = await giphyGif(q, dest);
    else meta = await pexelsClip(q, dest) || await pixabayClip(q, dest);
    if (meta) { a.file = rel; a.origin = meta; console.log(`🎬 ${id} (${a.kind}) ✓ [${meta.source}]`); n++; }
    else { a.file = null; console.log(`✗ ${id} (${a.kind}) sin resultado`); }
  } catch (e) { a.file = null; console.log(`✗ ${id} (${a.kind}) error ${(e.message || "").slice(0, 40)}`); }
}
fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
console.log(`✔ media: ${n} clips/gifs cacheados`);

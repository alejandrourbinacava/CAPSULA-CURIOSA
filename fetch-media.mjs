import fs from "node:fs";
const K = fs.readFileSync(new URL("./.env", import.meta.url), "utf8").match(/PIXABAY_KEY\s*=\s*(.+)/)[1].trim();
const OUT = new URL("./public/media/", import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
async function dl(url, dest) { const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }); if (!r.ok) throw new Error("dl " + r.status); fs.writeFileSync(new URL(dest, OUT), Buffer.from(await r.arrayBuffer())); return (fs.statSync(new URL(dest, OUT)).size / 1024 | 0) + "KB"; }
async function vid(q) { const j = await (await fetch(`https://pixabay.com/api/videos/?key=${K}&q=${encodeURIComponent(q)}&per_page=8&safesearch=true`)).json(); const h = (j.hits || [])[0]; return h ? (h.videos.small?.url || h.videos.medium?.url || h.videos.tiny.url) : null; }
async function pic(q) { const j = await (await fetch(`https://pixabay.com/api/?key=${K}&q=${encodeURIComponent(q)}&image_type=photo&per_page=8&safesearch=true&orientation=horizontal`)).json(); const h = (j.hits || [])[0]; return h ? (h.largeImageURL || h.webformatURL) : null; }

const JOBS = [
  ["esquizoide", "man working alone laptop night", "man sitting alone dark room"],
  ["esquizotipico", "starry night sky galaxy", "fortune teller crystal ball"],
  ["antisocial", "counting money cash hands", "man smirk suit confident"],
  ["limite", "person texting smartphone worried", "sad woman crying emotional"],
  ["histrionico", "friends party celebration toast", "woman laughing happy group"],
  ["narcisista", "man looking mirror", "confident businessman arms crossed"],
  ["evitativo", "lonely person looking window", "shy person covering face"],
  ["dependiente", "couple holding hands restaurant", "people choosing menu restaurant"],
  ["obsesivo", "organizing cleaning desk office", "tidy organized desk workspace"],
];
for (const [key, vq, pq] of JOBS) {
  try { const vu = await vid(vq); if (vu) console.log(key, "vid", await dl(vu, `${key}_vid.mp4`)); else console.log(key, "vid: nada"); } catch (e) { console.log(key, "vid ERR", e.message); }
  try { const pu = await pic(pq); if (pu) console.log(key, "pic", await dl(pu, `${key}_photo.jpg`)); else console.log(key, "pic: nada"); } catch (e) { console.log(key, "pic ERR", e.message); }
}
// paranoide reutiliza los ya bajados
fs.copyFileSync(new URL("para_video.mp4", OUT), new URL("paranoide_vid.mp4", OUT));
fs.copyFileSync(new URL("para_sospecha.jpg", OUT), new URL("paranoide_photo.jpg", OUT));
console.log("✅ media lista");

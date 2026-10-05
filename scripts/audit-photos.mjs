// audit-photos v2: reproduce EXACTAMENTE la lógica vieja de 01-assets (en primero, 1er resultado; si esa página no tiene imagen, cae a es)
// y lista de qué ARTÍCULO salió cada foto de cada episodio. Uso: node scripts/audit-photos.mjs > out/audit2.md
import fs from "node:fs"; import path from "node:path";
const UA = "CapsulaCuriosa/1.0 (audit)"; const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const j = async (u) => { for (let i = 0; i < 4; i++) { try { const r = await fetch(u, { headers: { "User-Agent": UA } }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(900); } } return null; };
const nz = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ");
async function oldPick(q) {
  for (const lang of ["en", "es"]) {
    await sleep(220);
    const s = await j(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=1&origin=*`);
    const t = s?.query?.search?.[0]?.title; if (!t) continue;
    const r = await j(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages|description&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*`);
    const p = Object.values(r?.query?.pages || {})[0]; const u = p?.thumbnail?.source || p?.original?.source;
    if (u) return { lang, title: t, desc: p.description || "" };
  }
  return null;
}
const cache = new Map(); const eps = fs.readdirSync("episodes").filter(d => /^\d{3}-/.test(d)).sort();
for (const e of eps) {
  const f = path.join("episodes", e, "assets.json"); if (!fs.existsSync(f)) continue;
  const a = JSON.parse(fs.readFileSync(f, "utf8")); const rows = [];
  for (const [k, v] of Object.entries(a)) {
    if (v.kind !== "cutout" && v.kind !== "photo") continue; const q = v.query || k;
    if (!cache.has(q)) cache.set(q, await oldPick(q)); const r = cache.get(q);
    const qt = nz(q).split(" ").filter(w => w.length >= 4); const tt = nz(r?.title || "");
    const overlap = qt.some(w => tt.includes(w.slice(0, 5)));
    rows.push({ k, q, r, overlap });
  }
  const sus = rows.filter(x => !x.overlap).length;
  console.log(`## ${e} — ${rows.length} fotos, ${sus} con título SIN relación con la consulta`);
  for (const x of rows) console.log(`- ${x.overlap ? "  " : "⚠️"} ${x.k} «${x.q}» → ${x.r ? x.r.lang + ":" + x.r.title + " [" + x.r.desc.slice(0, 40) + "]" : "SIN FOTO"}`);
  console.log();
}
console.log("FIN");

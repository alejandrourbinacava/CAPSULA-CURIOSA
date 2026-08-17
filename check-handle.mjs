const handles = process.argv.slice(2);
if (!handles.length) { console.log("uso: node check-handle.mjs CapsulaCuriosa AlexExplica ..."); process.exit(0); }
for (const h of handles) {
  const url = `https://www.youtube.com/@${h}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
    const html = await r.text();
    // YouTube devuelve 200 con página de error si no existe; buscamos señales
    const notFound = /"status":"ERROR"|404 Not Found|This page isn.t available|Esta página no está disponible|no está disponible/i.test(html);
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/ - YouTube$/, "").trim() : "";
    console.log(`@${h}  HTTP ${r.status}  ${notFound ? "→ LIBRE (no existe)" : "→ OCUPADO: \"" + title + "\""}`);
  } catch (e) {
    console.log(`@${h}  ERROR ${e.cause?.code || e.message}`);
  }
}

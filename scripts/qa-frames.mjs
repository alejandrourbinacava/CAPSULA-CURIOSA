// qa-frames: renderiza FOTOGRAMAS reales del episodio activo y los junta en una hoja de contacto, para MIRARLOS.
//   Empaqueta una sola vez con un `public` reducido (solo los ficheros que usa scenes.json), así no copia 2.4 GB.
// Uso: node scripts/qa-frames.mjs <nombre> <t1> <t2> ...    (segundos)  ->  out/qa/<nombre>.png  (+ un PNG por fotograma)
//      El episodio es el que haya compilado 02s en public/active/scenes.json.
import fs from "node:fs"; import path from "node:path"; import { execSync } from "node:child_process";
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition } from "@remotion/renderer";

const name = process.argv[2]; const times = process.argv.slice(3).map(Number).filter(x => !isNaN(x));
if (!name || !times.length) { console.log("uso: node scripts/qa-frames.mjs <nombre> <t1> <t2> ..."); process.exit(1); }
const scenes = JSON.parse(fs.readFileSync("public/active/scenes.json", "utf8"));
const slim = path.resolve("out/slimpublic"); fs.rmSync(slim, { recursive: true, force: true }); fs.mkdirSync(slim, { recursive: true });
const need = new Set(); for (const e of scenes.elements) { if (e.src) need.add(e.src); if (e.head) need.add(e.head); }
if (scenes.meta.audio) need.add(scenes.meta.audio);
for (const f of ["mascota.png"]) if (fs.existsSync(path.join("public", f))) need.add(f);
let copied = 0, missing = [];
for (const rel of need) { const src = path.join("public", rel); if (!fs.existsSync(src)) { missing.push(rel); continue; } const dst = path.join(slim, rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); copied++; }
console.log(`public reducido: ${copied} ficheros` + (missing.length ? ` · FALTAN ${missing.length}: ${missing.slice(0, 5).join(", ")}` : ""));

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: slim });
const comp = await selectComposition({ serveUrl, id: "Scene" });
fs.mkdirSync("out/qa", { recursive: true }); const files = [];
for (const t of times) {
  const out = `out/qa/${name}_${String(t).replace(".", "_")}.png`;
  await renderStill({ composition: comp, serveUrl, output: out, frame: Math.min(comp.durationInFrames - 1, Math.round(t * comp.fps)), scale: 0.5 });
  files.push({ t, f: out }); console.log("  fotograma", t + "s");
}
const py = `
from PIL import Image, ImageDraw
import json,sys
items=json.loads(sys.argv[1]); out=sys.argv[2]
cols=2 if len(items)>1 else 1; ims=[Image.open(i["f"]).convert("RGB") for i in items]; w,h=ims[0].size
rows=(len(ims)+cols-1)//cols; sheet=Image.new("RGB",(cols*w+(cols+1)*8,rows*(h+30)+8),(60,60,70)); d=ImageDraw.Draw(sheet)
for i,(im,it) in enumerate(zip(ims,items)):
    x=8+(i%cols)*(w+8); y=8+(i//cols)*(h+30); sheet.paste(im,(x,y+22)); d.text((x+4,y+4),"t = %ss"%it["t"],fill=(255,255,255))
sheet.save(out)
`;
fs.writeFileSync("out/_qa.py", py);
execSync(`python out/_qa.py ${JSON.stringify(JSON.stringify(files))} out/qa/${name}.png`, { stdio: "inherit", shell: true });
console.log("hoja:", `out/qa/${name}.png`);
process.exit(0);

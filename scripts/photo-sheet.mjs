// photo-sheet: hoja de contacto de las FOTOS reales de un episodio, con el artículo de Wikipedia del que salió cada una.
// Uso: node scripts/photo-sheet.mjs episodes/<slug>  ->  out/photos_<slug>.png   (hay que MIRARLA antes de commitear)
import fs from "node:fs"; import path from "node:path"; import { execSync } from "node:child_process";
const dir = process.argv[2]; const a = JSON.parse(fs.readFileSync(path.join(dir, "assets.json"), "utf8"));
const ph = Object.entries(a).filter(([, v]) => (v.kind === "cutout" || v.kind === "photo") && v.file);
fs.mkdirSync("out", { recursive: true });
const items = ph.map(([k, v]) => ({ k, f: path.join("public", v.file), src: v.attribution?.source || "?" }));
const py = `
from PIL import Image, ImageDraw
import json,sys
items=json.loads(sys.argv[1]); out=sys.argv[2]
cols=5; W=380; H=300; rows=(len(items)+cols-1)//cols
sheet=Image.new("RGB",(cols*W,rows*(H+44)),(255,255,255)); d=ImageDraw.Draw(sheet)
for i,it in enumerate(items):
    x=(i%cols)*W; y=(i//cols)*(H+44)
    try:
        im=Image.open(it["f"]).convert("RGB"); im.thumbnail((W-10,H-10)); sheet.paste(im,(x+5,y+5))
    except Exception as e: d.text((x+10,y+10),"ERR "+str(e)[:40],fill=(200,0,0))
    d.text((x+6,y+H+2),it["k"],fill=(0,0,0)); d.text((x+6,y+H+20),it["src"][:58],fill=(90,90,90))
sheet.save(out)
`;
fs.writeFileSync("out/_sheet.py", py);
const out = "out/photos_" + path.basename(dir) + ".png";
execSync(`python out/_sheet.py ${JSON.stringify(JSON.stringify(items))} ${out}`, { stdio: "inherit", shell: true });
console.log("hoja:", out, "(" + items.length + " fotos)");

// qa-preview: renderiza un TRAMO del episodio activo a mp4 pequeño (con la voz) para verlo en movimiento, sin GitHub Actions.
// Uso: node scripts/qa-preview.mjs <salida.mp4> <desde_s> <hasta_s> [escala=0.5]
import fs from "node:fs"; import path from "node:path";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer";
const [outFile, from, to, scaleArg] = process.argv.slice(2); const scale = +(scaleArg || 0.5);
const scenes = JSON.parse(fs.readFileSync("public/active/scenes.json", "utf8"));
const slim = path.resolve("out/slimpublic"); fs.rmSync(slim, { recursive: true, force: true }); fs.mkdirSync(slim, { recursive: true });
const need = new Set(["mascota.png"]); for (const e of scenes.elements) { if (e.src) need.add(e.src); if (e.head) need.add(e.head); } if (scenes.meta.audio) need.add(scenes.meta.audio);
for (const rel of need) { const s = path.join("public", rel); if (!fs.existsSync(s)) continue; const d = path.join(slim, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: slim });
const comp = await selectComposition({ serveUrl, id: "Scene" });
const fps = comp.fps, f0 = Math.round(+from * fps), f1 = Math.min(comp.durationInFrames - 1, Math.round(+to * fps));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
let last = 0;
await renderMedia({ composition: comp, serveUrl, codec: "h264", outputLocation: outFile, frameRange: [f0, f1], scale, crf: +(process.env.CRF || 27), jpegQuality: +(process.env.JPEGQ || 80), audioCodec: "aac", onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p > last) { last = p; console.log("  " + p * 10 + "%"); } } });
console.log("preview:", outFile); process.exit(0);

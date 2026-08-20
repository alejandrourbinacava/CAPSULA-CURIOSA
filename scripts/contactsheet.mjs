// contactsheet (VERIFICACION 1.4): 1 frame cada 10s en rejilla 4x5 para el vistazo HUMANO.
//   Detecta lo que verify no ve: iconos que no pegan, ritmo raro, escenas vacías.
// Uso: node scripts/contactsheet.mjs [video.mp4] [salida_%02d.png]
import { execSync } from "node:child_process";
const video = process.argv[2] || "out/VIDEO_FINAL.mp4";
const out = process.argv[3] || "out/hoja_%02d.png";
execSync(`ffmpeg -y -v error -i "${video}" -vf "fps=1/10,scale=480:-1,tile=4x5" "${out}"`, { stdio: "inherit" });
console.log("✔ hoja de contactos: out/hoja_*.png");

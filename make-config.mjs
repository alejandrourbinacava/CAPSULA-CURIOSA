// Genera video.config.json (fuente única de verdad del vídeo) a partir de:
//  - narraciones ya escritas en los scripts de voz
//  - campos en pantalla + búsquedas de assets (aquí abajo)
import fs from "node:fs";
const deep = fs.readFileSync(new URL("./generar-voz-video1-deep.mjs", import.meta.url), "utf8");
const full = fs.readFileSync(new URL("./generar-voz-video1-full.mjs", import.meta.url), "utf8");
const nar = {};
for (const src of [deep, full]) { const re = /\["(v\d+)","[^"]+","([^"]+)"\]/g; let m; while ((m = re.exec(src))) if (!nar[m[1]]) nar[m[1]] = m[2]; }

const P = ["#ffd54f", "#ff8c1a", "#4db6ac", "#e57373", "#7986cb", "#ba68c8"];
const s = (a, b, c) => ({ icon: a, color: b, label: c });
const items = [
  { id: "v02", key: "paranoide", name: "PARANOIDE", group: "GRUPO A", color: "#e57373", main: "eye", def: "Desconfía de todo y de todos",
    fuera: ["shield-alert", "Alerta y a la defensiva"], dentro: ["ghost", "Se siente en peligro"],
    senales: [s("eye", P[0], "Sospecha de todos"), s("shield-alert", P[1], "Todo es un ataque"), s("hourglass", P[2], "Guarda rencor")],
    causa: ["dna", "Genética + traiciones tempranas"], ejemploTitle: "Un mensaje del jefe…", consejo: ["handshake", "Sé claro, directo y coherente"],
    videoQuery: "worried phone smartphone", photoQuery: "suspicious man looking" },
  { id: "v03", key: "esquizoide", name: "ESQUIZOIDE", group: "GRUPO A", color: "#90a4ae", main: "user", def: "Prefiere la soledad de verdad",
    fuera: ["snowflake", "Frío y distante"], dentro: ["moon", "Sin ganas de conectar"],
    senales: [s("user", P[0], "Elige estar solo"), s("snowflake", P[1], "Frialdad emocional"), s("volume-x", P[2], "Nada le afecta")],
    causa: ["dna", "Temperamento distante innato"], ejemploTitle: "En el trabajo…", consejo: ["door-open", "Respeta su espacio"],
    videoQuery: "man working alone laptop night", photoQuery: "man sitting alone dark room" },
  { id: "v04", key: "esquizotipico", name: "ESQUIZOTÍPICO", group: "GRUPO A", color: "#ba68c8", main: "sparkles", def: "Un mundo interior extraño",
    fuera: ["star", "Excéntrico e inusual"], dentro: ["ghost", "Ve conexiones ocultas"],
    senales: [s("sparkles", P[0], "Pensamiento mágico"), s("moon", P[1], "Supersticiones"), s("shirt", P[2], "Viste y habla raro")],
    causa: ["brain", "Espectro leve de esquizofrenia"], ejemploTitle: "Anoche soñó que…", consejo: ["smile", "Paciencia, sin burlas"],
    videoQuery: "starry night sky galaxy", photoQuery: "fortune teller crystal ball" },
  { id: "v05", key: "antisocial", name: "ANTISOCIAL", group: "GRUPO B", color: "#607d8b", main: "venetian-mask", def: "No siente culpa (psicopatía)",
    fuera: ["smile", "Encantador y persuasivo"], dentro: ["heart-off", "Cero empatía"],
    senales: [s("venetian-mask", P[0], "Miente y manipula"), s("ban", P[1], "Ignora las normas"), s("heart-off", P[2], "Cero remordimiento")],
    causa: ["dna", "Genética + entorno duro"], ejemploTitle: "El engaño…", consejo: ["shield-alert", "Pon límites firmes"],
    videoQuery: "counting money cash hands", photoQuery: "man smirk suit confident" },
  { id: "v06", key: "limite", name: "LÍMITE", group: "GRUPO B", color: "#f06292", main: "heart-crack", def: "Montaña rusa emocional",
    fuera: ["flame", "Intensidad y drama"], dentro: ["frown", "Vacío e inseguridad"],
    senales: [s("door-open", P[0], "Miedo al abandono"), s("heart-crack", P[1], "Del amor al odio"), s("zap", P[2], "Impulsividad")],
    causa: ["dna", "Sensibilidad + abandono"], ejemploTitle: "Tarda en responder…", consejo: ["anchor", "Estabilidad y límites amables"],
    videoQuery: "person texting smartphone worried", photoQuery: "sad woman crying emotional" },
  { id: "v07", key: "histrionico", name: "HISTRIÓNICO", group: "GRUPO B", color: "#ffb300", main: "megaphone", def: "Necesita ser el centro",
    fuera: ["smile", "Simpatía y seducción"], dentro: ["eye", "Depende de las miradas"],
    senales: [s("megaphone", P[0], "Ser el centro"), s("star", P[1], "Dramatiza todo"), s("sparkles", P[2], "Seduce por atención")],
    causa: ["eye", "Atención solo al exagerar"], ejemploTitle: "En la cena…", consejo: ["scale", "Atención cuando está calmado"],
    videoQuery: "friends party celebration toast", photoQuery: "woman laughing happy group" },
  { id: "v08", key: "narcisista", name: "NARCISISTA", group: "GRUPO B", color: "#ffd54f", main: "crown", def: "Se cree superior y especial",
    fuera: ["crown", "Seguridad aplastante"], dentro: ["heart-crack", "Autoestima frágil"],
    senales: [s("crown", P[0], "Se cree superior"), s("star", P[1], "Ansía admiración"), s("heart-off", P[2], "Cero empatía")],
    causa: ["dna", "Sobrevaloración o frialdad"], ejemploTitle: "Una crítica pequeña…", consejo: ["shield-alert", "No alimentes su ego"],
    videoQuery: "man looking mirror", photoQuery: "confident businessman arms crossed" },
  { id: "v09", key: "evitativo", name: "EVITATIVO", group: "GRUPO C", color: "#4db6ac", main: "door-closed", def: "Quiere conectar, pero teme",
    fuera: ["lock", "Tímido y distante"], dentro: ["heart-crack", "Anhela pertenecer"],
    senales: [s("door-closed", P[0], "Evita el contacto"), s("arrow-down", P[1], "Se siente inferior"), s("shield-alert", P[2], "Teme la crítica")],
    causa: ["dna", "Rechazo o crítica temprana"], ejemploTitle: "La fiesta…", consejo: ["footprints", "Pasos pequeños, sin presión"],
    videoQuery: "lonely person looking window", photoQuery: "shy person covering face" },
  { id: "v10", key: "dependiente", name: "DEPENDIENTE", group: "GRUPO C", color: "#7986cb", main: "users", def: "«No puedo solo»",
    fuera: ["smile", "Amable y complaciente"], dentro: ["circle-help", "Miedo a valerse solo"],
    senales: [s("circle-help", P[0], "No decide solo"), s("users", P[1], "Necesita apoyo"), s("user", P[2], "Teme la soledad")],
    causa: ["baby", "Crianza sobreprotectora"], ejemploTitle: "Para cenar…", consejo: ["graduation-cap", "Anímale a decidir"],
    videoQuery: "couple holding hands restaurant", photoQuery: "people choosing menu restaurant" },
  { id: "v11", key: "obsesivo", name: "OBSESIVO", group: "GRUPO C", color: "#4dd0e1", main: "ruler", def: "Orden y control perfectos",
    fuera: ["briefcase", "El trabajador ideal"], dentro: ["lock", "Atrapado por sus reglas"],
    senales: [s("ruler", P[0], "Perfeccionismo"), s("list-checks", P[1], "Controla todo"), s("briefcase", P[2], "Adicto al trabajo")],
    causa: ["trophy", "Solo se valoraba el logro"], ejemploTitle: "El informe…", consejo: ["circle-check", "«Hecho» gana a «perfecto»"],
    videoQuery: "organizing cleaning desk office", photoQuery: "tidy organized desk workspace" },
];
for (const it of items) it.narration = nar[it.id];

const config = {
  title: "Los 10 Trastornos de la Personalidad",
  fps: 30,
  voiceId: "851ejYcv2BoNPjrkw93G",
  speed: 1.08,
  cornerIcon: "brain",
  handle: "@CapsulaCuriosa",
  intro: { id: "v00", narration: nar["v00"] },
  grupos: { id: "v01", narration: nar["v01"] },
  outro: { id: "v12", narration: nar["v12"] },
  items,
};
fs.writeFileSync(new URL("./video.config.json", import.meta.url), JSON.stringify(config, null, 2));
console.log("✅ video.config.json escrito ·", items.length, "items · narración:", Object.keys(nar).length, "clips");

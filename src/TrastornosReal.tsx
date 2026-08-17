import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Stick } from "./components/parts";
import { Paranoide, Esquizoide, Esquizotipico, Antisocial, Limite, Histrionico, Narcisista, Evitativo, Dependiente, Obsesivo } from "./components/faces";
import manifest from "../public/voz1deep/manifest.json";

const HAND = "'Comic Sans MS', 'Segoe Print', cursive";
const HEAVY = "'Arial Black', Impact, system-ui, sans-serif";
const RED = "#e2231a";
const PAD = 6;
const ICON = (n: string) => staticFile(`icons/${n}.svg`);
const IMG = (n: string) => staticFile(`img/${n}`);

const sp = (frame: number, fps: number, d = 13, stiff?: number) => spring({ frame, fps, config: stiff ? { damping: d, stiffness: stiff } : { damping: d } });
const bob = (f: number, a = 2, s = 11) => `rotate(${Math.sin(f / s) * a}deg)`;
const enterFX = (ml: number): React.CSSProperties => { const p = Math.min(1, ml / 11); return { opacity: p, filter: `blur(${(1 - p) * 10}px)` }; };
const cam = (ml: number, len: number) => `scale(${1.02 + 0.05 * Math.min(1, ml / len)})`;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const lerp3 = (t: number, a: number, b: number, c: number) => t < 0.6 ? a + (b - a) * (t / 0.6) : b + (c - b) * ((t - 0.6) / 0.4);
// MOVIMIENTO por beat: entra con rebote desde una dirección + SALE deslizando (motion en ambas puntas)
const beatMotion = (ml: number, len: number, dir = 0): React.CSSProperties => {
  const inP = clamp(ml / 9);
  const outP = ml > len - 9 ? clamp((ml - (len - 9)) / 9) : 0;
  const s = lerp3(inP, 0.68, 1.06, 1) * (1 - 0.15 * outP);
  const inOff = (1 - inP) * (dir === 1 ? 120 : dir === 2 ? -120 : 0);
  const inY = (1 - inP) * (dir === 3 ? 90 : dir === 4 ? -90 : 0);
  const outOff = outP * (dir === 1 ? -80 : dir === 2 ? 80 : 60);
  return { opacity: Math.min(inP, 1 - outP), transform: `translate(${inOff + outOff}px, ${inY}px) scale(${s})` };
};

// icono real dentro de círculo de color
const Chip: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: color, border: `${Math.max(5, size * 0.026)}px solid #111`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,.16)" }}>
    <Img src={ICON(name)} style={{ width: size * 0.54, height: size * 0.54 }} />
  </div>
);
// ventana-clip con foto real o icono dentro
const WindowClip: React.FC<{ accent: string; w: number; title: string; img?: string; icon?: string }> = ({ accent, w, title, img, icon }) => (
  <div style={{ width: w, borderRadius: 26, background: "#fff", border: `6px solid ${accent}`, boxShadow: "0 26px 60px rgba(0,0,0,.22)", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 18px", background: accent }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", opacity: .95 }} />
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", opacity: .6 }} />
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", opacity: .4 }} />
      <span style={{ marginLeft: 12, fontFamily: HAND, fontSize: 24, color: "#fff", fontWeight: "bold" }}>{title}</span>
    </div>
    {img ? <Img src={IMG(img)} style={{ width: "100%", height: 460, objectFit: "cover", display: "block" }} />
      : <div style={{ height: 460, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}><Img src={ICON(icon!)} style={{ width: 230, height: 230 }} /></div>}
  </div>
);
const Chevrons: React.FC<{ f: number; c: string }> = ({ f, c }) => (
  <div style={{ display: "flex", gap: 2 }}>{[0, 1, 2, 3].map(k => <span key={k} style={{ fontFamily: HEAVY, fontSize: 96, fontWeight: 900, color: c, opacity: 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f / 6 - k * 0.9)) }}>›</span>)}</div>
);

type Sig = { icon: string; color: string; label: string };
type DD = {
  Face: React.FC; color: string; group: string; name: string; main: string; def: string;
  fuera: [string, string]; dentro: [string, string]; senales: Sig[]; causa: [string, string];
  ejemplo: { title: string; img?: string; icon?: string }; meme: [string, string]; consejo: [string, string];
};
const P = ["#ffd54f", "#ff8c1a", "#4db6ac", "#e57373", "#7986cb", "#ba68c8"];
export const DATA: DD[] = [
  { Face: Paranoide, color: "#e57373", group: "GRUPO A", name: "PARANOIDE", main: "eye", def: "Desconfía de todo y de todos",
    fuera: ["shield-alert", "Alerta y a la defensiva"], dentro: ["ghost", "Se siente en peligro"],
    senales: [{ icon: "eye", color: P[0], label: "Sospecha de todos" }, { icon: "shield-alert", color: P[1], label: "Todo es un ataque" }, { icon: "hourglass", color: P[2], label: "Guarda rencor" }],
    causa: ["dna", "Genética + traiciones tempranas"], ejemplo: { title: "Un mensaje del jefe…", img: "phone_msg.jpg" }, meme: ["frown", "«¿por qué me miras así?»"], consejo: ["handshake", "Sé claro, directo y coherente"] },
  { Face: Esquizoide, color: "#90a4ae", group: "GRUPO A", name: "ESQUIZOIDE", main: "user", def: "Prefiere la soledad de verdad",
    fuera: ["snowflake", "Frío y distante"], dentro: ["moon", "Sin ganas de conectar"],
    senales: [{ icon: "user", color: P[0], label: "Elige estar solo" }, { icon: "snowflake", color: P[1], label: "Frialdad emocional" }, { icon: "volume-x", color: P[2], label: "Nada le afecta" }],
    causa: ["dna", "Temperamento distante innato"], ejemplo: { title: "En el trabajo…", img: "ej_esquizoide.jpg" }, meme: ["moon", "«prefiero estar solo»"], consejo: ["door-open", "Respeta su espacio"] },
  { Face: Esquizotipico, color: "#ba68c8", group: "GRUPO A", name: "ESQUIZOTÍPICO", main: "sparkles", def: "Un mundo interior extraño",
    fuera: ["star", "Excéntrico e inusual"], dentro: ["ghost", "Ve conexiones ocultas"],
    senales: [{ icon: "sparkles", color: P[0], label: "Pensamiento mágico" }, { icon: "moon", color: P[1], label: "Supersticiones" }, { icon: "shirt", color: P[2], label: "Viste y habla raro" }],
    causa: ["brain", "Espectro leve de esquizofrenia"], ejemplo: { title: "Anoche soñó que…", icon: "moon" }, meme: ["sparkles", "«el sueño me lo advirtió»"], consejo: ["smile", "Paciencia, sin burlas"] },
  { Face: Antisocial, color: "#607d8b", group: "GRUPO B", name: "ANTISOCIAL", main: "venetian-mask", def: "No siente culpa (psicopatía)",
    fuera: ["smile", "Encantador y persuasivo"], dentro: ["heart-off", "Cero empatía"],
    senales: [{ icon: "venetian-mask", color: P[0], label: "Miente y manipula" }, { icon: "ban", color: P[1], label: "Ignora las normas" }, { icon: "heart-off", color: P[2], label: "Cero remordimiento" }],
    causa: ["dna", "Genética + entorno duro"], ejemplo: { title: "El engaño…", img: "ej_antisocial.jpg" }, meme: ["smile", "solo le molesta que lo pillen"], consejo: ["shield-alert", "Pon límites firmes"] },
  { Face: Limite, color: "#f06292", group: "GRUPO B", name: "LÍMITE", main: "heart-crack", def: "Montaña rusa emocional",
    fuera: ["flame", "Intensidad y drama"], dentro: ["frown", "Vacío e inseguridad"],
    senales: [{ icon: "door-open", color: P[0], label: "Miedo al abandono" }, { icon: "heart-crack", color: P[1], label: "Del amor al odio" }, { icon: "zap", color: P[2], label: "Impulsividad" }],
    causa: ["dna", "Sensibilidad + abandono"], ejemplo: { title: "Tarda en responder…", img: "ej_limite.jpg" }, meme: ["heart-crack", "«te amo / me vas a dejar»"], consejo: ["anchor", "Estabilidad y límites amables"] },
  { Face: Histrionico, color: "#ffb300", group: "GRUPO B", name: "HISTRIÓNICO", main: "megaphone", def: "Necesita ser el centro",
    fuera: ["smile", "Simpatía y seducción"], dentro: ["eye", "Depende de las miradas"],
    senales: [{ icon: "megaphone", color: P[0], label: "Ser el centro" }, { icon: "star", color: P[1], label: "Dramatiza todo" }, { icon: "sparkles", color: P[2], label: "Seduce por atención" }],
    causa: ["eye", "Atención solo al exagerar"], ejemplo: { title: "En la cena…", img: "ej_histrionico.jpg" }, meme: ["megaphone", "¡miradme todos!"], consejo: ["scale", "Atención cuando está calmado"] },
  { Face: Narcisista, color: "#ffd54f", group: "GRUPO B", name: "NARCISISTA", main: "crown", def: "Se cree superior y especial",
    fuera: ["crown", "Seguridad aplastante"], dentro: ["heart-crack", "Autoestima frágil"],
    senales: [{ icon: "crown", color: P[0], label: "Se cree superior" }, { icon: "star", color: P[1], label: "Ansía admiración" }, { icon: "heart-off", color: P[2], label: "Cero empatía" }],
    causa: ["dna", "Sobrevaloración o frialdad"], ejemplo: { title: "Una crítica pequeña…", icon: "angry" }, meme: ["angry", "«¿una crítica? ¿a MÍ?»"], consejo: ["shield-alert", "No alimentes su ego"] },
  { Face: Evitativo, color: "#4db6ac", group: "GRUPO C", name: "EVITATIVO", main: "door-closed", def: "Quiere conectar, pero teme",
    fuera: ["lock", "Tímido y distante"], dentro: ["heart-crack", "Anhela pertenecer"],
    senales: [{ icon: "door-closed", color: P[0], label: "Evita el contacto" }, { icon: "arrow-down", color: P[1], label: "Se siente inferior" }, { icon: "shield-alert", color: P[2], label: "Teme la crítica" }],
    causa: ["dna", "Rechazo o crítica temprana"], ejemplo: { title: "La fiesta…", icon: "frown" }, meme: ["frown", "«mejor invento una excusa»"], consejo: ["footprints", "Pasos pequeños, sin presión"] },
  { Face: Dependiente, color: "#7986cb", group: "GRUPO C", name: "DEPENDIENTE", main: "users", def: "«No puedo solo»",
    fuera: ["smile", "Amable y complaciente"], dentro: ["circle-help", "Miedo a valerse solo"],
    senales: [{ icon: "circle-help", color: P[0], label: "No decide solo" }, { icon: "users", color: P[1], label: "Necesita apoyo" }, { icon: "user", color: P[2], label: "Teme la soledad" }],
    causa: ["baby", "Crianza sobreprotectora"], ejemplo: { title: "Para cenar…", img: "ej_dependiente.jpg" }, meme: ["circle-help", "«¿tú qué harías?» ×3"], consejo: ["graduation-cap", "Anímale a decidir"] },
  { Face: Obsesivo, color: "#4dd0e1", group: "GRUPO C", name: "OBSESIVO", main: "ruler", def: "Orden y control perfectos",
    fuera: ["briefcase", "El trabajador ideal"], dentro: ["lock", "Atrapado por sus reglas"],
    senales: [{ icon: "ruler", color: P[0], label: "Perfeccionismo" }, { icon: "list-checks", color: P[1], label: "Controla todo" }, { icon: "briefcase", color: P[2], label: "Adicto al trabajo" }],
    causa: ["trophy", "Solo se valoraba el logro"], ejemplo: { title: "El informe…", img: "ej_obsesivo.jpg" }, meme: ["ruler", "3 días ajustando márgenes"], consejo: ["circle-check", "«Hecho» gana a «perfecto»"] },
];

const useBeat = (frame: number, frames: number, n: number) => { const len = frames / n; const i = Math.min(n - 1, Math.floor(frame / len)); return { i, ml: frame - i * len, len }; };

/* ---------- INTRO ---------- */
export const Intro: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const { i, ml, len } = useBeat(frame, frames, 4);
  const pop = sp(ml, fps, 12, 150);
  return (
    <AbsoluteFill style={{ transform: cam(ml, len), ...enterFX(ml), alignItems: "center", justifyContent: "center" }}>
      <Audio src={staticFile("voz1deep/v00.mp3")} />
      <div style={{ position: "absolute", top: 28, width: "100%", textAlign: "center", fontFamily: HAND, fontSize: 26, color: "#cfcfcf" }}>Contenido divulgativo · no sustituye un diagnóstico profesional</div>
      {i === 0 && <div style={{ textAlign: "center", fontFamily: HEAVY, transform: `scale(${pop})` }}><div style={{ fontSize: 92, fontWeight: 900 }}>¿Conoces a</div><div style={{ fontSize: 130, fontWeight: 900, color: RED }}>ALGUIEN ASÍ?</div></div>}
      {i === 1 && <div style={{ textAlign: "center", fontFamily: HEAVY, transform: `scale(${pop})` }}><div style={{ fontSize: 200, fontWeight: 900, color: RED }}>10</div><div style={{ fontSize: 78, fontWeight: 900 }}>TRASTORNOS DE LA</div><div style={{ fontSize: 78, fontWeight: 900 }}>PERSONALIDAD</div></div>}
      {i >= 2 && <div style={{ display: "flex", flexWrap: "wrap", width: 1300, justifyContent: "center", gap: 26 }}>{DATA.map((d, k) => <div key={k} style={{ transform: `scale(${sp(ml - k * 4, fps, 12)}) ${bob(frame + k)}` }}><Chip name={d.main} color={d.color} size={150} /></div>)}</div>}
    </AbsoluteFill>
  );
};
/* ---------- GRUPOS ---------- */
export const Grupos: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const { i, ml, len } = useBeat(frame, frames, 3);
  const pop = sp(ml, fps, 12, 150);
  const G = [{ t: "GRUPO A", d: "Raros / excéntricos", idx: [0, 1, 2] }, { t: "GRUPO B", d: "Dramáticos / emocionales", idx: [3, 4, 5, 6] }, { t: "GRUPO C", d: "Ansiosos / temerosos", idx: [7, 8, 9] }][i];
  return (
    <AbsoluteFill style={{ transform: cam(ml, len), ...enterFX(ml), alignItems: "center", justifyContent: "center" }}>
      <Audio src={staticFile("voz1deep/v01.mp3")} />
      <div style={{ position: "absolute", top: 100, textAlign: "center", transform: `scale(${pop})` }}><div style={{ fontFamily: HEAVY, fontSize: 100, fontWeight: 900, color: RED }}>{G.t}</div><div style={{ fontFamily: HAND, fontSize: 46, color: "#555" }}>{G.d}</div></div>
      <div style={{ display: "flex", gap: 50, marginTop: 140 }}>{G.idx.map((k, j) => <div key={k} style={{ textAlign: "center", transform: `scale(${sp(ml - 10 - j * 7, fps, 12)}) ${bob(frame + k)}` }}><Chip name={DATA[k].main} color={DATA[k].color} size={210} /><div style={{ fontFamily: HAND, fontSize: 34, marginTop: 12 }}>{DATA[k].name}</div></div>)}</div>
    </AbsoluteFill>
  );
};
/* ---------- BLOQUE TRASTORNO (12 beats) ---------- */
const Block: React.FC<{ d: DD; audio: string; n: number; frames: number }> = ({ d, audio, n, frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const NB = 17; const len = frames / NB; const i = Math.min(NB - 1, Math.floor(frame / len)); const ml = frame - i * len;
  const dirs = [0, 2, 1, 2, 0, 3, 4, 3, 1, 2, 1, 2, 0, 3, 0, 2, 1];
  const mo = beatMotion(ml, len, dirs[i]);
  const Header = (<>
    <div style={{ position: "absolute", top: 46, right: 70, fontFamily: HEAVY, fontSize: 58, fontWeight: 900, color: "#dcdcdc", zIndex: 8 }}>{n}<span style={{ fontSize: 32 }}>/10</span></div>
    <div style={{ position: "absolute", top: 60, left: 80, fontFamily: HEAVY, fontSize: 30, fontWeight: 900, color: d.color, zIndex: 8 }}>{d.group}</div>
  </>);
  const chip = (name: string, color: string, size: number) => <div style={{ transform: bob(frame, 2), display: "inline-block" }}><Chip name={name} color={color} size={size} /></div>;
  const contraste = (title: string, icon: string, text: string, accent: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 70 }}>{chip(icon, d.color, 340)}<div><div style={{ fontFamily: HEAVY, fontSize: 70, fontWeight: 900, color: accent }}>{title}</div><div style={{ fontFamily: HAND, fontSize: 92, marginTop: 12, maxWidth: 1000 }}>{text}</div></div></div>
  );
  const single = (s: Sig) => <div style={{ textAlign: "center" }}><div>{chip(s.icon, s.color, 360)}</div><div style={{ fontFamily: HAND, fontSize: 72, marginTop: 30 }}>{s.label}</div></div>;
  const bigTitle = (t: string, c: string, sz = 110) => <div style={{ fontFamily: HEAVY, fontSize: sz, fontWeight: 900, color: c, textAlign: "center" }}>{t}</div>;
  const content = () => {
    switch (i) {
      case 0: return <div style={{ textAlign: "center" }}><div>{chip(d.main, d.color, 470)}</div><div style={{ fontFamily: HEAVY, fontSize: 116, fontWeight: 900, marginTop: 24 }}>TRASTORNO <span style={{ color: RED }}>{d.name}</span></div></div>;
      case 1: return <div style={{ display: "flex", alignItems: "center", gap: 50 }}>{chip(d.main, d.color, 320)}<Chevrons f={frame} c={RED} /><div style={{ fontFamily: HEAVY, fontSize: 88, fontWeight: 900, color: RED, maxWidth: 1000 }}>{d.def}</div></div>;
      case 2: return contraste("POR FUERA", d.fuera[0], d.fuera[1], "#141414");
      case 3: return contraste("POR DENTRO", d.dentro[0], d.dentro[1], RED);
      case 4: return <div style={{ textAlign: "center" }}><div style={{ marginBottom: 26 }}>{chip(d.senales[0].icon, d.senales[0].color, 240)}</div>{bigTitle("SEÑALES", RED, 124)}</div>;
      case 5: return single(d.senales[0]);
      case 6: return single(d.senales[1]);
      case 7: return single(d.senales[2]);
      case 8: return <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>{d.senales.map((s, k) => <div key={k} style={{ width: 500, textAlign: "center" }}><div>{chip(s.icon, s.color, 240)}</div><div style={{ fontFamily: HAND, fontSize: 48, marginTop: 18 }}>{s.label}</div></div>)}</div>;
      case 9: return bigTitle("¿POR QUÉ APARECE?", "#bbb", 76);
      case 10: return <div style={{ display: "flex", alignItems: "center", gap: 55 }}>{chip(d.causa[0], d.color, 300)}<div style={{ fontFamily: HAND, fontSize: 88, maxWidth: 1000 }}>{d.causa[1]}</div></div>;
      case 11: return <div style={{ display: "flex", alignItems: "center", gap: 34 }}><div style={{ transform: bob(frame, 2), transformOrigin: "bottom center", flexShrink: 0 }}><Stick head={<d.Face />} pose="pointR" /></div><Chevrons f={frame} c={d.color} /><WindowClip accent={d.color} w={900} title={d.ejemplo.title} img={d.ejemplo.img} icon={d.ejemplo.icon} /></div>;
      case 12: return <div style={{ textAlign: "center" }}><WindowClip accent={d.color} w={1240} title={d.ejemplo.title} img={d.ejemplo.img} icon={d.ejemplo.icon} /></div>;
      case 13: return <div style={{ textAlign: "center" }}><div>{chip(d.meme[0], d.color, 300)}</div><div style={{ fontFamily: HAND, fontSize: 90, marginTop: 30 }}>{d.meme[1]}</div></div>;
      case 14: return bigTitle("CÓMO ACTUAR", RED, 116);
      case 15: return <div style={{ width: 1400, background: "#fff", border: `8px solid ${RED}`, borderRadius: 40, padding: "50px 60px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}><div style={{ fontFamily: HEAVY, fontSize: 50, fontWeight: 900, color: RED, marginBottom: 24 }}>CÓMO ACTUAR</div><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 36 }}><Chip name={d.consejo[0]} color={d.color} size={170} /><div style={{ fontFamily: HAND, fontSize: 76, maxWidth: 900, textAlign: "left" }}>{d.consejo[1]}</div></div></div>;
      default: return <div style={{ fontFamily: HEAVY, fontSize: 120, fontWeight: 900 }}>Siguiente <span style={{ color: RED }}>▶</span></div>;
    }
  };
  return (
    <AbsoluteFill style={{ transform: cam(ml, len) }}>
      <Audio src={staticFile(`voz1deep/${audio}.mp3`)} />
      {Header}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={mo}>{content()}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
/* ---------- CIERRE ---------- */
export const Cierre: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const { i, ml, len } = useBeat(frame, frames, 3);
  const pop = sp(ml, fps, 12, 150);
  return (
    <AbsoluteFill style={{ transform: cam(ml, len), ...enterFX(ml), alignItems: "center", justifyContent: "center" }}>
      <Audio src={staticFile("voz1deep/v12.mp3")} />
      {i < 2 && <><div style={{ fontFamily: HEAVY, fontSize: 100, fontWeight: 900, transform: `scale(${pop})` }}>Y ESTOS SON <span style={{ color: RED }}>LOS 10</span></div>
        <div style={{ position: "absolute", bottom: 110, display: "flex", flexWrap: "wrap", width: 1300, justifyContent: "center", gap: 22 }}>{DATA.map((d, k) => <div key={k} style={{ transform: `scale(${sp(ml - 8 - k * 3, fps, 12)}) ${bob(frame + k)}` }}><Chip name={d.main} color={d.color} size={140} /></div>)}</div></>}
      {i === 2 && <div style={{ textAlign: "center", transform: `scale(${pop})` }}><div style={{ fontFamily: HEAVY, fontSize: 100, fontWeight: 900 }}>¿Reconociste a <span style={{ color: RED }}>alguien</span>?</div><div style={{ fontFamily: HAND, fontSize: 66, marginTop: 24 }}>Suscríbete a <b>Cápsula Curiosa</b> ▶</div></div>}
    </AbsoluteFill>
  );
};

export const timelineReal = (() => { let acc = 0; return (manifest as { id: string; label: string; frames: number }[]).map((m) => { const from = acc; const dur = m.frames + PAD; acc += dur; return { ...m, from, dur }; }); })();
export const TOTAL_REAL = timelineReal.reduce((a, s) => Math.max(a, s.from + s.dur), 0);

export const TrastornosReal: React.FC = () => {
  let n = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfbfa" }}>
      <div style={{ position: "absolute", top: 22, right: 34, width: 84, height: 84, zIndex: 6 }}><Img src={ICON("brain")} style={{ width: "100%", height: "100%" }} /></div>
      <div style={{ position: "absolute", top: 26, left: 34, fontFamily: HAND, fontSize: 30, color: "#cfcfcf", zIndex: 5 }}>@CapsulaCuriosa</div>
      {timelineReal.map((s) => {
        let c: React.ReactNode;
        if (s.label === "intro") c = <Intro frames={s.frames} />;
        else if (s.label === "grupos") c = <Grupos frames={s.frames} />;
        else if (s.label === "cierre") c = <Cierre frames={s.frames} />;
        else { const d = DATA[n]; n += 1; c = <Block d={d} audio={s.id} n={n} frames={s.frames} />; }
        return <Sequence key={s.id} from={s.from} durationInFrames={s.dur}>{c}</Sequence>;
      })}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: "100%", background: "#eee", zIndex: 9 }}><Bar /></div>
    </AbsoluteFill>
  );
};
const Bar: React.FC = () => { const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); return <div style={{ height: "100%", width: `${(frame / durationInFrames) * 100}%`, background: RED }} />; };

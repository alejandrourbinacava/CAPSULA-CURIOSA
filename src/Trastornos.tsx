import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { IconCircle } from "./components/parts";
import {
  Paranoide, Esquizoide, Esquizotipico, Antisocial, Limite,
  Histrionico, Narcisista, Evitativo, Dependiente, Obsesivo,
} from "./components/faces";
import manifest from "../public/voz1/manifest.json";

export const PAD = 8;
const HAND = "'Comic Sans MS', 'Segoe Print', cursive";
const HEAVY = "'Arial Black', Impact, system-ui, sans-serif";

type Info = { Face: React.FC; color: string; hook: string; cluster: string };
const D: Record<string, Info> = {
  "Paranoide":    { Face: Paranoide,    color: "#e57373", hook: "Desconfía de todos",           cluster: "Grupo A · raros / excéntricos" },
  "Esquizoide":   { Face: Esquizoide,   color: "#90a4ae", hook: "Prefiere la soledad",          cluster: "Grupo A · raros / excéntricos" },
  "Esquizotípico":{ Face: Esquizotipico,color: "#ba68c8", hook: "Creencias mágicas y rarezas",  cluster: "Grupo A · raros / excéntricos" },
  "Antisocial":   { Face: Antisocial,   color: "#607d8b", hook: "Sin culpa ni límites",         cluster: "Grupo B · dramáticos / emocionales" },
  "Límite":       { Face: Limite,       color: "#f06292", hook: "Del amor al odio en minutos",  cluster: "Grupo B · dramáticos / emocionales" },
  "Histriónico":  { Face: Histrionico,  color: "#ffb300", hook: "Necesita ser el centro",       cluster: "Grupo B · dramáticos / emocionales" },
  "Narcisista":   { Face: Narcisista,   color: "#ffd54f", hook: "Se cree superior a todos",     cluster: "Grupo B · dramáticos / emocionales" },
  "Evitativo":    { Face: Evitativo,    color: "#4db6ac", hook: "Quiere, pero teme el rechazo", cluster: "Grupo C · ansiosos / temerosos" },
  "Dependiente":  { Face: Dependiente,  color: "#7986cb", hook: "No soporta estar solo",        cluster: "Grupo C · ansiosos / temerosos" },
  "Obsesivo":     { Face: Obsesivo,     color: "#4dd0e1", hook: "Orden y control perfectos",    cluster: "Grupo C · ansiosos / temerosos" },
};
const ALL_FACES = [Paranoide, Esquizoide, Esquizotipico, Antisocial, Limite, Histrionico, Narcisista, Evitativo, Dependiente, Obsesivo];
const ALL_COLORS = ["#e57373","#90a4ae","#ba68c8","#607d8b","#f06292","#ffb300","#ffd54f","#4db6ac","#7986cb","#4dd0e1"];

const bob = (f: number, a = 2, s = 11) => `rotate(${Math.sin(f / s) * a}deg)`;
const floatY = (f: number, a = 10, s = 12) => `translateY(${Math.sin(f / s) * a}px)`;

/* ---------- INTRO ---------- */
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 13 } });
  const sub = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Audio src={staticFile("voz1/v01.mp3")} />
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: HEAVY, transform: `scale(${t})` }}>
        <div style={{ fontSize: 150, fontWeight: 900, color: "#141414", lineHeight: 1 }}>LOS <span style={{ color: "#e2231a" }}>10</span></div>
        <div style={{ fontSize: 92, fontWeight: 900, color: "#141414" }}>TRASTORNOS DE LA</div>
        <div style={{ fontSize: 92, fontWeight: 900, color: "#e2231a" }}>PERSONALIDAD</div>
      </div>
      <div style={{ position: "absolute", bottom: 120, width: "100%", display: "flex", justifyContent: "center", gap: 24, opacity: sub }}>
        {ALL_FACES.slice(0, 5).map((F, i) => (
          <div key={i} style={{ transform: `${floatY(frame + i * 8)}` }}><IconCircle color={ALL_COLORS[i]} size={130}><F /></IconCircle></div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- ESCENA DE TRASTORNO ---------- */
const Disorder: React.FC<{ label: string; audio: string; n: number }> = ({ label, audio, n }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const info = D[label];
  const inFace = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const inName = spring({ frame: frame - 8, fps, config: { damping: 14 } });
  const inHook = spring({ frame: frame - 18, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`voz1/${audio}.mp3`)} />
      {/* contador */}
      <div style={{ position: "absolute", top: 50, right: 70, fontFamily: HEAVY, fontSize: 60, fontWeight: 900, color: "#d9d9d9" }}>{n}<span style={{ fontSize: 34 }}>/10</span></div>
      {/* grupo/cluster */}
      <div style={{ position: "absolute", top: 70, left: 80, fontFamily: HAND, fontSize: 34, color: "#9a9a9a" }}>{info.cluster}</div>
      {/* cara grande */}
      <div style={{ position: "absolute", left: 150, top: 300, transform: `scale(${inFace}) ${bob(frame)}`, transformOrigin: "center" }}>
        <IconCircle color={info.color} size={470}><info.Face /></IconCircle>
      </div>
      {/* nombre + hook */}
      <div style={{ position: "absolute", left: 720, top: 380, width: 1120 }}>
        <div style={{ fontFamily: HEAVY, fontSize: 110, fontWeight: 900, color: "#141414", opacity: inName, transform: `translateX(${(1 - inName) * 60}px)` }}>{label}</div>
        <div style={{ fontFamily: HAND, fontSize: 60, color: "#e2231a", marginTop: 10, opacity: inHook, transform: `translateX(${(1 - inHook) * 60}px)` }}>{info.hook}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- OUTRO ---------- */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 13 } });
  const sub = spring({ frame: frame - 18, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Audio src={staticFile("voz1/v12.mp3")} />
      <div style={{ position: "absolute", top: 90, display: "flex", flexWrap: "wrap", width: 1000, justifyContent: "center", gap: 18, opacity: sub }}>
        {ALL_FACES.map((F, i) => (<div key={i} style={{ transform: floatY(frame + i * 6) }}><IconCircle color={ALL_COLORS[i]} size={120}><F /></IconCircle></div>))}
      </div>
      <div style={{ textAlign: "center", fontFamily: HEAVY, transform: `scale(${t})`, marginTop: 120 }}>
        <div style={{ fontSize: 96, fontWeight: 900, color: "#141414" }}>¿Reconociste a <span style={{ color: "#e2231a" }}>alguien</span>?</div>
        <div style={{ fontSize: 64, fontFamily: HAND, color: "#141414", marginTop: 20 }}>Suscríbete a <b>Cápsula Curiosa</b> ▶</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- barra de progreso ---------- */
const Bar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: "#e2231a", zIndex: 10 }} />;
};

export const timeline = (() => {
  let acc = 0;
  return (manifest as { id: string; label: string; frames: number }[]).map((m) => {
    const from = acc; const dur = m.frames + PAD; acc += dur; return { ...m, from, dur };
  });
})();
export const TOTAL = timeline.reduce((a, s) => Math.max(a, s.from + s.dur), 0);

export const Trastornos: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <div style={{ position: "absolute", top: 26, left: 34, fontFamily: HAND, fontSize: 30, color: "#cfcfcf", zIndex: 5 }}>@CapsulaCuriosa</div>
      {timeline.map((s, i) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.dur}>
          {i === 0 ? <Intro /> : s.label === "cierre" ? <Outro /> : <Disorder label={s.label} audio={s.id} n={i} />}
        </Sequence>
      ))}
      <Bar />
    </AbsoluteFill>
  );
};

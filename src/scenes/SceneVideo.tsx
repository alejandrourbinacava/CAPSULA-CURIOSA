import React from "react";
import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig, staticFile, spring } from "remotion";

// ---- FUENTE MANUSCRITA (spec §2). Fallbacks locales si no hay Google Fonts.
const HAND = "'Patrick Hand','Caveat','Comic Sans MS','Segoe Print',cursive";
const RED = "#E5342A";

// ---- SLOTS deterministas (spec §6). Centro (cx,cy) y caja (w,h) en 1920x1080.
type Box = { cx: number; cy: number; w: number; h: number };
const SLOTS: Record<string, Box> = {
  center: { cx: 960, cy: 500, w: 820, h: 560 },
  left: { cx: 520, cy: 500, w: 720, h: 560 },
  right: { cx: 1400, cy: 500, w: 720, h: 560 },
  top: { cx: 960, cy: 240, w: 1400, h: 320 },
  bottom: { cx: 960, cy: 830, w: 1400, h: 320 },
  "top-left": { cx: 520, cy: 300, w: 720, h: 420 },
  "top-right": { cx: 1400, cy: 300, w: 720, h: 420 },
  "bottom-left": { cx: 520, cy: 760, w: 720, h: 420 },
  "bottom-right": { cx: 1400, cy: 760, w: 720, h: 420 },
  "center-below": { cx: 960, cy: 860, w: 1000, h: 200 },
  "left-below": { cx: 520, cy: 850, w: 720, h: 180 },
  "right-below": { cx: 1400, cy: 850, w: 720, h: 180 },
  "corner-badge": { cx: 190, cy: 110, w: 280, h: 150 },
};
for (let i = 1; i <= 8; i++) { const col = (i - 1) % 4, row = Math.floor((i - 1) / 4); SLOTS["grid-" + i] = { cx: 360 + col * 400, cy: 380 + row * 360, w: 340, h: 300 }; }
const slotOf = (name?: string): Box => SLOTS[name || "center"] || SLOTS.center;

// ---- tipos del contrato scenes.json (spec §7)
type Anim = { kind: string; duration?: number };
type El = {
  id: string; type: "image" | "text" | "arrow" | "stickman";
  src?: string; content?: string; slot?: string; color?: string; size?: "sm" | "md" | "lg";
  from?: string; to?: string; style?: string; pose?: string; head?: string;
  in: number; out: number; enter?: Anim; exit?: Anim;
};
type Scenes = { meta: { fps: number; width: number; height: number; duration: number; audio?: string }; elements: El[] };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const TEXT_SIZE = { sm: 46, md: 70, lg: 104 } as const;

// ---- flecha dibujada a mano entre dos slots (spec: draw con stroke-dashoffset)
const ArrowEl: React.FC<{ el: El; p: number; red: boolean }> = ({ el, p, red }) => {
  const a = slotOf(el.from), b = slotOf(el.to);
  const x1 = a.cx, y1 = a.cy, x2 = b.cx, y2 = b.cy;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 90; // curva hacia arriba
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  const L = Math.hypot(x2 - x1, y2 - y1) * 1.5 + 200;
  const col = red ? RED : "#111";
  const ang = Math.atan2(y2 - my, x2 - mx);
  const ah = 34;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={col} strokeWidth={11} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
      {p > 0.9 && <g stroke={col} strokeWidth={11} strokeLinecap="round" fill="none">
        <line x1={x2} y1={y2} x2={x2 - ah * Math.cos(ang - 0.5)} y2={y2 - ah * Math.sin(ang - 0.5)} />
        <line x1={x2} y1={y2} x2={x2 - ah * Math.cos(ang + 0.5)} y2={y2 - ah * Math.sin(ang + 0.5)} />
      </g>}
    </svg>
  );
};

// ---- monigote de palo (spec: negro, línea fina, poses; cabeza sustituible por asset)
const Stickman: React.FC<{ pose?: string; head?: string; size: number }> = ({ pose = "neutral", head, size }) => {
  const arms: Record<string, string> = {
    neutral: "M100,120 L60,155 M100,120 L140,155",
    "pointing-right": "M100,130 L170,150 L184,146 M100,132 L68,172",
    shrug: "M100,128 L64,110 M100,128 L136,110",
    thinking: "M100,130 q34,4 30,-26 M100,132 L66,170",
    angry: "M100,120 L62,100 M100,120 L138,100",
  };
  const s = size / 300;
  return (
    <svg width={200 * s} height={330 * s} viewBox="0 0 200 330" style={{ overflow: "visible" }}>
      {head ? <image href={staticFile(head)} x={54} y={4} width={92} height={92} preserveAspectRatio="xMidYMid meet" />
        : <g><circle cx={100} cy={50} r={44} fill="#fff" stroke="#111" strokeWidth={5} /><circle cx={88} cy={47} r={5.5} fill="#111" /><circle cx={112} cy={47} r={5.5} fill="#111" /><path d="M87,64 Q100,73 113,64" stroke="#111" strokeWidth={4} fill="none" strokeLinecap="round" /></g>}
      <path d="M100,95 L100,210" stroke="#111" strokeWidth={5} fill="none" />
      <path d={arms[pose] || arms.neutral} stroke="#111" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M100,210 L74,300 M100,210 L126,300" stroke="#111" strokeWidth={5} fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Element: React.FC<{ el: El }> = ({ el }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // segundos
  const enterDur = el.enter?.duration ?? 0.4;
  const exitDur = el.exit?.duration ?? 0.3;
  if (t < el.in - 0.01 || t > el.out + exitDur) return null;
  const inP = clamp01((t - el.in) / enterDur);       // progreso de entrada 0..1
  const outP = t > el.out ? clamp01((t - el.out) / exitDur) : 0; // progreso de salida 0..1
  const box = slotOf(el.slot);

  // animación de entrada
  const enter = el.enter?.kind || "pop";
  let opacity = 1, tx = 0, ty = 0, scale = 1, clip = "none";
  if (enter === "pop") { const sp = spring({ frame: (t - el.in) * fps, fps, config: { damping: 12, stiffness: 140 } }); scale = Math.max(0, sp); opacity = clamp01(inP * 2); }
  else if (enter === "fade-in") opacity = inP;
  else if (enter === "stamp") { scale = 1.4 - 0.4 * inP; opacity = clamp01(inP * 2); }
  else if (enter === "slide-in-left") { tx = -80 * (1 - inP); opacity = inP; }
  else if (enter === "slide-in-right") { tx = 80 * (1 - inP); opacity = inP; }
  else if (enter === "slide-in-top") { ty = -80 * (1 - inP); opacity = inP; }
  else if (enter === "slide-in-bottom") { ty = 80 * (1 - inP); opacity = inP; }
  else if (enter === "handwrite") clip = `inset(0 ${(1 - inP) * 100}% 0 0)`; // revela izq→der
  else opacity = inP;

  // animación de salida
  if (outP > 0) {
    const ex = el.exit?.kind || "fade-out";
    if (ex === "pop-out") scale *= (1 - outP);
    else if (ex.startsWith("slide-out")) { tx += (ex.includes("left") ? -1 : 1) * 80 * outP; }
    opacity *= (1 - outP);
  }

  if (el.type === "arrow") return <ArrowEl el={el} p={enter === "draw" ? inP : 1} red={/red/.test(el.style || "")} />;

  const common: React.CSSProperties = { position: "absolute", left: box.cx, top: box.cy, transform: `translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${scale})`, opacity, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: box.w, height: box.h };

  if (el.type === "text") {
    const fs = TEXT_SIZE[el.size || "md"];
    return <div style={{ ...common, clipPath: clip, WebkitClipPath: clip }}><div style={{ fontFamily: HAND, fontWeight: 700, fontSize: fs, color: el.color || "#111", textAlign: "center", lineHeight: 1.1, maxWidth: box.w }}>{el.content}</div></div>;
  }
  if (el.type === "stickman") return <div style={common}><Stickman pose={el.pose} head={el.head} size={Math.min(box.h, 360)} /></div>;
  // image
  return <div style={common}><Img src={staticFile(el.src!)} style={{ maxWidth: box.w, maxHeight: box.h, objectFit: "contain" }} /></div>;
};

export const makeSceneVideo = (scenes: Scenes): React.FC => () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    {scenes.meta.audio && <Audio src={staticFile(scenes.meta.audio)} />}
    {scenes.elements.map((el) => <Element key={el.id} el={el} />)}
  </AbsoluteFill>
);
export type { Scenes };

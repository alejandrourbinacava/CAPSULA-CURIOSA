import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, useCurrentFrame, useVideoConfig, staticFile, spring } from "remotion";
import { Gif } from "@remotion/gif";
import { loadFont as loadPatrick } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { zOf } from "./templates.mjs";

// ---- FUENTE MANUSCRITA (spec §2). Se bundlea con la render (funciona headless en CI).
const { fontFamily: PATRICK } = loadPatrick("normal", { weights: ["400"] });
const { fontFamily: CAVEAT } = loadCaveat("normal", { weights: ["700"] });
const HAND = `${PATRICK}, 'Comic Sans MS','Segoe Print',cursive`;      // cuerpo manuscrito
const HAND_BOLD = `${CAVEAT}, ${PATRICK}, cursive`;                      // titulares/énfasis
const RED = "#E5342A";

type Box = { cx: number; cy: number; w: number; h: number };
type Anim = { kind: string; duration?: number };
type Pt = { x: number; y: number };
type El = {
  id: string;
  type: "image" | "text" | "arrow" | "stickman" | "clip" | "gif" | "shape" | "stat";
  src?: string; content?: string; unit?: string; color?: string; size?: "sm" | "md" | "lg" | "xl";
  box?: Box; frame?: string; pose?: string; head?: string;
  a?: Pt; b?: Pt; curve?: "up" | "down" | "none";           // arrow
  kind?: string;                                              // shape
  z?: number; in: number; out: number; enter?: Anim; exit?: Anim;
};
type Scenes = { meta: { fps: number; width: number; height: number; duration: number; audio?: string }; elements: El[] };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const TEXT_SIZE = { sm: 44, md: 68, lg: 100, xl: 128 } as const;
const HALO = "0 0 8px #fff, 0 0 8px #fff, 0 0 14px #fff, 2px 2px 0 #fff";

// ============================ FLECHA (curva a mano) ============================
const ArrowEl: React.FC<{ el: El; p: number }> = ({ el, p }) => {
  const a = el.a || { x: 400, y: 500 }, b2 = el.b || { x: 1500, y: 500 };
  const lift = el.curve === "down" ? 120 : el.curve === "none" ? 0 : -120;
  const mx = (a.x + b2.x) / 2, my = (a.y + b2.y) / 2 + lift;
  const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b2.x} ${b2.y}`;
  const L = Math.hypot(b2.x - a.x, b2.y - a.y) * 1.6 + 240;
  const col = el.color || RED;
  const ang = Math.atan2(b2.y - my, b2.x - mx), ah = 36;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={col} strokeWidth={11} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
      {p > 0.85 && <g stroke={col} strokeWidth={11} strokeLinecap="round" fill="none">
        <line x1={b2.x} y1={b2.y} x2={b2.x - ah * Math.cos(ang - 0.5)} y2={b2.y - ah * Math.sin(ang - 0.5)} />
        <line x1={b2.x} y1={b2.y} x2={b2.x - ah * Math.cos(ang + 0.5)} y2={b2.y - ah * Math.sin(ang + 0.5)} />
      </g>}
    </svg>
  );
};

// ============================ SHAPE (marcas dibujadas) ============================
// círculos rojos, subrayados, llaves, tachones, checks... dibujados con stroke-dashoffset.
const ShapeEl: React.FC<{ el: El; p: number }> = ({ el, p }) => {
  const box = el.box || { cx: 960, cy: 500, w: 400, h: 300 };
  const col = el.color || RED;
  const { cx, cy, w, h } = box;
  const L = (el as any)._len || 3000;
  const common = { fill: "none", stroke: col, strokeWidth: 12, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeDasharray: L, strokeDashoffset: L * (1 - p) };
  let d = "";
  const rx = w / 2 + 26, ry = h / 2 + 22;
  switch (el.kind) {
    case "underline": d = `M ${cx - w / 2} ${cy + h / 2 + 18} q ${w / 4} 26 ${w / 2} 4 q ${w / 4} -22 ${w / 2} 8`; break;
    case "box": d = `M ${cx - rx} ${cy - ry} L ${cx + rx} ${cy - ry} L ${cx + rx} ${cy + ry} L ${cx - rx} ${cy + ry} Z`; break;
    case "cross-out": d = `M ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy + h / 2} M ${cx + w / 2} ${cy - h / 2} L ${cx - w / 2} ${cy + h / 2}`; break;
    case "checkmark": d = `M ${cx - 60} ${cy} l 42 52 l 90 -120`; break;
    case "bracket": d = `M ${cx - rx + 20} ${cy - ry} q -28 0 -28 40 L ${cx - rx - 8} ${cy + ry - 40} q 0 40 28 40 M ${cx + rx - 20} ${cy - ry} q 28 0 28 40 L ${cx + rx + 8} ${cy + ry - 40} q 0 40 -28 40`; break;
    case "magnifier": { const gx = cx + w / 2 - 20, gy = cy - h / 2 + 20, r = 90; d = `M ${gx} ${gy} m ${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 M ${gx + r * 0.7} ${gy + r * 0.7} l 60 60`; break; }
    default: // circle-highlight: elipse a mano (dos pasadas)
      d = `M ${cx + rx} ${cy} a ${rx} ${ry} 0 1 1 ${-2 * rx} 6 a ${rx} ${ry} 0 1 1 ${2 * rx} -14`; break;
  }
  return <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}><path d={d} {...common} /></svg>;
};

// ============================ MONIGOTE ============================
const Stickman: React.FC<{ pose?: string; head?: string; size: number }> = ({ pose = "neutral", head, size }) => {
  const arms: Record<string, string> = {
    neutral: "M100,120 L60,155 M100,120 L140,155",
    "pointing-right": "M100,130 L170,150 L184,146 M100,132 L68,172",
    "pointing-left": "M100,130 L30,150 L16,146 M100,132 L132,172",
    shrug: "M100,128 L64,110 M100,128 L136,110",
    thinking: "M100,130 q34,4 30,-26 M100,132 L66,170",
    angry: "M100,120 L62,100 M100,120 L138,100",
    cheer: "M100,120 L64,74 M100,120 L136,74",
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

// ============================ MARCO (polaroid / tv / browser / phone) ============================
const Framed: React.FC<{ frame?: string; w: number; h: number; children: React.ReactNode }> = ({ frame, w, h, children }) => {
  if (frame === "none") return <>{children}</>;
  if (frame === "tv-crt")
    return <div style={{ padding: 22, background: "#1c1c1e", borderRadius: 40, border: "6px solid #111", boxShadow: "0 14px 40px rgba(0,0,0,.28)" }}><div style={{ borderRadius: 20, overflow: "hidden", display: "flex", background: "#000" }}>{children}</div></div>;
  if (frame === "browser")
    return <div style={{ background: "#fff", borderRadius: 16, border: "4px solid #111", boxShadow: "0 14px 40px rgba(0,0,0,.2)", overflow: "hidden" }}>
      <div style={{ height: 40, background: "#eee", borderBottom: "3px solid #111", display: "flex", alignItems: "center", gap: 10, padding: "0 16px" }}>
        <div style={{ width: 15, height: 15, borderRadius: 99, background: "#ff5f57" }} /><div style={{ width: 15, height: 15, borderRadius: 99, background: "#febc2e" }} /><div style={{ width: 15, height: 15, borderRadius: 99, background: "#28c840" }} />
      </div><div style={{ display: "flex" }}>{children}</div></div>;
  if (frame === "phone")
    return <div style={{ padding: "26px 14px", background: "#111", borderRadius: 46, boxShadow: "0 14px 40px rgba(0,0,0,.3)" }}><div style={{ borderRadius: 26, overflow: "hidden", display: "flex", background: "#000" }}>{children}</div></div>;
  // polaroid / card (por defecto para fotos)
  return <div style={{ padding: 10, background: "#fff", borderRadius: 18, border: "5px solid #111", boxShadow: "0 12px 34px rgba(0,0,0,.18)", display: "flex" }}>{children}</div>;
};

// ============================ ELEMENTO ============================
const Element: React.FC<{ el: El }> = ({ el }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enterDur = el.enter?.duration ?? 0.4;
  const exitDur = el.exit?.duration ?? 0.3;
  if (t < el.in - 0.01 || t > el.out + exitDur) return null;
  const inP = clamp01((t - el.in) / enterDur);
  const outP = t > el.out ? clamp01((t - el.out) / exitDur) : 0;
  const box = el.box || { cx: 960, cy: 500, w: 820, h: 560 };
  const z = el.z ?? zOf(el);

  // dibujos progresivos (flecha/shape) usan solo el progreso de entrada
  if (el.type === "arrow") return <div style={{ position: "absolute", inset: 0, zIndex: z }}><ArrowEl el={el} p={inP} /></div>;
  if (el.type === "shape") return <div style={{ position: "absolute", inset: 0, zIndex: z, opacity: 1 - outP }}><ShapeEl el={el} p={inP} /></div>;

  // animación de entrada
  const enter = el.enter?.kind || "pop";
  let opacity = 1, tx = 0, ty = 0, scale = 1, clip = "none";
  if (enter === "pop") { const sp = spring({ frame: (t - el.in) * fps, fps, config: { damping: 12, stiffness: 140 } }); scale = Math.max(0, sp); opacity = clamp01(inP * 2); }
  else if (enter === "fade-in") opacity = inP;
  else if (enter === "stamp") { scale = 1.4 - 0.4 * inP; opacity = clamp01(inP * 2); }
  else if (enter === "slide-in-left") { tx = -90 * (1 - inP); opacity = inP; }
  else if (enter === "slide-in-right") { tx = 90 * (1 - inP); opacity = inP; }
  else if (enter === "slide-in-top") { ty = -90 * (1 - inP); opacity = inP; }
  else if (enter === "slide-in-bottom") { ty = 90 * (1 - inP); opacity = inP; }
  else if (enter === "handwrite") clip = `inset(0 ${(1 - inP) * 100}% 0 0)`;
  else opacity = inP;

  if (outP > 0) {
    const ex = el.exit?.kind || "fade-out";
    if (ex === "pop-out") scale *= (1 - outP);
    else if (ex.startsWith("slide-out")) tx += (ex.includes("left") ? -1 : 1) * 90 * outP;
    opacity *= (1 - outP);
  }

  const common: React.CSSProperties = { position: "absolute", left: box.cx, top: box.cy, zIndex: z, transform: `translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${scale})`, opacity, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: box.w, height: box.h };

  if (el.type === "text") {
    const fsz = TEXT_SIZE[el.size || "md"];
    const emph = el.size === "lg" || el.size === "xl" || el.color === RED;
    return <div style={{ ...common, clipPath: clip, WebkitClipPath: clip }}><div style={{ fontFamily: emph ? HAND_BOLD : HAND, fontWeight: 700, fontSize: fsz, color: el.color || "#111", textAlign: "center", lineHeight: 1.1, maxWidth: box.w, textShadow: HALO }}>{el.content}</div></div>;
  }
  if (el.type === "stat") {
    return <div style={common}>
      <div style={{ fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 210, color: el.color || RED, lineHeight: 1, textShadow: HALO }}>{el.content}</div>
      {el.unit && <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 64, color: "#111", marginTop: 6, textShadow: HALO }}>{el.unit}</div>}
    </div>;
  }
  if (el.type === "stickman") return <div style={common}><Stickman pose={el.pose} head={el.head} size={Math.min(box.h, 420)} /></div>;

  if (el.type === "clip") {
    const inner = <OffthreadVideo src={staticFile(el.src!)} muted playbackRate={1} style={{ maxWidth: box.w - 24, maxHeight: box.h - 24, objectFit: "contain", display: "block" }} />;
    return <div style={common}><Framed frame={el.frame || "polaroid"} w={box.w} h={box.h}>{inner}</Framed></div>;
  }
  if (el.type === "gif") {
    const inner = <Gif src={staticFile(el.src!)} width={box.w - 24} height={box.h - 24} fit="contain" style={{ display: "block" }} />;
    return <div style={common}><Framed frame={el.frame || "none"} w={box.w} h={box.h}>{inner}</Framed></div>;
  }
  // image: SVG (icono) crudo; foto (jpg/png) enmarcada
  const isPhoto = !/\.svg(\?|$)/i.test(el.src || "");
  const img = <Img src={staticFile(el.src!)} style={{ maxWidth: box.w - (isPhoto ? 40 : 0), maxHeight: box.h - (isPhoto ? 40 : 0), objectFit: "contain", borderRadius: isPhoto ? 10 : 0, display: "block" }} />;
  return <div style={common}>{isPhoto ? <Framed frame={el.frame || "polaroid"} w={box.w} h={box.h}>{img}</Framed> : img}</div>;
};

export const makeSceneVideo = (scenes: Scenes): React.FC => () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    {scenes.meta.audio && <Audio src={staticFile(scenes.meta.audio)} />}
    {scenes.elements.map((el) => <Element key={el.id} el={el} />)}
  </AbsoluteFill>
);
export type { Scenes };

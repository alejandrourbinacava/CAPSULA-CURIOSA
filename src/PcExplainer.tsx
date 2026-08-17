import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import {
  IconCircle, Mobo, Cpu, Gpu, Ram, Ssd, Storage,
  Arrow, Stick, FaceConfused, FaceRage,
} from "./components/parts";

const HAND = "'Comic Sans MS', 'Segoe Print', cursive";

/* ---------- helpers de animación ---------- */
const usePop = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 140 } });
};
const bob = (frame: number, amp = 1.6, speed = 10) => `rotate(${Math.sin(frame / speed) * amp}deg)`;
const floatY = (frame: number, amp = 8, speed = 9) => `translateY(${Math.sin(frame / speed) * amp}px)`;

/* ---------- Caption ---------- */
const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const p = usePop(4);
  return (
    <div
      style={{
        position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center",
        fontFamily: HAND, fontSize: 62, color: "#141414", padding: "0 120px",
        opacity: p, transform: `translateY(${(1 - p) * 30}px)`,
      }}
    >
      {children}
    </div>
  );
};
const R: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: "#e2231a", fontWeight: "bold" }}>{children}</span>
);

/* ============================================================
   ESCENA 0 — grid de iconos coloridos
   ============================================================ */
const items = [
  { color: "#8bc34a", Icon: Mobo }, { color: "#d61fd6", Icon: Cpu },
  { color: "#19dede", Icon: Gpu }, { color: "#bdbdbd", Icon: Storage },
  { color: "#f5333a", Icon: Ram }, { color: "#ffd21f", Icon: Ssd },
  { color: "#ff8c1a", Icon: Gpu }, { color: "#ff9ec7", Icon: Mobo },
];
const labels = ["Motherboard", "CPU", "GPU", "Storage", "RAM", "SSD", "PSU", "Case"];

const Scene0: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Audio src={staticFile("voz/linea1t.mp3")} />
      {items.map((it, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const x = 250 + col * 400;
        const y = 180 + row * 380;
        const s = spring({ frame: frame - i * 6, fps, config: { damping: 11, stiffness: 150 } });
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "center" }}>
            <IconCircle color={it.color} size={220}><it.Icon /></IconCircle>
            <div style={{ textAlign: "center", fontFamily: HAND, fontSize: 34, marginTop: 6, opacity: s }}>{labels[i]}</div>
          </div>
        );
      })}
      <Caption>Tu PC tiene <R>8 piezas clave</R>.</Caption>
    </AbsoluteFill>
  );
};

/* ============================================================
   ESCENA 1 — muñeco placa señala GPU y CPU
   ============================================================ */
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inCenter = spring({ frame, fps, config: { damping: 13 } });
  const inL = spring({ frame: frame - 12, fps, config: { damping: 13 } });
  const inR = spring({ frame: frame - 12, fps, config: { damping: 13 } });
  const arrowP = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headOn = frame > 55;
  const hiOp = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Audio src={staticFile("voz/linea2t.mp3")} />
      {/* GPU izq */}
      <div style={{ position: "absolute", left: 120, top: 150, opacity: inL, transform: `translateX(${(1 - inL) * -150}px) ${floatY(frame)}` }}>
        <IconCircle color="#19dede" size={230}><Gpu /></IconCircle>
      </div>
      <div style={{ position: "absolute", left: 380, top: 180, fontFamily: HAND, fontSize: 64, fontWeight: "bold", opacity: hiOp }}>¡Hola!</div>
      {/* CPU der */}
      <div style={{ position: "absolute", right: 120, top: 150, opacity: inR, transform: `translateX(${(1 - inR) * 150}px) ${floatY(frame, 8, 11)}` }}>
        <IconCircle color="#d61fd6" size={230}><Cpu /></IconCircle>
      </div>
      <div style={{ position: "absolute", right: 380, top: 180, fontFamily: HAND, fontSize: 64, fontWeight: "bold", opacity: hiOp }}>¡Hola!</div>
      {/* Muñeco central */}
      <div style={{ position: "absolute", left: 810, top: 300, transform: `scale(${1.2 * inCenter}) ${bob(frame)}`, transformOrigin: "bottom center" }}>
        <Stick head={<Mobo />} pose="pointL2R" />
      </div>
      {/* flechas */}
      <div style={{ position: "absolute", left: 430, top: 430 }}>
        <Arrow d="M200,90 C120,70 80,55 30,40" head="M30,40 L52,44 M30,40 L44,60" progress={arrowP} headOn={headOn} width={420} />
      </div>
      <div style={{ position: "absolute", right: 430, top: 430 }}>
        <Arrow d="M20,90 C100,70 140,55 190,40" head="M190,40 L168,44 M190,40 L176,60" progress={arrowP} headOn={headOn} width={420} />
      </div>
      <Caption>La <R>placa madre</R> conecta la gráfica… y el procesador.</Caption>
    </AbsoluteFill>
  );
};

/* ============================================================
   ESCENA 2 — cuántos SSD
   ============================================================ */
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inC = spring({ frame, fps, config: { damping: 13 } });
  const in1 = spring({ frame: frame - 18, fps, config: { damping: 14 } });
  const in2 = spring({ frame: frame - 28, fps, config: { damping: 14 } });
  const aP = interpolate(frame, [34, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headOn = frame > 58;
  return (
    <AbsoluteFill>
      <Audio src={staticFile("voz/linea3t.mp3")} />
      <div style={{ position: "absolute", left: 140, top: 300, transform: `scale(${1.2 * inC}) ${bob(frame)}`, transformOrigin: "bottom center" }}>
        <Stick head={<Mobo />} pose="pointR" />
      </div>
      {/* 1 SSD */}
      <div style={{ position: "absolute", right: 150, top: 190, opacity: in1, transform: `translateX(${(1 - in1) * 150}px)` }}>
        <svg viewBox="0 0 100 30" width={480} height={144} style={{ overflow: "visible" }}><Ssd /></svg>
        <div style={{ fontFamily: HAND, fontSize: 60, fontWeight: "bold", textAlign: "right" }}>1 SSD M.2</div>
      </div>
      {/* 2 SSD */}
      <div style={{ position: "absolute", right: 150, top: 560, opacity: in2, transform: `translateX(${(1 - in2) * 150}px)` }}>
        <div style={{ position: "relative", height: 150 }}>
          <svg viewBox="0 0 100 30" width={460} height={138} style={{ position: "absolute", right: 40, top: 30, overflow: "visible" }}><Ssd /></svg>
          <svg viewBox="0 0 100 30" width={460} height={138} style={{ position: "absolute", right: 0, top: 0, overflow: "visible" }}><Ssd /></svg>
        </div>
        <div style={{ fontFamily: HAND, fontSize: 60, fontWeight: "bold", textAlign: "right" }}>2 SSD M.2</div>
      </div>
      <div style={{ position: "absolute", left: 520, top: 330 }}>
        <Arrow d="M15,80 C90,60 140,45 205,32" head="M205,32 L183,38 M205,32 L193,54" progress={aP} headOn={headOn} width={520} />
      </div>
      <div style={{ position: "absolute", left: 520, top: 520 }}>
        <Arrow d="M15,20 C90,45 140,62 205,82" head="M205,82 L183,76 M205,82 L193,60" progress={aP} headOn={headOn} width={520} />
      </div>
      <Caption>Y decide <R>cuántos SSD</R> puedes poner.</Caption>
    </AbsoluteFill>
  );
};

/* ============================================================
   ESCENA 3 — tamaños de placa + confundido
   ============================================================ */
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inGuy = spring({ frame, fps, config: { damping: 13 } });
  const sizes = [
    { c: "#546e7a", s: 200, label: "Mini-ITX", x: 620, y: 300, delay: 12 },
    { c: "#455a64", s: 260, label: "Micro-ATX", x: 960, y: 260, delay: 24 },
    { c: "#37474f", s: 320, label: "ATX", x: 1360, y: 220, delay: 36 },
  ];
  return (
    <AbsoluteFill>
      <Audio src={staticFile("voz/linea4t.mp3")} />
      <div style={{ position: "absolute", left: 120, top: 380, transform: `scale(${1.15 * inGuy}) ${bob(frame, 1.2)}`, transformOrigin: "bottom center" }}>
        <Stick head={<FaceConfused />} pose="idle" />
      </div>
      {sizes.map((z, i) => {
        const sp = spring({ frame: frame - z.delay, fps, config: { damping: 11, stiffness: 150 } });
        return (
          <div key={i} style={{ position: "absolute", left: z.x, top: z.y, transform: `scale(${sp})`, transformOrigin: "center" }}>
            <IconCircle color={z.c} size={z.s}><Mobo /></IconCircle>
            <div style={{ textAlign: "center", fontFamily: HAND, fontSize: 48, marginTop: 8, opacity: sp }}>{z.label}</div>
          </div>
        );
      })}
      <Caption>Viene en <R>3 tamaños</R>: Mini-ITX, Micro-ATX y ATX.</Caption>
    </AbsoluteFill>
  );
};

/* ============================================================
   ESCENA 4 — meme cara de rabia
   ============================================================ */
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inGuy = spring({ frame, fps, config: { damping: 12 } });
  const inTxt = spring({ frame: frame - 15, fps, config: { damping: 13 } });
  const inPile = spring({ frame: frame - 26, fps, config: { damping: 13 } });
  const shake = frame > 20 ? Math.sin(frame / 2) * 2 : 0;
  return (
    <AbsoluteFill>
      <Audio src={staticFile("voz/linea5t.mp3")} />
      <div style={{ position: "absolute", left: 150, top: 360, transform: `scale(${1.25 * inGuy}) translateX(${shake}px)`, transformOrigin: "bottom center" }}>
        <Stick head={<FaceRage />} pose="hip" />
      </div>
      <div style={{ position: "absolute", left: 760, top: 230, width: 1050, fontFamily: HAND, fontSize: 92, fontWeight: "bold", opacity: inTxt, transform: `translateY(${(1 - inTxt) * 40}px)` }}>
        un <R>pisapapeles</R><br />de <R>$400</R> 💸
      </div>
      <div style={{ position: "absolute", right: 220, top: 560, transform: `scale(${inPile})`, transformOrigin: "center" }}>
        <svg viewBox="0 0 200 130" width={620} height={403} style={{ overflow: "visible" }}>
          <g fill="#fff" stroke="#111" strokeWidth={3}>
            <rect x={20} y={70} width={160} height={16} rx={3} />
            <rect x={16} y={56} width={168} height={16} rx={3} />
            <rect x={22} y={42} width={156} height={16} rx={3} />
            <rect x={18} y={28} width={164} height={16} rx={3} />
          </g>
          <g transform="translate(72,4)"><svg x={0} y={0} width={60} height={60} viewBox="0 0 100 100" style={{ overflow: "visible" }}><Cpu /></svg></g>
        </svg>
      </div>
      <Caption>Si eliges mal… un <R>pisapapeles de $400</R>.</Caption>
    </AbsoluteFill>
  );
};

/* ============================================================
   VIDEO PRINCIPAL
   ============================================================ */
export const PcExplainer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      {/* watermark */}
      <div style={{ position: "absolute", top: 26, left: 34, fontFamily: HAND, fontSize: 30, color: "#cfcfcf", zIndex: 5 }}>@TecnoExplica</div>

      <Sequence from={0} durationInFrames={74}><Scene0 /></Sequence>
      <Sequence from={74} durationInFrames={123}><Scene1 /></Sequence>
      <Sequence from={197} durationInFrames={85}><Scene2 /></Sequence>
      <Sequence from={282} durationInFrames={117}><Scene3 /></Sequence>
      <Sequence from={399} durationInFrames={112}><Scene4 /></Sequence>

      {/* barra de progreso */}
      <ProgressBar />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = (frame / durationInFrames) * 100;
  return <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${w}%`, backgroundColor: "#e2231a", zIndex: 6 }} />;
};

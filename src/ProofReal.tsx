import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Stick } from "./components/parts";
import { Paranoide } from "./components/faces";

const HAND = "'Comic Sans MS', 'Segoe Print', cursive";
const HEAVY = "'Arial Black', Impact, system-ui, sans-serif";
const RED = "#e2231a";
const ICON = (n: string) => staticFile(`icons/${n}.svg`);

const sp = (frame: number, fps: number, d = 13, stiff?: number) => spring({ frame, fps, config: stiff ? { damping: d, stiffness: stiff } : { damping: d } });
const bob = (f: number, a = 2, s = 11) => `rotate(${Math.sin(f / s) * a}deg)`;

// icono real que ENTRA girando + zoom
const SpinIcon: React.FC<{ name: string; size: number; ml: number; fps: number; color?: string }> = ({ name, size, ml, fps, color = "#141414" }) => {
  const s = sp(ml, fps, 11, 140);
  const rot = interpolate(s, [0, 1], [-170, 0]);
  return <div style={{ width: size, height: size, transform: `scale(${s}) rotate(${rot}deg)` }}>
    <Img src={ICON(name)} style={{ width: "100%", height: "100%", filter: color === "#141414" ? "none" : "" }} />
  </div>;
};

// clip-ventana con imagen real dentro
const WindowClip: React.FC<{ accent: string; w: number; title: string; img: string }> = ({ accent, w, title, img }) => (
  <div style={{ width: w, borderRadius: 26, background: "#fff", border: `6px solid ${accent}`, boxShadow: "0 26px 60px rgba(0,0,0,.22)", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 18px", background: accent }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", opacity: .95 }} />
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", opacity: .6 }} />
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", opacity: .4 }} />
      <span style={{ marginLeft: 12, fontFamily: HAND, fontSize: 24, color: "#fff", fontWeight: "bold" }}>{title}</span>
    </div>
    <Img src={img} style={{ width: "100%", height: 460, objectFit: "cover", display: "block" }} />
  </div>
);

const Chevrons: React.FC<{ f: number; c: string }> = ({ f, c }) => (
  <div style={{ display: "flex", gap: 2 }}>{[0, 1, 2, 3].map(k => <span key={k} style={{ fontFamily: HEAVY, fontSize: 96, fontWeight: 900, color: c, opacity: 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f / 6 - k * 0.9)) }}>›</span>)}</div>
);

const N = 4;
export const ProofReal: React.FC = () => {
  const frame = useCurrentFrame(); const { fps, durationInFrames } = useVideoConfig();
  const len = durationInFrames / N;
  const i = Math.min(N - 1, Math.floor(frame / len));
  const ml = frame - i * len;
  const t = Math.min(1, ml / len);
  const enter = { opacity: Math.min(1, ml / 10), filter: `blur(${(1 - Math.min(1, ml / 10)) * 10}px)` };
  // solo zoom suave (sin paneo horizontal) → todo queda CENTRADO
  const cam = `scale(${1.02 + 0.05 * t})`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfbfa" }}>
      {/* logo tema esquina */}
      <div style={{ position: "absolute", top: 26, right: 34, width: 84, height: 84, zIndex: 6 }}><Img src={ICON("brain")} style={{ width: "100%", height: "100%" }} /></div>
      <div style={{ position: "absolute", top: 26, left: 34, fontFamily: HAND, fontSize: 30, color: "#cfcfcf", zIndex: 5 }}>@CapsulaCuriosa</div>

      <AbsoluteFill style={{ transform: cam, ...enter, alignItems: "center", justifyContent: "center" }}>
        {/* 0 · nombre con brain real girando */}
        {i === 0 && (<div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><SpinIcon name="brain" size={480} ml={ml} fps={fps} /></div>
          <div style={{ fontFamily: HEAVY, fontSize: 120, fontWeight: 900, color: "#141414", marginTop: 30, opacity: sp(ml - 10, fps), transform: `translateY(${(1 - sp(ml - 10, fps)) * 40}px)` }}>TRASTORNO <span style={{ color: RED }}>PARANOIDE</span></div>
        </div>)}

        {/* 1 · SEÑALES — 3 columnas de ancho FIJO (simétricas) con iconos en círculo */}
        {i === 1 && (<div style={{ width: 1620, textAlign: "center" }}>
          <div style={{ fontFamily: HEAVY, fontSize: 104, fontWeight: 900, color: RED, marginBottom: 70, transform: `scale(${sp(ml, fps)})` }}>SEÑALES</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {[["eye", "Sospecha", "#ffd54f"], ["shield-alert", "Todo es un ataque", "#ff8c1a"], ["hourglass", "Guarda rencor", "#4db6ac"]].map(([ic, lb, col], k) => {
              const s = sp(ml - 8 - k * 12, fps, 11, 150);
              return <div key={k} style={{ width: 540, textAlign: "center", transform: `scale(${s}) ${bob(frame + k * 3)}` }}>
                <div style={{ width: 280, height: 280, margin: "0 auto", borderRadius: "50%", background: col, border: "7px solid #111", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 26px rgba(0,0,0,.15)" }}>
                  <Img src={ICON(ic)} style={{ width: 160, height: 160 }} />
                </div>
                <div style={{ fontFamily: HAND, fontSize: 56, marginTop: 26 }}>{lb}</div>
              </div>;
            })}
          </div>
        </div>)}

        {/* 2 · muñeco › clip-ventana con FOTO REAL */}
        {i === 2 && (<div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ transform: `scale(${sp(ml, fps)}) ${bob(frame, 2)}`, transformOrigin: "bottom center", flexShrink: 0 }}><Stick head={<Paranoide />} pose="pointR" /></div>
          <div style={{ opacity: sp(ml - 8, fps), flexShrink: 0 }}><Chevrons f={frame} c={RED} /></div>
          <div style={{ opacity: sp(ml - 12, fps), transform: `translateX(${(1 - sp(ml - 12, fps)) * 120}px)` }}>
            <WindowClip accent="#e57373" w={1020} title="Un mensaje del jefe…" img={staticFile("img/phone_msg.jpg")} />
          </div>
        </div>)}

        {/* 3 · causa con DNA real girando */}
        {i === 3 && (<div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: HEAVY, fontSize: 56, fontWeight: 900, color: "#bbb", marginBottom: 30, transform: `scale(${sp(ml, fps)})` }}>¿POR QUÉ APARECE?</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 60 }}>
            <SpinIcon name="dna" size={320} ml={ml} fps={fps} />
            <div style={{ fontFamily: HAND, fontSize: 88, color: "#141414", opacity: sp(ml - 14, fps) }}>Genética + traiciones</div>
          </div>
        </div>)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

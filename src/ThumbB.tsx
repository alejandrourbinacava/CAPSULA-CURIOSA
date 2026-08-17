import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
const HEAVY = "'Arial Black',Impact,system-ui,sans-serif";
const HAND = "'Comic Sans MS','Segoe Print',cursive";
const RED = "#e2231a";
const ICON = (n: string) => staticFile(`icons/${n}.svg`);
const Chip: React.FC<{ n: string; c: string; s: number }> = ({ n, c, s }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", background: c, border: "7px solid #111", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 22px rgba(0,0,0,.25)" }}>
    <Img src={ICON(n)} style={{ width: s * 0.54, height: s * 0.54 }} />
  </div>
);
export const ThumbB: React.FC = () => (
  <AbsoluteFill style={{ background: "#fff" }}>
    {/* borde */}
    <div style={{ position: "absolute", inset: 12, border: "6px solid #111", borderRadius: 18 }} />
    {/* titular */}
    <div style={{ position: "absolute", top: 34, width: "100%", textAlign: "center", fontFamily: HEAVY, lineHeight: 0.98 }}>
      <div style={{ fontSize: 96, fontWeight: 900, color: "#111" }}>¿RECONOCES A</div>
      <div style={{ fontSize: 112, fontWeight: 900, color: RED }}>ALGUIEN?</div>
    </div>
    {/* foto real recortada en marco */}
    <div style={{ position: "absolute", left: 70, top: 250, width: 470, height: 420, borderRadius: 24, overflow: "hidden", border: "8px solid #111", boxShadow: "0 20px 44px rgba(0,0,0,.3)" }}>
      <Img src={staticFile("media/para_sospecha.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    {/* flecha roja */}
    <svg style={{ position: "absolute", left: 545, top: 420, width: 150, height: 120 }} viewBox="0 0 150 120"><path d="M10,60 C60,55 90,58 130,60" stroke={RED} strokeWidth={12} fill="none" strokeLinecap="round" /><path d="M130,60 L104,44 M130,60 L104,78" stroke={RED} strokeWidth={12} fill="none" strokeLinecap="round" /></svg>
    {/* rejilla de iconos */}
    <div style={{ position: "absolute", right: 80, top: 250, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
      {[["eye", "#e57373"], ["crown", "#ffd54f"], ["venetian-mask", "#607d8b"], ["heart-crack", "#f06292"]].map(([n, c], k) => (
        <div key={k} style={{ transform: `rotate(${[-6, 5, 4, -5][k]}deg)` }}><Chip n={n} c={c} s={190} /></div>
      ))}
    </div>
    {/* pie */}
    <div style={{ position: "absolute", bottom: 34, width: "100%", textAlign: "center", fontFamily: HEAVY, fontSize: 56, fontWeight: 900, color: "#111" }}>10 TRASTORNOS DE LA <span style={{ color: RED }}>PERSONALIDAD</span></div>
  </AbsoluteFill>
);

import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import config from "../video.config.json";
const HEAVY = "'Arial Black',Impact,system-ui,sans-serif";
const HAND = "'Comic Sans MS','Segoe Print',cursive";
const RED = "#e2231a";
const ICON = (n: string) => staticFile(`icons/${n}.svg`);
const items = config.items as { name: string; main: string; color: string }[];

// título a 2 tonos: última palabra en rojo
const titleParts = () => { const w = config.title.replace(/^Los?\s+\d+\s+/i, "").toUpperCase().split(" "); const red = w.slice(-1).join(" "); const black = w.slice(0, -1).join(" "); return { black, red }; };

export const AutoThumb: React.FC = () => {
  const { black, red } = titleParts();
  const cols = items.length <= 8 ? 4 : 5;
  const size = items.length <= 8 ? 200 : 175;
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <div style={{ position: "absolute", top: 22, left: 0, right: 0, textAlign: "center", fontFamily: HEAVY, lineHeight: 0.98, padding: "0 30px" }}>
        <span style={{ fontSize: 78, fontWeight: 900, color: "#141414" }}>{black} </span>
        <span style={{ fontSize: 86, fontWeight: 900, color: RED }}>{red}</span>
      </div>
      <div style={{ position: "absolute", top: 190, left: 0, right: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 26, padding: "0 40px" }}>
        {items.map((it, k) => (
          <div key={k} style={{ width: size, textAlign: "center" }}>
            <div style={{ width: size, height: size, borderRadius: "50%", background: it.color, border: "6px solid #111", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(0,0,0,.2)" }}>
              <Img src={ICON(it.main)} style={{ width: size * 0.5, height: size * 0.5 }} />
            </div>
            <div style={{ fontFamily: HAND, fontSize: 26, marginTop: 4, color: "#141414" }}>{it.name}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

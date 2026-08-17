import React from "react";
import { AbsoluteFill } from "remotion";
import { IconCircle } from "./components/parts";
import {
  Paranoide, Esquizoide, Esquizotipico, Antisocial, Limite,
  Histrionico, Narcisista, Evitativo, Dependiente, Obsesivo,
} from "./components/faces";

const CELLS = [
  { Face: Paranoide, color: "#e57373", label: "Paranoide" },
  { Face: Esquizoide, color: "#90a4ae", label: "Esquizoide" },
  { Face: Esquizotipico, color: "#ba68c8", label: "Esquizotípico" },
  { Face: Antisocial, color: "#607d8b", label: "Antisocial" },
  { Face: Limite, color: "#f06292", label: "Límite" },
  { Face: Histrionico, color: "#ffb300", label: "Histriónico" },
  { Face: Narcisista, color: "#ffd54f", label: "Narcisista" },
  { Face: Evitativo, color: "#4db6ac", label: "Evitativo" },
  { Face: Dependiente, color: "#7986cb", label: "Dependiente" },
  { Face: Obsesivo, color: "#4dd0e1", label: "Obsesivo" },
];

const HEAVY = "'Arial Black', Impact, system-ui, sans-serif";

export const Thumbnail: React.FC = () => {
  const cols = 5;
  const cx = [160, 400, 640, 880, 1120];
  const rowY = [345, 560];
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      {/* Titular */}
      <div style={{ position: "absolute", top: 26, left: 0, right: 0, textAlign: "center", fontFamily: HEAVY, lineHeight: 0.98 }}>
        <div style={{ fontSize: 88, fontWeight: 900, color: "#141414", letterSpacing: 1 }}>TRASTORNOS DE</div>
        <div style={{ fontSize: 96, fontWeight: 900, color: "#e2231a", letterSpacing: 1 }}>PERSONALIDAD</div>
      </div>

      {/* Rejilla 2x5 */}
      {CELLS.map((c, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = cx[col], y = rowY[row];
        return (
          <div key={i} style={{ position: "absolute", left: x - 88, top: y - 88, width: 176, textAlign: "center" }}>
            <IconCircle color={c.color} size={176}><c.Face /></IconCircle>
            <div style={{ fontFamily: HEAVY, fontWeight: 900, fontSize: 27, color: "#141414", marginTop: 2 }}>{c.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

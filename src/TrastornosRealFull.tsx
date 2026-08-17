import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stick } from "./components/parts";
import { DATA, Intro, Grupos, Cierre } from "./TrastornosReal";
import manifest from "../public/voz1deep/manifest.json";
import anchors from "../public/voz1deep/anchors.json";

const HAND = "'Comic Sans MS','Segoe Print',cursive";
const HEAVY = "'Arial Black',Impact,system-ui,sans-serif";
const RED = "#e2231a";
const PAD = 6;
const ICON = (n: string) => staticFile(`icons/${n}.svg`);
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const lerp3 = (t: number, a: number, b: number, c: number) => t < 0.55 ? a + (b - a) * (t / 0.55) : b + (c - b) * ((t - 0.55) / 0.45);
const ap = (lf: number, delay: number, dur = 10) => clamp((lf - delay) / dur);
const bob = (f: number, a = 2) => `rotate(${Math.sin(f / 11) * a}deg)`;
const KEYS = ["paranoide", "esquizoide", "esquizotipico", "antisocial", "limite", "histrionico", "narcisista", "evitativo", "dependiente", "obsesivo"];

const Chip: React.FC<{ n: string; c: string; size: number }> = ({ n, c, size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: c, border: `${Math.max(5, size * 0.026)}px solid #111`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,.16)" }}>
    <Img src={ICON(n)} style={{ width: size * 0.54, height: size * 0.54 }} />
  </div>
);
const El: React.FC<{ p: number; x: number; y: number; from?: number; fromY?: number; children: React.ReactNode }> = ({ p, x, y, from = 0, fromY = 0, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translate(${(1 - p) * from}px,${(1 - p) * fromY}px) scale(${lerp3(p, 0.4, 1.09, 1)})`, opacity: Math.min(1, p * 1.3) }}>{children}</div>
);
const T: React.FC<{ s?: number; c?: string; w?: number; children: React.ReactNode; heavy?: boolean }> = ({ s = 60, c = "#141414", w = 1000, children, heavy }) => (
  <div style={{ fontFamily: heavy ? HEAVY : HAND, fontWeight: heavy ? 900 : "normal", fontSize: s, color: c, width: w, textAlign: "center", lineHeight: 1.15 }}>{children}</div>
);
const Win: React.FC<{ img?: string; video?: string; videoFrom?: number; w: number; title: string; accent: string; h?: number }> = ({ img, video, videoFrom = 0, w, title, accent, h = 430 }) => (
  <div style={{ width: w, borderRadius: 24, overflow: "hidden", border: `6px solid ${accent}`, boxShadow: "0 24px 60px rgba(0,0,0,.22)", background: "#fff" }}>
    <div style={{ background: accent, padding: "12px 18px", display: "flex", gap: 8, alignItems: "center" }}><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", opacity: .9 }} /><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", opacity: .6 }} /><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", opacity: .4 }} /><span style={{ marginLeft: 10, fontFamily: HAND, fontSize: 22, color: "#fff", fontWeight: "bold" }}>{title}</span></div>
    {video ? <Sequence from={videoFrom} layout="none"><OffthreadVideo src={staticFile(video)} muted style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} /></Sequence>
      : <Img src={staticFile(img!)} style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />}
  </div>
);
const Chev: React.FC<{ f: number; c: string }> = ({ f, c }) => (
  <div style={{ display: "flex", gap: 2 }}>{[0, 1, 2].map(k => <span key={k} style={{ fontFamily: HEAVY, fontSize: 90, fontWeight: 900, color: c, opacity: 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(f / 6 - k)) }}>›</span>)}</div>
);

type A = { fuera: number; dentro: number; senales: number; causa: number; ejemplo: number; consejo: number };
const DisorderReal: React.FC<{ d: typeof DATA[number]; a: A; id: string; key0: string; n: number; frames: number }> = ({ d, a, id, key0, n, frames }) => {
  const frame = useCurrentFrame();
  const B = [0, a.fuera, a.senales, a.causa, a.ejemplo, a.consejo, frames];
  let si = 0; for (let k = 1; k <= 5; k++) if (frame >= B[k]) si = k;
  const lf = frame - B[si];
  const photo = `media/${key0}_photo.jpg`;
  const video = `media/${key0}_vid.mp4`;
  const Face = d.Face;
  const s1 = a.senales, sc = a.causa - a.senales; // duración señales
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`voz1deep/${id}.mp3`)} />
      <div style={{ position: "absolute", top: 46, right: 70, fontFamily: HEAVY, fontSize: 56, fontWeight: 900, color: "#dcdcdc" }}>{n}<span style={{ fontSize: 30 }}>/10</span></div>
      <div style={{ position: "absolute", top: 60, left: 80, fontFamily: HEAVY, fontSize: 30, fontWeight: 900, color: d.color }}>{d.group}</div>

      {/* 0 título */}
      {si === 0 && <>
        <El p={ap(lf, 0)} x={960} y={430}><div style={{ transform: bob(frame) }}><Chip n={d.main} c={d.color} size={360} /></div></El>
        <El p={ap(lf, 16)} x={960} y={710}><T s={116} heavy>TRASTORNO <span style={{ color: RED }}>{d.name}</span></T></El>
        <El p={ap(lf, Math.max(30, a.fuera * 0.5))} x={960} y={850} fromY={40}><T s={70} c={RED} heavy>{d.def}</T></El>
      </>}
      {/* 1 contraste (POR FUERA en fuera, POR DENTRO en dentro) */}
      {si === 1 && <>
        <El p={ap(lf, 0)} x={560} y={410}><T s={62} heavy>POR FUERA</T></El>
        <El p={ap(lf, 20)} x={560} y={590}><div style={{ transform: bob(frame) }}><Chip n={d.fuera[0]} c={d.color} size={270} /></div></El>
        <El p={ap(lf, 52)} x={560} y={790}><T s={50} w={720}>{d.fuera[1]}</T></El>
        <El p={ap(lf, a.dentro - a.fuera)} x={1380} y={410}><T s={62} c={RED} heavy>POR DENTRO</T></El>
        <El p={ap(lf, a.dentro - a.fuera + 22)} x={1380} y={590}><div style={{ transform: bob(frame + 5) }}><Chip n={d.dentro[0]} c="#e57373" size={270} /></div></El>
        <El p={ap(lf, a.dentro - a.fuera + 54)} x={1380} y={790}><T s={50} w={720}>{d.dentro[1]}</T></El>
      </>}
      {/* 2 señales (1 en senales, 2 y 3 escalonadas hasta causa) */}
      {si === 2 && <>
        <El p={ap(lf, 0)} x={960} y={220}><T s={92} c={RED} heavy>SEÑALES</T></El>
        <El p={ap(lf, 15)} x={470} y={600}><div style={{ transform: bob(frame) }}><Chip n={d.senales[0].icon} c={d.senales[0].color} size={250} /></div></El>
        <El p={ap(lf, 42)} x={470} y={800}><T s={46} w={520}>{d.senales[0].label}</T></El>
        <El p={ap(lf, Math.round(sc * 0.38))} x={960} y={600}><div style={{ transform: bob(frame + 4) }}><Chip n={d.senales[1].icon} c={d.senales[1].color} size={250} /></div></El>
        <El p={ap(lf, Math.round(sc * 0.38) + 27)} x={960} y={800}><T s={46} w={520}>{d.senales[1].label}</T></El>
        <El p={ap(lf, Math.round(sc * 0.7))} x={1450} y={600}><div style={{ transform: bob(frame + 8) }}><Chip n={d.senales[2].icon} c={d.senales[2].color} size={250} /></div></El>
        <El p={ap(lf, Math.round(sc * 0.7) + 27)} x={1450} y={800}><T s={46} w={520}>{d.senales[2].label}</T></El>
      </>}
      {/* 3 causa (chip+texto + FOTO real) */}
      {si === 3 && <>
        <El p={ap(lf, 0)} x={960} y={210}><T s={58} c="#bbb" heavy>¿POR QUÉ APARECE?</T></El>
        <El p={ap(lf, 30)} x={520} y={620} from={-120}><Win img={photo} w={720} title={d.name} accent={d.color} h={430} /></El>
        <El p={ap(lf, 70)} x={1420} y={580}><T s={70} w={820} heavy>{d.causa[1]}</T></El>
      </>}
      {/* 4 ejemplo (muñeco › CLIP DE VÍDEO real) */}
      {si === 4 && <>
        <El p={ap(lf, 0)} x={300} y={560} from={-150}><div style={{ transform: bob(frame, 2), transformOrigin: "bottom center" }}><Stick head={<Face />} pose="pointR" /></div></El>
        <El p={ap(lf, 26)} x={560} y={560}><Chev f={frame} c={d.color} /></El>
        <El p={ap(lf, 50)} x={1240} y={500} from={140}><Win video={video} videoFrom={a.ejemplo} w={900} title={d.ejemplo.title} accent={d.color} /></El>
        <El p={ap(lf, Math.round((a.consejo - a.ejemplo) * 0.55))} x={1240} y={880}><T s={58} c={RED} heavy>{d.ejemplo.title}</T></El>
      </>}
      {/* 5 cómo actuar */}
      {si === 5 && <>
        <El p={ap(lf, 0)} x={960} y={300}><T s={92} c={RED} heavy>CÓMO ACTUAR</T></El>
        <El p={ap(lf, 14)} x={640} y={620}><div style={{ transform: bob(frame, 3) }}><Chip n={d.consejo[0]} c={d.color} size={280} /></div></El>
        <El p={ap(lf, 30)} x={1300} y={620}><T s={74} w={880} heavy>{d.consejo[1]}</T></El>
      </>}
    </AbsoluteFill>
  );
};

const timeline = (() => { let acc = 0; return (manifest as { id: string; label: string; frames: number }[]).map((m) => { const from = acc; const dur = m.frames + PAD; acc += dur; return { ...m, from, dur }; }); })();
export const TOTAL = timeline.reduce((a, s) => Math.max(a, s.from + s.dur), 0);

export const TrastornosRealFull: React.FC = () => {
  let n = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfbfa", fontFamily: HAND }}>
      <div style={{ position: "absolute", top: 22, right: 30, width: 84, height: 84, zIndex: 30 }}><Img src={ICON("brain")} style={{ width: "100%", height: "100%" }} /></div>
      <div style={{ position: "absolute", top: 26, left: 34, fontSize: 30, color: "#cfcfcf", zIndex: 30 }}>@CapsulaCuriosa</div>
      {timeline.map((s) => {
        let c: React.ReactNode;
        if (s.label === "intro") c = <Intro frames={s.frames} />;
        else if (s.label === "grupos") c = <Grupos frames={s.frames} />;
        else if (s.label === "cierre") c = <Cierre frames={s.frames} />;
        else { const idx = n; n += 1; c = <DisorderReal d={DATA[idx]} a={(anchors as Record<string, A>)[s.id]} id={s.id} key0={KEYS[idx]} n={idx + 1} frames={s.frames} />; }
        return <Sequence key={s.id} from={s.from} durationInFrames={s.dur}>{c}</Sequence>;
      })}
      <Bar />
    </AbsoluteFill>
  );
};
const Bar: React.FC = () => { const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); return <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: RED, zIndex: 30 }} />; };

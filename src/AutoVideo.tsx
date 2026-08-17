import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stick } from "./components/parts";
import config from "../video.config.json";
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

type Item = typeof config.items[number];
const ITEMS = config.items as Item[];

const Chip: React.FC<{ n: string; c: string; size: number }> = ({ n, c, size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: c, border: `${Math.max(5, size * 0.026)}px solid #111`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,.16)" }}>
    <Img src={ICON(n)} style={{ width: size * 0.54, height: size * 0.54 }} />
  </div>
);
// cabeza del muñeco = icono del tema en círculo (SVG para encajar en el Stick)
const iconHead = (icon: string, color: string) => (
  <g>
    <circle cx={50} cy={50} r={46} fill={color} stroke="#111" strokeWidth={4} />
    <image href={ICON(icon)} x={26} y={26} width={48} height={48} />
  </g>
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

const ItemScene: React.FC<{ d: Item; a: A; n: number; frames: number }> = ({ d, a, n, frames }) => {
  const frame = useCurrentFrame();
  const B = [0, a.fuera, a.senales, a.causa, a.ejemplo, a.consejo, frames];
  let si = 0; for (let k = 1; k <= 5; k++) if (frame >= B[k]) si = k;
  const lf = frame - B[si];
  const photo = `media/${d.key}_photo.jpg`;
  const video = `media/${d.key}_vid.mp4`;
  const video2 = `media/${d.key}_vid2.mp4`;
  const sc = a.causa - a.senales;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`voz1deep/${d.id}.mp3`)} />
      <div style={{ position: "absolute", top: 46, right: 70, fontFamily: HEAVY, fontSize: 56, fontWeight: 900, color: "#dcdcdc" }}>{n}<span style={{ fontSize: 30 }}>/{ITEMS.length}</span></div>
      <div style={{ position: "absolute", top: 60, left: 80, fontFamily: HEAVY, fontSize: 30, fontWeight: 900, color: d.color }}>{d.group}</div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {si === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, padding: "0 80px" }}>
            <div style={{ opacity: Math.min(1, ap(lf, 0) * 1.3), transform: `scale(${lerp3(ap(lf, 0), 0.4, 1.09, 1)}) ${bob(frame)}` }}><Chip n={d.main} c={d.color} size={310} /></div>
            <div style={{ opacity: Math.min(1, ap(lf, 16) * 1.3), fontFamily: HEAVY, fontWeight: 900, fontSize: d.name.length > 13 ? 80 : 112, color: "#141414", textAlign: "center", maxWidth: 1650, lineHeight: 1.02 }}>{d.name}</div>
            <div style={{ opacity: Math.min(1, ap(lf, Math.max(30, a.fuera * 0.5)) * 1.3), fontFamily: HEAVY, fontWeight: 900, fontSize: 58, color: RED, textAlign: "center", maxWidth: 1400, lineHeight: 1.1 }}>{d.def}</div>
          </div>
        )}
        {si === 1 && <>
          <El p={ap(lf, 0)} x={560} y={410}><T s={62} heavy>POR FUERA</T></El>
          <El p={ap(lf, 20)} x={560} y={590}><div style={{ transform: bob(frame) }}><Chip n={d.fuera[0]} c={d.color} size={270} /></div></El>
          <El p={ap(lf, 52)} x={560} y={790}><T s={50} w={720}>{d.fuera[1]}</T></El>
          <El p={ap(lf, a.dentro - a.fuera)} x={1380} y={410}><T s={62} c={RED} heavy>POR DENTRO</T></El>
          <El p={ap(lf, a.dentro - a.fuera + 22)} x={1380} y={590}><div style={{ transform: bob(frame + 5) }}><Chip n={d.dentro[0]} c="#e57373" size={270} /></div></El>
          <El p={ap(lf, a.dentro - a.fuera + 54)} x={1380} y={790}><T s={50} w={720}>{d.dentro[1]}</T></El>
        </>}
        {si === 2 && <>
          <El p={ap(lf, 0)} x={960} y={220}><T s={92} c={RED} heavy>SEÑALES</T></El>
          {d.senales.map((sg, k) => { const dl = k === 0 ? 15 : k === 1 ? Math.round(sc * 0.38) : Math.round(sc * 0.7); const x = [470, 960, 1450][k]; return (
            <React.Fragment key={k}>
              <El p={ap(lf, dl)} x={x} y={600}><div style={{ transform: bob(frame + k * 4) }}><Chip n={sg.icon} c={sg.color} size={250} /></div></El>
              <El p={ap(lf, dl + 27)} x={x} y={800}><T s={46} w={520}>{sg.label}</T></El>
            </React.Fragment>); })}
        </>}
        {si === 3 && <>
          <El p={ap(lf, 0)} x={960} y={180}><T s={56} c="#bbb" heavy>¿POR QUÉ APARECE?</T></El>
          <El p={ap(lf, 20)} x={300} y={600} from={-150}><div style={{ transform: `${bob(frame, 2)}`, transformOrigin: "bottom center" }}><Stick head={iconHead(d.causa[0], d.color)} pose="pointR" /></div></El>
          <El p={ap(lf, 40)} x={560} y={600}><Chev f={frame} c={d.color} /></El>
          <El p={ap(lf, 60)} x={1250} y={560} from={140}><Win video={video2} videoFrom={a.causa} w={880} title={d.causa[1]} accent={d.color} h={400} /></El>
        </>}
        {si === 4 && <>
          <El p={ap(lf, 0)} x={300} y={560} from={-150}><div style={{ transform: bob(frame, 2), transformOrigin: "bottom center" }}><Stick head={iconHead(d.main, d.color)} pose="pointR" /></div></El>
          <El p={ap(lf, 26)} x={560} y={560}><Chev f={frame} c={d.color} /></El>
          <El p={ap(lf, 50)} x={1240} y={500} from={140}><Win video={video} videoFrom={a.ejemplo} w={900} title={d.ejemploTitle} accent={d.color} /></El>
          <El p={ap(lf, Math.round((a.consejo - a.ejemplo) * 0.55))} x={1240} y={880}><T s={58} c={RED} heavy>{d.ejemploTitle}</T></El>
        </>}
        {si === 5 && <>
          <El p={ap(lf, 0)} x={960} y={300}><T s={92} c={RED} heavy>CÓMO ACTUAR</T></El>
          <El p={ap(lf, 14)} x={640} y={620}><div style={{ transform: bob(frame, 3) }}><Chip n={d.consejo[0]} c={d.color} size={280} /></div></El>
          <El p={ap(lf, 30)} x={1300} y={620}><T s={74} w={880} heavy>{d.consejo[1]}</T></El>
        </>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Simple: React.FC<{ id: string; children: (lf: number) => React.ReactNode }> = ({ id, children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Audio src={staticFile(`voz1deep/${id}.mp3`)} />{children(frame)}</AbsoluteFill>;
};

const tline = (() => { let acc = 0; return (manifest as { id: string; frames: number }[]).map((m) => { const from = acc; const dur = m.frames + PAD; acc += dur; return { ...m, from, dur }; }); })();
export const TOTAL = tline.reduce((a, s) => Math.max(a, s.from + s.dur), 0);

export const AutoVideo: React.FC = () => {
  let n = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfbfa", fontFamily: HAND }}>
      <div style={{ position: "absolute", top: 22, right: 30, width: 84, height: 84, zIndex: 30 }}><Img src={ICON(config.cornerIcon)} style={{ width: "100%", height: "100%" }} /></div>
      <div style={{ position: "absolute", top: 26, left: 34, fontSize: 30, color: "#cfcfcf", zIndex: 30 }}>{config.handle}</div>
      {tline.map((s) => {
        let c: React.ReactNode;
        if (s.id === config.intro.id) c = <Simple id={s.id}>{() => <>
          <T s={150} heavy>{config.title.split(" ").slice(0, 3).join(" ")}</T>
          <div style={{ display: "flex", flexWrap: "wrap", width: 1300, justifyContent: "center", gap: 22, marginTop: 40 }}>{ITEMS.map((it, k) => <div key={k} style={{ transform: bob(k * 3) }}><Chip n={it.main} c={it.color} size={130} /></div>)}</div>
        </>}</Simple>;
        else if (s.id === config.grupos.id) c = <Simple id={s.id}>{() => <>
          <T s={100} c={RED} heavy>{config.title}</T>
          <div style={{ display: "flex", flexWrap: "wrap", width: 1400, justifyContent: "center", gap: 26, marginTop: 40 }}>{ITEMS.map((it, k) => <div key={k} style={{ textAlign: "center", transform: bob(k * 2) }}><Chip n={it.main} c={it.color} size={150} /><div style={{ fontSize: 26, marginTop: 6 }}>{it.name}</div></div>)}</div>
        </>}</Simple>;
        else if (s.id === config.outro.id) c = <Simple id={s.id}>{() => <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 1200, justifyContent: "center", gap: 18, marginBottom: 40 }}>{ITEMS.map((it, k) => <div key={k} style={{ transform: bob(k * 3) }}><Chip n={it.main} c={it.color} size={110} /></div>)}</div>
          <T s={96} heavy>¿Reconociste a <span style={{ color: RED }}>alguien</span>?</T>
          <div style={{ fontFamily: HAND, fontSize: 62, marginTop: 20 }}>Suscríbete a <b>{config.handle.replace("@", "")}</b> ▶</div>
        </div>}</Simple>;
        else { const idx = n; n += 1; c = <ItemScene d={ITEMS[idx]} a={(anchors as Record<string, A>)[s.id]} n={idx + 1} frames={s.frames} />; }
        return <Sequence key={s.id} from={s.from} durationInFrames={s.dur}>{c}</Sequence>;
      })}
      <Bar />
    </AbsoluteFill>
  );
};
const Bar: React.FC = () => { const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); return <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: RED, zIndex: 30 }} />; };

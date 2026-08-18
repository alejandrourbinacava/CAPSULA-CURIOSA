import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gif } from "@remotion/gif";
import { Stick } from "./components/parts";
import config from "../video.config.json";
import manifest from "../public/voz1deep/manifest.json";
import beatsData from "../public/voz1deep/beats.json";

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
// flecha dibujada a mano que se "dibuja" sola (draw-in) y termina en punta
const Arrow: React.FC<{ f: number; delay?: number; w?: number; color?: string; flip?: boolean }> = ({ f, delay = 0, w = 200, color = "#111", flip }) => {
  const p = clamp((f - delay) / 14), L = 300;
  return (
    <svg width={w} height={w * 0.62} viewBox="0 0 300 186" style={{ transform: flip ? "scaleX(-1)" : "none", overflow: "visible" }}>
      <path d="M18,140 C95,25 205,25 268,96" fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
      <path d="M268,96 L224,92 M268,96 L256,52" fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" opacity={p > 0.82 ? 1 : 0} />
    </svg>
  );
};

type A = { fuera: number; dentro: number; senales: number; causa: number; ejemplo: number; consejo: number };

// divide la narración en frases (~3s cada una) para sincronizar un visual por frase
const splitPhrases = (text: string): string[] => {
  const parts = text.split(/(?<=[.!?…;:])\s+/).map(s => s.trim()).filter(s => s.length > 1);
  const out: string[] = [];
  for (const p of parts) {
    const w = p.split(/\s+/);
    if (w.length > 22) { let buf = ""; for (const s of p.split(/,\s*/)) { buf = buf ? buf + ", " + s : s; if (buf.split(/\s+/).length >= 11) { out.push(buf); buf = ""; } } if (buf) out.push(buf); }
    else out.push(p);
  }
  return out.length ? out : [text];
};
// plan ordenado de visuales que cubre TODO el material del tipo (título → consejo)
const buildPlan = (): { k: string; i?: number }[] => [
  { k: "title" }, { k: "def" }, { k: "fuera" }, { k: "photo" }, { k: "dentro" },
  { k: "senal", i: 0 }, { k: "gif" }, { k: "clip" }, { k: "senal", i: 1 }, { k: "causa" },
  { k: "senal", i: 2 }, { k: "clip2" }, { k: "consejo" },
];
// envoltorio de entrada: cada beat entra con fundido + desliz + escala
const BeatWrap: React.FC<{ lf: number; dir: number; children: React.ReactNode }> = ({ lf, dir, children }) => {
  const e = clamp(lf / 8);
  return <div style={{ opacity: Math.min(1, e * 1.5), transform: `translateX(${(1 - e) * 80 * dir}px) scale(${lerp3(clamp(lf / 13), 0.8, 1.04, 1)})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, width: "100%" }}>{children}</div>;
};

type Beat = { f: number; text: string; icon: string; file: string | null; kind: string | null };
const BEATS = beatsData as Record<string, Beat[]>;

const ItemScene: React.FC<{ d: Item; n: number }> = ({ d, n }) => {
  const frame = useCurrentFrame();
  const bts = BEATS[d.id] || [];
  if (!bts.length) return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Audio src={staticFile(`voz1deep/${d.id}.mp3`)} /><Chip n={d.main} c={d.color} size={320} /></AbsoluteFill>;
  let bi = 0; for (let k = 0; k < bts.length; k++) if (frame >= bts[k].f) bi = k;
  const b = bts[bi]; const lf = frame - b.f; const dir = bi % 2 === 0 ? 1 : -1;

  // entrada con REBOTE (0.35→1.2→1) + deslizamiento en X e Y
  const R = (p: number, from: number, node: React.ReactNode, fromY = 0) => {
    const s = p < 0.6 ? 0.35 + 0.85 * (p / 0.6) : 1.2 - 0.2 * ((p - 0.6) / 0.4);
    return <div style={{ opacity: Math.min(1, p * 1.6), transform: `translate(${(1 - p) * from}px,${(1 - p) * fromY}px) scale(${Math.max(0, s)})` }}>{node}</div>;
  };
  const MW = (w: number, h: number) => b.kind === "gif"
    ? <div style={{ borderRadius: 20, overflow: "hidden", border: `7px solid ${d.color}`, boxShadow: "0 22px 55px rgba(0,0,0,.22)" }}><Gif src={staticFile(b.file!)} width={w} height={h} fit="cover" /></div>
    : b.kind === "img" ? <Win img={b.file!} w={w} title={d.name} accent={d.color} h={h} />
      : <Win video={b.file!} videoFrom={b.f} w={w} title={d.name} accent={d.color} h={h} />;

  const isTitle = bi === 0;
  const label = b.text || d.name;
  let body: React.ReactNode;
  if (isTitle) body = <>
    <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
      {R(ap(lf, 0), -160, <div style={{ transform: bob(frame) }}><Chip n={b.icon || d.main} c={d.color} size={290} /></div>)}
      {R(ap(lf, 16), 0, <Arrow f={lf} delay={16} w={190} />)}
    </div>
    {R(ap(lf, 10), 0, <T s={label.length > 13 ? 84 : 116} heavy>{label}</T>, 55)}
  </>;
  else body = <>
    <div style={{ display: "flex", alignItems: "center", gap: 26, justifyContent: "center" }}>
      {R(ap(lf, 0), -170, <div style={{ transform: bob(frame) }}><Chip n={b.icon} c={d.color} size={b.file ? 230 : 300} /></div>)}
      {b.file && R(ap(lf, 14), 0, <Arrow f={lf} delay={14} w={160} />)}
      {b.file && R(ap(lf, 22), 180, MW(880, 490))}
    </div>
    {R(ap(lf, 32), 0, <T s={label.length > 22 ? 52 : 66} heavy w={1500}>{label}</T>, 55)}
  </>;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(`voz1deep/${d.id}.mp3`)} />
      <div style={{ position: "absolute", top: 46, right: 70, fontFamily: HEAVY, fontSize: 56, fontWeight: 900, color: "#dcdcdc" }}>{n}<span style={{ fontSize: 30 }}>/{ITEMS.length}</span></div>
      <div style={{ position: "absolute", top: 58, left: 80, fontFamily: HEAVY, fontSize: 34, fontWeight: 900, color: d.color, maxWidth: 900 }}>{d.name}</div>
      <div style={{ position: "absolute", bottom: 40, left: 0, width: "100%", display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", padding: "0 180px" }}>
        {bts.map((_, k) => <div key={k} style={{ width: 16, height: 16, borderRadius: "50%", background: k <= bi ? d.color : "#e4e4e4", transform: `scale(${k === bi ? 1.35 : 1})` }} />)}
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
        <BeatWrap lf={lf} dir={dir}>{body}</BeatWrap>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Simple: React.FC<{ id: string; children: (lf: number) => React.ReactNode }> = ({ id, children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Audio src={staticFile(`voz1deep/${id}.mp3`)} />{children(frame)}</AbsoluteFill>;
};

// INTRO dinámico: título → teaser de cada tipo (icono grande + nombre) uno cada ~3s
const IntroScene: React.FC<{ id: string; frames: number }> = ({ id, frames }) => {
  const frame = useCurrentFrame();
  const N = Math.min(ITEMS.length + 1, 9);
  const len = frames / N;
  const i = Math.min(N - 1, Math.floor(frame / len));
  const lf = frame - i * len;
  const pop = lerp3(clamp(lf / 12), 0.4, 1.1, 1);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
      <Audio src={staticFile(`voz1deep/${id}.mp3`)} />
      {i === 0 && <div style={{ fontFamily: HEAVY, fontWeight: 900, fontSize: 96, color: "#141414", textAlign: "center", transform: `scale(${pop})`, lineHeight: 1.05 }}>{config.title}</div>}
      {i > 0 && (() => { const it = ITEMS[(i - 1) % ITEMS.length]; return (
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", transform: `scale(${pop}) ${bob(frame)}` }}><Chip n={it.main} c={it.color} size={340} /></div>
          <div style={{ fontFamily: HEAVY, fontWeight: 900, fontSize: it.name.length > 13 ? 62 : 88, color: "#141414", marginTop: 34, opacity: clamp((lf - 8) / 10) }}>{it.name}</div>
        </div>
      ); })()}
    </AbsoluteFill>
  );
};
// GRUPOS dinámico: las bolitas van apareciendo una a una
const GruposScene: React.FC<{ id: string; frames: number }> = ({ id, frames }) => {
  const frame = useCurrentFrame();
  const per = frames / (ITEMS.length + 3);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Audio src={staticFile(`voz1deep/${id}.mp3`)} />
      <div style={{ fontFamily: HEAVY, fontSize: 82, fontWeight: 900, color: RED, position: "absolute", top: 90, textAlign: "center", width: "100%", padding: "0 40px" }}>{config.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", width: 1500, justifyContent: "center", gap: 30, marginTop: 60 }}>
        {ITEMS.map((it, k) => { const p = clamp((frame - k * per) / 10); return (
          <div key={k} style={{ textAlign: "center", opacity: p, transform: `scale(${lerp3(p, 0.3, 1.12, 1)}) ${bob(frame + k)}` }}>
            <Chip n={it.main} c={it.color} size={150} />
            <div style={{ fontFamily: HAND, fontSize: 24, marginTop: 4, maxWidth: 170, lineHeight: 1 }}>{it.name}</div>
          </div>); })}
      </div>
    </AbsoluteFill>
  );
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
        if (s.id === config.intro.id) c = <IntroScene id={s.id} frames={s.frames} />;
        else if (s.id === config.grupos.id) c = <GruposScene id={s.id} frames={s.frames} />;
        else if (s.id === config.outro.id) c = <Simple id={s.id}>{() => <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 1200, justifyContent: "center", gap: 18, marginBottom: 40 }}>{ITEMS.map((it, k) => <div key={k} style={{ transform: bob(k * 3) }}><Chip n={it.main} c={it.color} size={110} /></div>)}</div>
          <T s={96} heavy>¿Reconociste a <span style={{ color: RED }}>alguien</span>?</T>
          <div style={{ fontFamily: HAND, fontSize: 62, marginTop: 20 }}>Suscríbete a <b>{config.handle.replace("@", "")}</b> ▶</div>
        </div>}</Simple>;
        else { const idx = n; n += 1; c = <ItemScene d={ITEMS[idx]} n={idx + 1} />; }
        return <Sequence key={s.id} from={s.from} durationInFrames={s.dur}>{c}</Sequence>;
      })}
      <Bar />
    </AbsoluteFill>
  );
};
const Bar: React.FC = () => { const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); return <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: RED, zIndex: 30 }} />; };

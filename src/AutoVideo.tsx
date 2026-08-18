import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gif } from "@remotion/gif";
import { Stick } from "./components/parts";
import config from "../video.config.json";
import manifest from "../public/voz1deep/manifest.json";
import anchors from "../public/voz1deep/anchors.json";
import mediaFlags from "../public/media/media.json";

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

const ItemScene: React.FC<{ d: Item; a: A; n: number; frames: number }> = ({ d, n, frames }) => {
  const frame = useCurrentFrame();
  const photo = `media/${d.key}_photo.jpg`, video = `media/${d.key}_vid.mp4`, video2 = `media/${d.key}_vid2.mp4`;
  const totW = d.narration.split(/\s+/).length;
  const phrases = splitPhrases(d.narration);
  let cum = 0; const beatF = phrases.map(ph => { const s = cum; cum += ph.split(/\s+/).length; return Math.round((s / totW) * frames); });
  let bi = 0; for (let k = 0; k < beatF.length; k++) if (frame >= beatF[k]) bi = k;
  const lf = frame - beatF[bi];
  const plan = buildPlan();
  const pIdx = Math.min(plan.length - 1, Math.floor((bi / Math.max(1, phrases.length)) * plan.length));
  const tpl = plan[pIdx];
  const dir = bi % 2 === 0 ? 1 : -1;
  const vf = Math.max(0, beatF[bi]);
  const hasGif = Boolean((mediaFlags as Record<string, { gif?: boolean }>)[d.key]?.gif);
  const chip = (icon: string, c: string, sz = 260) => <div style={{ transform: bob(frame) }}><Chip n={icon} c={c} size={sz} /></div>;

  let body: React.ReactNode = null;
  if (tpl.k === "title") body = <><div style={{ transform: bob(frame) }}><Chip n={d.main} c={d.color} size={300} /></div><T s={d.name.length > 13 ? 84 : 116} heavy>{d.name}</T></>;
  else if (tpl.k === "def") body = <div style={{ display: "flex", alignItems: "center", gap: 56 }}>{chip(d.main, d.color, 240)}<T s={64} c={RED} heavy w={1150}>{d.def}</T></div>;
  else if (tpl.k === "fuera") body = <><T s={70} heavy>😐 POR FUERA</T>{chip(d.fuera[0], d.color, 250)}<T s={56} w={1250}>{d.fuera[1]}</T></>;
  else if (tpl.k === "dentro") body = <><T s={70} c={RED} heavy>🎭 POR DENTRO</T>{chip(d.dentro[0], "#e57373", 250)}<T s={56} w={1250}>{d.dentro[1]}</T></>;
  else if (tpl.k === "senal") { const sg = d.senales[tpl.i!] || d.senales[0]; body = <><T s={66} c={RED} heavy>⚠️ SEÑAL</T>{chip(sg.icon, sg.color, 250)}<T s={58} w={1150}>{sg.label}</T></>; }
  else if (tpl.k === "gif") body = hasGif
    ? <div style={{ borderRadius: 24, overflow: "hidden", border: `6px solid ${d.color}`, boxShadow: "0 24px 60px rgba(0,0,0,.22)" }}><Gif src={staticFile(`media/${d.key}.gif`)} width={1040} height={580} fit="cover" /></div>
    : <Win video={video} videoFrom={vf} w={1200} title={d.ejemploTitle} accent={d.color} h={580} />;
  else if (tpl.k === "photo") body = <Win img={photo} w={1200} title={d.name} accent={d.color} h={580} />;
  else if (tpl.k === "clip") body = <Win video={video} videoFrom={vf} w={1200} title={d.ejemploTitle} accent={d.color} h={580} />;
  else if (tpl.k === "clip2") body = <Win video={video2} videoFrom={vf} w={1200} title={d.causa[1]} accent={d.color} h={580} />;
  else if (tpl.k === "causa") body = <div style={{ display: "flex", alignItems: "center", gap: 26 }}><div style={{ transform: bob(frame, 2), transformOrigin: "bottom center" }}><Stick head={iconHead(d.main, d.color)} pose="pointR" /></div><Chev f={frame} c={d.color} /><Win video={video2} videoFrom={vf} w={780} title={d.causa[1]} accent={d.color} h={440} /></div>;
  else if (tpl.k === "consejo") body = <><T s={74} c={RED} heavy>✅ CÓMO ACTUAR</T><div style={{ display: "flex", alignItems: "center", gap: 56 }}>{chip(d.consejo[0], d.color, 240)}<T s={66} w={1050} heavy>{d.consejo[1]}</T></div></>;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(`voz1deep/${d.id}.mp3`)} />
      <div style={{ position: "absolute", top: 46, right: 70, fontFamily: HEAVY, fontSize: 56, fontWeight: 900, color: "#dcdcdc" }}>{n}<span style={{ fontSize: 30 }}>/{ITEMS.length}</span></div>
      <div style={{ position: "absolute", top: 58, left: 80, fontFamily: HEAVY, fontSize: 34, fontWeight: 900, color: d.color, maxWidth: 900 }}>{d.name}</div>
      {/* fila de progreso: una bolita por concepto ya cubierto */}
      <div style={{ position: "absolute", bottom: 42, left: 0, width: "100%", display: "flex", justifyContent: "center", gap: 16 }}>
        {plan.map((_, k) => <div key={k} style={{ width: 20, height: 20, borderRadius: "50%", background: k <= pIdx ? d.color : "#e4e4e4", transform: `scale(${k === pIdx ? 1.25 : 1})` }} />)}
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
        else { const idx = n; n += 1; c = <ItemScene d={ITEMS[idx]} a={(anchors as Record<string, A>)[s.id]} n={idx + 1} frames={s.frames} />; }
        return <Sequence key={s.id} from={s.from} durationInFrames={s.dur}>{c}</Sequence>;
      })}
      <Bar />
    </AbsoluteFill>
  );
};
const Bar: React.FC = () => { const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); return <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: RED, zIndex: 30 }} />; };

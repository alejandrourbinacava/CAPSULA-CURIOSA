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
// envoltorio del beat: los elementos ENTRAN (stagger interno) y el grupo SALE antes del siguiente
const BeatWrap: React.FC<{ lf: number; beatLen: number; dir: number; children: React.ReactNode }> = ({ lf, beatLen, dir, children }) => {
  const ein = clamp(lf / 7);
  const eout = clamp((beatLen - lf) / 7); // 1 casi todo el beat, baja a 0 al final → salida
  return <div style={{ opacity: Math.min(1, ein * 1.5) * eout, transform: `translateX(${-(1 - eout) * 100 * dir}px) scale(${0.95 + 0.05 * eout})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, width: "100%" }}>{children}</div>;
};

type Beat = { f: number; text: string; icon?: string; iconFile?: string | null; iconColorful?: boolean; file: string | null; kind: string | null; bullets?: string[] };
type Entry = { ref?: string | null; beats: Beat[] };
const BEATS = beatsData as Record<string, Entry | Beat[]>;
const refOf = (id: string): string | null => { const e = BEATS[id]; return e && !Array.isArray(e) ? (e.ref || null) : null; };
// icono/dibujo vectorial (Iconify) en círculo; colorido = fondo blanco, monocromo = fondo color
const IconChip: React.FC<{ b: Beat; c: string; size: number }> = ({ b, c, size }) => {
  if (!b.iconFile) return null;
  const br = `${Math.max(5, size * 0.026)}px solid #111`;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: b.iconColorful ? "#fff" : c, border: br, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,.16)" }}>
    <Img src={staticFile(b.iconFile)} style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain", filter: b.iconColorful ? "none" : "brightness(0)" }} />
  </div>;
};

// imagen/clip/gif real GRANDE (protagonista, estilo Explainer Chris)
const BigMedia: React.FC<{ file: string; kind: string | null; from: number; accent: string; w: number; h: number }> = ({ file, kind, from, accent, w, h }) => {
  if (kind === "logo") return <div style={{ width: w, height: h + 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}><Img src={staticFile(file)} style={{ maxWidth: "100%", maxHeight: h, objectFit: "contain" }} /></div>;
  return <div style={{ width: w, borderRadius: 22, overflow: "hidden", border: `8px solid ${accent}`, boxShadow: "0 26px 64px rgba(0,0,0,.28)", background: "#fff", lineHeight: 0 }}>
    {kind === "gif" ? <Gif src={staticFile(file)} width={w} height={h} fit="cover" />
      : kind === "img" ? <div style={{ width: "100%", height: h, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}><Img src={staticFile(file)} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /></div>
        : <Sequence from={from} layout="none"><OffthreadVideo src={staticFile(file)} muted style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} /></Sequence>}
  </div>;
};

const ItemScene: React.FC<{ d: Item; n: number }> = ({ d, n }) => {
  const frame = useCurrentFrame();
  const entry = BEATS[d.id];
  const bts: Beat[] = Array.isArray(entry) ? entry : (entry?.beats || []);
  const ref: string | null = Array.isArray(entry) ? null : (entry?.ref || null);
  if (!bts.length) return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Audio src={staticFile(`voz1deep/${d.id}.mp3`)} /><Chip n={d.main} c={d.color} size={320} /></AbsoluteFill>;
  let bi = 0; for (let k = 0; k < bts.length; k++) if (frame >= bts[k].f) bi = k;
  const b = bts[bi];
  const isTitle = bi === 0;
  const label = b.text || d.name;

  // palabra a mano (estilo pizarra) con color de acento alterno
  const hword = (t: string, big: number, small: number, col: string) => <div style={{ fontFamily: HAND, fontSize: t.length > 16 ? small : big, fontWeight: "bold", color: col, textAlign: "center", maxWidth: 740, lineHeight: 1.05 }}>{t}</div>;
  // un elemento del lienzo: imagen real / lista de datos / vector-icono+palabra (mascota solo a veces)
  const Slot: React.FC<{ bb: Beat; idx: number }> = ({ bb, idx }) => {
    if (bb.file) return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative" }}><BigMedia file={bb.file} kind={bb.kind} from={bb.f} accent={d.color} w={720} h={332} />
        {bb.iconFile && <div style={{ position: "absolute", top: -24, left: -24 }}><IconChip b={bb} c={d.color} size={92} /></div>}</div>
      {hword(bb.text, 46, 34, "#141414")}
    </div>;
    if (bb.bullets && bb.bullets.length) return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>{bb.iconFile && <div style={{ transform: bob(frame) }}><IconChip b={bb} c={d.color} size={100} /></div>}{hword(bb.text, 46, 40, "#141414")}</div>
      {bb.bullets.map((bl, k) => <div key={k} style={{ fontFamily: HAND, fontSize: 38, display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ color: d.color, fontWeight: 900 }}>▸</span><span style={{ maxWidth: 640 }}>{bl}</span></div>)}
    </div>;
    const col = idx % 3 === 0 ? d.color : "#141414";
    // FIGURA STICKMAN reaccionando (no el logo del canal)
    if (idx % 4 === 2) return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ transform: `${bob(frame, 2.5)} scaleX(${idx % 8 >= 4 ? -1 : 1})`, transformOrigin: "bottom center" }}>
        <Stick pose={(["pointR", "idle", "hip", "pointL2R"] as const)[idx % 4]} headSize={112} head={<g><circle cx={50} cy={50} r={44} fill="#fff" stroke="#111" strokeWidth={5} /><circle cx={38} cy={47} r={5.5} fill="#111" /><circle cx={62} cy={47} r={5.5} fill="#111" /><path d="M37,64 Q50,73 63,64" stroke="#111" strokeWidth={4} fill="none" strokeLinecap="round" /></g>} />
      </div>
      {hword(bb.text, 60, 44, col)}
    </div>;
    // con icono vectorial relevante → icono + palabra; sin icono bueno → SOLO la palabra grande (nada de "?")
    if (bb.iconFile) return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ transform: bob(frame) }}><IconChip b={bb} c={d.color} size={200} /></div>
      {hword(bb.text, 66, 48, col)}
    </div>;
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", maxWidth: 800 }}>{hword(bb.text, 92, 66, col)}</div>;
  };

  let main: React.ReactNode;
  if (isTitle) {
    const p = clamp((frame - b.f) / 10); const s = p < 0.6 ? 0.5 + 0.6 * (p / 0.6) : 1.1 - 0.1 * ((p - 0.6) / 0.4);
    main = <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "160px 90px 100px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, opacity: Math.min(1, p * 1.6), transform: `scale(${Math.max(0, s)})` }}>
        {ref ? <BigMedia file={ref} kind={/\.(mp4|webm)$/i.test(ref) ? "vid" : "img"} from={b.f} accent={d.color} w={1120} h={590} />
          : b.file ? <BigMedia file={b.file} kind={b.kind} from={b.f} accent={d.color} w={1120} h={590} />
            : <div style={{ transform: bob(frame) }}><IconChip b={b} c={d.color} size={320} /></div>}
        <T s={label.length > 20 ? 74 : 104} heavy>{label}</T>
      </div>
    </AbsoluteFill>;
  } else {
    // LIENZO que se llena: agrupa los beats en paneles de 4 slots; van apareciendo uno a uno y SE QUEDAN
    const POS = [{ x: 545, y: 425 }, { x: 1375, y: 425 }, { x: 545, y: 855 }, { x: 1375, y: 855 }];
    const idx = bi - 1, panel = Math.floor(idx / 4), startK = panel * 4 + 1;
    const slots: number[] = []; for (let k = startK; k <= bi; k++) slots.push(k);
    main = <AbsoluteFill>
      {slots.map((k) => {
        const bb = bts[k], si = k - startK, pos = POS[si] || POS[3];
        const p = clamp((frame - bb.f) / 9), s = p < 0.6 ? 0.4 + 0.8 * (p / 0.6) : 1.16 - 0.16 * ((p - 0.6) / 0.4);
        const fx = (si % 2 === 0 ? -1 : 1) * 90 * (1 - p);
        return <div key={k} style={{ position: "absolute", left: pos.x, top: pos.y, opacity: Math.min(1, p * 1.7), transform: `translate(-50%,-50%) translate(${fx}px,${(1 - p) * -45}px) scale(${Math.max(0, s)})` }}><Slot bb={bb} idx={k} /></div>;
      })}
    </AbsoluteFill>;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfbfa" }}>
      <Audio src={staticFile(`voz1deep/${d.id}.mp3`)} />
      <div style={{ position: "absolute", top: 40, right: 70, fontFamily: HEAVY, fontSize: 54, fontWeight: 900, color: "#dcdcdc", zIndex: 5 }}>{n}<span style={{ fontSize: 28 }}>/{ITEMS.length}</span></div>
      <div style={{ position: "absolute", top: 40, left: 70, display: "flex", alignItems: "center", gap: 16, zIndex: 5 }}>
        {ref && <Img src={staticFile(ref)} style={{ width: 132, height: 82, objectFit: "cover", borderRadius: 10, border: `3px solid ${d.color}`, boxShadow: "0 6px 16px rgba(0,0,0,.18)" }} />}
        <div style={{ fontFamily: HEAVY, fontSize: 34, fontWeight: 900, color: d.color, maxWidth: 820 }}>{d.name}</div>
      </div>
      <div style={{ position: "absolute", bottom: 34, left: 0, width: "100%", display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", padding: "0 180px", zIndex: 5 }}>
        {bts.map((_, k) => <div key={k} style={{ width: 15, height: 15, borderRadius: "50%", background: k <= bi ? d.color : "#e4e4e4", transform: `scale(${k === bi ? 1.35 : 1})` }} />)}
      </div>
      {main}
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
      {i > 0 && (() => { const it = ITEMS[(i - 1) % ITEMS.length]; const rf = refOf(it.id); return (
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", transform: `scale(${pop}) ${bob(frame)}` }}>
            {rf ? <div style={{ borderRadius: 20, overflow: "hidden", border: `7px solid ${it.color}`, boxShadow: "0 20px 50px rgba(0,0,0,.2)", background: "#fff", padding: 10 }}><Img src={staticFile(rf)} style={{ width: 460, height: 300, objectFit: "contain" }} /></div> : <Chip n={it.main} c={it.color} size={340} />}
          </div>
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
        {ITEMS.map((it, k) => { const p = clamp((frame - k * per) / 10); const rf = refOf(it.id); return (
          <div key={k} style={{ textAlign: "center", opacity: p, transform: `scale(${lerp3(p, 0.3, 1.12, 1)}) ${bob(frame + k)}`, width: 240 }}>
            {rf ? <div style={{ borderRadius: 12, overflow: "hidden", border: `4px solid ${it.color}`, background: "#fff", padding: 6, display: "inline-block" }}><Img src={staticFile(rf)} style={{ width: 200, height: 128, objectFit: "contain" }} /></div> : <Chip n={it.main} c={it.color} size={150} />}
            <div style={{ fontFamily: HAND, fontSize: 24, marginTop: 4, maxWidth: 230, lineHeight: 1 }}>{it.name}</div>
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

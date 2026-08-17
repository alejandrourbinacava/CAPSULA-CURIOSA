import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stick, FaceConfused, FaceRage } from "./components/parts";
import { Paranoide } from "./components/faces";

const HAND = "'Comic Sans MS','Segoe Print',cursive";
const HEAVY = "'Arial Black',Impact,system-ui,sans-serif";
const RED = "#e2231a";
const ICON = (n: string) => staticFile(`icons/${n}.svg`);
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const lerp3 = (t: number, a: number, b: number, c: number) => t < 0.55 ? a + (b - a) * (t / 0.55) : b + (c - b) * ((t - 0.55) / 0.45);
const ap = (lf: number, delay: number, dur = 10) => clamp((lf - delay) / dur);
const bob = (f: number, a = 2) => `rotate(${Math.sin(f / 11) * a}deg)`;

const Chip: React.FC<{ n: string; c: string; size: number }> = ({ n, c, size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: c, border: `${Math.max(5, size * 0.026)}px solid #111`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,.16)" }}>
    <Img src={ICON(n)} style={{ width: size * 0.54, height: size * 0.54 }} />
  </div>
);
const El: React.FC<{ p: number; x: number; y: number; from?: number; fromY?: number; children: React.ReactNode; z?: number }> = ({ p, x, y, from = 0, fromY = 0, children, z }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translate(${(1 - p) * from}px,${(1 - p) * fromY}px) scale(${lerp3(p, 0.4, 1.09, 1)})`, opacity: Math.min(1, p * 1.3), zIndex: z }}>{children}</div>
);
const T: React.FC<{ s?: number; c?: string; w?: number; children: React.ReactNode; heavy?: boolean }> = ({ s = 60, c = "#141414", w = 1000, children, heavy }) => (
  <div style={{ fontFamily: heavy ? HEAVY : HAND, fontWeight: heavy ? 900 : "normal", fontSize: s, color: c, width: w, textAlign: "center", lineHeight: 1.15 }}>{children}</div>
);
const Win: React.FC<{ img?: string; video?: string; videoFrom?: number; w: number; title: string; accent?: string; h?: number }> = ({ img, video, videoFrom = 0, w, title, accent = "#e57373", h = 430 }) => (
  <div style={{ width: w, borderRadius: 24, overflow: "hidden", border: `6px solid ${accent}`, boxShadow: "0 24px 60px rgba(0,0,0,.22)", background: "#fff" }}>
    <div style={{ background: accent, padding: "12px 18px", display: "flex", gap: 8, alignItems: "center" }}><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", opacity: .9 }} /><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", opacity: .6 }} /><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", opacity: .4 }} /><span style={{ marginLeft: 10, fontFamily: HAND, fontSize: 22, color: "#fff", fontWeight: "bold" }}>{title}</span></div>
    {video
      ? <Sequence from={videoFrom} layout="none"><OffthreadVideo src={staticFile(video)} muted style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} /></Sequence>
      : <Img src={staticFile(img!)} style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />}
  </div>
);

// escenas con límites en frames SINCRONIZADOS a la narración
const S = [0, 226, 354, 558, 773, 956, 1224, 1546, 1590];

export const ParanoideReal: React.FC = () => {
  const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  const si = Math.max(0, S.findIndex((s, k) => frame >= s && frame < (S[k + 1] ?? 1e9)));
  const lf = frame - S[si];

  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfbfa", fontFamily: HAND }}>
      <Audio src={staticFile("voz1deep/v02.mp3")} />
      <div style={{ position: "absolute", top: 22, right: 30, width: 84, height: 84, zIndex: 20 }}><Img src={ICON("brain")} style={{ width: "100%", height: "100%" }} /></div>
      <div style={{ position: "absolute", top: 26, left: 34, fontSize: 30, color: "#cfcfcf", zIndex: 20 }}>@CapsulaCuriosa</div>

      {/* S0 [0-226] título · "=desconfianza" SINCRONIZADO a frame 118 (delay 118) */}
      {si === 0 && <>
        <El p={ap(lf, 0)} x={960} y={420}><div style={{ transform: bob(frame) }}><Chip n="eye" c="#e57373" size={360} /></div></El>
        <El p={ap(lf, 40)} x={960} y={700}><T s={124} heavy>TRASTORNO <span style={{ color: RED }}>PARANOIDE</span></T></El>
        <El p={ap(lf, 118)} x={960} y={850} fromY={40}><T s={82} c={RED} heavy>= DESCONFIANZA</T></El>
      </>}

      {/* S1 [226-354] "quieren engañarme" (frame 226) */}
      {si === 1 && <>
        <El p={ap(lf, 0)} x={360} y={560} from={-160}><div style={{ transform: bob(frame, 2), transformOrigin: "bottom center" }}><Stick head={<Paranoide />} pose="idle" /></div></El>
        <El p={ap(lf, 8)} x={1230} y={330}><T s={70} w={1100} heavy>«TODOS quieren<br />engañarme»</T></El>
        <El p={ap(lf, 46)} x={1300} y={720} from={140}><Win img="media/para_sospecha.jpg" w={780} title="Sospecha de todos" accent="#90a4ae" h={360} /></El>
      </>}

      {/* S2 [354-558] POR FUERA (354) / POR DENTRO SINCRONIZADO frame 473 (delay 119) */}
      {si === 2 && <>
        <El p={ap(lf, 0)} x={560} y={410}><T s={62} heavy>POR FUERA</T></El>
        <El p={ap(lf, 22)} x={560} y={590}><div style={{ transform: bob(frame) }}><Chip n="shield-alert" c="#607d8b" size={270} /></div></El>
        <El p={ap(lf, 55)} x={560} y={780}><T s={52} w={700}>Alerta y a la defensiva</T></El>
        <El p={ap(lf, 119)} x={1380} y={410}><T s={62} c={RED} heavy>POR DENTRO</T></El>
        <El p={ap(lf, 141)} x={1380} y={590}><div style={{ transform: bob(frame + 5) }}><Chip n="ghost" c="#e57373" size={270} /></div></El>
        <El p={ap(lf, 174)} x={1380} y={780}><T s={52} w={700}>Se siente en peligro</T></El>
      </>}

      {/* S3 [558-773] SEÑALES: sospecha (558) · ataques SINCRONIZADO frame 730 (delay 172) */}
      {si === 3 && <>
        <El p={ap(lf, 0)} x={960} y={230}><T s={96} c={RED} heavy>SEÑALES</T></El>
        <El p={ap(lf, 15)} x={620} y={620}><div style={{ transform: bob(frame) }}><Chip n="eye" c="#ffd54f" size={290} /></div></El>
        <El p={ap(lf, 45)} x={620} y={840}><T s={54} w={600}>Sospecha de todos</T></El>
        <El p={ap(lf, 172)} x={1300} y={620}><div style={{ transform: bob(frame + 6) }}><Chip n="shield-alert" c="#ff8c1a" size={290} /></div></El>
        <El p={ap(lf, 200)} x={1300} y={840}><T s={54} w={620}>Todo es un ataque</T></El>
      </>}

      {/* S4 [773-956] rencor (773) + reacción muñeco */}
      {si === 4 && <>
        <El p={ap(lf, 0)} x={620} y={560} from={-140}><div style={{ transform: bob(frame, 3), transformOrigin: "bottom center" }}><Stick head={<FaceRage />} pose="hip" /></div></El>
        <El p={ap(lf, 40)} x={1300} y={470}><div style={{ transform: bob(frame + 4) }}><Chip n="hourglass" c="#4db6ac" size={290} /></div></El>
        <El p={ap(lf, 80)} x={1300} y={720}><T s={62} w={820} heavy>Guarda rencor<br />durante AÑOS</T></El>
      </>}

      {/* S5 [956-1224] causa: genética (956) + foto cerebro real */}
      {si === 5 && <>
        <El p={ap(lf, 0)} x={960} y={230}><T s={60} c="#bbb" heavy>¿POR QUÉ APARECE?</T></El>
        <El p={ap(lf, 30)} x={520} y={620} from={-120}><Win img="media/para_cerebro.jpg" w={720} title="El cerebro" accent="#607d8b" /></El>
        <El p={ap(lf, 90)} x={1420} y={560}><T s={72} w={800} heavy>Genética +<br />traiciones</T></El>
      </>}

      {/* S6 [1224-1546] ejemplo: mensaje (1224) · "me despiden" SINCRONIZADO frame 1396 (delay 172) */}
      {si === 6 && <>
        <El p={ap(lf, 0)} x={300} y={560} from={-150}><div style={{ transform: bob(frame, 2), transformOrigin: "bottom center" }}><Stick head={<FaceConfused />} pose="pointR" /></div></El>
        <El p={ap(lf, 30)} x={560} y={560}><div style={{ display: "flex", gap: 2 }}>{[0, 1, 2].map(k => <span key={k} style={{ fontFamily: HEAVY, fontSize: 90, fontWeight: 900, color: RED, opacity: 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / 6 - k)) }}>›</span>)}</div></El>
        <El p={ap(lf, 55)} x={1240} y={500} from={140}><Win video="media/para_video.mp4" videoFrom={1224} w={900} title="Mensaje del jefe…" /></El>
        <El p={ap(lf, 172)} x={1240} y={880}><T s={64} c={RED} heavy>«me van a despedir»</T></El>
      </>}

      {/* S7 [1546-1590] cómo actuar (1546) */}
      {si === 7 && <>
        <El p={ap(lf, 0)} x={960} y={300}><T s={94} c={RED} heavy>CÓMO ACTUAR</T></El>
        <El p={ap(lf, 14)} x={640} y={620}><div style={{ transform: bob(frame, 3) }}><Chip n="handshake" c="#4db6ac" size={280} /></div></El>
        <El p={ap(lf, 30)} x={1300} y={620}><T s={76} w={880} heavy>Sé claro, directo<br />y coherente</T></El>
      </>}

      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: RED, zIndex: 20 }} />
    </AbsoluteFill>
  );
};

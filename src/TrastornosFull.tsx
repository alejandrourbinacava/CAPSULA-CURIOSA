import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { IconCircle, Arrow, Stick } from "./components/parts";
import {
  Paranoide, Esquizoide, Esquizotipico, Antisocial, Limite,
  Histrionico, Narcisista, Evitativo, Dependiente, Obsesivo,
} from "./components/faces";
import manifest from "../public/voz1deep/manifest.json";

export const PAD2 = 6;
const HAND = "'Comic Sans MS', 'Segoe Print', cursive";
const HEAVY = "'Arial Black', Impact, system-ui, sans-serif";
const RED = "#e2231a";

type EMO = { fuera: string; dentro: string; senales: string[]; causa: string; consejo: string };
type DD = { Face: React.FC; color: string; group: string; def: string; fuera: string; dentro: string; senales: string[]; causa: string; ejemplo: string; meme: string; consejo: string; emo?: EMO };
const DATA: Record<string, DD> = {
  Paranoide: { Face: Paranoide, color: "#e57373", group: "GRUPO A", def: "Desconfía de todo y de todos", fuera: "Alerta y a la defensiva", dentro: "Se siente en peligro", senales: ["Sospecha de todos", "Todo le parece un ataque", "Guarda rencor durante años"], causa: "Genética + traiciones tempranas", ejemplo: "Un mensaje ambiguo del jefe = «me van a despedir»", meme: "«¿por qué me miras así?» 👀", consejo: "Sé claro, directo y coherente", emo: { fuera: "🛡️", dentro: "😨", senales: ["👀", "⚔️", "⏳"], causa: "🧬", consejo: "🤝" } },
  Esquizoide: { Face: Esquizoide, color: "#90a4ae", group: "GRUPO A", def: "Prefiere la soledad de verdad", fuera: "Frío y distante", dentro: "Sin deseo de conectar", senales: ["Elige estar solo", "Frialdad emocional", "Ni elogio ni crítica le afectan"], causa: "Temperamento distante innato", ejemplo: "Rechaza un ascenso para seguir trabajando solo", meme: "«prefiero estar solo, gracias»", consejo: "Respeta su espacio" },
  "Esquizotípico": { Face: Esquizotipico, color: "#ba68c8", group: "GRUPO A", def: "Un mundo interior extraño", fuera: "Excéntrico e inusual", dentro: "Ve conexiones ocultas", senales: ["Pensamiento mágico", "Supersticiones intensas", "Habla y viste raro"], causa: "Espectro leve de esquizofrenia", ejemplo: "Cree que un sueño le predice la semana", meme: "«el sueño me lo advirtió» 🔮", consejo: "Paciencia y nada de burlas" },
  Antisocial: { Face: Antisocial, color: "#607d8b", group: "GRUPO B", def: "No siente culpa (psicopatía)", fuera: "Encantador y persuasivo", dentro: "Cero empatía", senales: ["Miente y manipula", "Ignora las normas", "Cero remordimiento"], causa: "Genética + entorno duro", ejemplo: "Estafa a un amigo y no siente nada", meme: "solo le molesta que lo pillen 😐", consejo: "Pon límites firmes" },
  "Límite": { Face: Limite, color: "#f06292", group: "GRUPO B", def: "Montaña rusa emocional", fuera: "Intensidad y drama", dentro: "Vacío e inseguridad", senales: ["Miedo al abandono", "Del amor al odio", "Impulsividad y vacío"], causa: "Sensibilidad + abandono", ejemplo: "Tarda en responder → «me va a dejar»", meme: "«te amo / me vas a dejar» 💔", consejo: "Estabilidad y límites amables" },
  "Histriónico": { Face: Histrionico, color: "#ffb300", group: "GRUPO B", def: "Necesita ser el centro", fuera: "Simpatía y seducción", dentro: "Depende de las miradas", senales: ["Dramatiza todo", "Seduce por atención", "Humor cambiante"], causa: "Atención solo al exagerar", ejemplo: "Exagera anécdotas para captar miradas", meme: "¡miradme todos! ✨", consejo: "Atención cuando está calmado" },
  Narcisista: { Face: Narcisista, color: "#ffd54f", group: "GRUPO B", def: "Se cree superior y especial", fuera: "Seguridad aplastante", dentro: "Autoestima frágil", senales: ["Ansía admiración", "Cero empatía", "Ego frágil por dentro"], causa: "Sobrevaloración o frialdad", ejemplo: "Una crítica pequeña → rabia enorme", meme: "«¿una crítica? ¿a MÍ?» 😤", consejo: "No alimentes su ego" },
  Evitativo: { Face: Evitativo, color: "#4db6ac", group: "GRUPO C", def: "Quiere conectar, pero teme", fuera: "Tímido y distante", dentro: "Anhela pertenecer", senales: ["Miedo al rechazo", "Se siente inferior", "Terror a la crítica"], causa: "Rechazo o crítica temprana", ejemplo: "Se prepara para la fiesta… y no va", meme: "mejor invento una excusa… 😰", consejo: "Pasos pequeños, sin presión" },
  Dependiente: { Face: Dependiente, color: "#7986cb", group: "GRUPO C", def: "«No puedo solo»", fuera: "Amable y complaciente", dentro: "Miedo a valerse solo", senales: ["No decide solo", "Evita el desacuerdo", "Teme la soledad"], causa: "Crianza sobreprotectora", ejemplo: "Pregunta a 3 antes de elegir cena", meme: "«¿tú qué harías?» ×3 🥺", consejo: "Anímale a decidir por sí mismo" },
  Obsesivo: { Face: Obsesivo, color: "#4dd0e1", group: "GRUPO C", def: "Orden y control perfectos", fuera: "El trabajador ideal", dentro: "Atrapado por sus reglas", senales: ["Perfeccionismo rígido", "No sabe delegar", "Adicto al trabajo"], causa: "Solo se valoraba el logro", ejemplo: "No entrega por ajustar tipografías", meme: "3 días ajustando márgenes 📐", consejo: "«Hecho» gana a «perfecto tarde»" },
};
const ALL = [Paranoide, Esquizoide, Esquizotipico, Antisocial, Limite, Histrionico, Narcisista, Evitativo, Dependiente, Obsesivo];
const NAMES = ["Paranoide","Esquizoide","Esquizotípico","Antisocial","Límite","Histriónico","Narcisista","Evitativo","Dependiente","Obsesivo"];
const COLORS = ["#e57373","#90a4ae","#ba68c8","#607d8b","#f06292","#ffb300","#ffd54f","#4db6ac","#7986cb","#4dd0e1"];

const bob = (f: number, a = 2, s = 11) => `rotate(${Math.sin(f / s) * a}deg)`;
const floatY = (f: number, a = 10, s = 12) => `translateY(${Math.sin(f / s) * a}px)`;
const drift = (f: number) => `scale(${1 + 0.008 * Math.sin(f / 45)})`; // micro-zoom continuo
const sp = (frame: number, fps: number, d = 13, stiff?: number) => spring({ frame, fps, config: stiff ? { damping: d, stiffness: stiff } : { damping: d } });
// entrada "pro": fundido + desenfoque al cambiar de beat
const enterFX = (ml: number): React.CSSProperties => {
  const p = Math.max(0, Math.min(1, ml / 11));
  return { opacity: p, filter: `blur(${(1 - p) * 12}px)` };
};
// CÁMARA: movimiento CONTINUO durante todo el beat (mata el efecto PowerPoint)
// desliza al entrar + zoom lento + paneo constante mientras dura el beat
const cameraTransform = (ml: number, len: number): string => {
  const t = Math.min(1, ml / Math.max(1, len));
  const slideIn = (1 - Math.min(1, ml / 9)) * 85;   // entra empujando desde la derecha
  const pan = -18 * t;                               // paneo continuo
  const zoom = 1.015 + 0.075 * t;                    // zoom lento constante
  return `translateX(${slideIn + pan}px) scale(${zoom})`;
};
// textura de papel sutil (ruido SVG) + viñeta muy leve
const PAPER = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const Check: React.FC<{ s: number }> = ({ s }) => (
  <svg viewBox="0 0 40 40" width={62} height={62} style={{ transform: `scale(${s})`, flexShrink: 0 }}>
    <circle cx={20} cy={20} r={17} fill={RED} />
    <path d="M12 21 l5 6 l11 -15" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Q: React.FC<{ x: number; y: number; f: number; c?: string; sz?: number }> = ({ x, y, f, c = RED, sz = 70 }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: HEAVY, fontSize: sz, fontWeight: 900, color: c, opacity: 0.8, transform: floatY(f, 12, 10) }}>?</div>
);
// Panel/clip enmarcado: esquinas redondeadas + borde de color + sombra + barra de ventana
const FramedPanel: React.FC<{ accent: string; w: number; title?: string; children: React.ReactNode }> = ({ accent, w, title, children }) => (
  <div style={{ width: w, borderRadius: 28, background: "#fff", border: `5px solid ${accent}`, boxShadow: "0 26px 60px rgba(0,0,0,.20)", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 20px", background: accent }}>
      <span style={{ width: 15, height: 15, borderRadius: "50%", background: "#fff", opacity: 0.95 }} />
      <span style={{ width: 15, height: 15, borderRadius: "50%", background: "#fff", opacity: 0.65 }} />
      <span style={{ width: 15, height: 15, borderRadius: "50%", background: "#fff", opacity: 0.4 }} />
      {title && <span style={{ marginLeft: 14, fontFamily: HAND, fontSize: 26, color: "#fff", fontWeight: "bold" }}>{title}</span>}
    </div>
    <div style={{ padding: "44px 50px" }}>{children}</div>
  </div>
);
// Chevrons de flujo ›››
const Chevrons: React.FC<{ f: number; accent: string; scale?: number }> = ({ f, accent, scale = 1 }) => (
  <div style={{ display: "flex", gap: 2, transform: `scale(${scale})` }}>
    {[0, 1, 2, 3].map((k) => {
      const o = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f / 6 - k * 0.9));
      return <span key={k} style={{ fontFamily: HEAVY, fontSize: 90, fontWeight: 900, color: accent, opacity: o, lineHeight: 1 }}>›</span>;
    })}
  </div>
);
// Emoji grande (icono único por escena) con leve balanceo
const Emo: React.FC<{ e: string; size?: number; f?: number }> = ({ e, size = 300, f = 0 }) => (
  <div style={{ fontSize: size, lineHeight: 1, transform: bob(f, 2.5), filter: "drop-shadow(0 10px 16px rgba(0,0,0,.15))" }}>{e}</div>
);
// helper: índice de "beat" y frame local al beat
const useBeat = (frame: number, frames: number, n: number) => {
  const len = frames / n;
  const i = Math.min(n - 1, Math.floor(frame / len));
  return { i, ml: frame - i * len, len };
};

/* ================= INTRO (8 beats) ================= */
const Intro: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const { i, ml, len } = useBeat(frame, frames, 8);
  const pop = sp(ml, fps, 12, 150);
  const faceBeat = (F: React.FC, color: string, txt: string, hi: string) => (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${pop}) ${bob(frame)}` }}><IconCircle color={color} size={430}><F /></IconCircle></div>
      <div style={{ position: "absolute", bottom: 210, fontFamily: HEAVY, fontSize: 74, fontWeight: 900, color: "#141414", textAlign: "center", opacity: sp(ml - 8, fps) }}>
        {txt} <span style={{ color: RED }}>{hi}</span>
      </div>
    </AbsoluteFill>
  );
  const bigText = (a: string, b: string, bRed?: boolean) => (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", fontFamily: HEAVY, transform: `scale(${pop})` }}>
        <div style={{ fontSize: 96, fontWeight: 900, color: "#141414" }}>{a}</div>
        <div style={{ fontSize: 110, fontWeight: 900, color: bRed ? RED : "#141414" }}>{b}</div>
      </div>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ transform: cameraTransform(ml, len), ...enterFX(ml) }}>
      <Audio src={staticFile("voz1deep/v00.mp3")} />
      <div style={{ position: "absolute", top: 28, width: "100%", textAlign: "center", fontFamily: HAND, fontSize: 26, color: "#cfcfcf" }}>Contenido divulgativo · no sustituye un diagnóstico profesional</div>
      {i === 0 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Q x={260} y={240} f={frame} /><Q x={1560} y={280} f={frame + 20} c="#111" /><Q x={300} y={720} f={frame + 40} c="#111" /><Q x={1600} y={740} f={frame + 10} /><div style={{ textAlign: "center", fontFamily: HEAVY, transform: `scale(${pop})` }}><div style={{ fontSize: 92, fontWeight: 900, color: "#141414" }}>¿Conoces a</div><div style={{ fontSize: 128, fontWeight: 900, color: RED }}>ALGUIEN ASÍ?</div></div></AbsoluteFill>)}
      {i === 1 && faceBeat(Paranoide, "#e57373", "El que", "DESCONFÍA de todo")}
      {i === 2 && faceBeat(Histrionico, "#ffb300", "El que necesita ser el", "CENTRO")}
      {i === 3 && faceBeat(Dependiente, "#7986cb", "El que no soporta estar", "SOLO")}
      {i === 4 && bigText("No es solo carácter…", "es al EXTREMO", true)}
      {i === 5 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center", fontFamily: HEAVY, transform: `scale(${pop})` }}><div style={{ fontSize: 190, fontWeight: 900, color: RED, lineHeight: 1 }}>10</div><div style={{ fontSize: 74, fontWeight: 900, color: "#141414" }}>TRASTORNOS DE LA</div><div style={{ fontSize: 74, fontWeight: 900, color: "#141414" }}>PERSONALIDAD</div></div></AbsoluteFill>)}
      {i === 6 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ display: "flex", flexWrap: "wrap", width: 1150, justifyContent: "center", gap: 20 }}>{ALL.map((F, k) => (<div key={k} style={{ transform: `scale(${sp(ml - k * 4, fps, 12)}) ${bob(frame + k)}` }}><IconCircle color={COLORS[k]} size={150}><F /></IconCircle></div>))}</div></AbsoluteFill>)}
      {i === 7 && bigText("¿A cuántos", "RECONOCERÁS?", true)}
    </AbsoluteFill>
  );
};

/* ================= GRUPOS (3 beats, faces cascando) ================= */
const Grupos: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const { i, ml, len } = useBeat(frame, frames, 3);
  const groups = [
    { t: "GRUPO A", d: "Raros / excéntricos", idx: [0, 1, 2] },
    { t: "GRUPO B", d: "Dramáticos / emocionales", idx: [3, 4, 5, 6] },
    { t: "GRUPO C", d: "Ansiosos / temerosos", idx: [7, 8, 9] },
  ];
  const g = groups[i];
  const tp = sp(ml, fps, 12, 150);
  return (
    <AbsoluteFill style={{ transform: cameraTransform(ml, len), alignItems: "center", justifyContent: "center", ...enterFX(ml) }}>
      <Audio src={staticFile("voz1deep/v01.mp3")} />
      <div style={{ position: "absolute", top: 90, textAlign: "center", transform: `scale(${tp})` }}>
        <div style={{ fontFamily: HEAVY, fontSize: 96, fontWeight: 900, color: RED }}>{g.t}</div>
        <div style={{ fontFamily: HAND, fontSize: 44, color: "#555" }}>{g.d}</div>
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 120 }}>
        {g.idx.map((k, j) => {
          const s = sp(ml - 12 - j * (len / g.idx.length) * 0.5, fps, 12);
          const F = ALL[k];
          return (
            <div key={k} style={{ textAlign: "center", transform: `scale(${s}) ${bob(frame + k)}` }}>
              <IconCircle color={COLORS[k]} size={200}><F /></IconCircle>
              <div style={{ fontFamily: HAND, fontSize: 32, marginTop: 8 }}>{NAMES[k]}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ================= BLOQUE TRASTORNO (9 beats) ================= */
const DisorderBlock: React.FC<{ label: string; audio: string; n: number; frames: number }> = ({ label, audio, n, frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const d = DATA[label];
  const { i, ml, len } = useBeat(frame, frames, 12);
  const pop = sp(ml, fps, 12, 150);

  const Header = (
    <>
      <div style={{ position: "absolute", top: 46, right: 70, fontFamily: HEAVY, fontSize: 58, fontWeight: 900, color: "#dcdcdc" }}>{n}<span style={{ fontSize: 32 }}>/10</span></div>
      <div style={{ position: "absolute", top: 60, left: 80, fontFamily: HEAVY, fontSize: 30, fontWeight: 900, color: d.color }}>{d.group}</div>
    </>
  );
  const Face = d.Face;
  const senalesView = (upto: number) => {
    const curEmo = d.emo?.senales[upto - 1];
    return (
      <>
        <div style={{ position: "absolute", left: 190, top: 340, transform: `scale(${sp(ml, fps)})` }}>
          {curEmo ? <Emo e={curEmo} size={300} f={frame} /> : <div style={{ transform: `scale(0.8) ${bob(frame)}` }}><IconCircle color={d.color} size={320}><Face /></IconCircle></div>}
        </div>
        <div style={{ position: "absolute", left: 620, top: 190, fontFamily: HEAVY, fontSize: 66, fontWeight: 900, color: RED }}>SEÑALES</div>
        {d.senales.slice(0, upto).map((s, k) => {
          const isNew = k === upto - 1; const en = isNew ? sp(ml, fps, 14) : 1;
          return (<div key={k} style={{ position: "absolute", left: 620, top: 320 + k * 130, display: "flex", alignItems: "center", gap: 24, opacity: en, transform: `translateX(${(1 - en) * 60}px)` }}><Check s={en} /><div style={{ fontFamily: HAND, fontSize: 60, color: "#141414" }}>{s}</div></div>);
        })}
      </>
    );
  };
  const contraste = (title: string, text: string, accent: string, emoji?: string) => (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", left: 200, top: 360, transform: `scale(${pop})` }}>
        {emoji ? <Emo e={emoji} size={320} f={frame} /> : <div style={{ transform: `scale(0.85) ${bob(frame)}` }}><IconCircle color={d.color} size={340}><Face /></IconCircle></div>}
      </div>
      <div style={{ position: "absolute", left: 700, top: 330, transform: `scale(${pop})` }}>
        <div style={{ fontFamily: HEAVY, fontSize: 64, fontWeight: 900, color: accent }}>{title}</div>
        <div style={{ fontFamily: HAND, fontSize: 88, color: "#141414", marginTop: 12, maxWidth: 1050 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ transform: cameraTransform(ml, len), ...enterFX(ml) }}>
      <Audio src={staticFile(`voz1deep/${audio}.mp3`)} />
      {Header}

      {/* 0 · nombre + cara */}
      {i === 0 && (<AbsoluteFill><Q x={140} y={230} f={frame} c={d.color} /><Q x={1650} y={760} f={frame + 25} c={d.color} /><div style={{ position: "absolute", left: 150, top: 300, transform: `scale(${1.05 * pop}) ${bob(frame)}` }}><IconCircle color={d.color} size={480}><Face /></IconCircle></div><div style={{ position: "absolute", left: 760, top: 420, fontFamily: HEAVY, fontSize: 130, fontWeight: 900, color: "#141414", opacity: sp(ml - 6, fps), transform: `translateX(${(1 - sp(ml - 6, fps)) * 70}px)` }}>{label}</div></AbsoluteFill>)}

      {/* 1 · definición */}
      {i === 1 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", left: 130, top: 320, transform: `scale(0.9) ${bob(frame)}` }}><IconCircle color={d.color} size={360}><Face /></IconCircle></div><div style={{ position: "absolute", left: 560, top: 300 }}><Arrow d="M15,60 C90,58 150,56 210,52" head="M210,52 L188,46 M210,52 L198,68" progress={interpolate(ml, [6, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} headOn={ml > 26} width={360} /></div><div style={{ position: "absolute", left: 720, top: 380, width: 1080, fontFamily: HEAVY, fontSize: 90, fontWeight: 900, color: RED, opacity: sp(ml - 4, fps), transform: `scale(${pop})` }}>{d.def}</div></AbsoluteFill>)}

      {/* 2 · POR FUERA / 3 · POR DENTRO */}
      {i === 2 && contraste("POR FUERA", d.fuera, "#141414", d.emo?.fuera)}
      {i === 3 && contraste("POR DENTRO", d.dentro, RED, d.emo?.dentro)}

      {/* 4,5,6 · señales acumuladas */}
      {i === 4 && <AbsoluteFill>{senalesView(1)}</AbsoluteFill>}
      {i === 5 && <AbsoluteFill>{senalesView(2)}</AbsoluteFill>}
      {i === 6 && <AbsoluteFill>{senalesView(3)}</AbsoluteFill>}

      {/* 7 · causa */}
      {i === 7 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", top: 200, fontFamily: HEAVY, fontSize: 60, fontWeight: 900, color: "#bbb", transform: `scale(${pop})` }}>¿POR QUÉ APARECE?</div><div style={{ display: "flex", alignItems: "center", gap: 44, transform: `scale(${sp(ml - 6, fps)})` }}>{d.emo?.causa ? <Emo e={d.emo.causa} size={240} f={frame} /> : <div style={{ transform: bob(frame, 3) }}><IconCircle color={d.color} size={260}><Face /></IconCircle></div>}<div style={{ fontFamily: HAND, fontSize: 82, color: "#141414", maxWidth: 1000 }}>{d.causa}</div></div></AbsoluteFill>)}

      {/* 8 · ejemplo — personaje ›› panel-clip enmarcado */}
      {i === 8 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: 110, top: 150, fontFamily: HEAVY, fontSize: 54, fontWeight: 900, color: "#bbb" }}>EJEMPLO</div>
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <div style={{ transform: `scale(${sp(ml, fps)}) ${bob(frame, 2)}`, transformOrigin: "bottom center", flexShrink: 0 }}><Stick head={<Face />} pose="hip" /></div>
          <div style={{ opacity: sp(ml - 8, fps), flexShrink: 0 }}><Chevrons f={frame} accent={d.color} /></div>
          <div style={{ opacity: sp(ml - 12, fps), transform: `translateX(${(1 - sp(ml - 12, fps)) * 90}px)` }}>
            <FramedPanel accent={d.color} w={900} title={label}>
              <div style={{ fontFamily: HAND, fontSize: 62, color: "#141414", lineHeight: 1.3 }}>{d.ejemplo}</div>
            </FramedPanel>
          </div>
        </div>
      </AbsoluteFill>)}

      {/* 9 · reacción meme */}
      {i === 9 && (<AbsoluteFill><div style={{ position: "absolute", left: 120, top: 150, fontFamily: HEAVY, fontSize: 52, fontWeight: 900, color: "#bbb" }}>EN LA VIDA REAL…</div><div style={{ position: "absolute", left: 200, top: 360, transform: `scale(${1.2 * sp(ml, fps)}) ${bob(frame, 3)}`, transformOrigin: "bottom center" }}><Stick head={<Face />} pose="hip" /></div><div style={{ position: "absolute", left: 720, top: 420, width: 1100, fontFamily: HAND, fontSize: 92, color: "#141414", transform: `scale(${pop})` }}>{d.meme}</div></AbsoluteFill>)}

      {/* 10,11 · cómo actuar */}
      {(i === 10 || i === 11) && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ transform: `scale(${i === 10 ? pop : 1}) ${floatY(frame, 6, 20)}`, width: 1300, background: "#fff", border: `8px solid ${RED}`, borderRadius: 40, padding: "60px 70px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}><div style={{ fontFamily: HEAVY, fontSize: 52, fontWeight: 900, color: RED, marginBottom: 20 }}>CÓMO ACTUAR</div><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>{d.emo?.consejo ? <Emo e={d.emo.consejo} size={130} f={frame} /> : <div style={{ transform: bob(frame) }}><IconCircle color={d.color} size={150}><Face /></IconCircle></div>}<div style={{ fontFamily: HAND, fontSize: 76, color: "#141414", maxWidth: 820, textAlign: "left" }}>{d.consejo}</div></div></div></AbsoluteFill>)}
    </AbsoluteFill>
  );
};

/* ================= CIERRE (5 beats) ================= */
const Cierre: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const { i, ml, len } = useBeat(frame, frames, 5);
  const pop = sp(ml, fps, 12, 150);
  const groupRecap = (t: string, d: string, idx: number[], col: string) => (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 120, fontFamily: HEAVY, fontSize: 90, fontWeight: 900, color: col, transform: `scale(${pop})` }}>{t}</div>
      <div style={{ position: "absolute", top: 240, fontFamily: HAND, fontSize: 46, color: "#555" }}>{d}</div>
      <div style={{ display: "flex", gap: 36, marginTop: 60 }}>{idx.map((k, j) => { const F = ALL[k]; return (<div key={k} style={{ transform: `scale(${sp(ml - 8 - j * 6, fps, 12)}) ${bob(frame + k)}` }}><IconCircle color={COLORS[k]} size={190}><F /></IconCircle></div>); })}</div>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ transform: cameraTransform(ml, len), ...enterFX(ml) }}>
      <Audio src={staticFile("voz1deep/v12.mp3")} />
      {i === 0 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: HEAVY, fontSize: 96, fontWeight: 900, transform: `scale(${pop})` }}>Y ESTOS SON <span style={{ color: RED }}>LOS 10</span></div><div style={{ position: "absolute", bottom: 120, display: "flex", flexWrap: "wrap", width: 1150, justifyContent: "center", gap: 16 }}>{ALL.map((F, k) => (<div key={k} style={{ transform: `scale(${sp(ml - 10 - k * 3, fps, 12)}) ${bob(frame + k)}` }}><IconCircle color={COLORS[k]} size={120}><F /></IconCircle></div>))}</div></AbsoluteFill>)}
      {i === 1 && groupRecap("GRUPO A", "los raros", [0, 1, 2], "#e57373")}
      {i === 2 && groupRecap("GRUPO B", "los dramáticos", [3, 4, 5, 6], "#f06292")}
      {i === 3 && groupRecap("GRUPO C", "los temerosos", [7, 8, 9], "#4db6ac")}
      {i === 4 && (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center", fontFamily: HEAVY, transform: `scale(${pop})` }}><div style={{ fontSize: 100, fontWeight: 900, color: "#141414" }}>¿Reconociste a <span style={{ color: RED }}>alguien</span>?</div><div style={{ fontFamily: HAND, fontSize: 66, color: "#141414", marginTop: 24 }}>Suscríbete a <b>Cápsula Curiosa</b> ▶</div></div></AbsoluteFill>)}
    </AbsoluteFill>
  );
};

/* ================= TIMELINE ================= */
export const timelineFull = (() => {
  let acc = 0;
  return (manifest as { id: string; label: string; frames: number }[]).map((m) => {
    const from = acc; const dur = m.frames + PAD2; acc += dur; return { ...m, from, dur };
  });
})();
export const TOTAL_FULL = timelineFull.reduce((a, s) => Math.max(a, s.from + s.dur), 0);

export const TrastornosFull: React.FC = () => {
  let n = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfbfa" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: PAPER, backgroundSize: "140px 140px", opacity: 0.05, mixBlendMode: "multiply", zIndex: 0 }} />
      <div style={{ position: "absolute", top: 22, right: 30, zIndex: 6 }}>
        <svg viewBox="-70 -70 140 140" width={96} height={96}>
          <path fill="#fff" stroke="#141414" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" d="M-55,-18 C-70,-52 -30,-72 -6,-60 C10,-78 55,-68 58,-36 C80,-28 78,12 55,22 C58,46 20,60 0,44 C-25,60 -66,44 -58,14 C-80,4 -75,-10 -55,-18 Z" />
          <path fill="none" stroke="#141414" strokeWidth={4} strokeLinecap="round" d="M-6,-60 C-9,-28 -6,12 0,44 M-30,-42 C-15,-37 -18,-18 -35,-13 M26,-48 C11,-38 19,-20 33,-16" />
        </svg>
      </div>
      <div style={{ position: "absolute", top: 26, left: 34, fontFamily: HAND, fontSize: 30, color: "#cfcfcf", zIndex: 5 }}>@CapsulaCuriosa</div>
      {timelineFull.map((s) => {
        let content: React.ReactNode;
        if (s.label === "intro") content = <Intro frames={s.frames} />;
        else if (s.label === "grupos") content = <Grupos frames={s.frames} />;
        else if (s.label === "cierre") content = <Cierre frames={s.frames} />;
        else { n += 1; content = <DisorderBlock label={s.label} audio={s.id} n={n} frames={s.frames} />; }
        return <Sequence key={s.id} from={s.from} durationInFrames={s.dur}>{content}</Sequence>;
      })}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: "100%", background: "#eee", zIndex: 9 }}><ProgressInner /></div>
    </AbsoluteFill>
  );
};
const ProgressInner: React.FC = () => {
  const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  return <div style={{ height: "100%", width: `${(frame / durationInFrames) * 100}%`, background: RED }} />;
};

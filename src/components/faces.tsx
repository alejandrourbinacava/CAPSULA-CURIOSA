import React from "react";

/* Cabezas-personaje para cada trastorno de personalidad (espacio 0..100).
   Base común: cara blanca con contorno negro + rasgos distintivos. */

const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <g>
    <circle cx={50} cy={53} r={44} fill="#fff" stroke="#111" strokeWidth={4} />
    {children}
  </g>
);
const eye = (x: number, y = 52, r = 3.6) => <circle cx={x} cy={y} r={r} fill="#111" />;

// 1 · Paranoide — mirada de reojo + gota de sudor + ceja alta
export const Paranoide: React.FC = () => (
  <Head>
    <circle cx={41} cy={52} r={7} fill="#fff" stroke="#111" strokeWidth={2} />
    <circle cx={62} cy={52} r={7} fill="#fff" stroke="#111" strokeWidth={2} />
    <circle cx={44} cy={53} r={3.2} fill="#111" /><circle cx={65} cy={53} r={3.2} fill="#111" />
    <path d="M33,42 q8,-4 15,0" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M54,40 q8,-5 16,-1" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M40,72 q10,-4 20,0" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M82,34 q5,8 0,12 q-5,-4 0,-12z" fill="#4fc3f7" stroke="#111" strokeWidth={2} />
  </Head>
);

// 2 · Esquizoide — frío/distante, ojos entrecerrados, boca recta
export const Esquizoide: React.FC = () => (
  <Head>
    <path d="M34,52 h14 M52,52 h14" stroke="#111" strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M40,70 h20" stroke="#111" strokeWidth={3} strokeLinecap="round" />
    <path d="M20,34 q-6,4 -3,10" stroke="#90a4ae" strokeWidth={3} fill="none" />
  </Head>
);

// 3 · Esquizotípico — ojos en espiral + estrella (pensamiento mágico)
export const Esquizotipico: React.FC = () => (
  <Head>
    <path d="M41,52 m-6,0 a6,6 0 1 1 6,6 a4,4 0 1 1 -4,-4" fill="none" stroke="#111" strokeWidth={2.4} />
    <path d="M62,52 m-6,0 a6,6 0 1 1 6,6 a4,4 0 1 1 -4,-4" fill="none" stroke="#111" strokeWidth={2.4} />
    <path d="M40,70 q6,4 12,0 q6,-4 8,2" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M74,30 l3,7 l7,1 l-5,5 l1,7 l-6,-4 l-6,4 l1,-7 l-5,-5 l7,-1z" fill="#ffd54f" stroke="#111" strokeWidth={2} />
  </Head>
);

// 4 · Antisocial — cejas agresivas, sonrisa torcida, cuernitos
export const Antisocial: React.FC = () => (
  <Head>
    {eye(41)}{eye(62)}
    <path d="M33,44 l14,4 M69,44 l-14,4" stroke="#111" strokeWidth={3.4} strokeLinecap="round" />
    <path d="M38,70 q12,10 26,-2" stroke="#111" strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M24,16 l6,10 l-11,-2z" fill="#e57373" stroke="#111" strokeWidth={2} />
    <path d="M76,16 l-6,10 l11,-2z" fill="#e57373" stroke="#111" strokeWidth={2} />
  </Head>
);

// 5 · Límite (Borderline) — cara partida: media sonrisa / media lágrima
export const Limite: React.FC = () => (
  <Head>
    <path d="M50,10 v86" stroke="#111" strokeWidth={2} strokeDasharray="4 4" />
    {eye(41)}{eye(62)}
    <path d="M37,44 q5,-4 10,-1" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M35,60 q4,10 3,16" stroke="#4fc3f7" strokeWidth={3} fill="none" />
    <path d="M38,72 q6,5 12,3" stroke="#111" strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M50,75 q6,2 12,-5" stroke="#111" strokeWidth={3} fill="none" strokeLinecap="round" />
  </Head>
);

// 6 · Histriónico — teatral: ojos grandes, gran sonrisa, destellos
export const Histrionico: React.FC = () => (
  <Head>
    <circle cx={41} cy={52} r={6} fill="#fff" stroke="#111" strokeWidth={2} /><circle cx={41} cy={52} r={2.6} fill="#111" />
    <circle cx={62} cy={52} r={6} fill="#fff" stroke="#111" strokeWidth={2} /><circle cx={62} cy={52} r={2.6} fill="#111" />
    <path d="M36,66 q15,16 30,0 q-15,6 -30,0z" fill="#e57373" stroke="#111" strokeWidth={3} />
    <path d="M20,40 l2,4 l4,1 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 l4,-1z" fill="#ffd54f" stroke="#111" strokeWidth={1.6} />
    <path d="M82,60 l2,4 l4,1 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 l4,-1z" fill="#ffd54f" stroke="#111" strokeWidth={1.6} />
  </Head>
);

// 7 · Narcisista — corona + sonrisa presumida + ojos cerrados de suficiencia
export const Narcisista: React.FC = () => (
  <Head>
    <path d="M34,50 q7,-6 14,0" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M54,50 q7,-6 14,0" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M38,68 q12,8 24,0" stroke="#111" strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M30,20 l6,10 l7,-8 l7,8 l7,-8 l6,10 l-4,6 h-36 l-4,-6z" fill="#ffd54f" stroke="#111" strokeWidth={2.4} strokeLinejoin="round" />
    <circle cx={31} cy={20} r={2.5} fill="#e53935" /><circle cx={69} cy={20} r={2.5} fill="#e53935" />
  </Head>
);

// 8 · Evitativo — se esconde tras las manos, solo asoman los ojos
export const Evitativo: React.FC = () => (
  <Head>
    <path d="M35,48 q6,-3 12,0" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M53,48 q6,-3 12,0" stroke="#111" strokeWidth={3} fill="none" />
    {eye(41, 54, 3)}{eye(62, 54, 3)}
    <path d="M22,74 q28,-14 56,0 v24 h-56z" fill="#ffe0b2" stroke="#111" strokeWidth={3} />
    <path d="M35,74 v14 M45,73 v16 M55,73 v16 M65,74 v14" stroke="#111" strokeWidth={2} />
  </Head>
);

// 9 · Dependiente — carita preocupada aferrada, manitas agarrando
export const Dependiente: React.FC = () => (
  <Head>
    <path d="M35,46 q6,4 12,2" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M53,48 q6,-4 12,-2" stroke="#111" strokeWidth={3} fill="none" />
    {eye(42)}{eye(61)}
    <path d="M40,72 q10,-3 20,0" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M18,60 q6,6 4,14 q-4,-2 -6,-6z" fill="#ffe0b2" stroke="#111" strokeWidth={2} />
    <path d="M82,60 q-6,6 -4,14 q4,-2 6,-6z" fill="#ffe0b2" stroke="#111" strokeWidth={2} />
  </Head>
);

// 10 · Obsesivo-Compulsivo (OCPD) — serio, gafas, todo alineado + check
export const Obsesivo: React.FC = () => (
  <Head>
    <rect x={33} y={47} width={13} height={10} rx={2} fill="#fff" stroke="#111" strokeWidth={2.5} />
    <rect x={55} y={47} width={13} height={10} rx={2} fill="#fff" stroke="#111" strokeWidth={2.5} />
    <line x1={46} y1={51} x2={55} y2={51} stroke="#111" strokeWidth={2.5} />
    {eye(39, 52, 2.6)}{eye(61, 52, 2.6)}
    <path d="M40,71 h20" stroke="#111" strokeWidth={3} strokeLinecap="round" />
    <path d="M70,74 l4,5 l9,-11" stroke="#2e7d32" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Head>
);

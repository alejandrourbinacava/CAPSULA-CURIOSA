import React from "react";

/* ============================================================
   ICONOS DE COMPONENTES (contenido interno en espacio 0..100)
   ============================================================ */

export const Mobo: React.FC = () => (
  <g>
    <rect x={16} y={16} width={68} height={68} rx={4} fill="#3fa34d" stroke="#111" strokeWidth={4} />
    <rect x={24} y={24} width={30} height={5} rx={1} fill="#e0a000" stroke="#111" strokeWidth={1.5} />
    <rect x={24} y={33} width={30} height={5} rx={1} fill="#e0a000" stroke="#111" strokeWidth={1.5} />
    <rect x={42} y={46} width={22} height={22} fill="#2e7d38" stroke="#111" strokeWidth={3} />
    <circle cx={70} cy={30} r={4} fill="#c0392b" stroke="#111" strokeWidth={1.5} />
    <rect x={24} y={60} width={14} height={6} fill="#b7791f" stroke="#111" strokeWidth={1.5} />
  </g>
);

export const Cpu: React.FC = () => (
  <g>
    <g stroke="#111" strokeWidth={4} strokeLinejoin="round">
      <line x1={35} y1={14} x2={35} y2={22} /><line x1={50} y1={14} x2={50} y2={22} /><line x1={65} y1={14} x2={65} y2={22} />
      <line x1={35} y1={78} x2={35} y2={86} /><line x1={50} y1={78} x2={50} y2={86} /><line x1={65} y1={78} x2={65} y2={86} />
      <line x1={14} y1={35} x2={22} y2={35} /><line x1={14} y1={50} x2={22} y2={50} /><line x1={14} y1={65} x2={22} y2={65} />
      <line x1={78} y1={35} x2={86} y2={35} /><line x1={78} y1={50} x2={86} y2={50} /><line x1={78} y1={65} x2={86} y2={65} />
    </g>
    <rect x={22} y={22} width={56} height={56} rx={6} fill="#2fb3b3" stroke="#111" strokeWidth={4} />
    <rect x={33} y={33} width={34} height={34} rx={2} fill="#f4f4f4" stroke="#111" strokeWidth={3} />
    <text x={50} y={54} fontSize={13} textAnchor="middle" fontFamily="Arial" fontWeight="bold" fill="#111">CPU</text>
  </g>
);

export const Gpu: React.FC = () => (
  <g>
    <rect x={14} y={36} width={72} height={34} rx={3} fill="#7a4a2b" stroke="#111" strokeWidth={4} />
    <circle cx={36} cy={53} r={12} fill="#1b2a4a" stroke="#111" strokeWidth={3} />
    <circle cx={64} cy={53} r={12} fill="#1b2a4a" stroke="#111" strokeWidth={3} />
    <g stroke="#4a6fa5" strokeWidth={2} fill="none">
      <path d="M36,53 q6,-8 0,-12" /><path d="M36,53 q8,4 12,2" /><path d="M36,53 q-6,6 -10,4" />
      <path d="M64,53 q6,-8 0,-12" /><path d="M64,53 q8,4 12,2" /><path d="M64,53 q-6,6 -10,4" />
    </g>
    <rect x={30} y={70} width={40} height={7} fill="#e6c200" stroke="#111" strokeWidth={2} />
  </g>
);

export const Ram: React.FC = () => (
  <g>
    <rect x={20} y={30} width={60} height={30} rx={2} fill="#2e9e4f" stroke="#111" strokeWidth={4} />
    <g fill="#16331f">
      <rect x={26} y={36} width={8} height={14} /><rect x={38} y={36} width={8} height={14} />
      <rect x={50} y={36} width={8} height={14} /><rect x={62} y={36} width={8} height={14} />
    </g>
    <rect x={22} y={60} width={26} height={6} fill="#e6c200" stroke="#111" strokeWidth={1.5} />
    <rect x={52} y={60} width={26} height={6} fill="#e6c200" stroke="#111" strokeWidth={1.5} />
  </g>
);

export const Ssd: React.FC = () => (
  <g>
    <rect x={10} y={40} width={80} height={18} rx={2} fill="#2e9e4f" stroke="#111" strokeWidth={3} />
    <g fill="#16331f">
      <rect x={30} y={44} width={12} height={10} /><rect x={46} y={44} width={12} height={10} /><rect x={62} y={44} width={12} height={10} />
    </g>
    <text x={20} y={53} fontSize={9} fontFamily="Arial" fontWeight="bold" fill="#fff">SSD</text>
    <rect x={10} y={44} width={6} height={10} fill="#e6c200" />
  </g>
);

export const Storage: React.FC = () => (
  <g>
    <rect x={20} y={22} width={60} height={56} rx={4} fill="#c9c9c9" stroke="#111" strokeWidth={4} />
    <circle cx={45} cy={50} r={19} fill="#efefef" stroke="#111" strokeWidth={3} />
    <circle cx={45} cy={50} r={5} fill="#e6c200" stroke="#111" strokeWidth={2} />
    <path d="M74,30 L52,52" stroke="#111" strokeWidth={4} strokeLinecap="round" />
  </g>
);

/* ============================================================
   ICONO EN CÍRCULO DE COLOR
   ============================================================ */

export const IconCircle: React.FC<{
  color: string;
  children: React.ReactNode;
  size?: number;
}> = ({ color, children, size = 120 }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} style={{ overflow: "visible" }}>
    <circle cx={60} cy={60} r={54} fill={color} stroke="#111" strokeWidth={5} />
    <g transform="translate(24,24) scale(0.72)">{children}</g>
  </svg>
);

/* ============================================================
   FLECHA ROJA QUE SE DIBUJA
   ============================================================ */

export const Arrow: React.FC<{
  d: string;
  head: string;
  progress: number; // 0..1 dibujo del cuerpo
  headOn: boolean;
  width?: number;
  height?: number;
}> = ({ d, head, progress, headOn, width = 220, height = 130 }) => (
  <svg viewBox="0 0 220 130" width={width} height={height} style={{ overflow: "visible" }}>
    <path
      d={d}
      pathLength={100}
      fill="none"
      stroke="#e2231a"
      strokeWidth={7}
      strokeLinecap="round"
      strokeDasharray={100}
      strokeDashoffset={100 - progress * 100}
    />
    {headOn && (
      <path d={head} fill="none" stroke="#e2231a" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

/* ============================================================
   MUÑECO DE PALO (cuerpo con hueco para la cabeza)
   ============================================================ */

type StickProps = { head: React.ReactNode; headSize?: number; pose?: "pointR" | "pointL2R" | "hip" | "idle" };

export const Stick: React.FC<StickProps> = ({ head, headSize = 90, pose = "idle" }) => {
  const arms: Record<string, string> = {
    idle: "M100,120 L60,155 M100,120 L140,155",
    pointR: "M100,130 L165,150 L178,146 M100,132 L70,170",
    pointL2R: "M100,120 L55,150 L45,140 M100,120 L150,145 L162,140",
    hip: "M100,128 L135,150 L147,146 M100,132 q-26,6 -20,34",
  };
  return (
    <svg viewBox="0 0 200 300" width={220} height={330} style={{ overflow: "visible" }}>
      <g transform={`translate(${100 - headSize / 2}, 0)`}>
        <svg x={0} y={0} width={headSize} height={headSize} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
          {head}
        </svg>
      </g>
      <path d="M100,90 L100,205" stroke="#111" strokeWidth={4} fill="none" />
      <path d={arms[pose]} stroke="#111" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M100,205 L78,285 M100,205 L122,285" stroke="#111" strokeWidth={4} fill="none" strokeLinecap="round" />
      <ellipse cx={76} cy={288} rx={12} ry={5} fill="none" stroke="#111" strokeWidth={4} />
      <ellipse cx={124} cy={288} rx={12} ry={5} fill="none" stroke="#111" strokeWidth={4} />
    </svg>
  );
};

/* Cabezas "cara" dibujadas (confundido / rabia) en 0..100 para usar como head */

export const FaceConfused: React.FC = () => (
  <g>
    <circle cx={50} cy={50} r={38} fill="#fff" stroke="#111" strokeWidth={4} />
    <path d="M16,36 q8,-30 40,-27 q28,3 30,27 q-12,-12 -27,-7 q-7,-9 -20,-2 q-11,-3 -23,9z" fill="#8a8a8a" stroke="#111" strokeWidth={3} />
    <circle cx={38} cy={52} r={4} fill="#111" /><circle cx={62} cy={52} r={4} fill="#111" />
    <path d="M32,42 l12,5 M68,42 l-12,5" stroke="#111" strokeWidth={3} fill="none" />
    <path d="M40,70 q10,-5 20,0" stroke="#111" strokeWidth={3} fill="none" />
  </g>
);

export const FaceRage: React.FC = () => (
  <g>
    <circle cx={50} cy={50} r={40} fill="#fff" stroke="#111" strokeWidth={4} />
    <path d="M24,38 q9,9 22,7 M76,38 q-9,9 -22,7" stroke="#111" strokeWidth={4} fill="none" />
    <circle cx={40} cy={52} r={3.5} fill="#111" /><circle cx={60} cy={52} r={3.5} fill="#111" />
    <path d="M28,72 q22,10 44,0 q-6,10 -22,10 q-16,0 -22,-10z" fill="#fff" stroke="#111" strokeWidth={3} />
    <path d="M32,74 h36 M42,72 v10 M52,72 v11 M62,72 v10" stroke="#111" strokeWidth={2.5} />
  </g>
);

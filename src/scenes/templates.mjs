// templates.mjs — geometría compartida por el compilador (02) y el renderizador (SceneVideo).
//   Addendum 1 · secciones B (plantillas), E (capas z-order), D (frames de clip).
//   JS plano (sin JSX) para poder importarlo desde Node y desde el bundle de Remotion.

export const W = 1920, H = 1080;
const b = (cx, cy, w, h) => ({ cx, cy, w, h });

// Slots universales: existen en TODAS las plantillas (rótulos, badges, overlays de texto/shape).
export const UNIVERSAL = {
  center: b(960, 500, 900, 620),
  top: b(960, 165, 1500, 230),
  bottom: b(960, 905, 1500, 200),
  "top-left": b(430, 235, 700, 340),
  "top-right": b(1490, 235, 700, 340),
  "bottom-left": b(430, 820, 700, 300),
  "bottom-right": b(1490, 820, 700, 300),
  "corner-badge": b(190, 110, 280, 150),
};

// Cada plantilla expone sus slots propios (además de los universales).
export const TEMPLATES = {
  "title-card": { slots: { title: b(960, 520, 1560, 430), icon: b(960, 245, 240, 240) } },
  "single-focus": { slots: { focus: b(960, 455, 880, 650), label: b(960, 910, 1320, 150) } },
  "compare-2": { slots: { left: b(560, 450, 680, 600), right: b(1360, 450, 680, 600), "label-left": b(560, 865, 680, 150), "label-right": b(1360, 865, 680, 150), divider: b(960, 500, 8, 770) } },
  "list-3": { slots: { "item-1": b(400, 435, 470, 470), "item-2": b(960, 435, 470, 470), "item-3": b(1520, 435, 470, 470), "label-1": b(400, 815, 470, 140), "label-2": b(960, 815, 470, 140), "label-3": b(1520, 815, 470, 140) } },
  "grid-4": { slots: { "cell-1": b(620, 350, 560, 330), "cell-2": b(1300, 350, 560, 330), "cell-3": b(620, 740, 560, 330), "cell-4": b(1300, 740, 560, 330), "label-1": b(620, 560, 560, 90), "label-2": b(1300, 560, 560, 90), "label-3": b(620, 950, 560, 90), "label-4": b(1300, 950, 560, 90) } },
  "grid-8": {
    slots: (() => {
      const s = {}; const xs = [340, 760, 1180, 1600]; const ys = [340, 740];
      let i = 1; for (const y of ys) for (const x of xs) { s["cell-" + i] = b(x, y, 380, 300); s["label-" + i] = b(x, y + 185, 380, 80); i++; }
      return s;
    })(),
  },
  "photo-focus": { slots: { photo: b(960, 470, 1180, 720), "caption-top": b(960, 145, 1560, 170), "caption-bottom": b(960, 935, 1560, 170) } },
  "stat-card": { slots: { number: b(960, 420, 1400, 440), unit: b(960, 735, 1150, 150), label: b(960, 905, 1300, 140) } },
  "stickman-reaction": { slots: { figure: b(370, 560, 560, 680), content: b(1200, 450, 1160, 600), label: b(1200, 885, 1160, 150) } },
  "flow-3": { slots: { "step-1": b(360, 455, 430, 430), "step-2": b(960, 455, 430, 430), "step-3": b(1560, 455, 430, 430), "label-1": b(360, 785, 430, 140), "label-2": b(960, 785, 430, 140), "label-3": b(1560, 785, 430, 140) } },
  "zoom-detail": { slots: { main: b(720, 470, 840, 650), detail: b(1500, 435, 540, 540), label: b(960, 910, 1200, 140) } },
  "full-bleed-clip": { slots: { bleed: b(960, 540, 1920, 1080), text: b(960, 885, 1600, 210) } },
};

export const TEMPLATE_NAMES = Object.keys(TEMPLATES);

// límites de uso por episodio (regla C.2). single-focus admite más.
export const TEMPLATE_MAX = (name) => (name === "single-focus" ? 5 : 3);

// ¿existe el slot en la plantilla (o es universal)?
export const slotExists = (template, slot) => {
  const t = TEMPLATES[template];
  return !!(t && t.slots[slot]) || !!UNIVERSAL[slot];
};
// caja absoluta de un slot dentro de una plantilla.
export const boxOf = (template, slot) => {
  const t = TEMPLATES[template];
  return (t && t.slots[slot]) || UNIVERSAL[slot] || UNIVERSAL.center;
};

// Capas fijas (sección E). Mayor = más al frente.
export const Z = { bg: 10, image: 20, clip: 20, gif: 20, shape: 30, arrow: 40, stickman: 50, text: 60, stat: 60, badge: 70 };
export const zOf = (el) => {
  if (el.slot === "corner-badge") return Z.badge;
  if (el.slot === "bleed") return Z.bg;
  return Z[el.type] ?? 20;
};

// Direcciones de flecha disponibles (regla C.3).
export const ARROW_DIRS = ["left-right", "right-left", "top-bottom", "curved-up", "curved-down", "center-radial"];

// Marcos para clip/gif/photo (sección D).
export const FRAMES = ["none", "polaroid", "tv-crt", "browser", "phone"];

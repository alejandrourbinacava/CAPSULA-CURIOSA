// scene-templates: ESCENAS DE DIAGRAMA para el storyboard. En vez de apilar iconos sueltos (lienzo acumulativo),
// cada beat es UN diagrama que se construye al ritmo de la voz: los nodos (icono/foto/clip + etiqueta) entran cuando el
// narrador dice su palabra y se UNEN con flechas que se dibujan. Simetría de tamaño y posición, cámara suave, y todo el
// grupo sale junto al final del beat (nada de iconos huérfanos ni que desaparezcan y reaparezcan).
//
// Plantillas:  flow · hub · ladder · versus · list · stat · focus · single
// buildScene(spec, ctx) -> elementos para scenes.json.  spec = { template, nodes:[{icon,src,label,kind,t}], stat, beat }
//   ctx = { enterOf, RED, STROKE }   (el compilador pasa sus helpers; aquí no se lee ningún fichero)
//
// Medidas (comprobadas con fotogramas reales): la fuente (Patrick Hand) es ESTRECHA ≈ 0.40 em por carácter.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CW = 0.44; // ancho de carácter que uso para ENCAJAR texto (algo holgado sobre el 0.40 real)

export function buildScene(spec, ctx) {
  const { template, nodes, beat } = spec;
  const n = nodes.length; const els = []; let uid = 0;
  const id = (p) => `${p}${beat.num}_${uid++}`;
  const t0 = beat.t0, t1 = beat.t1;

  // ---- tiempos: cada nodo entra con SU palabra; en el ORDEN en que el autor los escribió (la posición del diagrama
  //      sigue ese orden). Si falta la palabra se reparte; mínimo 0.55 s entre entradas; el primero entra al empezar ----
  const span = Math.max(2, t1 - t0 - 1.4);
  nodes.forEach((nd, i) => { if (nd.t == null) nd.t = +(t0 + 0.15 + (n > 1 ? (span * i) / n : 0)).toFixed(2); });
  if (n) nodes[0].t = +Math.min(nodes[0].t, t0 + 0.05).toFixed(2);
  for (let i = 1; i < n; i++) nodes[i].t = +Math.max(nodes[i].t, nodes[i - 1].t + 0.55).toFixed(2);
  for (const nd of nodes) nd.t = +clamp(nd.t, t0 + 0.05, t1 - 0.9).toFixed(2);
  for (let i = 1; i < n; i++) if (nodes[i].t <= nodes[i - 1].t) nodes[i].t = +(nodes[i - 1].t + 0.3).toFixed(2);

  // ---- primitivas ----
  const addNode = (nd, cx, cy, size, enter) => {
    nd._box = { cx, cy, w: size, h: size };
    if (!nd.src) return null; // nodo solo-rótulo
    const isClip = nd.kind === "clip";
    const w = isClip ? Math.round(size * 1.5) : size, h = isClip ? Math.round(size * 0.84) : size;
    nd._box = { cx, cy, w, h, rect: isClip || nd.kind === "photo" }; // fotos/clips son rectángulos: la flecha parte del BORDE real, no del radio
    const base = { id: id("n"), box: { cx, cy, w, h }, in: nd.t, out: t1, z: isClip ? 27 : 30, enter: ctx.enterOf(enter || "pop"), exit: { kind: "fade-out", duration: 0.3 }, _scene: true };
    if (isClip) els.push({ ...base, type: "clip", src: nd.src, frame: "rounded" });
    else els.push({ ...base, type: "image", kind: nd.kind === "photo" ? "cutout" : "vector", src: nd.src, ...(nd.kind === "photo" ? { kenburns: true } : {}) });
    return base;
  };
  // rótulo en 1-2 líneas equilibradas (nunca una línea diminuta)
  const splitLabel = (txt, maxChars) => { if (txt.length <= maxChars) return [txt]; const w = txt.split(" "); let best = null; for (let i = 1; i < w.length; i++) { const A = w.slice(0, i).join(" "), B = w.slice(i).join(" "); const sc = Math.max(A.length, B.length); if (!best || sc < best.sc) best = { sc, l: [A, B] }; } return best ? best.l : [txt]; };
  const labelLines = (label, maxW, fsz) => { let fs = fsz, lines = splitLabel(label, Math.floor(maxW / (fs * CW))); while (fs > 28 && Math.max(...lines.map(l => l.length)) * fs * CW > maxW) fs -= 2; return { fs, lines }; };
  const addLabel = (nd, cx, cy, maxW, fsz = 46, color) => {
    if (!nd.label) return 0;
    const { fs, lines } = labelLines(nd.label, maxW, fsz); const lh = Math.round(fs * 1.12), top = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => { const bw = Math.round(ln.length * fs * CW) + 36; els.push({ id: id("l"), type: "text", content: ln, fontSize: fs, box: { cx, cy: Math.round(top + i * lh), w: bw, h: lh + 10 }, color: color || ctx.STROKE, z: 60, in: +(nd.t + 0.2 + i * 0.12).toFixed(2), out: t1, enter: ctx.enterOf("fade"), exit: { kind: "fade-out", duration: 0.25 }, _scene: true }); });
    return lines.length;
  };
  // rótulo a la derecha del icono, alineado a la izquierda (listas y abanicos)
  const addSideLabel = (nd, xLeft, cy, maxW, fsz = 44, color) => {
    if (!nd.label) return;
    const { fs, lines } = labelLines(nd.label, maxW, fsz); const lh = Math.round(fs * 1.12), top = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => { const bw = Math.round(ln.length * fs * CW) + 36; els.push({ id: id("l"), type: "text", content: ln, fontSize: fs, box: { cx: Math.round(xLeft + bw / 2), cy: Math.round(top + i * lh), w: bw, h: lh + 10 }, color: color || ctx.STROKE, z: 60, in: +(nd.t + 0.2 + i * 0.12).toFixed(2), out: t1, enter: ctx.enterOf("handwrite"), exit: { kind: "fade-out", duration: 0.25 }, _scene: true }); });
  };
  const addArrow = (A, B, tIn, opts = {}) => {
    const ca = A._box, cb = B._box; const dx = cb.cx - ca.cx, dy = cb.cy - ca.cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const edge = (b, vx, vy) => { if (!b.rect) return Math.min(b.w, b.h) / 2; const tx = vx ? (b.w / 2) / Math.abs(vx) : Infinity, ty = vy ? (b.h / 2) / Math.abs(vy) : Infinity; return Math.min(tx, ty); };
    const ra = edge(ca, ux, uy) + (opts.gapA ?? 26), rb = edge(cb, -ux, -uy) + (opts.gapB ?? 34);
    if (L < ra + rb + 40) return; // sin sitio para una flecha decente: mejor ninguna
    els.push({ id: id("ar"), type: "arrow", a: { x: Math.round(ca.cx + ux * ra), y: Math.round(ca.cy + uy * ra) }, b: { x: Math.round(cb.cx - ux * rb), y: Math.round(cb.cy - uy * rb) }, curve: opts.curve || "none", color: opts.color || ctx.RED, z: 40, in: +Math.max(t0, tIn).toFixed(2), out: t1, enter: { kind: "draw", duration: 0.45 }, exit: { kind: "fade-out", duration: 0.2 }, _scene: true });
  };
  const pick = (k, table) => table[clamp(k, 1, table.length) - 1];
  const under = (nd, S) => S / 2 + (nd.kind === "photo" || nd.kind === "clip" ? 62 : 46); // más aire bajo fotos/clips

  switch (template) {
    // ===== flow: A → B → C (fila centrada y simétrica; cada flecha se dibuja justo antes de que entre el siguiente) =====
    case "flow": {
      const S = pick(n, [460, 400, 340, 280, 230]); const gap = n > 1 ? Math.min(600, (1560 - S) / (n - 1)) : 0;
      const x0 = 960 - (gap * (n - 1)) / 2, cy = 500;
      nodes.forEach((nd, i) => { const x = Math.round(x0 + gap * i); addNode(nd, x, cy, S, i === 0 ? "pop" : "slide-l"); addLabel(nd, x, cy + under(nd, S), Math.max(280, gap - 24)); });
      for (let i = 1; i < n; i++) addArrow(nodes[i - 1], nodes[i], nodes[i].t - 0.3);
      break;
    }
    // ===== hub: un concepto y sus consecuencias. 1-2 → a los lados del centro · 3-5 → concepto a la izquierda, abanico a la derecha =====
    case "hub": {
      const [c, ...sat] = nodes; const m = sat.length;
      if (m <= 2) {
        const CS = 360, SS = 290, cy = 500; addNode(c, 960, cy, CS, "pop"); addLabel(c, 960, cy + under(c, CS), 560, 48, ctx.RED);
        const xs = m === 1 ? [1500] : [380, 1540];
        sat.forEach((s, i) => { addNode(s, xs[i], cy, SS, "pop"); addLabel(s, xs[i], cy + under(s, SS), 440, 42); addArrow(c, s, s.t - 0.3, { gapA: 14, gapB: 22 }); });
      } else {
        const CS = 420, cx0 = 470, cy0 = 500, SS = m === 3 ? 230 : m === 4 ? 200 : 170, gap = m === 3 ? 250 : m === 4 ? 210 : 178, X = 1130;
        addNode(c, cx0, cy0, CS, "pop"); addLabel(c, cx0, cy0 + under(c, CS), 600, 48, ctx.RED);
        sat.forEach((s, i) => { const y = Math.round(cy0 + (i - (m - 1) / 2) * gap); addNode(s, X, y, SS, "slide-l"); addSideLabel(s, X + SS / 2 + 26, y, 1800 - (X + SS / 2 + 26) - 30, 44); addArrow(c, s, s.t - 0.3, { gapA: 16, gapB: 20 }); });
      }
      break;
    }
    // ===== ladder: escalera ascendente de niveles (Tipo 0 → I → II → III…) =====
    case "ladder": {
      const x0 = 330, x1 = 1590, S = pick(n, [320, 290, 250, 215, 190, 170]), yLow = 610, yHigh = 360;
      nodes.forEach((nd, i) => { const f = n > 1 ? i / (n - 1) : 0.5; const cx = Math.round(x0 + (x1 - x0) * f), cy = Math.round(yLow - (yLow - yHigh) * f); addNode(nd, cx, cy, S, "pop"); addLabel(nd, cx, cy + under(nd, S), Math.max(260, (x1 - x0) / Math.max(1, n - 1) - 20), 42); });
      for (let i = 1; i < n; i++) addArrow(nodes[i - 1], nodes[i], nodes[i].t - 0.3, { curve: "up" });
      break;
    }
    // ===== versus: dos lados enfrentados con VS al centro =====
    case "versus": {
      const [A, B] = nodes; const S = 420;
      addNode(A, 540, 490, S, "slide-l"); addLabel(A, 540, 490 + under(A, S), 700, 50);
      addNode(B, 1380, 490, S, "slide-r"); addLabel(B, 1380, 490 + under(B, S), 700, 50);
      els.push({ id: id("vs"), type: "text", content: "VS", fontSize: 120, box: { cx: 960, cy: 480, w: 220, h: 140 }, color: ctx.RED, z: 62, in: +(B.t - 0.1).toFixed(2), out: t1, enter: ctx.enterOf("stamp"), exit: { kind: "fade-out", duration: 0.25 }, _scene: true });
      break;
    }
    // ===== list: filas (icono + frase) una a una, cada una con su check =====
    case "list": {
      const rowH = n <= 3 ? 200 : n === 4 ? 165 : 140, y0 = 520 - (rowH * (n - 1)) / 2, S = rowH - 30;
      nodes.forEach((nd, i) => { const cy = Math.round(y0 + rowH * i); addNode(nd, 470, cy, S, "slide-l"); addSideLabel(nd, 470 + S / 2 + 40, cy, 960, 54);
        els.push({ id: id("ck"), type: "shape", kind: "checkmark", box: { cx: 1640, cy, w: 120, h: 120 }, color: "#2F9E44", z: 45, in: +(nd.t + 0.55).toFixed(2), out: t1, enter: { kind: "draw", duration: 0.45 }, exit: { kind: "fade-out", duration: 0.2 }, _scene: true }); });
      break;
    }
    // ===== stat: dato grande que CUENTA + icono y etiqueta (spec.stat = { value, unit }) =====
    case "stat": {
      const st = spec.stat || { value: "", unit: "" }; const nd = nodes[0];
      if (nd) { addNode(nd, 560, 470, 420, "pop"); addLabel(nd, 560, 470 + under(nd, 420), 560, 44); }
      els.push({ id: id("st"), type: "stat", content: st.value, unit: st.unit, box: { cx: nd ? 1280 : 960, cy: 470, w: 980, h: 360 }, color: ctx.RED, z: 55, in: +((nd ? nd.t : t0) + 0.45).toFixed(2), out: t1, enter: ctx.enterOf("stamp"), exit: { kind: "fade-out", duration: 0.3 }, _scene: true });
      break;
    }
    // ===== focus: foto/clip grande centrado + 1-4 rótulos con flecha a los lados (nunca encima de la pieza) =====
    case "focus": {
      const [M, ...tags] = nodes; const isClip = M.kind === "clip"; const big = isClip ? 520 : 560; // clip → 780 de ancho (size*1.5)
      addNode(M, 960, 510, big, "pop"); if (M.label) addLabel(M, 960, 510 + big * (isClip ? 0.42 : 0.5) + 56, 900, 44);
      const m = tags.length;
      const slots = m === 1 ? [[1560, 480]] : m === 2 ? [[300, 480], [1620, 480]] : m === 3 ? [[300, 400], [1620, 400], [1620, 680]] : [[300, 400], [1620, 400], [300, 680], [1620, 680]];
      tags.forEach((tg, i) => {
        const [sx, sy] = slots[i]; const left = sx < 960;
        if (tg.src) { addNode(tg, sx, sy, 230, left ? "slide-l" : "slide-r"); addLabel(tg, sx, sy + 135, 400, 40); }
        else addLabel(tg, sx, sy, 400, 46, ctx.RED);
        const A = { _box: { cx: sx, cy: sy, w: tg.src ? 230 : 240, h: tg.src ? 230 : 110 } };
        addArrow(A, { _box: { cx: 960, cy: 510, w: isClip ? 780 : big, h: isClip ? 438 : big, rect: true } }, tg.t - 0.3, { curve: i % 2 ? "up" : "down", gapA: tg.src ? 40 : 70, gapB: 8 });
      });
      break;
    }
    // ===== single: UNA idea grande y centrada con su etiqueta (para frases contundentes) =====
    case "single": {
      const nd = nodes[0]; const S = nd.kind === "clip" ? 520 : 480; addNode(nd, 960, 490, S, "pop"); addLabel(nd, 960, 490 + under(nd, S) + 10, 1200, 58, ctx.RED);
      break;
    }
    default: throw new Error("plantilla de escena desconocida: " + template);
  }
  // ---- CÁMARA: toda la escena (nodos, rótulos y flechas) se acerca o aleja despacio, como un solo plano ----
  const push = beat.num % 2 === 1; const cam = { t0, t1, s0: push ? 1.0 : 1.045, s1: push ? 1.045 : 1.0 };
  for (const e of els) e.cam = cam;
  return els;
}

// scene-templates: ESCENAS DE DIAGRAMA para el storyboard. En vez de apilar iconos sueltos (lienzo acumulativo),
// cada beat es UN diagrama que se construye al ritmo de la voz: los nodos (icono/foto/clip + etiqueta) entran cuando el
// narrador dice su palabra y se UNEN con flechas que se dibujan. Simetría de tamaño y posición, cámara suave, y todo el
// grupo sale junto al final del beat (nada de iconos huérfanos ni que desaparezcan y reaparezcan).
//
// Plantillas:  flow · hub · ladder · versus · list · stat · focus · single
//              cycle (ciclo cerrado) · converge (varias causas → un efecto) · radial (centro rodeado) · zigzag (cascada) ·
//              timeline (línea con hitos arriba/abajo) · grid (2 columnas, sin flechas) · words (frase grande que se escribe palabra a palabra)
// Estilo por escena (SCENE flow dark):  fondo → dark · paper · dots · grid · tint · gradient · plain   (si no se indica, rota solo)
//                                       placas bajo los iconos → plate · plain   ·   transición → nowipe   ·   cámara → push · pull · track
// Variantes (SCENE flow rtl):  flow: rtl (de derecha a izquierda) · grow (cada nodo mayor que el anterior)
//                              ladder: down (descenso) · hub: mirror (concepto a la derecha, abanico a la izquierda)
// Además cada escena alterna sola: cámara (empuje / alejamiento / paneo izq / paneo der) y forma de salir.
// buildScene(spec, ctx) -> elementos para scenes.json.  spec = { template, nodes:[{icon,src,label,kind,t}], stat, beat }
//   ctx = { enterOf, RED, STROKE }   (el compilador pasa sus helpers; aquí no se lee ningún fichero)
//
// Medidas (comprobadas con fotogramas reales): la fuente (Patrick Hand) es ESTRECHA ≈ 0.40 em por carácter.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CW = 0.44; // ancho de carácter que uso para ENCAJAR texto (algo holgado sobre el 0.40 real)

export function buildScene(spec, ctx) {
  const { template, nodes, beat } = spec; const V = new Set(spec.variant || []);
  const n = nodes.length; const els = []; let uid = 0;
  const id = (p) => `${p}${beat.num}_${uid++}`;
  const t0 = beat.t0, t1 = beat.t1;
  const exitK = ["fade-out", "pop-out", "slide-out-left"][beat.num % 3]; // la escena sale de forma distinta cada vez
  const dark = V.has("dark"), INK = dark ? "#FFFFFF" : ctx.STROKE;
  const PAL = ["#FFF3C4", "#DDF1FF", "#FFE3E8", "#E3F7DC", "#EEE5FF", "#FFE9D2"];
  const bgKinds = ["plain", "paper", "tint", "dots", "plain", "gradient", "grid", "plain"]; // alterna solo; nunca dos escenas seguidas iguales
  const bgk = ["dark", "paper", "dots", "grid", "tint", "gradient", "plain"].find(k => V.has(k)) || bgKinds[(beat.num * 3) % 8];
  if (bgk !== "plain") els.push({ id: `bg${beat.num}`, type: "bg", kind: bgk, color: dark ? "#080D2B" : bgk === "paper" ? "#FBF3E0" : (bgk === "dots" || bgk === "grid") ? "#FFFFFF" : PAL[beat.num % 6], color2: dark ? "#1E2D6B" : PAL[(beat.num + 2) % 6], z: 1, in: +Math.max(0, t0 - 0.3).toFixed(2), out: t1, enter: { kind: "fade-in", duration: 0.35 }, exit: { kind: "fade-out", duration: 0.35 }, _scene: true });
  const plateMode = dark ? "white" : V.has("plain") ? null : (V.has("plate") || beat.num % 3 === 1) ? "pastel" : null; // iconos sobre disco/tarjeta de color
  let ni = 0;
  const dirEnter = (dx, dy) => Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "slide-l" : "slide-r") : (dy >= 0 ? "slide-t" : "slide-b"); // entra desde donde viene la flecha

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
    const idx = ni++;
    if (plateMode && !isClip && nd.kind !== "photo") { // placa de color bajo el icono (la flecha parte del borde de la placa)
      const pk = ["disc", "card", "tilt"][(idx + beat.num) % 3], ps = Math.round(size * 1.12);
      els.push({ id: id("pl"), type: "panel", kind: pk === "disc" ? "disc" : "card", color: plateMode === "white" ? "#FFFFFF" : PAL[(idx + beat.num) % PAL.length], box: { cx, cy, w: ps, h: ps }, rotate: pk === "tilt" ? (idx % 2 ? 4 : -4) : 0, z: 26, in: +(nd.t - 0.03).toFixed(2), out: t1, enter: ctx.enterOf("pop"), exit: { kind: exitK, duration: 0.3 }, structural: true, _scene: true });
      nd._box = { cx, cy, w: ps, h: ps };
    }
    const tilt = (isClip || nd.kind === "photo") && !V.has("flat") ? ((idx + beat.num) % 2 ? 2 : -2) : 0; // fotos/clips ligeramente inclinados (collage)
    const base = { id: id("n"), box: { cx, cy, w, h }, ...(tilt ? { rotate: tilt } : {}), in: nd.t, out: t1, z: isClip ? 27 : 30, enter: ctx.enterOf(enter || "pop"), exit: { kind: exitK, duration: 0.3 }, _scene: true };
    if (isClip) els.push({ ...base, type: "clip", src: nd.src, frame: "rounded" });
    else els.push({ ...base, type: "image", kind: nd.kind === "photo" ? "cutout" : "vector", src: nd.src, ...(nd.kind === "photo" ? { kenburns: true } : {}) });
    return base;
  };
  // rótulo en 1-2 líneas equilibradas (nunca una línea diminuta)
  const splitLabel = (txt, maxChars) => { if (txt.length <= maxChars) return [txt]; const w = txt.split(" "); let best = null; for (let i = 1; i < w.length; i++) { const A = w.slice(0, i).join(" "), B = w.slice(i).join(" "); const sc = Math.max(A.length, B.length); if (!best || sc < best.sc) best = { sc, l: [A, B] }; } return best ? best.l : [txt]; };
  const labelLines = (label, maxW, fsz, cw = CW) => { let fs = fsz, lines = splitLabel(label, Math.floor(maxW / (fs * cw))); while (fs > 28 && Math.max(...lines.map(l => l.length)) * fs * cw > maxW) fs -= 2; return { fs, lines }; };
  const addLabel = (nd, cx, cy, maxW, fsz = 46, color) => {
    if (!nd.label) return 0;
    const cw = color === ctx.RED ? 0.63 : CW; const { fs, lines } = labelLines(nd.label, maxW, fsz, cw); const lh = Math.round(fs * 1.3), top = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => { const bw = Math.round(ln.length * fs * cw) + 36; els.push({ id: id("l"), type: "text", content: ln, fontSize: fs, box: { cx, cy: Math.round(top + i * lh), w: bw, h: lh - 4 }, color: color || INK, z: 60, ...(dark ? { noHalo: true } : {}), in: +(nd.t + 0.2 + i * 0.12).toFixed(2), out: t1, enter: ctx.enterOf("fade"), exit: { kind: exitK, duration: 0.25 }, _scene: true }); });
    return lines.length;
  };
  // rótulo a la derecha del icono, alineado a la izquierda (listas y abanicos)
  const addSideLabel = (nd, xLeft, cy, maxW, fsz = 44, color) => {
    if (!nd.label) return;
    const cw = color === ctx.RED ? 0.63 : CW; const { fs, lines } = labelLines(nd.label, maxW, fsz, cw); const lh = Math.round(fs * 1.3), top = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => { const bw = Math.round(ln.length * fs * cw) + 36; els.push({ id: id("l"), type: "text", content: ln, fontSize: fs, box: { cx: Math.round(xLeft + bw / 2), cy: Math.round(top + i * lh), w: bw, h: lh - 4 }, color: color || INK, z: 60, ...(dark ? { noHalo: true } : {}), in: +(nd.t + 0.2 + i * 0.12).toFixed(2), out: t1, enter: ctx.enterOf("handwrite"), exit: { kind: exitK, duration: 0.25 }, _scene: true }); });
  };
  // rótulo a la IZQUIERDA del icono (alineado a la derecha, pegado al icono)
  const addLeftLabel = (nd, xRight, cy, maxW, fsz = 44, color) => {
    if (!nd.label) return;
    const cw = color === ctx.RED ? 0.63 : CW; const { fs, lines } = labelLines(nd.label, maxW, fsz, cw); const lh = Math.round(fs * 1.3), top = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => { const bw = Math.round(ln.length * fs * cw) + 36; els.push({ id: id("l"), type: "text", content: ln, fontSize: fs, box: { cx: Math.round(xRight - bw / 2), cy: Math.round(top + i * lh), w: bw, h: lh - 4 }, color: color || INK, z: 60, ...(dark ? { noHalo: true } : {}), in: +(nd.t + 0.2 + i * 0.12).toFixed(2), out: t1, enter: ctx.enterOf("handwrite"), exit: { kind: exitK, duration: 0.25 }, _scene: true }); });
  };
  // rótulo fuera del anillo según el ángulo: arriba, abajo o al costado
  const addRingLabel = (nd, x, y, S, sin, cos, maxW, fsz = 42) => {
    if (sin < -0.4) addLabel(nd, x, y - nd._box.h / 2 - 48, maxW, fsz);
    else if (sin > 0.4) addLabel(nd, x, y + under(nd, S), maxW, fsz);
    else if (cos >= 0) addSideLabel(nd, x + nd._box.w / 2 + 20, y, Math.min(maxW, 1880 - (x + nd._box.w / 2 + 20)), fsz);
    else addLeftLabel(nd, x - nd._box.w / 2 - 20, y, Math.min(maxW, x - nd._box.w / 2 - 20 - 40), fsz);
  };
  const addArrow = (A, B, tIn, opts = {}) => {
    const ca = A._box, cb = B._box; const dx = cb.cx - ca.cx, dy = cb.cy - ca.cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const edge = (b, vx, vy) => { if (!b.rect) return Math.min(b.w, b.h) / 2; const tx = vx ? (b.w / 2) / Math.abs(vx) : Infinity, ty = vy ? (b.h / 2) / Math.abs(vy) : Infinity; return Math.min(tx, ty); };
    const ra = edge(ca, ux, uy) + (opts.gapA ?? 26), rb = edge(cb, -ux, -uy) + (opts.gapB ?? 34);
    if (L < ra + rb + 40) return; // sin sitio para una flecha decente: mejor ninguna
    els.push({ id: id("ar"), type: "arrow", a: { x: Math.round(ca.cx + ux * ra), y: Math.round(ca.cy + uy * ra) }, b: { x: Math.round(cb.cx - ux * rb), y: Math.round(cb.cy - uy * rb) }, curve: opts.curve || "none", color: opts.color || ctx.RED, z: 40, in: +Math.max(t0, tIn).toFixed(2), out: t1, enter: { kind: "draw", duration: 0.45 }, exit: { kind: "fade-out", duration: 0.2 }, _scene: true });
  };
  const pick = (k, table) => table[clamp(k, 1, table.length) - 1];
  const under = (nd, S) => (nd._box ? nd._box.h : S) / 2 + (nd.kind === "photo" || nd.kind === "clip" ? 54 : 46); // distancia del centro a la etiqueta de debajo (cuenta placa y media altura real del clip)

  switch (template) {
    // ===== flow: A → B → C (fila centrada y simétrica; cada flecha se dibuja justo antes de que entre el siguiente) =====
    case "flow": {
      const rtl = V.has("rtl"), grow = V.has("grow") && nodes.every(nd => nd.kind !== "clip" && nd.kind !== "photo"); // "grow" sólo con iconos (clips/fotos desalinean)
      const S0 = pick(n, [460, 400, 340, 280, 230]); const gap = n > 1 ? Math.min(600, (1560 - S0) / (n - 1)) : 0;
      const x0 = 960 - (gap * (n - 1)) / 2, cy = 500;
      nodes.forEach((nd, i) => {
        const S = grow ? Math.round(S0 * (0.7 + 0.42 * (n > 1 ? i / (n - 1) : 1))) : S0; // "grow": cada paso es mayor que el anterior
        const x = Math.round(rtl ? x0 + gap * (n - 1 - i) : x0 + gap * i);
        addNode(nd, x, cy, S, i === 0 ? "pop" : (rtl ? "slide-r" : "slide-l")); addLabel(nd, x, cy + under(nd, S), Math.max(280, gap - 24));
      });
      for (let i = 1; i < n; i++) addArrow(nodes[i - 1], nodes[i], nodes[i].t - 0.3, { curve: V.has("curve") ? (i % 2 ? "up" : "down") : "none" });
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
        const mir = V.has("mirror"); const CS = 420, cx0 = mir ? 1450 : 470, cy0 = 500, SS = m === 3 ? 230 : m === 4 ? 200 : 170, gap = m === 3 ? 250 : m === 4 ? 210 : 178, X = mir ? 790 : 1130;
        addNode(c, cx0, cy0, CS, "pop"); addLabel(c, cx0, cy0 + under(c, CS), 600, 48, ctx.RED);
        sat.forEach((s, i) => { const y = Math.round(cy0 + (i - (m - 1) / 2) * gap); addNode(s, X, y, SS, mir ? "slide-r" : "slide-l"); if (mir) addLeftLabel(s, X - s._box.w / 2 - 20, y, X - s._box.w / 2 - 20 - 40, 44); else addSideLabel(s, X + s._box.w / 2 + 20, y, 1800 - (X + s._box.w / 2 + 20) - 30, 44); addArrow(c, s, s.t - 0.3, { gapA: 16, gapB: 20 }); });
      }
      break;
    }
    // ===== ladder: escalera ascendente de niveles (Tipo 0 → I → II → III…) =====
    case "ladder": {
      const x0 = 330, x1 = 1590, S = pick(n, [320, 290, 250, 215, 190, 170]), yLow = 610, yHigh = 360, dn = V.has("down");
      nodes.forEach((nd, i) => { const f = n > 1 ? i / (n - 1) : 0.5; const cx = Math.round(x0 + (x1 - x0) * f), cy = Math.round(dn ? yHigh + (yLow - yHigh) * f : yLow - (yLow - yHigh) * f); addNode(nd, cx, cy, S, "pop"); addLabel(nd, cx, cy + under(nd, S), Math.max(260, (x1 - x0) / Math.max(1, n - 1) - 20), 42); });
      for (let i = 1; i < n; i++) addArrow(nodes[i - 1], nodes[i], nodes[i].t - 0.3, { curve: dn ? "down" : "up" });
      break;
    }
    // ===== versus: dos lados enfrentados con VS al centro =====
    case "versus": {
      const [A, B] = nodes; const S = 420;
      addNode(A, 540, 490, S, "slide-l"); addLabel(A, 540, 490 + under(A, S), 700, 50);
      addNode(B, 1380, 490, S, "slide-r"); addLabel(B, 1380, 490 + under(B, S), 700, 50);
      els.push({ id: id("vs"), type: "text", content: "VS", fontSize: 120, box: { cx: 960, cy: 480, w: 220, h: 140 }, color: ctx.RED, z: 62, ...(dark ? { noHalo: true } : {}), in: +(B.t - 0.1).toFixed(2), out: t1, enter: ctx.enterOf("stamp"), exit: { kind: "fade-out", duration: 0.25 }, _scene: true });
      break;
    }
    // ===== list: filas (icono + frase) una a una, cada una con su check =====
    case "list": {
      const rowH = n <= 3 ? 200 : n === 4 ? 165 : 140, y0 = 520 - (rowH * (n - 1)) / 2, S = rowH - 30;
      nodes.forEach((nd, i) => { const cy = Math.round(y0 + rowH * i); addNode(nd, 470, cy, S, "slide-l"); addSideLabel(nd, 470 + nd._box.w / 2 + 34, cy, 960, 54);
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
        if (tg.src) { addNode(tg, sx, sy, 230, left ? "slide-l" : "slide-r"); addLabel(tg, sx, sy + tg._box.h / 2 + 52, 400, 40); }
        else addLabel(tg, sx, sy, 400, 46, ctx.RED);
        const A = { _box: { cx: sx, cy: sy, w: tg.src ? 230 : 240, h: tg.src ? 230 : 110 } };
        addArrow(A, { _box: { cx: 960, cy: 510, w: isClip ? 780 : big, h: isClip ? 438 : big, rect: true } }, tg.t - 0.3, { curve: i % 2 ? "up" : "down", gapA: tg.src ? 40 : 70, gapB: 8 });
      });
      break;
    }
    // ===== cycle: ciclo cerrado (3-5 pasos en anillo; la última flecha vuelve al principio) =====
    case "cycle": {
      const m = clamp(n, 3, 5), S = m === 3 ? 210 : m === 4 ? 190 : 170, cx0 = 960, cy0 = m === 3 ? 670 : m === 4 ? 613 : 633, rx = m === 5 ? 470 : m === 4 ? 640 : 560, ry = m === 3 ? 230 : m === 4 ? 262 : 215; // arriba y abajo quedan dentro de y 285..940
      const off = m === 4 ? -45 : -90;
      nodes.slice(0, m).forEach((nd, i) => { const ang = (off + (360 * i) / m) * Math.PI / 180, sin = Math.sin(ang), cos = Math.cos(ang), x = Math.round(cx0 + rx * cos), y = Math.round(cy0 + ry * sin);
        addNode(nd, x, y, S, "pop"); addRingLabel(nd, x, y, S, sin, cos, 420, 42); });
      for (let i = 1; i < m; i++) addArrow(nodes[i - 1], nodes[i], nodes[i].t - 0.3);
      addArrow(nodes[m - 1], nodes[0], Math.min(nodes[m - 1].t + 0.55, t1 - 0.8), { color: ctx.RED }); // cierra el ciclo
      break;
    }
    // ===== converge: varias causas/fuentes (izquierda) → un único resultado (derecha) =====
    case "converge": {
      const src = nodes.slice(0, -1), R = nodes[nodes.length - 1], m = src.length, S = m === 2 ? 220 : 190, gap = m === 2 ? 290 : 250, xs = 560;
      src.forEach((nd, i) => { const y = Math.round(540 + (i - (m - 1) / 2) * gap); addNode(nd, xs, y, S, "slide-l"); const hw = nd._box.w / 2; addLeftLabel(nd, xs - hw - 24, y, xs - hw - 24 - 60, 44); });
      const RS = 440; addNode(R, 1400, 520, RS, "pop"); addLabel(R, 1400, 520 + under(R, RS), 640, 50, ctx.RED);
      src.forEach(nd => addArrow(nd, R, R.t - 0.55, { gapA: 18, gapB: 24 }));
      break;
    }
    // ===== radial: un concepto en el centro y 3-5 elementos a su alrededor, cada uno con su flecha =====
    case "radial": {
      const [c, ...sat] = nodes; const m = clamp(sat.length, 3, 4), cy0 = 585, CS = 330, SS = plateMode ? 170 : 200, rx = 620, ry = 215;
      const angs = m === 3 ? [-140, -40, 90] : [-150, -30, 30, 150];
      addNode(c, 960, cy0, CS, "pop");
      const axis = angs.some(a => Math.sin(a * Math.PI / 180) > 0.95);
      addLabel(c, 960, axis ? cy0 - CS / 2 - 50 : cy0 + CS / 2 + 56, 520, 48, ctx.RED);
      sat.slice(0, m).forEach((nd, i) => { const ang = angs[i] * Math.PI / 180, sin = Math.sin(ang), cos = Math.cos(ang), x = Math.round(960 + rx * cos), y = Math.round(cy0 + ry * sin);
        addNode(nd, x, y, SS, dirEnter(-cos, -sin)); addRingLabel(nd, x, y, SS, sin, cos, 400, 40); addArrow(c, nd, nd.t - 0.3, { gapA: 18, gapB: 22 }); });
      break;
    }
    // ===== zigzag: cascada que sube y baja (causa → efecto → efecto), rótulos hacia fuera =====
    case "zigzag": {
      const m = clamp(n, 3, 5), S = m === 3 ? 230 : m === 4 ? 210 : 190, xa = 400, xb = 1560, yUp = 345 + S / 2, yDn = yUp + 268; // los rótulos de arriba quedan por debajo del título (y ≥ 285)
      nodes.slice(0, m).forEach((nd, i) => { const x = Math.round(xa + ((xb - xa) * i) / (m - 1)), up = i % 2 === 0, y = up ? yUp : yDn;
        addNode(nd, x, y, S, up ? "slide-t" : "slide-b"); if (up) addLabel(nd, x, y - nd._box.h / 2 - 48, 480, 42); else addLabel(nd, x, y + under(nd, S), 480, 42); });
      for (let i = 1; i < m; i++) addArrow(nodes[i - 1], nodes[i], nodes[i].t - 0.3, { curve: i % 2 ? "down" : "up" });
      break;
    }
    // ===== timeline: línea que se dibuja de izquierda a derecha con hitos arriba y abajo, alternados =====
    case "timeline": {
      const m = clamp(n, 3, 5), S = m <= 4 ? 190 : 170, ly = 620, xa = 300, xb = 1620;
      els.push({ id: id("tl"), type: "arrow", a: { x: 120, y: ly }, b: { x: 1800, y: ly }, curve: "none", color: INK, z: 38, in: +t0.toFixed(2), out: t1, enter: { kind: "draw", duration: Math.min(2.5, (t1 - t0) * 0.5) }, exit: { kind: "fade-out", duration: 0.25 }, _scene: true });
      nodes.slice(0, m).forEach((nd, i) => { const x = Math.round(xa + ((xb - xa) * i) / (m - 1)), up = i % 2 === 0, y = up ? 345 + S / 2 : 894 - S / 2;
        addNode(nd, x, y, S, up ? "slide-t" : "slide-b"); if (up) addLabel(nd, x, y - nd._box.h / 2 - 48, 460, 42); else addLabel(nd, x, y + under(nd, S), 460, 42);
        const yb = up ? y + nd._box.h / 2 + 14 : y - nd._box.h / 2 - 14, ye = up ? ly - 16 : ly + 16;
        els.push({ id: id("tk"), type: "arrow", a: { x, y: yb }, b: { x, y: ye }, curve: "none", color: ctx.RED, z: 40, in: +Math.max(t0, nd.t + 0.25).toFixed(2), out: t1, enter: { kind: "draw", duration: 0.3 }, exit: { kind: "fade-out", duration: 0.2 }, _scene: true }); });
      break;
    }
    // ===== grid: 4-6 ideas en dos columnas (icono + frase), sin flechas: para "cosas del mismo nivel" =====
    case "grid": {
      const m = clamp(n, 4, 6), rows = Math.ceil(m / 2), S = rows === 2 ? 250 : 190, rh = rows === 2 ? 340 : 245, y0 = (rows === 2 ? 565 : 590) - (rh * (rows - 1)) / 2;
      nodes.slice(0, m).forEach((nd, i) => { const col = i % 2, row = Math.floor(i / 2), x = col ? 1180 : 470, y = Math.round(y0 + rh * row);
        addNode(nd, x, y, S, i % 3 === 1 ? "stamp" : "pop"); addSideLabel(nd, x + nd._box.w / 2 + 20, y, 560, 46); });
      break;
    }
    // ===== words: frase grande que se escribe palabra a palabra con la voz; "*clave*" → rojo + marcador amarillo detrás =====
    case "words": {
      const m = clamp(n, 1, 4), fb = m <= 2 ? 150 : m === 3 ? 125 : 105, gap = fb * 1.5;
      nodes.slice(0, m).forEach((nd, i) => {
        const key = /^\*.*\*$/.test(nd.label || ""), txt = (nd.label || "").replace(/^\*|\*$/g, ""), cw = key ? 0.63 : 0.47;
        const fs = Math.min(fb, Math.floor(1680 / Math.max(3, txt.length * cw))), bw = Math.round(txt.length * fs * cw) + 36, y = Math.round(560 + (i - (m - 1) / 2) * gap);
        if (key) els.push({ id: id("hl"), type: "panel", kind: "bar", color: dark ? "#C9A100" : "#FFE066", box: { cx: 960, cy: Math.round(y + fs * 0.08), w: bw + 30, h: Math.round(fs * 0.78) }, z: 50, in: +(nd.t + 0.25).toFixed(2), out: t1, enter: { kind: "handwrite", duration: 0.5 }, exit: { kind: exitK, duration: 0.25 }, structural: true, _scene: true });
        els.push({ id: id("w"), type: "text", content: txt, fontSize: fs, box: { cx: 960, cy: y, w: bw, h: Math.round(fs * 1.25) - 4 }, color: key ? ctx.RED : INK, z: 60, ...(dark ? { noHalo: true } : {}), in: nd.t, out: t1, enter: ctx.enterOf(key ? "stamp" : (i % 2 ? "slide-r" : "slide-l")), exit: { kind: exitK, duration: 0.25 }, _scene: true });
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
  const kinds = ["push", "pull", "panL", "panR", "track"], kind = ["push", "pull", "track"].find(k => V.has(k)) || kinds[beat.num % 5];
  const last = nodes[n - 1] && nodes[n - 1]._box; // "track": la cámara se acerca al ÚLTIMO elemento que entra (punch-in sobre lo nuevo)
  const cam = kind === "push" ? { t0, t1, s0: 1.0, s1: 1.05 } : kind === "pull" ? { t0, t1, s0: 1.05, s1: 1.0 }
    : kind === "track" && last && n >= 2 ? { t0: +(nodes[n - 1].t - 0.25).toFixed(2), t1, s0: 1.0, s1: 1.16, ox: Math.round(960 * 0.4 + last.cx * 0.6), oy: Math.round(540 * 0.4 + last.cy * 0.6) }
    : { t0, t1, s0: 1.05, s1: 1.05, x0: kind === "panL" ? 34 : -34, y0: 0, x1: kind === "panL" ? -34 : 34, y1: 0 };
  for (const e of els) if (e.type !== "bg") e.cam = cam;
  // TRANSICIÓN: en las escenas pares un panel de color cruza la pantalla justo al empezar (a veces desde la izq., arriba, en iris…)
  if (beat.num % 2 === 0 && !V.has("nowipe")) { const wk = ["left", "up", "iris", "right"], wc = [ctx.RED, "#111111", "#FFD43B", "#1098AD"], wi = (beat.num / 2) % 4;
    els.push({ id: `wp${beat.num}`, type: "wipe", kind: wk[wi], color: wc[(wi + beat.num) % 4], z: 200, in: +Math.max(0, t0 - 0.4).toFixed(2), out: +(t0 + 0.3).toFixed(2), enter: { kind: "fade-in", duration: 0.01 }, exit: { kind: "fade-out", duration: 0.01 }, _scene: true }); }
  return els;
}

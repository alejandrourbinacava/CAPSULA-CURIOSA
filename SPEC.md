# Especificación: motor de vídeos explainer estilo "whiteboard doodle"

> Fuente de verdad del proyecto.

---

## 0. Qué NO es este proyecto

- NO se genera vídeo con IA.
- NO se genera imagen con IA (salvo excepciones puntuales).
- NO hay edición manual en un editor de vídeo.

## 1. Qué SÍ es

Un **compositor de línea de tiempo programático**. Un renderizador que recibe un
fichero `scenes.json` describiendo qué imagen aparece, cuándo, dónde y con qué
animación, y produce un MP4 de 1920x1080 sincronizado con una pista de audio.

Analogía correcta: es un motor de PowerPoint animado que se controla por JSON,
no un generador de vídeo.

---

## 2. Estética objetivo

- Fondo blanco liso (`#FFFFFF`). Sin gradientes, sin texturas.
- Assets: PNG/SVG con **fondo transparente**, recortados, colocados sobre el blanco.
- Tipografía manuscrita para todo el texto en pantalla.
  Recomendadas: `Caveat`, `Patrick Hand`, `Gloria Hallelujah` (Google Fonts).
- Texto principal en negro. Palabras de énfasis en rojo (`#E5342A`).
- Flechas rojas o negras dibujadas a mano, animadas trazándose.
- Monigotes de palo negros, línea fina, reutilizables.
- Todo respira: pocos elementos simultáneos en pantalla (máximo 4-5).

---

## 3. Stack técnico

| Capa | Herramienta | Motivo |
|---|---|---|
| Renderizado | **Remotion** (React + TypeScript) | Animaciones declarativas, `spring()`, `interpolate()`, render headless en CI |
| TTS | ElevenLabs o OpenAI TTS | Voz natural |
| Alineación | Whisper con `timestamp_granularities: ["word"]`, o WhisperX local | Timestamps palabra a palabra |
| Composición final | FFmpeg (lo llama Remotion internamente) | — |
| Automatización | GitHub Actions | Render en CI, artefacto o subida a YouTube |

**No usar** Manim, ni MoviePy, ni ningún modelo de generación de vídeo.

---

## 4. Estructura del repositorio

```
/
├── SPEC.md
├── assets/
│   ├── icons/                  ← PNG transparentes: cpu.png, gpu.png...
│   ├── stickmen/               ← monigotes SVG por pose
│   ├── arrows/                 ← paths SVG de flechas
│   └── manifest.json           ← catálogo: id → ruta, tamaño, licencia, atribución
├── scripts/
│   ├── 01-tts.ts               ← guion → audio.mp3 + words.json
│   ├── 02-build-scenes.ts      ← guion + words.json → scenes.json
│   └── 03-render.ts            ← invoca Remotion
├── episodes/
│   └── 001-.../
│       ├── script.md
│       ├── audio.mp3           (generado)
│       ├── words.json          (generado)
│       └── scenes.json         (generado)
├── src/
│   ├── Root.tsx
│   ├── Video.tsx               ← lee scenes.json y renderiza
│   ├── layouts/
│   └── animations/
└── .github/workflows/render.yml
```

---

## 5. Formato del guion (`script.md`)

Texto plano de locución con **etiquetas inline** que marcan el punto exacto del
discurso donde aparece cada elemento. La etiqueta se ancla a la palabra siguiente.

Etiquetas:
- `[[show: <asset_id> @<slot>]]`
- `[[hide: <asset_id>]]`
- `[[text: "..." @<slot>, color=red|black, size=sm|md|lg]]`
- `[[arrow: <slot> -> <slot>]]`
- `[[stickman: <pose> @<slot>, head=<asset_id>]]`
- `[[clear]]`

**Regla:** un asset permanece hasta el siguiente `[[clear]]` si no se oculta.

---

## 6. Slots (layout determinista)

`center, left, right, top, bottom, top-left, top-right, bottom-left, bottom-right,
left-below, center-below, right-below, grid-1..grid-8, corner-badge`

- Cada slot tiene bounding box; el asset se escala conservando ratio.
- Dos assets en un slot → se reparten automáticamente.
- El texto asociado va debajo del asset.

---

## 7. `scenes.json` (contrato render). El renderizador NO conoce el guion.

```jsonc
{
  "meta": { "title": "...", "fps": 30, "width": 1920, "height": 1080, "duration": 213.4, "audio": "audio.mp3" },
  "elements": [
    { "id": "motherboard", "type": "image", "src": "assets/icons/motherboard.png", "slot": "center",
      "in": 3.2, "out": 18.7, "enter": {"kind":"pop","duration":0.45}, "exit": {"kind":"fade-out","duration":0.3} },
    { "id": "label-1", "type": "text", "content": "un pisapapeles de 400€", "slot": "right", "color": "#E5342A", "size": "lg",
      "in": 22.1, "out": 27.0, "enter": {"kind":"handwrite","duration":0.9}, "exit": {"kind":"fade-out","duration":0.3} },
    { "id": "arrow-1", "type": "arrow", "from": "center", "to": "right", "style": "hand-drawn-red",
      "in": 9.4, "out": 18.7, "enter": {"kind":"draw","duration":0.5}, "exit": {"kind":"fade-out","duration":0.2} },
    { "id": "guy", "type": "stickman", "pose": "pointing-right", "head": "assets/icons/motherboard.png", "slot": "center",
      "in": 5.0, "out": 18.7, "enter": {"kind":"fade-in","duration":0.3}, "exit": {"kind":"fade-out","duration":0.3} }
  ]
}
```

---

## 8. Animaciones (solo estas)

Entradas: `pop` (spring, la más usada), `fade-in`, `slide-in-left/-right/-top/-bottom`,
`draw` (stroke-dashoffset, solo flechas/líneas), `handwrite` (máscara izq→der), `stamp`.
Salidas: `fade-out` (defecto), `pop-out`, `slide-out-*`.

Timing: entrada 0.4s / salida 0.3s por defecto. Si varios entran en <0.2s, escalonar 0.12s.
Ningún elemento menos de 1.2s en pantalla.

---

## 9. Los tres scripts

- `01-tts`: quita etiquetas (guardando índice), TTS→audio.mp3, Whisper palabra→words.json.
- `02-build-scenes`: mapea etiqueta→palabra siguiente (timestamp `in`), resuelve hide/clear (`out`), slots, timing → scenes.json.
- `03-render`: `npx remotion render` sobre la composición que lee el JSON.

Cada script ejecutable por separado. Modo `--preview` para Remotion Studio.

---

## 10. Assets (sin IA)

`assets/manifest.json`: id → file, source, license, attribution.
Fuentes: **OpenMoji / Twemoji** (libres, sin atribución), Flaticon/Icons8, Noun Project,
imágenes de prensa de fabricantes para hardware. Mantener atribuciones y volcarlas en la descripción.
Monigotes: SVG reutilizables, la firma del canal.

---

## 11. GitHub Actions

Push de nuevo directorio en `episodes/` → instalar deps+fuentes → 01-tts → 02-build-scenes →
03-render (headless Chrome) → subir out.mp4 o publicar en YouTube. Cachear node_modules y audio.

---

## 12. "Terminado" v1

Episodio de 60s con: 6 assets sincronizados, 2 flechas trazadas, 1 monigote con cabeza
sustituida, 3 textos manuscritos (uno rojo), renderizado desde GitHub Actions sin intervención.

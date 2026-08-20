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


# ADDENDUM 1 a SPEC.md — Variedad de composición, media y capas

> Añadir al final de `SPEC.md`. Amplía las secciones 6, 7 y 8.
> Corrige tres defectos: repetición de escena, assets fantasma y colisiones.

---

## A. Concepto nuevo: BEAT

El guion deja de compilarse párrafo a párrafo con una estructura fija. Se divide
en **beats**: unidades de 4 a 12 segundos, cada una con su propia **plantilla de
composición**.

En `script.md`:

```markdown
[[beat: compare-2]]
Neptuno es el más ventoso del sistema [[show: neptune @left]]
mientras que Marte apenas tiene atmósfera [[show: mars @right]].

[[beat: stat-card]]
Un año allí dura [[stat: "165" unit="años terrestres"]].

[[beat: photo-focus]]
Y así se ve desde el Voyager 2. [[clip: voyager-flyby @center, frame=polaroid]]
```

Si no se declara `[[beat: ...]]`, el compilador elige plantilla automáticamente
según qué elementos contiene el beat, aplicando las reglas anti-repetición de C.

---

## B. Catálogo de plantillas

Implementar las once. Cada una define sus propios slots y su z-order.

| Plantilla | Composición | Cuándo se usa |
|---|---|---|
| `title-card` | Texto grande centrado, fondo limpio, opcional icono pequeño encima | Apertura de sección |
| `single-focus` | Un solo elemento grande centrado + rótulo debajo | Presentar un concepto nuevo |
| `compare-2` | Dos elementos enfrentados, línea vertical divisoria, rótulo bajo cada uno | Comparar A vs B |
| `list-3` | Tres elementos en fila, entrada escalonada, rótulo bajo cada uno | Enumerar |
| `grid-4` / `grid-8` | Rejilla, entrada en cascada, rótulo bajo cada celda | Catálogo de componentes |
| `photo-focus` | Foto o clip grande centrado con marco, texto flotando encima | Material real |
| `stat-card` | Número enorme centrado + unidad pequeña debajo | Dato impactante |
| `stickman-reaction` | Monigote a la izquierda ocupando 1/3, contenido a la derecha | Reacción, opinión, chiste |
| `flow-3` | Tres elementos en fila unidos por dos flechas cortas | Proceso, cadena causal |
| `zoom-detail` | Elemento grande + recuadro de lupa señalando una parte | Detalle técnico |
| `full-bleed-clip` | Clip a sangre ocupando todo el frame, texto sobreimpreso | Transición, respiro |

Cada plantilla expone sus slots propios. `compare-2` expone `left`, `right`,
`label-left`, `label-right`, `divider`. `grid-4` expone `cell-1..4` y
`label-1..4`. El compilador solo puede usar slots que existan en la plantilla
activa; si el guion pide uno inexistente, **error de build**.

---

## C. Reglas anti-repetición (obligatorias)

El compilador mantiene el historial del episodio y aplica:

1. Ninguna plantilla puede repetirse en **beats consecutivos**.
2. Ninguna plantilla puede usarse más de **3 veces en todo el episodio**, salvo
   `single-focus`, que admite 5.
3. La dirección de las flechas debe alternar. Prohibido más de dos flechas
   seguidas con la misma dirección. Direcciones disponibles:
   `left→right`, `right→left`, `top→bottom`, `center→radial` (varias salientes),
   `curved-up`, `curved-down`.
4. La animación de entrada no puede ser la misma en dos beats consecutivos.
5. Si tres beats seguidos usan solo `image` + `text`, forzar la inserción de un
   beat con `clip`, `gif` o `stickman-reaction`. El compilador debe avisar por
   consola: `⚠ 3 beats estáticos seguidos en 01:24 — insertar media`.
6. Cada 45 segundos como máximo debe aparecer un elemento en movimiento
   (`clip`, `gif` o animación de monigote). Si no, error de lint.

Añadir un comando `npm run lint:variety` que analice `scenes.json` y devuelva un
informe: reparto de plantillas, segundos sin movimiento, direcciones de flecha,
assets más repetidos.

---

## D. Tipos de elemento nuevos en `scenes.json`

Ampliar el `type` a: `image | text | arrow | stickman | clip | gif | shape | stat`.

```jsonc
{
  "id": "voyager",
  "type": "clip",                    // vídeo local o descargado
  "src": "assets/clips/voyager.mp4",
  "slot": "center",
  "frame": "polaroid",               // none | polaroid | tv-crt | browser | phone
  "loop": true,
  "muted": true,
  "in": 42.1, "out": 51.0,
  "enter": { "kind": "pop", "duration": 0.4 },
  "exit":  { "kind": "fade-out", "duration": 0.3 }
}
```

```jsonc
{
  "id": "reaction",
  "type": "gif",
  "src": "assets/gifs/mind-blown.gif",
  "slot": "right",
  "frame": "none",
  "in": 55.0, "out": 58.2,
  "enter": { "kind": "stamp", "duration": 0.25 },
  "exit":  { "kind": "pop-out", "duration": 0.2 }
}
```

```jsonc
{
  "id": "highlight",
  "type": "shape",
  "shape": "circle-highlight",       // circle-highlight | underline | bracket |
                                     // cross-out | checkmark | box | magnifier
  "target": "neptune",               // se dibuja sobre otro elemento
  "color": "#E5342A",
  "in": 47.0, "out": 51.0,
  "enter": { "kind": "draw", "duration": 0.6 }
}
```

Las `shape` son la variedad de "dibujo" que falta: círculos rojos rodeando algo,
subrayados, llaves, tachones, checks. Se dibujan con `stroke-dashoffset` igual
que las flechas y dan muchísima vida sin necesidad de assets nuevos.

**Implementación en Remotion:**
- `clip` → `<OffthreadVideo>` del core.
- `gif` → paquete `@remotion/gif`, componente `<Gif>`.
- `frame` → wrapper CSS: borde blanco 12px + trazo negro 4px + sombra suave
  para `polaroid`; el resto son SVG decorativos superpuestos.

---

## E. Sistema de capas (z-order fijo)

Se acabaron los solapamientos accidentales. Orden fijo, no configurable:

```
  0  fondo
 10  clip / gif / image de fondo a sangre
 20  image / clip en slot
 30  shape (círculos, subrayados) — encima del elemento al que apuntan
 40  arrow
 50  stickman
 60  text / stat
 70  corner-badge (miniatura persistente arriba a la izquierda)
```

**Regla de trazado de flechas:** una flecha no puede atravesar el bounding box de
un elemento de capa 20. El compilador debe:
1. Detectar la colisión.
2. Curvar la flecha por encima o por debajo del obstáculo (`curved-up` /
   `curved-down`), eligiendo el lado con más espacio libre.
3. Si no hay ruta limpia, error de build indicando el beat.

**Regla de colisión de texto:** ningún `text` puede solaparse con un `stickman`
ni con otro `text`. Si ocurre, desplazar verticalmente en incrementos de 40px
hasta resolver; si no cabe, error de build.

---

## F. Assets que faltan: fallar, nunca dibujar

**Eliminar el fallback shape.** Si un `asset_id` no está en `manifest.json`, el
build falla con:

```
✗ Asset no encontrado: "telescope-2" (beat 7, 03:26)
  Sugerencias por nombre similar: telescope, telescope-old
  Añádelo a assets/manifest.json o corrige el guion.
```

Añadir `npm run assets:check`, que recorre todos los guiones de `episodes/`,
lista los `asset_id` usados y marca los que faltan **antes** de gastar un céntimo
en TTS.

---

## G. Fuentes de clips y GIFs

Añadir un script `scripts/00-fetch-media.ts` que resuelva assets remotos
declarados en el manifest y los cachee en local.

- **GIFs:** API de Giphy y de Tenor. Ambas gratuitas con clave, búsqueda por
  término. Ideales para reacciones y humor.
- **Clips de stock:** Pexels Videos y Pixabay tienen API gratuita y licencia
  permisiva. Coverr para planos ambiente.
- **Material científico y de archivo:** la NASA (imágenes y vídeo de dominio
  público), Internet Archive, Wikimedia Commons. Para un canal de divulgación
  espacial esto es la mina principal.
- **Capturas de producto o interfaz:** grabar tú mismo y guardarlas en
  `assets/clips/`.

Cachear siempre en disco y versionar el manifest con la URL de origen y la
licencia. Si un clip viene de Pexels o Giphy, el crédito debe salir generado
automáticamente en la descripción del vídeo.

---

## H. Criterio de "terminado" para este addendum

Un episodio de 3 minutos que cumpla el lint de variedad:

- mínimo 6 plantillas distintas usadas,
- ninguna repetida en beats consecutivos,
- al menos 2 clips y 1 GIF,
- al menos 4 `shape` distintas,
- flechas en 3 direcciones diferentes como mínimo,
- 0 colisiones, 0 assets fantasma,
- ningún tramo de más de 45 segundos sin movimiento.


# ADDENDUM 2 a SPEC.md — Composición acumulativa y registro de tipos

> Añadir al final de `SPEC.md`, después del ADDENDUM 1.
> **Este documento CORRIGE reglas del ADDENDUM 1.** Donde haya conflicto, manda este.

---

## A. CORRECCIÓN al ADDENDUM 1, sección E

La regla *"ningún elemento puede solaparse, si ocurre error de build"* era
incorrecta. El estilo de referencia **sí solapa**, y ese amontonamiento es parte
de la identidad visual.

Se sustituye por el modelo de **lienzo acumulativo**:

1. Los elementos **no se limpian frase a frase**. Entran y se quedan.
2. La pantalla se va llenando durante toda una sección (30-60 s).
3. Solo al cambiar de sección se ejecuta un `[[clear]]` que vacía todo con
   salida escalonada de 0.08 s entre elementos.
4. El solapamiento está **permitido y es deseable**, con estos límites:
   - Ningún elemento puede tapar más del **35 %** del área de otro que siga vivo.
   - El texto nunca queda tapado: capa superior siempre.
   - Un elemento nuevo no puede caer exactamente sobre el centro de otro.
5. Se permite que un elemento **se salga parcialmente del frame** (hasta un 15 %
   de su ancho). Es un recurso deliberado que da sensación de abundancia.

Sustituir el validador de colisiones por un **validador de densidad**:

```
densidad = área total ocupada / área del frame
  < 0.15  →  warning "escena vacía"
  0.25 – 0.65  →  correcto
  > 0.80  →  warning "saturada, forzar clear"
```

---

## B. Colocación orgánica (anti-rejilla)

Los slots del SPEC siguen existiendo, pero como **zona de atracción**, no como
casilla fija. Al resolver un slot, aplicar:

- **Jitter de posición:** ±6 % del ancho del frame en X e Y, con semilla derivada
  del `id` del elemento para que el render sea reproducible.
- **Jitter de escala:** cada elemento se escala entre 0.75x y 1.35x respecto al
  tamaño nominal del slot. Los elementos que el guion marque como `hero` van a
  1.6x.
- **Rotación:** ±3° en fotos y capturas. Los vectores y el texto sin rotación.

Sin esto todo queda alineado como una presentación corporativa y pierde
completamente el carácter.

---

## C. Registro de tipos de asset

Seis familias visuales conviven en pantalla. Cada una tiene tratamiento y
animación propios. En `manifest.json`, campo `kind`:

| `kind` | Qué es | Tratamiento | Entrada por defecto |
|---|---|---|---|
| `doodle` | Ilustración trazada a mano, línea negra, sin color o en gris | Ninguno | `draw` 0.8 s |
| `vector` | Icono plano de trazo grueso y color liso | Ninguno | `pop` 0.4 s |
| `cutout` | Foto de producto recortada, fondo transparente | Sombra suave opcional | `slide-in` + fade 0.4 s |
| `screenshot` | Captura de pantalla o interfaz | Borde blanco 6 px + sombra + rotación ±3° | `pop` 0.45 s |
| `meme` | GIF o clip corto de reacción | Borde fino o ninguno | `stamp` 0.25 s |
| `logo` | Logotipo de marca | Ninguno | `fade-in` + escala 1.1→1 0.35 s |

**Reglas de vida útil por tipo:**
- `meme`: 2–4 s. Entra, remata la frase y desaparece. Nunca se queda.
- `doodle`, `vector`, `cutout`: viven hasta el `clear` de sección.
- `screenshot`: 4–8 s, o hasta el clear si es el elemento `hero`.

**Regla de mezcla:** en una misma sección deben aparecer al menos **tres `kind`
distintos**. Si el lint detecta una sección con un solo tipo, warning.

---

## D. Texto-eco: el texto sale del propio guion

Este es el mecanismo central del estilo y hay que implementarlo bien.

El texto en pantalla **no son rótulos descriptivos**. Son fragmentos literales de
la frase que se está locutando en ese momento, extraídos y colocados alrededor
de las imágenes.

En `script.md` se marca con asteriscos dobles:

```markdown
El **DVI** hizo de **puente** entre los **monitores analógicos**
y las **pantallas digitales** ==modernas==.
```

- `**palabra**` → texto negro flotante, entra con `handwrite`.
- `==palabra==` → texto rojo `#E5342A`, entra con `stamp`. Máximo 1 por frase.
- `[[box: "texto"]]` → texto blanco sobre caja negra redondeada (ver captura de
  DisplayPort: "PC gamers"). Para etiquetar un público o categoría.

El compilador coloca cada fragmento en un hueco libre cercano al elemento visual
más recientemente añadido, con el jitter de la sección B.

**Reglas:**
- Máximo 5 fragmentos de texto simultáneos en pantalla.
- Tamaños: `sm` 32 px, `md` 48 px, `lg` 72 px. El compilador alterna para crear
  jerarquía; nunca dos fragmentos consecutivos del mismo tamaño.
- El texto rojo nunca supera el 15 % del total de palabras en pantalla.

---

## E. Elementos estructurales fijos

### Corner badge (obligatorio)
Miniatura del tema de la sección arriba a la izquierda, con etiqueta manuscrita
debajo. Cambia en cada `[[section]]`, con transición de cross-fade de 0.4 s.
Persiste durante toda la sección. Es lo que orienta al espectador.

```markdown
[[section: "VGA", badge=vga-connector.png]]
```

### Título de sección subrayado
Título centrado arriba en tipografía manuscrita, con un subrayado trazado a mano
que se dibuja de izquierda a derecha en 0.5 s tras aparecer el texto. Aparece al
inicio de sección y **permanece** mientras dura.

### Marca de agua
Logo del canal abajo a la derecha, opacidad 0.5, siempre presente.

---

## F. Perfiles de estilo por canal

Distintos canales de referencia usan paletas distintas. Definir en
`style-profile.json` para poder cambiar el look sin tocar el motor:

```jsonc
{
  "name": "color-pop",
  "palette": ["#F5C518","#EE2B37","#3DDC3D","#F0329B","#1BA0EE"],
  "stroke": "#111111",
  "accent": "#E5342A",
  "font": "Patrick Hand",
  "allowedKinds": ["vector","cutout","screenshot","meme","logo"],
  "jitter": { "position": 0.06, "scale": [0.75,1.35], "rotation": 3 }
}
```

Perfil alternativo `mono-doodle`: sin paleta de color, solo trazo negro sobre
blanco, `allowedKinds: ["doodle","logo"]`, jitter de rotación 0. Es el estilo de
las capturas de VGA y DisplayPort.

---

## G. Actualización del lint

`npm run lint:variety` pasa a comprobar también:

- densidad por sección dentro del rango,
- mínimo 3 `kind` distintos por sección,
- ningún `meme` con vida > 4 s,
- ningún tramo de 20 s sin texto-eco nuevo,
- corner badge presente en el 100 % de los frames,
- máximo 5 textos simultáneos,
- proporción de texto rojo bajo el 15 %.

# Especificación — motor de vídeos explainer "Cápsula Curiosa"

> **Fuente de verdad del proyecto.** Documento único y consolidado (base + addendums 1, 2, 4 y 6).
> Ante cualquier duda futura, manda este fichero. Ver "Decisiones y motivos" al final.

---

## 0. Qué NO es

- NO se genera vídeo con IA. NO hay edición manual en un editor de vídeo.
- Las IMÁGENES pueden generarse (OpenAI) cuando no hay foto real ni icono válido; los ICONOS se generan con OpenAI y/o se toman de packs y se **normalizan** al estilo de la casa.

## 1. Qué SÍ es

Un **compositor de línea de tiempo programático**: un renderizador (Remotion) que recibe `scenes.json` —qué elemento aparece, cuándo, dónde, con qué animación— y produce un MP4 1920×1080 sincronizado con la voz. Es un "PowerPoint animado por JSON", no un generador de vídeo.

---

## 2. Estética objetivo (perfil `color-pop`)

- **Fondo BLANCO `#FFFFFF`.** Liso, sin gradientes ni texturas. *(Regla firme; ver Decisiones.)*
- Trazo negro `#111111`, grosor 4. Paleta de relleno viva: amarillo `#F5C518`, magenta `#F0329B`, verde `#3DDC3D`, cian `#1BA0EE`, naranja `#FF7A1A`, violeta `#8B5CF6`.
- **Rojo `#EE2B37` reservado al texto de énfasis** (nunca como relleno de icono). Máx 3 colores de paleta en pantalla a la vez.
- Tipografía manuscrita: `Patrick Hand` (cuerpo) + `Caveat` (titulares/énfasis), con fallback. Se **empaquetan** en el render (`@remotion/google-fonts`) para que funcione headless.
- Monigotes de palo negros reutilizables. Flechas y marcas rojas dibujadas a mano (trazado `draw`).
- Perfil configurable en `style-profile.json` (permite un `mono-doodle` alternativo). El perfil define fondo, paleta, tipografía, `allowedKinds`, jitter y tratamiento por kind.

---

## 3. Stack técnico

| Capa | Herramienta |
|---|---|
| Render | **Remotion** (React+TS), headless en GitHub Actions |
| Voz | **genaipro.io** (voz "Tony", `eleven_multilingual_v2`) — DE PAGO, cachear |
| Sincronía | **faster-whisper** (local, gratis) → `words.json` palabra a palabra |
| Iconos | OpenAI (SVG) → normalizador; reserva: sets offline `@iconify-json/*` |
| Media | Pexels/Pixabay (clips), Giphy (gifs), Wikipedia (fotos), archivos históricos (archive) |
| Composición final | FFmpeg (lo llama Remotion; música de fondo se mezcla aparte) |

No usar Manim, MoviePy ni modelos de generación de vídeo.

---

## 4. Perfiles de contenido (`contentType`)

El vocabulario visual NO es el mismo para todos los temas. Se declara en la cabecera del guion:

```yaml
---
title: "El Imperio Español"
contentType: historical
---
```

| `contentType` | Material dominante | Iconos | Ejemplos |
|---|---|---|---|
| `tech` | fotos de producto, capturas, vectores | 50 % | hardware, software, protocolos |
| `historical` | grabados, pinturas, mapas antiguos, archivo | **máx 10 %** | historia, biografías, guerras |
| `scientific` | fotografía científica, diagramas, agencias | 25 % | espacio, biología, geología |
| `conceptual` | iconos, esquemas, monigotes | 70 % | economía, filosofía, procesos |
| `cultural` | fotografía, clips, obra reproducida | 15 % | arte, música, gastronomía |

**La proporción de iconos depende del `contentType`, no es fija.** En `historical`, los iconos quedan para navegación (corner badge, separadores); el cuerpo se ilustra con material de archivo.

---

## 5. Guion (`script.md`)

Locución en español con **etiquetas inline** ancladas a la palabra SIGUIENTE. El guion se organiza en **SECCIONES** (30-60 s); dentro, opcionalmente, en **beats** (4-12 s) que fijan la plantilla.

### Etiquetas
- `[[section: "TÍTULO", badge=<id>]]` — abre sección: badge persistente + título subrayado. Frontera de vaciado.
- `[[beat: <plantilla>]]` — fija la plantilla (zona de atracción) para lo que sigue.
- `[[show: <id> @<slot>]]` / `[[icon: <id> @<slot>]]` — imagen/icono explícito.
- `[[archive: "descripción" @<slot>, source=bne, treatment=card|map-canvas]]` — material histórico.
- `[[clip: <id> @<slot>, frame=card]]` — vídeo. `[[gif: <id> @<slot>]]` — reacción (2-4 s, se va).
- `[[stat: "<número>" @number, unit="<unidad>"]]` — número gigante.
- `[[text: "<máx 6 palabras>" @<slot>, color=red, size=sm|md|lg]]` — texto manuscrito.
- `[[shape: <tipo> @<slot>]]` — marca dibujada: circle, underline, cross, check, box, bracket, magnifier.
- `[[arrow: <slotA> -> <slotB>]]` — flecha (dirección alterna).
- `[[stickman: <pose> @<slot>, head=<id>]]` — poses: neutral, pointing-right/-left, shrug, thinking, angry, cheer.
- `[[box: "texto"]]` — texto blanco sobre caja negra (etiquetar público/categoría).
- `[[hide: <id>]]` / `[[clear]]`.

### Texto-eco (mecanismo central)
El texto en pantalla NO son rótulos: son **fragmentos literales de la locución**, marcados en el propio texto hablado:
- `**palabra**` → texto negro flotante, entra con `handwrite`.
- `==palabra==` → texto rojo, entra con `stamp`. Máx 1 por frase.

El compilador **no inventa iconos**: si el guion no marca material para una frase, no coloca nada y emite warning con el segundo y la frase. La densidad se consigue escribiendo bien el guion, no improvisando.

Longitud obligatoria: **mínimo 1300 palabras (8+ min)**; hay pasada de expansión si sale corto.

---

## 6. Composición: lienzo ACUMULATIVO

1. Los elementos **no se limpian frase a frase**: entran y se quedan.
2. La pantalla se llena durante toda la sección; sólo `[[section]]`/`[[clear]]` la vacían, con salida escalonada 0.08 s entre elementos.
3. **Solapamiento** *(regla firme)*:
   - **imagen-imagen: permitido hasta el 35 %** del área del otro elemento vivo.
   - **texto-texto: PROHIBIDO, sin excepciones.** El texto es siempre capa superior; si dos textos se solapan, el compilador desplaza en incrementos de 40 px hasta resolver; si no cabe, error de build.
   - Un elemento nuevo no cae exactamente sobre el centro de otro. Una imagen puede salirse hasta un 15 % por el borde (sensación de abundancia).
4. **Máximo 4 textos simultáneos en total** (labels + ecos). El título de sección y la etiqueta del badge son navegación, no cuentan.
5. Validador de **DENSIDAD** (sustituye al de colisiones): área ocupada / área del frame → `<0.15` warning "vacía"; `0.25–0.65` correcto; `>0.80` warning "saturada".

---

## 7. Slots = zonas de atracción con JITTER (no rejilla)

Los slots (`center, left, right, top, bottom, top-left/right, bottom-left/right, corner-badge`, y los de cada plantilla) son **centros de atracción, NO casillas fijas**. Al resolver un slot se aplica:
- **Jitter de posición:** ±6 % del ancho del frame en X e Y, con semilla derivada del `id` (render reproducible).
- **Jitter de escala:** 0.75×–1.35× del tamaño nominal del kind; los marcados `hero` a 1.6×.
- **Rotación:** ±3° en fotos, cutouts, screenshots y archive. Vectores y texto sin rotación.

Sin jitter todo queda alineado como PowerPoint y pierde el carácter hecho a mano.

---

## 8. Catálogo de plantillas

`title-card, single-focus, compare-2, list-3, grid-4, grid-8, photo-focus, stat-card, stickman-reaction, flow-3, zoom-detail, full-bleed-clip, map-canvas`.

- Cada plantilla expone sus slots propios (además de los universales). Slot inexistente en la plantilla activa → warning.
- `map-canvas`: mapa antiguo a pantalla completa como fondo, con marcadores/iconos encima. Plantilla base para contenido geográfico e histórico.
- Reglas de variedad: ≥6 plantillas distintas por vídeo, ninguna repetida en beats consecutivos, ninguna >3 veces (`single-focus` máx 5).

---

## 9. Capas (z-order fijo)

```
 0 fondo · 10 clip/imagen a sangre · 20 image/clip/archive en slot · 30 shape ·
 40 arrow · 50 stickman · 60 text/stat · 70 corner-badge
```
El texto siempre por encima. Las flechas no atraviesan cajas de capa 20: se curvan por encima/por debajo del obstáculo.

---

## 10. Tipos de asset (`kind`) y tratamiento

| `kind` | Qué es | Tratamiento | Entrada por defecto | Vida |
|---|---|---|---|---|
| `vector` | icono plano de trazo grueso y color liso | ninguno (ya normalizado) | `pop` 0.4 s | hasta clear |
| `doodle` | dibujo a mano, línea negra | ninguno | `draw` 0.8 s | hasta clear |
| `cutout` | foto de producto recortada | sombra suave + rotación ±3° | `slide-in`+fade 0.4 s | hasta clear |
| `screenshot` | captura de interfaz | borde blanco 6 px + sombra + rotación | `pop` 0.45 s | 4-8 s / hero hasta clear |
| `archive` | grabado/pintura/mapa histórico | **card + Ken Burns + viñeta 0.15 + rotación 2°** | `scale-blur-in` 0.5 s | 5-12 s |
| `clip` | vídeo (B-roll) | esquinas redondeadas (borde negro) | `slide-in-bottom` 0.45 s | hasta clear |
| `meme` (gif) | reacción/humor | borde fino o ninguno | `stamp` 0.25 s | **2-4 s, nunca se queda** |
| `logo` | logotipo de marca | ninguno | `fade-in`+escala 0.35 s | hasta clear |

**Tratamiento `card`** *(regla firme)* — para `image`, `screenshot`, `clip`, `archive`:
```css
border-radius: 18px; background: #FFFFFF;
border: 3px solid #111111;                 /* SÍ hay borde */
box-shadow: 6px 6px 0 rgba(17,17,17,0.35); /* sombra DURA desplazada, sin blur */
overflow: hidden;
```
Tamaño típico de tarjeta: 45-70 % del ancho del frame (son protagonistas). En una sección debe haber al menos 3 `kind` distintos.

**Iconos — estructura de TRES CAPAS + `paint-order` obligatorio** *(regla firme)*:
1. `stroke` negro (trazo), 2. `fill-body` (color de paleta), 3. `fill-detail` (`#1F1F1F`).
Todo path lleva `paint-order="stroke fill"` (el trazo se pinta detrás del relleno), `stroke #111111`, `stroke-width 4`, `vector-effect="non-scaling-stroke"`, linejoin/linecap `round`. Colores como `var(--fill-body)` / `var(--fill-detail)` para recolorear en render. Lo produce `scripts/normalize-icon.mjs` (SVGO → limpia → path de mayor área = cuerpo → resto = detalle → capas + trazo).

---

## 11. Animaciones y motion blur

Entradas: `pop` (spring), `fade-in`, `slide-in-*`, `draw` (flechas/shapes), `handwrite`, `stamp`,
`slide-in-right-blur`, `slide-in-left-blur`, `whip-in` (0.3 s), `card-drop` (cae con rebote), `scale-blur-in`.
Salidas: `fade-out` (defecto), `pop-out`, `slide-out-*`.

- **Motion blur** (`@remotion/motion-blur`, `<Trail>` o `filter:blur` en el eje del movimiento): toda entrada/salida `slide-*` con recorrido **>300 px** lleva motion blur; `pop`, `fade`, `draw` NO.
- Los `slide-*` usan `spring()` con overshoot bajo (3-4 %) para dar peso.
- Reparto: tarjetas grandes → `slide-*-blur` o `card-drop`; iconos pequeños → `pop`. No mezclar (si todo lleva blur, deja de destacar).
- Timing base: entrada 0.4 s / salida 0.3 s. Entradas a <0.2 s se escalonan 0.12 s. Nada menos de 1.2 s en pantalla.

---

## 12. `scenes.json` (contrato del render; el renderizador NO conoce el guion)

```jsonc
{
  "meta": { "title":"...", "fps":30, "width":1920, "height":1080, "duration":784.4, "audio":"active/audio.mp3", "profile":"color-pop" },
  "elements": [
    { "id":"...", "type":"image|text|arrow|stickman|clip|gif|shape|stat|title|boxtext|watermark",
      "kind":"vector|cutout|archive|...", "src":"assets/...", "box":{"cx":960,"cy":500,"w":380,"h":380},
      "rotate":2, "frame":"card", "z":20, "in":34.0, "out":48.0,
      "enter":{"kind":"scale-blur-in","duration":0.5}, "exit":{"kind":"slide-out-left","duration":0.4} }
  ]
}
```
El compilador resuelve slot→caja absoluta (con jitter) y escribe `box`, `rotate`, `z`; el renderizador sólo dibuja.

---

## 13. Pipeline (scripts)

- `00-write-script` — Claude escribe UNA vez el guion (secciones/beats/eco, ≥1300 palabras, sin repetir iconos) + `assets.json`. No se reescribe salvo vídeo nuevo. `max_tokens: 64000`.
- `00b-annotate` (histórico) — recorre el guion frase a frase y propone qué material de archivo pedir; **una persona revisa** antes de resolver assets.
- `01-assets` — iconos: OpenAI (SVG) → normalizador; reserva sets offline. Fotos: Wikipedia. `archive`: resolutor de archivos (BNE, Europeana, Wikimedia, Rijksmuseum, Met, LoC, Rumsey, Internet Archive). NO toca clips/gifs.
- `00-fetch-media` — clips (Pexels/Pixabay), gifs (Giphy).
- `assets:check` — **GATE**: falla el build si falta un asset o si un `vector` no está normalizado.
- `01-tts` — texto limpio → voz (genaipro) **sólo si no existe ya** → Whisper → `words.json`.
- `02-build-scenes` — etiquetas + `words.json` → `scenes.json` (secciones, jitter, capas, colisión de texto, densidad).
- `03-render` — `npx remotion render`; luego se mezcla la música de fondo (loop, ~-23 dB).

---

## 14. Assets: fuentes, licencias, "faltantes = error"

- **Iconos:** OpenAI + sets offline `@iconify-json/*` (solar/ph/streamline/mingcute), normalizados. Guardar licencia en `attribution` (solar/streamline = CC BY 4.0; ph = MIT; mingcute = Apache 2.0).
- **Fotos:** Wikipedia/Wikimedia Commons (con User-Agent propio; reintentos).
- **Archivo histórico:** BNE (OAI-PMH), Europeana (clave), Wikimedia, Rijksmuseum, Met, Library of Congress, David Rumsey, Internet Archive. Guardar institución + declaración de derechos; volcar créditos a la descripción del vídeo. Pieza con derechos dudosos → descartar.
- **Assets no encontrados → ERROR DE BUILD.** NUNCA se dibuja una figura de fallback. `assets:check` lista los que faltan antes de gastar en TTS.

---

## 15. Anti-gasto (voz de pago)

- La voz genaipro es DE PAGO: se genera **una sola vez por episodio** y se versiona (`audio.mp3` + `words.json`). Re-renders la REUTILIZAN (0 gasto). `FORCE_TTS=1` fuerza regenerar.
- **La voz se hace commit+push ANTES de renderizar** (paso `02c`): si el render falla, el audio de pago no se pierde. Nunca guardar el audio después del render.
- Probar clips/gifs/render en local antes de generar un vídeo nuevo (generar = TTS = gasto).

---

## 16. Lint de variedad (`lint:variety`)

Comprueba: densidad por sección en rango; ≥3 `kind` distintos por sección; ningún `meme` >4 s; ningún tramo >20 s sin texto-eco nuevo; corner badge presente ~siempre; **≤4 textos simultáneos**; texto rojo <15 % de las palabras; **ningún icono/imagen de concepto repetido**; flechas en ≥3 direcciones.

---

## 17. GitHub Actions

`workflow_dispatch` (`nuevoVideo` true/false) + cron diario. ffmpeg estático (GitHub), Python + faster-whisper. Orden: 00 (si nuevo) → 01-assets → 00-fetch-media → assets:check (gate) → 01-tts → 02-build-scenes → **02c guardar voz** → 03-render → música → Release permanente + commit del episodio. Créditos (CC BY, etc.) en la descripción del Release.

---

## 18. Criterio "terminado"

Un episodio de 8+ min, `contentType` correcto, ≥6 plantillas, 0 iconos repetidos, 0 colisiones de texto, densidad en rango, badge siempre presente, voz cacheada, música de fondo, y renderizado desde GitHub Actions sin intervención.

---

## Decisiones y motivos (no reintroducir errores ya corregidos)

1. **Fondo blanco**: es la identidad del canal de referencia; el gris se probó y se descartó. La tarjeta se ve por su borde+sombra dura, no por contraste de fondo.
2. **Card = borde 3px + sombra dura desplazada**: la sombra difusa se pierde y parece de plantilla; la dura da el look "sticker" hecho a mano.
3. **Texto-texto nunca se solapa; imagen-imagen hasta 35%**: el texto ilegible es el fallo que más se nota; el amontonamiento de imágenes es identidad, no error.
4. **Máx 4 textos**: más de 4 satura y no da tiempo a leer; el título y el badge no cuentan porque son navegación.
5. **Slots con jitter, no rejilla**: la rejilla fija delata "PowerPoint"; el jitter (con semilla) da el aire manual y es reproducible.
6. **Asset faltante = error, nunca fallback**: la figura de relleno metía iconos irrelevantes ("barquito azul"); mejor parar y pedir el asset correcto.
7. **Iconos 3 capas + paint-order="stroke fill"**: el trazo detrás del relleno evita que el borde "coma" la forma; las 3 capas dan color plano coherente y recoloreable.
8. **Proporción de iconos por contentType**: un icono decora cuando existe material real (histórico); la mezcla correcta depende del tema, no es fija.
9. **Voz cacheada + commit antes de render**: la voz es de pago; se perdió saldo por regenerar y por commitear después de un render que falló. Nunca repetir.

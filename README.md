# Cápsula Curiosa — pipeline de vídeo (Remotion)

Genera vídeos explicativos faceless (estilo whiteboard) y los **renderiza en la nube con GitHub Actions**.

## Qué hace
- Composición Remotion (`src/`) con los 10 trastornos de la personalidad: iconos SVG, muñecos, ventanas con fotos y **clips de vídeo reales**, texto sincronizado a la voz.
- El workflow de GitHub Actions renderiza el MP4 (10 min, 1080p) + la miniatura, sin necesidad de tu PC.

## Poner en marcha (una sola vez)

### 1. Crear el repo en GitHub y subirlo
```bash
# desde esta carpeta (remotion-canal)
git init
git add .
git commit -m "Pipeline Cápsula Curiosa"
git branch -M main
# crea un repo VACÍO en github.com (p.ej. capsula-curiosa) y luego:
git remote add origin https://github.com/TU_USUARIO/capsula-curiosa.git
git push -u origin main
```

### 2. Añadir las API keys como Secrets (NO se suben al repo)
En GitHub → tu repo → **Settings → Secrets and variables → Actions → New repository secret**. Añade:
- `GENAIPRO_API_KEY`
- `PIXABAY_KEY`
- `PEXELS_KEY`

(Solo hacen falta si en el futuro regeneras voz/assets en la nube. Para renderizar el vídeo actual no se usan porque los assets ya van en el repo.)

### 3. Lanzar un render
GitHub → pestaña **Actions** → "Renderizar vídeo (Cápsula Curiosa)" → **Run workflow**.
Al terminar, descarga el MP4 + miniatura desde los **Artifacts** de esa ejecución.

Para que corra solo cada semana, descomenta el bloque `schedule` en `.github/workflows/render.yml`.

## Scripts locales (para preparar nuevos vídeos)
- `generar-voz-video1-deep.mjs` — genera la voz (genaipro) y `manifest.json`.
- `fetch-media.mjs` — baja fotos + clips de vídeo de Pixabay por trastorno.
- `anchors.mjs` — calcula la sincronización texto-voz.
- `generar-musica.mjs` / `generar-sfx-full.mjs` — música y efectos.

## Fase 2 — automatización total desde `video.config.json`

Todo el vídeo se define en **`video.config.json`** (título, guion/narración, textos en pantalla, iconos, colores y las búsquedas de fotos/vídeos de cada ítem). La composición `AutoVideo` lo lee directamente — **no hay datos en el código**.

**Para un vídeo NUEVO** (sin tocar código):
1. Edita `video.config.json`: cambia `title`, `intro/grupos/outro.narration`, y cada ítem (`name`, `narration`, `def`, `fuera/dentro`, `senales`, `causa`, `ejemploTitle`, `consejo`, `main` icono, `color`, `videoQuery`, `photoQuery`).
2. `git commit` + `git push`.
3. GitHub → **Actions → Run workflow** y marca **"Regenerar"** ✅ → el Action:
   - genera la **voz** (genaipro) de cada segmento y mide su duración,
   - calcula la **sincronía** texto-voz,
   - baja **fotos + clips de vídeo** de Pixabay según las búsquedas,
   - genera **música + pops**,
   - **renderiza** el vídeo y sube el MP4 + miniatura.

`node generate.mjs` hace todo eso en local también (con las keys en `.env`). Los iconos disponibles están en `public/icons/` (Lucide); añade más con:
`curl -o public/icons/NOMBRE.svg https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/NOMBRE.svg`

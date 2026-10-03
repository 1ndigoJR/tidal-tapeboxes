# 📼 TapeBoxes para Tidal — Guía de instalación

Plugin para el cliente de escritorio de Tidal (vía TidaLuna) con 4 herramientas:
- 📀 Catálogo del artista → playlist nueva
- 🔀 Mezclar la playlist ORIGINAL (in-place, sin copias)
- ✂️ Dividir playlist en dos
- 🧹 Quitar canciones marcadas como IA

## Requisitos
- PC con Windows, Mac o Linux
- App de escritorio de Tidal instalada desde tidal.com (NO sirve la versión de Windows Store)
- TidaLuna instalado (el mod que permite plugins)

## Paso 1 — Instalar TidaLuna
1. Cierra Tidal por completo.
2. Descarga el **Luna Installer** desde https://github.com/Inrixia/TidaLuna/releases
3. Ejecútalo y sigue las instrucciones.
4. Abre Tidal — deberías ver la pantalla de bienvenida de Luna.

## Paso 2 — Instalar el plugin TapeBoxes
1. En Tidal, haz clic en tu avatar (arriba a la derecha) → **Luna Settings**.
2. Ve a la pestaña **Plugin Store**.
3. En **Install from URL** pega:
   ```
   https://github.com/1ndigoJR/tidal-tapeboxes/releases/download/latest/store.json
   ```
   *(URL pendiente de publicar el repo — ver NOTA abajo)*
4. Haz clic en **Install** en la tarjeta de 📼 TapeBoxes Tidal.

## Paso 3 — Usar
- Verás un botón flotante 📼 abajo a la derecha en Tidal.
- Tócalo para abrir el panel con las 4 herramientas.
- **📀 Catálogo:** abre el perfil del artista primero, luego pulsa el botón.
- **🔀 / ✂️ / 🧹:** abre la playlist primero, luego pulsa el botón.
- Todo pide confirmación antes de modificar algo.

## NOTA — Publicación pendiente
Para que la URL del paso 2 funcione hay que:
1. Crear el repo `tidal-tapeboxes` en GitHub (cuenta 1ndigoJR).
2. Subir el contenido de `dist/` (el `.mjs` y el `store.json`) a un Release.
3. El `store.json` del release debe listar el plugin.

El código fuente está en `~/workspace/tidal-tapeboxes/`.
Para recompilar: `cd ~/workspace/tidal-tapeboxes && pnpm build`.

## Advertencias honestas
- TidaLuna está en beta; si Tidal actualiza fuerte, el plugin puede necesitar ajustes.
- La detección de IA usa la sesión del propio cliente de escritorio (first-party), por eso es probable que sí vea el campo `ai` — pendiente de verificación real.
- El escaneo IA revisa canción por canción (puede tardar en playlists grandes).

# 📼 TapeBoxes para Tidal

Plugin de [TidaLuna](https://github.com/Inrixia/TidaLuna) con 4 herramientas para el cliente de escritorio de Tidal:

- **📀 Catálogo del artista → playlist** — Abre el perfil de un artista y crea una playlist con su catálogo completo (álbumes, EPs y sencillos).
- **🔀 Mezclar playlist original** — Reordena las canciones de la playlist actual *in-place* (no crea copias), con rollback automático si algo falla.
- **✂️ Dividir playlist** — Parte la playlist actual en dos nuevas: `"<nombre> (1/2)"` y `"<nombre> (2/2)"`.
- **🧹 Quitar canciones IA** — Escanea la playlist usando la sesión del propio cliente y quita las marcadas como generadas por IA (con confirmación y lista previa).

## Instalación

1. Instala [TidaLuna](https://github.com/Inrixia/TidaLuna) (cierra Tidal antes).
2. Abre Tidal → tu avatar → **Luna Settings** → **Plugin Store**.
3. En **Install from URL** pega:
   ```
   https://github.com/1ndigoJR/tidal-tapeboxes/releases/download/latest/store.json
   ```
4. Instala **📼 TapeBoxes Tidal**.
5. Verás el botón flotante 📼 abajo a la derecha.

> Requiere la app de escritorio de Tidal (no la versión de Windows Store).

## Desarrollo

```bash
pnpm install
pnpm build        # genera dist/
pnpm watch        # build + watch
```

## Licencia

MIT

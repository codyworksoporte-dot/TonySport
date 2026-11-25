# Rediseño 2026 · «Botones gigantes»

Sitio más simple y directo: menos texto, más imágenes y botones grandes. La asesora Tony y todo el proceso de **Crea tu pedido** (`/configurador`, `components/pedido/*`, `lib/pedido/*`) **no cambiaron**.

## Qué hay en cada parte

| Parte | Archivos |
| --- | --- |
| Colores, botones y bloques compartidos (prefijo `tc-`) | `app/tony-c.css` |
| Encabezado, menú, buscador y barra de accesos | `components/Header.tsx`, `components/header/*`, `components/site-navigation.css`, `lib/nav.ts` |
| Índice del buscador | `lib/site-directory.ts` |
| Pie de página | `components/Footer.tsx`, `components/site-footer.css` |
| Inicio | `app/page.tsx`, `components/home/*` |
| Escoge tu disciplina deportiva | `app/producto/*`, `components/product/*`, `lib/product-menu.ts` |
| Implementos deportivos | `app/implementos/*` |
| Promociones, Consulta tu pedido, App Tony, Tiendas, Contáctanos, Preguntas frecuentes | `app/promociones`, `app/consulta`, `app/app-tony`, `app/tiendas`, `app/contacto`, `app/ayuda`, `components/pages/*` |
| Ventana «Descarga la App Tony» | `components/AppDownload.tsx` |
| Asistente Tony | `components/assistant/*`, `lib/assistant/*` |
| Cocodrilo y animaciones | `lib/tony-art.ts`, `components/TonyArt.tsx`, `LagartoIntro`, `RouteTransition`, `TonyPeek`, `TonyMascot` |

## Para cambiar contenido (sin tocar diseño)

- **Teléfono, WhatsApp, consulta de pedido y tiendas de apps:** `lib/site-links.ts`.
- **Promociones:** `lib/promotions.ts`. Hoy son campañas pasadas. Para anunciar una vigente, agrega su imagen a `public/assets/…` y marca `current: true` con `until` (fecha). Solo así aparece como «Vigente».
- **Tiendas:** `data/tony-stores.json` (14 tiendas, Lourdes incluida).
- **Disciplinas (13) y sus fotos:** `lib/disciplines.ts`. Fotos de cada opción: `lib/product-menu.ts`.
- **Implementos (46 productos en 8 familias):** `lib/implements.ts`.
- **Destinos del menú y del pie:** `lib/nav.ts`.

## Logo 2026

Es la **opción C**: el mismo concepto de siempre, redibujado más imponente, con el cocodrilo de perfil rugiendo sobre el escudo.

- **Original sin fondo:** `design/brand/tony-logo-2026-master.webp` (1898×1707). Las opciones A y B y la comparativa están en `output/logo-nuevo/`, que no se sube.
- **Archivos para la web:** `public/assets/brand/`
  - `tony-logo.webp`, `tony-logo-480.webp`: logo completo.
  - `tony-peek.webp`: cabeza y garras sobre el borde.
  - `tony-head.webp`: cabeza.
- **Ícono del navegador:** `app/icon.png`, `app/apple-icon.png`.
- **Posiciones:** el ojo, el párpado, la bisagra de la mandíbula y los recortes están medidos en `lib/tony-art.ts`. Si se cambia el logo, se cambian esos números y los archivos; los componentes no.

## Asistente Tony

- Hoy responde **sin internet**, con los datos del propio sitio: tiendas, precios desde, implementos, disciplinas, app, consulta de pedido y promociones. Lo que no sabe lo pasa a WhatsApp 7015 5571 con la pregunta ya escrita.
- Está oculto en `/configurador`, porque ahí está la asesora.
- **Para conectarlo a una IA real:** publica un servidor propio, por ejemplo en el backend PHP, y compila con `NEXT_PUBLIC_TONY_ASSISTANT_URL=https://…`.
  - El contrato de petición y respuesta está explicado en `lib/assistant/remote.ts`.
  - La clave del modelo **vive solo en ese servidor**, nunca en el sitio.
  - Si el servidor falla, responde el motor local.

## Rutas

- **Nuevas:** `/promociones`, `/consulta` (dirección corta para la consulta de pedidos), `/app-tony`, `/implementos`.
- **`/entregas`:** ahora muestra «Consulta tu pedido».
- **Fuera del menú pero activas:** `/catalogo`, `/recientes` y `/resenas`, porque el proceso de pedido enlaza algunas. También `/actualidad`.
- **Quitado:** TonyPlay, de `/comunidad`.

## Pendiente de confirmar con Tony

1. **Teléfono de la tienda Lourdes:** el sitio oficial muestra 7015-5571 pero enlaza a 7603-5808. Hoy está 7015-5571.
2. **Promociones vigentes:** imagen, texto y fecha.
3. **Fotos de producto sin precio impreso:** varias portadas oficiales traen precios viejos dentro de la imagen.
4. **«Crear tu pedido» dentro de la App Tony:** viene del brief del cliente; el sitio oficial no lo menciona.

## Pruebas

- Toda la suite: `npm run test:e2e`.
- Unitarias de pedido y asesora: `npx playwright test -c tests/pedido/unit.config.ts`.
- Aceptación del rediseño: `tests/redesign.spec.ts`.

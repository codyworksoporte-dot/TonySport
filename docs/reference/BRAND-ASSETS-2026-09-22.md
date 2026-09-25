# Ajuste del logo y entrada de Tony

## Logo con transparencia

- Fuente del proyecto: `public/assets/tony-logo.jpeg`.
- Herramienta: `image_gen.imagegen`, modo nativo de edición; no CLI ni manipulación programática de píxeles.
- Resultado utilizado: `public/assets/tony-wordmark-transparent-v1.png`.
- Dimensiones: 1774 × 887; PNG RGBA con canal alfa real. El JPEG original permanece disponible.
- Archivo nativo de generación conservado localmente durante el diseño; no forma parte de la publicación.

Se conserva el wordmark inclinado, el degradado amarillo/verde, el ojo de reptil en la O y el subtítulo naranja. La extracción generativa elimina la textura rectangular y sus sombras desplazadas; puede introducir pequeñas diferencias de borde frente al original. `Brand.tsx` usa `object-fit: contain`, sin mezcla de color, para mostrar la imagen completa.

Prompt utilizado:

> Use case: background-extraction. Edit target: the provided original official TONY SPORTSWEAR logo. Make a clean transparent-background PNG cutout of the EXACT original brand lettering and reptile eye, for use in a website header. Remove ALL black/gray reptile-skin photographic background texture, including inside the counters of letters; retain the stylized yellow-lime-to-deep-green italic angular TONY letterforms, thin green/yellow outline, the lime slit-pupil reptile eye inside the O, and the orange italic SPORTSWEAR subtitle. Preserve original geometry, spacing, colors, eye cracks and pupil, spelling, proportions, and style as precisely as possible. Do not redesign, don't invent a mascot or emblem. Remove the muddy offset background shadow copies of lettering; the central primary logo and its fine outline are retained cleanly. Genuine alpha transparency everywhere beyond the logo, no checkerboard pattern rendered, no colored backdrop, no glow, no framed rectangle. Center complete logo with modest transparent margin; no cropping at any side. Landscape image containing the whole logo.

## Entrada animada

`LagartoIntro.tsx` conserva la ilustración vectorial por capas y la adapta a los colores del escudo de referencia del usuario: verdes vivos, ojos naranjas, contorno oscuro y marco naranja. El escudo incorpora el wordmark transparente en lugar de texto compuesto con una fuente genérica. La mascota sigue siendo una adaptación SVG, no un original vectorial suministrado por Tony.

El rasgado tiene tres heridas con interior oscuro, bordes iluminados, cortes irregulares y pequeños fragmentos. Las dos mitades de la cubierta usan contornos dentados. El rasgado termina de desvanecerse a los 2100 ms y toda la secuencia conserva sus 4200 ms.

Cada instancia de la mascota incluye un respaldo de texto SVG `TONY / SPORTSWEAR`, visible inmediatamente y mientras carga la imagen. El PNG permanece invisible hasta `onLoad`; si `onError` informa una descarga fallida, permanece el texto. La carga nunca retrasa el inicio ni la salida de la animación. Los atributos `data-wordmark-status` y `data-wordmark-fallback` permiten verificar ambos estados.

Se conserva el bootstrap de primer pintado, la preferencia de movimiento reducido, la marca de sesión `tony:intro:v2`, el botón Saltar intro, Escape y la repetición manual.

Revisión visual local: `docs/brand-refinement.png`, `docs/intro-rip-refinement.png`, `docs/intro-mascot-refinement.png`. El script `review-brand-intro.cjs` captura estados de la animación pausados con la API de animaciones del navegador y registra errores JavaScript.

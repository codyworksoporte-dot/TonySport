# Menú y transiciones móviles — 28 de septiembre de 2026

El menú separa su cabecera, una única zona desplazable y los accesos a carrito, cuenta y contactos. Se abre siempre desde arriba y con los grupos cerrados. La numeración fuera de orden y la distribución de submenús en dos columnas se sustituyen por filas legibles de al menos 48 px. El catálogo y las colecciones oficiales tienen acceso directo desde Producto. Se mantienen las rutas y el diseño de escritorio.

En teléfonos, la búsqueda ocupa la pantalla y desplaza solo los resultados: el campo y Cerrar siguen accesibles. El salto a Contactos usa únicamente el espacio reservado por la cabecera, evitando sumar dos márgenes de desplazamiento.

La transición móvil cubre toda la ventana del sitio con Tony centrado, acercamiento breve, guiño y salida. El navegador inicia la navegación inmediatamente; la cubierta no intercepta clics ni foco. Las entradas del contenido esperan hasta que empiece a retirarse. Se conservan el comportamiento de Atrás/Adelante, la pausa de efectos, movimiento reducido, cancelación al ocultar la pestaña y límite de seguridad.

## Archivos y ajustes

- `components/Header.tsx`, `components/site-navigation.css`: estructura, posición actual, apertura y cierre, panel móvil de 100dvh; en tablet permanece como panel lateral. Cabecera y cierre de 44 px, enlaces de submenú de 48 px.
- `components/mobile-refinements.css`: búsqueda de pantalla completa hasta 600 px y corrección del desplazamiento a contactos. Se eliminaron los estilos anteriores del menú que duplicaban su geometría.
- `components/RouteTransition.tsx`, `components/route-transition.css`: variante móvil hasta 900 px o con puntero táctil; fondo sólido sin filtros ni textura grande. Solo se animan transform y opacity. Reutiliza los SVG y el WebP de la marca, sin dependencias nuevas.
- `lib/ambient-config.ts`: `transition.mobile`: llegada 240 ms, guiño 280 ms, salida 200 ms (720 ms en una ruta ya preparada). Límite de espera: 3.200 ms. La navegación no se retrasa para ejecutar estos tiempos.
- `tests/mobile-menu.spec.ts`, `tests/mobile-transition.spec.ts`: geometría, submenús, accesos persistentes, reapertura, búsqueda, secuencia de fases, limpieza y tamaños 320×568, 390×844, 768×1024 y 844×390.

## Alcance de la validación

47 pruebas E2E distintas aprobadas entre las ejecuciones y las repeticiones: 5 del nuevo menú, 6 de transición móvil, 8 de editor/carrito móvil, 10 de apartados, 8 de efectos, 6 de colecciones/directorio y 4 generales del sitio. El caso horizontal detectó el doble margen de Contactos y pasó después de corregirlo. Las pruebas de transición registran las cuatro fases y sus dimensiones durante la navegación, no solo una captura estática.

TypeScript, compilación con `TONY_GITHUB_PAGES=true` y preparación de la exportación completados. Comprobación adicional sobre la exportación con prefijo `/TonySport`: menú, Inicio → Somos Tony → Atrás, cubierta completa, búsqueda de Mundial Anime y Contactos a 320 px; sin errores JavaScript.

Pruebas automatizadas en Chromium/Edge con emulación táctil y revisión visual en el navegador local. No equivalen a probar el teléfono físico del propietario ni Safari/iOS. No se afirma una mejora porcentual de FPS o batería. Capturas de trabajo en `output/mobile-menu-after.png` y `output/mobile-transition-after.png` (no se publican en Git).

La prueba antigua de búsqueda esperaba el nombre «Catálogo», sustituido en la revisión anterior por «70 diseños para personalizar»; se actualizó su selector sin alterar el contenido del sitio. No hay comando de lint configurado.

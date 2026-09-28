# Imágenes propias de las secciones Tony

Serie de 25 imágenes originales generadas con la herramienta integrada `image_gen`, el 28 de septiembre de 2026. Modelos adultas ficticias con uniformes de campaña negros, verdes y acentos naranja; escenas relacionadas con cada apartado y primeros planos para técnicas textiles. No se copiaron promociones, fechas ni precios de las referencias.

## Cobertura

| Apartado | Recurso o integración |
| --- | --- |
| Inicio: Recientes y Reseñas | `recientes-tony.webp`, `resenas-tony.webp`; sustituyen las tarjetas apiladas y la comilla decorativa |
| Inicio: directorio de tiendas | `tiendas-tony.webp`; sustituye el mapa decorativo |
| Inicio: cinco destinos | Miniaturas propias de calidad, entregas, patrocinio, comunidad y actualidad |
| Producto y Líneas | Nueve fotografías conceptuales, una por deporte o tipo de prenda; sustituyen las ilustraciones provisionales |
| Calidad: tela, costura y acabado | `calidad-tony.webp` |
| Calidad: cuatro técnicas | `full-tony.webp`, `partial-tony.webp`, `print-tony.webp`, `embroidery-tony.webp` |
| Tiendas | Escena conceptual de atención y uniformes; conserva el directorio real |
| Entregas | Preparación de prendas y embalaje; conserva los tres pasos y las opciones de entrega |
| Patrocinio | Capitana de equipo; conserva los textos y el formulario |
| Comunidad: App Tony | Atleta usando un teléfono, con los textos existentes de funciones |
| Comunidad: TonyPlay | Atleta con control de juego; conserva el estado «EN DESARROLLO» |
| Comunidad: responsabilidad social | Campaña conceptual de compañeras de equipo |
| Actualidad | Descubrimiento de prendas en un estudio |
| Nosotros | Campaña de identidad deportiva salvadoreña |
| Contacto | Imágenes contextuales para WhatsApp y correo |
| Tony News | Portadas conceptuales de Instagram, TikTok y Facebook; fotos para Racing y Cycling Pro |
| Recientes, Reseñas y carrito vacíos | Imágenes propias junto a los textos de estado existentes |

Las fotografías existentes del catálogo, las guías de producto, el tutorial y las vistas del editor se conservan. Las imágenes nuevas son material de campaña conceptual: no representan clientes que hayan escrito reseñas, sucursales específicas, clubes patrocinados ni registros documentales de responsabilidad social. Los enlaces a las publicaciones originales, los avisos y los estados funcionales se conservan.

## Archivos y ajustes

- Recursos finales: `public/assets/sections/`, WebP de hasta 960 píxeles de ancho, calidad de codificación 80.
- Prompts finales por imagen: [section-image-prompts.json](./section-image-prompts.json).
- `components/SectionImage.tsx`: integración compartida con `next/image`, carga diferida, `sizes`, recorte y sombras para lectura. Usa `siteAsset` para GitHub Pages.
- `components/section-images.css`: encuadres y contraste limitados a los espacios que reciben fotografía; sin nuevos listeners ni efectos de movimiento.
- `components/LineArtwork.tsx`: correspondencia entre las nueve líneas y sus imágenes; el catálogo real y el editor siguen siendo independientes.
- Integraciones en `HomeClientHub`, `HomeDestinations`, `TonyEditorial`, `EditorialTools`, `SocialPublication`, `RecentOrders`, `ReviewExperience`, `CartExperience` y las páginas editoriales correspondientes.

## Validación

- `npm run typecheck`.
- 21 pruebas existentes de `sections`, `customer-content`, `news` y `site`: navegación, enlaces, teclado, formularios, estados vacíos, carga social a petición, accesibilidad automatizada y móvil.
- Auditoría de 15 rutas a 1440, 768, 390 y 320 píxeles: 60 vistas, sin desbordamiento horizontal, imágenes rotas ni errores de página.
- Inspección visual de las 25 imágenes y de capturas de sus integraciones en escritorio y móvil.
- 20 pruebas adicionales existentes del pedido: precios, asesor y descargas, todas aprobadas.
- Compilación estática con `TONY_GITHUB_PAGES=true` y preparación de rutas mediante `scripts/prepare-pages.mjs`, completadas correctamente.
- La serie completa pesa 2.11 MiB. No se incorporan PNG originales ni dependencias nuevas al sitio.

El proyecto no define un comando de lint; no se ha ejecutado uno. Las comprobaciones de los servicios externos conservan sus límites originales: no se realizaron compras, envíos reales ni pagos.

La tarea modifica imágenes y su presentación. No modifica backend, pagos, autenticación, puntos, datos del catálogo ni textos comerciales. Los avances previos del configurador se conservan.

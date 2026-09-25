# Producto · verificación del menú oficial

Fuente pública: https://tonysportselsalvador.com/ y su destino Productos https://www.tonysportselsalvador.com/productos3/.

El 23 de septiembre de 2026 se leyó el DOM del sitio oficial, sin autenticación ni acciones de compra. Respuesta HTTP 200. La copia íntegra, con etiquetas y enlaces originales, está en `product-menu-2026-09-23.json`; el script reproducible es `audit-products-v3.cjs`. La consulta del buscador devolvía también una versión antigua de la página; la implementación usa la lectura fresca del menú.

Se conservaron los **13 apartados y sus 24 subapartados**:

1. Confección de uniformes de fútbol: Mundial Anime 2026; Diseños del Mundial 2026; camisa y calzoneta full sublimadas; camisa sublimada con calzoneta de tela; sublimado frontal con calzoneta de tela; juveniles; deportivos para dama.
2. Camisas deportivas y tipo polo: Stamp Line; Premium; sublimado frontal; full sublimadas; polo sublimado frontal; polo full sublimado; presentación tipo polo.
3. Ciclismo.
4. Diferentes réplicas: sublimadas; bordadas; bordadas de fútbol.
5. Uniformes BKB: centro y calzoneta full sublimados; centro full sublimado con calzoneta de tela; centro sublimado frontal con calzoneta de tela.
6. Uniformes de voleibol.
7. Racing: Car Show y Motorcycle.
8. Empresarial: cinta reflectiva y polo liso.
9. Runners.
10. Moldes de fútbol.
11. Logos 3D Alto Relieve.
12. Implementos deportivos.
13. Hoddies (nombre usado por el menú oficial).

## Aplicación

`data/tony-products.json` conserva la evidencia original, incluidos sus enlaces. `lib/products.ts` normaliza presentación/acentos y elimina importes de las etiquetas públicas. Los dos apartados de réplicas bordadas se mantienen separados, sin reutilizar los precios antiguos como nombres de producto.

`/producto` contiene el explorador visual de nueve líneas y el directorio completo. Las categorías tienen anclas propias, se abren al llegar desde el menú y contienen consultas específicas por WhatsApp, además de enlaces al explorador o la guía de calidad. No se copiaron fotografías del catálogo deteriorado, existencias, ofertas o precios.

El menú principal divide la empresa (**Somos Tony**) y la ayuda al cliente (**Para ti**). Producto conserva un acceso a cada categoría principal y al directorio completo. La búsqueda incluye las subcategorías como términos de búsqueda. Se mantienen los botones promocionales de creación exclusivamente en Inicio.

## Límites

Las etiquetas representan familias presentes en el menú oficial, no certifican inventario ni disponibilidad actual. El catálogo nuevo continúa pendiente. Las consultas se abren por decisión del visitante; ninguna se envía desde la web por sí sola.

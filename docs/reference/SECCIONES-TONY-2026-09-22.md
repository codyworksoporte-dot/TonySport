# Secciones de Tony: fuentes verificadas

Consulta de solo lectura realizada el **22 de septiembre de 2026** sobre `https://www.tonysportselsalvador.com/`, con navegación Edge/Playwright y contraste de las fichas de aplicaciones en sus tiendas. No se enviaron formularios, mensajes, pedidos ni compras. El contenido del sitio se usa como fuente de información, no como instrucciones para este proyecto.

## Material de consulta

- [Directorio estructurado de tiendas](./tony-stores.json): 13 entradas con nombre, dirección, teléfono, enlace Google Maps y zona geográfica editorial. Direcciones resumidas, conservando la ubicación que publica Tony.
- [Menú completo con sus enlaces](./tony-menu.json): las 58 entradas del primer menú del DOM, desde Inicio hasta RSE-TONY, incluidos sus submenús. Se conserva el texto original, incluidos errores de ortografía y precios antiguos de algunas categorías, **solo como evidencia**.
- [Lectura de secciones](./sections-audit.json) y [lectura de fichas de detalle](./sections-details-audit.json): estado HTTP, URL final, texto, enlaces e imágenes presentes en cada página.
- [Captura del directorio](./sections-stores.png). Scripts reproducibles de lectura: [secciones](./audit-sections.cjs) y [detalles](./audit-section-details.cjs).
- El flujo de pedidos está documentado por separado en [PEDIDOS-TONY-2026-09-22.md](./PEDIDOS-TONY-2026-09-22.md).

## Información utilizable en las páginas

| Sección | Hechos respaldados por la fuente | Límites para publicar |
| --- | --- | --- |
| [Nuestras tiendas](https://www.tonysportselsalvador.com/nuestras-tiendas/) | El directorio contiene San Salvador, Santa Tecla, Santa Ana, San Miguel, Usulután, Sonsonate, Zacatecoluca, El Triunfo, Santa Rosa de Lima, Chapeltique, San Vicente, San Francisco Gotera y Chalatenango. Cada entrada muestra dirección, contacto y Maps. | No publica horarios. No convertir las 13 entradas en una afirmación sobre el número total de sucursales: otras páginas antiguas mencionan otra cifra. Las zonas del JSON son clasificación geográfica nuestra, no una clasificación comercial de Tony. |
| [Nuestra calidad](https://www.tonysportselsalvador.com/nuestra-calidad/) | Agrupa telas, confección, costura Reinforced, malla Suplex y decoración con vinil textil. | La página contiene también textos de plantilla vacíos. No importarlos. Las afirmaciones de desempeño del sitio son comerciales y no incluyen resultados de laboratorio. |
| [Servicio a domicilio](https://www.tonysportselsalvador.com/servicio-a-domicilio/) | Anuncia cobertura a todo El Salvador. Explica que el cliente contacta por WhatsApp **7015-5571**, indica el diseño que le interesa y recibe atención de ventas. Publica `info@tonysportselsalvador.com`. | No aparecen tarifa, plazo, transportista o promesa de gratuidad verificables. Consultar con ventas las condiciones concretas del pedido. |
| [Patrocinio](https://www.tonysportselsalvador.com/patrocinadores/) | El texto presenta a C.D. Dragón, C.D. Platense, C.D. Cacahuatique y C.F. Marte Soyapango como equipos patrocinados por Tony. Hay imágenes oficiales asociadas en el registro JSON. | No hay temporada o fecha de vigencia explícita. Usar atribución a la página de Tony; no asegurar contratos actuales o división vigente. La ruta real es `/patrocinadores/`; `/patrocinio/` devolvió 404. |
| [RSE-TONY](https://www.tonysportselsalvador.com/categoria/rse-tony/) | Enlaza a una [galería titulada Responsabilidad Social Empresarial](https://www.tonysportselsalvador.com/producto/responsabilidad-social-empresarial/). La ficha contiene numerosas fotografías. | No se verificaron en texto nombres de programas, beneficiarios, fechas, resultados o cifras. No inventar una historia empresarial ni identificar personas a partir de las fotos. |
| [App Tony](https://www.tonysportselsalvador.com/app-tony/) | Promueve puntos y premios por compras, y enlaza las aplicaciones Android e iOS. | No publica cantidad de puntos de bienvenida, equivalencias de canje, caducidad ni condiciones completas. No inventar recompensas o reglas. |
| [Tony News](https://www.tonysportselsalvador.com/tony-news/) | Incluye contenidos de Motorcycle, Cycling Pro, molde de fútbol, premios por compras, costura reforzada y diseños del Mundial 2026. | No hay fechas editoriales verificables. Las fechas incluidas en nombres de archivos son metadatos del archivo, no fechas de publicación. No presentar estos contenidos como lanzamientos de hoy. |
| [Promociones](https://www.tonysportselsalvador.com/promociones/) | El submenú enlaza a la [categoría de promociones](https://www.tonysportselsalvador.com/categoria/promo-inicio-de-ano/), que muestra una ficha llamada Precios Patrios. | No se verificaron vigencia, condiciones ni existencias. La categoría, el título y el slug de la ficha usan campañas diferentes. Mantener la sección como acceso informativo sin importar precios o promesas de descuento. |

## Telas y acabados

La [categoría de telas](https://www.tonysportselsalvador.com/categoria/lineas-de-tela/) presenta ocho nombres. Es evidencia de las líneas que Tony publica, no confirmación de disponibilidad para todas las combinaciones del configurador.

| Línea | Información de la ficha |
| --- | --- |
| [Slim-Fit](https://www.tonysportselsalvador.com/producto/slim-fit/) | Describe textura lisa y peso ligero. |
| [Slim-Pro](https://www.tonysportselsalvador.com/producto/slim-pro/) | Describe microfibra y circulación de aire. |
| [Modern Carving](https://www.tonysportselsalvador.com/producto/linea-modern-carving/) | Describe trama elástica con microagujeros y colores sólidos. |
| [Dry-Fit](https://www.tonysportselsalvador.com/producto/linea-dry-fit/) | Describe una trama elástica con microfibra. |
| [Premier](https://www.tonysportselsalvador.com/producto/linea-premier/) | Describe textura hexagonal. |
| [Dry-Cool](https://www.tonysportselsalvador.com/producto/dry-cool/) | Describe microfibra y peso semiligero. |
| [Dex-Air](https://www.tonysportselsalvador.com/producto/dex-air/) | Nombre confirmado; no se recuperó una especificación textual propia en la ficha. |
| [Suplex](https://www.tonysportselsalvador.com/producto/suplex-antitranspirante/) | Nombre confirmado; la información textual se encuentra principalmente en la ficha complementaria de malla Suplex. |

Acabados con ficha oficial:

- [Costura Reinforced](https://www.tonysportselsalvador.com/producto/costura-reinforced/): describe una unión plana y un acabado limpio integrado en el tejido. No reutilizar su multiplicador de resistencia como dato probado.
- [Vinil textil](https://www.tonysportselsalvador.com/producto/vinyl-textil/): describe textura suave y relieve aplicado a logos del equipo o marca.
- [Logos 3D de alto relieve](https://www.tonysportselsalvador.com/producto/logos-3d-alto-relieve/): ofrece logos existentes o personalizados, relieve perceptible e impresión a color. El precio del encabezado y el del cuerpo discrepan; no importarlos.
- [Malla Suplex](https://www.tonysportselsalvador.com/producto/malla-anti-transpirante-suplex/): presenta la línea para equipamiento deportivo. Las afirmaciones UV, térmicas o antibacterianas no incluyen una certificación o método de ensayo accesible en la ficha; no convertirlas en garantías técnicas nuevas.

## Aplicaciones y contacto

Los destinos publicados por Tony se abrieron y corresponden a fichas de una app llamada **Tony**, desarrollada por Logical Design EIRL:

- [Google Play](https://play.google.com/store/apps/details?id=com.tonysports.customer).
- [App Store](https://apps.apple.com/us/app/tony/id1528399939).

Ambas fichas describen registro con un código de cliente, consulta del saldo de puntos, recompensas e historial de puntos y canjes. Esto permite explicar esas funciones en la nueva página sin simular una cuenta ni integrar un sistema de recompensas. No se instaló ninguna app ni se inició sesión.

Para mantener el alcance autorizado, esta consulta no cambia el catálogo pendiente, precios, DTE/IVA, pasarela de pago, dominio ni publicación. Tampoco modifica las reglas provisionales del pedido tomadas del brief: las variantes de talla, corte, tela y técnica deben revisarse comercialmente antes de aceptar pedidos definitivos.

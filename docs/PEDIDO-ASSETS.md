# Catálogo y recursos del pedido V279

Fuente: https://tonysportselsalvador.com/mockup-prueba/?v=58. Recuperación verificada el 26 de septiembre de 2026.

## Alcance y procedencia

Se recuperaron los 70 diseños TONY-001 a TONY-070. La lista del HTML declaraba 69 y omitía TONY-010; el archivo de ese código sí existe en la ruta pública WEBP declarada por el propio configurador. Se comprobaron Content-Type, decodificación completa, dimensiones y SHA-256. No se exploraron códigos posteriores al 070 ni se presenta esta recuperación como el inventario comercial completo.

La copia local y el HTML público coincidían: 21.371.583 bytes; SHA-256 `8596cc28e24a6f59506bb3885f5cf764513739941670adc185814b6584d6c1d1`. El título indica V279 y la meta de compilación `v329-admin-sync-robusto`.

`data/pedido/catalog.json` conserva el código exacto, URL de origen, SHA-256 original, dimensiones y rutas de cada recurso optimizado. Las imágenes originales y el registro de solicitudes permanecen fuera de Git, en `output/tony-v279-assets/`. El manifiesto público `catalogo/catalogo.json` devolvió 404 durante esta revisión.

## Preparación reproducible

Con las fuentes recuperadas disponibles, ejecutar `node scripts/prepare-pedido-assets.mjs`. El script valida el SHA original antes de generar archivos. Usa el paquete `sharp` ya instalado con Next; no accede a la red ni a servicios de generación.

Por diseño se publican una lámina WEBP de hasta 1200 px, una miniatura de 220 px y dos recortes, frontal y dorsal. Se conserva el encuadre original de la fuente:

| Cara | X | Y | Ancho | Alto |
| --- | --- | --- | --- | --- |
| Frontal | 0,12 | 0,10 | 0,43 | 0,80 |
| Dorsal | 0,48 | 0,08 | 0,42 | 0,82 |

Los valores son fracciones del tamaño de la lámina. Son recortes de una referencia comercial; no segmentan la prenda ni representan patrones de confección. Los escudos, números, nombres y fondos incluidos en la imagen no se convierten en capas editables.

Se incluyen 21 guías optimizadas: asesora, portada, uniforme, camisa, tres moldes, cuatro cuellos, cuatro referencias de marca/escudo sublimado o 3D y las seis telas. Las telas se descargaron de las rutas públicas declaradas en el HTML, `telas%20tony/*.jpg`: las seis respuestas fueron imágenes válidas de 1100×1100. Su registro original está en `output/tony-v279-assets/fabrics.json`; sus descripciones se conservaron desde el HTML oficial. `data/pedido/guides.json` incluye identificadores, rutas, dimensiones y SHA original. Las imágenes de producto contienen los precios impresos de la fuente; el cálculo del pedido usa su tabla comercial compartida, nunca OCR ni texto de esas imágenes.

Resultado: 301 archivos WEBP (280 del catálogo y 21 guías), 23.808.776 bytes. Las miniaturas cargan de forma diferida; no se incrustan imágenes de catálogo base64 en los componentes. Todas las rutas públicas pasan por `siteAsset` al mostrarse o exportarse para funcionar con `/TonySport` en Pages.

## Editor

`DesignEditor` recibe `draft`, `onChange` y el callback opcional `onAI(operation, payload)`. Las capas usan coordenadas normalizadas de 0 a 100: X/Y son el centro; ancho y alto son proporciones del lienzo 800×1000. El giro usa grados y el tamaño de letra, píxeles del lienzo de exportación. Las capas se pueden mover con puntero táctil o ratón, con las flechas (Shift aumenta el paso) o mediante campos numéricos. La eliminación retira el objeto de la lista; ocultarlo conserva el servicio comercial asociado.

Las imágenes propias deben ser JPG, PNG o WEBP de hasta 4 MiB, con cabecera binaria reconocida y decodificación válida. Se limitan a 40 megapíxeles y se normalizan a un máximo de 1400 px. Escudos, marcas y patrocinadores reciben `designKey` SHA-256 del archivo original; copiar a la otra cara conserva esa identidad. Los patrocinadores siguen siendo objetos separados según el contrato comercial.

`renderPedidoDesign(design, side)` exporta una vista PNG 800×1000 con la base y sus capas visibles. Puede reutilizarse para revisión, IA y descargas. Modificar la base o una capa invalida la aprobación y los acabados finales. Deshacer/rehacer conserva hasta 20 estados durante la sesión del editor.

El borrador mágico envía la imagen base sin capas y una región normalizada de 0 a 1, con `x`, `y`, `width` y `height`. Solo cambia la base si el servicio devuelve una imagen válida. El mockup envía ambas vistas compuestas; al recibir el resultado se ocultan las capas ya incluidas para evitar duplicarlas, conservando sus datos y cargos. Sin servicio disponible se muestra el error y se conserva el diseño; no se fabrica una respuesta de IA.

`SignaturePad` recibe `value`, `onChange`, `label`, `reset` y `disabled`. Dibuja con Pointer Events, exporta PNG y conserva la firma al cambiar el tamaño del contenedor. También admite teclado: Tab enfoca el área, Espacio baja/sube el lápiz y las flechas mueven el cursor o trazan; Mayús amplía el paso. El cursor visual no se incluye en el PNG y no se genera una firma sin un trazo explícito. Los datos de firma pertenecen al flujo transitorio del pedido y no a este catálogo de recursos.

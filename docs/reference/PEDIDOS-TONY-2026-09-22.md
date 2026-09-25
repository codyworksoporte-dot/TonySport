# Referencia del pedido actual de Tony

Revisión de solo lectura del 22 de septiembre de 2026. No se añadieron productos al carrito ni se enviaron formularios, pedidos o mensajes.

## Hallazgos verificados

- [Ficha de uniformes retro](https://www.tonysportselsalvador.com/producto/disenos-retro/): describe diseño libre, camiseta y calzoneta sublimadas, logos y patrocinadores, nombre de equipo, nombre de jugador y dorsal. La ficha publica mínimo de seis uniformes, pero su campo numérico del carrito tiene `min=1`. No debe interpretarse ese control como política comercial.
- En esa ficha, el único campo visible del pedido es cantidad. No hay editor ni listado de jugadores. Tampoco encontré un editor enlazado en la navegación del inicio o de [Tienda en línea](https://www.tonysportselsalvador.com/tienda-en-linea/). Esto se limita a las páginas revisadas, no demuestra que no exista en otro servicio.
- [Servicio a domicilio](https://www.tonysportselsalvador.com/servicio-a-domicilio/): el proceso publicado deriva a un asesor por WhatsApp para explicar el diseño deseado.
- [Moldes de fútbol](https://www.tonysportselsalvador.com/categoria/moldes-de-futbol/): contiene Normal, Ranglan y Primera División. No publica una tabla de medidas en la página de categoría.
- La navegación diferencia camisetas con sublimado frontal o completo, calzonetas de tela o sublimadas, líneas juveniles y para dama, además de baloncesto, voleibol y otros usos. Las escamas no representan todos los productos.

## Aplicación a la nueva experiencia

### Diferencia con el Anexo A adjunto

El documento adjunto describe un configurador de seis pasos y lo identifica como el sitio vivo sin `www`. Se verificaron ambos hosts con Edge: el host sin `www` redirige al WordPress con `www`. Después de activar los scripts diferidos con movimiento y desplazamiento, la portada no contenía iframes, enlaces a pedido/editor/configurador ni esas cadenas en su contenido. Se observaron jQuery, LiteSpeed y componentes de WordPress. La revisión de estos hosts no permite verificar hoy el configurador del Anexo A.

Por tanto, las opciones Hombre/Mujer; Estándar/Raglan/Primera División; Slim Fit/Slim Pro/Modern Carving/Dryfit/Premier/Drycool; y tallas 2–16 y XS–4XL son **referencia provisional del brief**, no reglas corroboradas íntegramente en la web actual. Los moldes y algunas telas sí aparecen en páginas del WordPress, pero ello no valida precios, combinaciones o recargos del Anexo A.

### Flujo propuesto a partir del pedido del usuario

1. Pedir cantidad antes del diseño; crear exactamente esa cantidad de registros.
2. Capturar nombre, talla y dorsal de cada integrante, con progreso, errores específicos y edición reversible de la cantidad.
3. Mantener la identidad reptil de la página separada del diseño del uniforme. Ofrecer bases lisas y diferentes motivos visuales; escamas como alternativa.
4. Resumir y conservar la plantilla completa en la solicitud. Aclarar que la vista previa es un boceto y el asesor confirma la confección.
5. No copiar precios, descuentos, condiciones de pago o promesas de entrega de las fichas antiguas: el catálogo y la integración comercial siguen pendientes por decisión del usuario.

No se verificó una tabla oficial de equivalencias o medidas. Las tallas de captura sirven para expresar la solicitud; no deben presentarse como una guía de medidas certificada.

## Evidencia local

- `official-0.png`: captura del inicio.
- `official-1.png`: ficha de uniforme retro.
- `official-followup-0.png`: categoría Moldes de fútbol.
- `official-followup-1.png`: Tienda en línea.
- `official-nonwww-home.png`: portada solicitada sin `www`, que termina en el mismo WordPress.
- `official-audit.json` y `official-followup-audit.json`: URL, HTTP, enlaces, campos e imágenes observados.
- `official-embedded.json`: scripts, iframes, enlaces y solicitudes tras activar JavaScript diferido. Su campo `url` registra el destino final con `www`.
- `audit-official.cjs`: navegador de solo lectura para reproducir la inspección.

Se registraron URLs de imágenes originales en los JSON. No se trasladaron fotos del catálogo antiguo a la aplicación.

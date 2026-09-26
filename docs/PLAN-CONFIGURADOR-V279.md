# Plan de integración del configurador oficial de Tony

Revisión: 26 de septiembre de 2026. Estado: plan aprobado; implementación terminada en `feature/configurador-v279`, pendiente de revisión para publicar. Las secciones siguientes conservan el plan original; ver `ENTREGA-CONFIGURADOR-V279.md` para el resultado y las limitaciones.

## Fuente y alcance

- Fuente oficial: https://tonysportselsalvador.com/mockup-prueba/?v=58.
- El HTML público coincide byte por byte con `lo que faltaba/index (4).html`: 21.371.583 bytes. SHA-256 `8596cc28e24a6f59506bb3885f5cf764513739941670adc185814b6584d6c1d1`.
- El título dice V279, pero el documento acumula 102 scripts y parches posteriores; la meta de compilación declara `v329-admin-sync-robusto`. Se portará el comportamiento final de esta fuente, con las excepciones comerciales pendientes de aclaración que se enumeran abajo.
- Recuperados y verificados **70/70 diseños TONY-001 a TONY-070**, incluido TONY-010 que falta en la lista inicial. Son 70 WebP distintos, con MIME, decodificación, dimensiones y SHA-256 comprobados; 20 de 900×900 y 50 de 1200×1200, 10.648.922 bytes en total. No hay faltantes dentro de este rango.
- La copia contiene además 41 imágenes embebidas, 39 distintas, extraídas y verificadas: 14.039.024 bytes. Incluyen productos, asesora, guías, marca y 19 diseños que también aparecen en el catálogo externo.
- Los recursos recuperados están en `output/tony-v279-assets/`, fuera del contenido publicado, con inventario en `manifest.json`. La recuperación de estos 70 diseños no acredita que sean todo el inventario comercial de Tony. Son láminas comerciales con texto y marcas ya incorporados, no archivos de diseño por capas.
- No se ha abierto el ZIP de pagos, no se han usado datos de clientes y no se han llamado servicios de IA, cobro ni recepción de pedidos.

## Estructura propuesta

| Ubicación | Responsabilidad |
| --- | --- |
| `app/configurador/` | Ruta pública y composición del flujo nativo en Next. |
| `components/pedido/` | Pasos, ayuda y asesora; catálogo; editor frontal/dorsal; mapa; firma; resumen y confirmación. |
| `lib/pedido/` | Tipos, estado versionado, validaciones, cálculo, API, borrador y descargas. |
| `data/pedido/` | Tabla comercial compartida y manifiesto del catálogo con procedencia. |
| `public/assets/pedido/` | Solo imágenes públicas verificadas, optimizadas y miniaturas. |
| `backend/pedido-api/` | PHP limpio para sesiones, cotización, IA, Panel y pagos; fuera de `public/` y de la exportación `out/`. |
| `tests/pedido/` | Casos de precios y flujo con APIs simuladas; sin servicios productivos. |
| `docs/` | Diferencias respecto a la fuente, configuración y despliegue del backend. |

Se trabajará en una rama nueva con commits pequeños. No se hará push ni despliegue sin el OK posterior requerido por el documento. Los cambios locales previos, incluida la exclusión de `lo que faltaba/`, se conservarán.

## Qué se porta

Portada → producto → Hombre/Mujer → configuración y guías → jugadores y porteros → asesora opcional → medias → catálogo o diseño propio y editor → acabado final y aprobación → resumen → entrega → pago → términos y firma → confirmación y descargas. Se conservarán textos, opciones y recursos comerciales comprobados, además de ayuda por WhatsApp durante el flujo.

Se integrará con el header, footer, fuentes, colores y botones existentes. Los archivos protegidos de intro, ambiente, transiciones, mascotas, textura y animación de texto no se editarán. Tampoco se cambiarán `tests/motion.spec.ts` ni `tests/intro.spec.ts`.

El catálogo, editor, mapa y firma cargarán cuando hagan falta. El estilo del nuevo flujo se limitará a su carpeta. No habrá imágenes base64 gigantes dentro de componentes.

## Cálculo comprobado y decisiones comerciales

La función original `calc()` cobra $12.99 por uniforme o $7.99 por camisa, más molde, tela, cuello, manga, tallas extra, diseño, escudos, marca, patrocinadores, acabados 3D, medias, porteros y entrega. El anticipo es del 50 %. La fórmula permanece en el archivo, pero algunos parches alteran qué selecciones se pueden realizar.

1. **Marca Tony:** la fórmula conserva −$0.50 por uniforme, pero los parches finales retiran esa opción y fuerzan marca propia. Propuesta: restaurar la elección Tony y su descuento porque el brief lo solicita expresamente; registrar esa diferencia respecto al estado final de la fuente.
2. **Patrocinador:** el texto dice un cobro por diseño, mientras la fórmula cobra cada objeto colocado, incluso repetido en ambas caras. Propuesta: conservar inicialmente la fórmula exacta solicitada y documentar este caso; no cambiar la política comercial sin autorización.
3. **3D y porteros:** marca y escudo 3D se cobran por separado a jugadores de campo, aunque no exista el elemento; los porteros no reciben ese recargo. Se mantendrá la regla original hasta que Tony confirme otra.
4. **Cantidad:** la fórmula usa filas con talla, mientras el resumen utiliza la cantidad seleccionada. Se impedirá llegar al cobro con filas incompletas para que ambos valores coincidan.
5. **Redondeo:** se trabajará en centavos; anticipo redondeado al centavo y saldo calculado como total menos anticipo para evitar diferencias de un centavo.
6. **Regalías existentes:** primer portero y gafete desde 12 uniformes, y gorra con total mayor de $150. No se extenderán estas condiciones ni se inventarán promociones.

La tabla de precios JSON será común a TypeScript y PHP. Cada entorno tendrá su calculador, comprobado con las mismas entradas y resultados. Un archivo TypeScript no se ejecuta directamente en PHP: la igualdad se verificará mediante pruebas compartidas.

Ejemplos base comprobados a mano: seis uniformes de catálogo = $77.94, anticipo $38.97; seis con diseño propio = $82.94, anticipo $41.47; doce de catálogo con marca y escudo 3D = $197.88, anticipo $98.94 y primer portero gratis. Estos ejemplos no incluyen otros recargos ni envío.

## Carrito, Recientes y reseñas

El carrito actual contiene solicitudes de cotización con un esquema distinto, no compras pagadas. Propuesta para aprobar antes de adaptar su lógica:

- Conservar los diseños y solicitudes existentes con su esquema original.
- Añadir un tipo de borrador V279 separado, con prenda y diseño; sin DUI, firma, comprobante ni información de pago.
- El carrito seguirá sirviendo para conservar y retomar diseños; el nuevo pago se realiza por pedido, como en la fuente. No se inventará un pago combinado de varios equipos.
- Recientes distinguirá solicitudes aún en preparación de pedidos enviados. De estos últimos, se guardarán únicamente referencia y estado; el servidor será la autoridad del pago y del seguimiento.
- Mantener reseñas y el comportamiento actual de eliminación confirmada del carrito.

## Backend y correcciones necesarias

GitHub Pages seguirá sirviendo el frontend. El PHP se preparará para una carpeta configurable del hosting oficial, por ejemplo `/pedido-api/`; la URL pública del frontend se configurará por separado.

- Sustituir claves literales por configuración del servidor y entregar ejemplos vacíos. Los originales sensibles y `wompi-recuperar-pago.php` no se copiarán al backend publicable.
- Aplicar CORS con comparación exacta y respuesta OPTIONS. El origen permitido de Pages es `https://codyworksoporte-dot.github.io`, sin `/TonySport`.
- Recalcular total y anticipo en el servidor desde las selecciones validadas; rechazar discrepancias con el navegador.
- Vincular pago, transacción, comercio, referencia, enlace y monto; exigir autenticación de las notificaciones según el contrato oficial de Wompi. Rechazar avisos incompletos y procesar reintentos de forma idempotente.
- El retorno redirigirá al frontend configurado; este consultará el estado verificado. Volver de la pasarela no se considerará prueba de pago.
- Guardar pedidos y pagos fuera de la carpeta pública. Proteger seguimiento y descargas para que conocer un número de pedido no permita ver datos personales.
- Validar el pedido enviado al Panel y limitarlo a 24 MiB, con control de reenvío. No basta con CORS para autenticar una operación.
- Mantener prompts y contratos IA, verificando modelos y endpoint contra la documentación oficial antes de activarlos. Añadir validación de formato/tamaño y límites por sesión e IP.
- Probar Wompi, IA y Panel con simulaciones locales. No crear enlaces de pago reales ni enviar pedidos de prueba a producción.

Variables previstas: `NEXT_PUBLIC_TONY_API_BASE` (pública), `FRONTEND_URL`, `TONY_API_PUBLIC_URL`, `TONY_ALLOWED_ORIGINS`, `TONY_PRIVATE_STORAGE_DIR`, `TONY_SESSION_SECRET`, `TONY_PANEL_URL`, `TONY_PANEL_TOKEN`, `GEMINI_API_KEY`, `GEMINI_PRIMARY_MODEL`, `GEMINI_FALLBACK_MODEL`, `WOMPI_CLIENT_ID`, `WOMPI_CLIENT_SECRET`, `WOMPI_WEBHOOK_SECRET` y configuración de modo de pruebas y cuotas. Solo la URL de API irá al bundle público. Los nombres finales se documentarán con los PHP entregados.

## Comprobación y entrega

Typecheck, build local y exportación Pages; precios calculados a mano y equivalencia TS/PHP; flujo aprobado/rechazado simulado; firma táctil y descargas; accesibilidad; ausencia de desbordamiento a 320, 390 y 1440 px. Se actualizarán las pruebas que dependían del configurador sustituido y se ejecutará toda la suite. Se entregarán capturas a 390 y 1440 px.

## Pendientes para activar servicios reales

- Confirmar acceso y carpeta del hosting PHP oficial; no se elegirá otro proveedor automáticamente.
- Confirmar contrato de recepción del Panel y mecanismo de seguimiento privado.
- Configurar secretos directamente en el hosting, preferiblemente renovando los que aparecen en las fuentes recibidas; no enviarlos por el repositorio público.
- Confirmar las decisiones comerciales y la adaptación de Carrito/Recientes descritas arriba.

El plan fue aprobado mediante «adelante». La implementación se realiza en `feature/configurador-v279`; la publicación sigue pendiente de revisión y autorización. El resultado y sus comprobaciones se documentan en `ENTREGA-CONFIGURADOR-V279.md`.

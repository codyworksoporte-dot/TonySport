# Configurador Tony V279

Implementación nativa React/TypeScript de `/configurador` sobre Next 16.3, en la rama `feature/configurador-v279`. No se utiliza iframe. Esta entrega no se ha publicado.

## Qué incluye

- Portada, producto, línea, molde, tela, cuello, manga, marca, acabados 3D, cantidad y plantilla de jugadores, porteros, asesora con voz opcional, medias, catálogo y diseño, acabado final, resumen, entrega, anticipo, datos del responsable, términos, firma y confirmación.
- Catálogo oficial TONY-001 a TONY-070 completo y verificado. Miniaturas separadas, vistas frontal/dorsal y guías extraídas de las fuentes. No se afirma que estos 70 diseños representen todo el inventario comercial de Tony.
- Editor con imágenes propias, escudos, marcas, patrocinadores, texto, posición, escala, giro, capas, copia entre caras, eliminación, deshacer/rehacer y encuadre. Borrador mágico, mockup y acabado final usan los endpoints PHP configurables.
- Precios en centavos a partir de `data/pedido/prices.json`; cálculos TS y PHP. El servidor recalcula y valida el anticipo del 50 %. Las transferencias requieren comprobante y quedan pendientes de revisión.
- Retiro por sucursal, envío a domicilio, ubicación bajo acción del cliente y mapa Leaflet/OpenStreetMap con atribución. Firma táctil y por teclado. PDF multipágina de producción/pago e imágenes finales descargables.
- Borradores V279 en IndexedDB; carrito con confirmación al eliminar y efecto de Tony existente. Las cotizaciones anteriores conservan su esquema y su editor en `/configurador/archivo`. Recientes distingue borradores de referencias de pedidos enviados. Reseñas permanece intacto.

El header, footer, portada, animaciones de entrada, ambiente y mascotas permanecen intactos. El CSS del configurador está limitado a sus componentes. El movimiento respeta las preferencias de accesibilidad y el control existente de efectos.

## Datos y servicios

El frontend guarda las selecciones y diseños del borrador, sin datos del responsable, dirección, ubicación, firma ni comprobante. Los pedidos enviados conservan localmente únicamente referencia y estado. SessionStorage contiene el token opaco de sesión y, durante el pago, la referencia pendiente y su clave de idempotencia; el servidor conserva la instantánea privada asociada al anticipo. En el cliente, los datos personales del responsable solo se mantienen en memoria del formulario y viajan por HTTPS hacia la API configurada. El servidor conserva los pedidos, firmas y comprobantes; la política de retención y sus copias de seguridad requieren configuración en el hosting. HTTP está permitido exclusivamente en loopback para pruebas locales.

El enlace Wompi se abre en la misma pestaña para conservar la sesión y, al regresar, se verifica el estado en el servidor. El retorno del navegador nunca confirma un pago por sí mismo. El seguimiento requiere esa misma sesión, vigente durante ocho horas; no existe todavía recuperación de sesión para clientes. Los documentos descargables se crean desde la instantánea confirmada en memoria y deben descargarse antes de recargar o cerrar la página.

Los servicios no se activan por estar el código listo. Sin `NEXT_PUBLIC_TONY_API_BASE`, el sitio permite diseñar y guardar, y explica que la IA y el envío todavía requieren conexión. La activación real necesita hosting PHP HTTPS, configuración privada, credenciales nuevas y comprobar el contrato receptor del Panel Tony. La API distingue un pedido guardado de un envío al Panel pendiente.

Ver [PEDIDO-BACKEND.md](./PEDIDO-BACKEND.md) y [.env.example](../.env.example) para variables, rutas de despliegue, permisos, límites y pruebas locales. Subir únicamente `backend/pedido-api/` al hosting PHP; nunca a `public/` ni al artefacto de Pages. Los JSON compartidos se colocan fuera del directorio público. No subir los originales de `lo que faltaba/`.

## Decisiones frente a la fuente

- Se restaura la elección de marca Tony y su descuento solicitado de $0.50 por uniforme de campo, aunque un parche tardío del HTML escondía esa elección. Se conserva el cobro por cada elemento patrocinador, los recargos 3D separados y las reglas de porteros documentadas en el plan aprobado.
- Se usan centavos enteros. El anticipo redondea al centavo y el saldo es total menos anticipo.
- Se valida la plantilla completa antes del cobro para que cantidad y filas con talla coincidan.
- La asesora usa la voz del navegador, activada expresamente; no se reproduce automáticamente audio de bienvenida ni se graba el micrófono. El formulario sigue disponible sin compatibilidad de voz.
- Las imágenes oficiales del catálogo son fichas aplanadas. Sus elementos impresos no son capas separadas: se quitan con el borrador mágico; los elementos añadidos en el editor sí son capas independientes. Los recortes iniciales siguen las proporciones de la fuente y pueden ajustarse con encuadre.
- Los prompts de generación y acabado conservan la lógica original para uniformes. Para camisas se corrige la instrucción heredada que exigía siempre una calzoneta, de modo que respete el producto elegido.
- Se corrige la selección de línea al navegar mediante enlaces a otra categoría dentro de la misma página. Se conservan sus contenidos y diseño, y Atrás recupera la selección anterior.
- El Panel administrativo de demostración no se incluye. No se conservan pedidos completos con DUI/firma en localStorage ni se publican herramientas manuales de recuperación de pagos.
- Las pruebas de IA devuelven imágenes sintéticas o de entrada, y los pagos usan simulaciones explícitas; no son una evaluación de calidad de Gemini ni una transacción financiera real.

## Validación

- `npm run typecheck`: correcto.
- `npm run build`: correcto; 22 rutas prerenderizadas, incluido el editor anterior.
- `TONY_GITHUB_PAGES=true npm run build` y `node scripts/prepare-pages.mjs`: correctos. No se reescriben HTML, JavaScript ni payloads de React; se conservan las rutas RSC anidadas que necesita el editor archivado.
- Suite completa Playwright: **83/83**, incluidas las pruebas originales de intro y movimiento sin cambios. Tras los ajustes finales de bienvenida y limpieza de almacenamiento: **18/18** pruebas de configurador/editor, incluida confirmación Wompi simulada aunque falle localStorage.
- PHP dominio/seguridad: **42 comprobaciones**; HTTP real con PHP local y proveedores simulados: **24**; contrato del cliente contra PHP local: **13**. Total backend: **79**. La suite Playwright también compara **52 escenarios de precio** entre TS y PHP y verifica los documentos multipágina.
- Exportación en Edge local: seis rutas, navegación cliente a Producto y al editor archivado, sin recursos locales fallidos. Cero archivos PHP, SQLite, `.env` o datos originales de pagos en `out/`.
- Diseño y controles verificados a 320, 390 y 1440 px, con axe en el editor. Capturas de producción a 390/1440, sin desbordamiento horizontal ni errores de hidratación/ejecución.

Las capturas se guardan fuera de Git en `output/pedido-review/`: `welcome-390.png`, `welcome-1440.png`, `players-390.png`, `players-1440.png`, `editor-390.png` y `editor-1440.png`. Los jugadores de las capturas son datos de demostración.

## Activación después de aprobar la publicación

1. Crear el directorio privado fuera de la raíz web y copiar allí `prices.json` y `checkout.json`. Configurar las variables del hosting que enumera [.env.example](../.env.example), con claves nuevas y permisos según [PEDIDO-BACKEND.md](./PEDIDO-BACKEND.md).
2. Subir el contenido de `backend/pedido-api/`, incluido `.htaccess`, a la carpeta PHP elegida; excluir `mock-confirm.php`, pruebas, archivos originales y configuraciones con secretos. Verificar las extensiones de PHP, límites de carga, HTTPS y que los archivos internos no sean accesibles.
3. Comprobar en un entorno de pruebas el receptor del Panel, la entrega del webhook y las credenciales de IA/Wompi. Activar cada interruptor únicamente después de esa verificación y validar las condiciones comerciales con Tony.
4. Configurar la variable del repositorio GitHub `NEXT_PUBLIC_TONY_API_BASE` con la URL HTTPS de la API; el workflow ya la incorpora al build. Publicar la rama aprobada por el procedimiento habitual de `main`.
5. Revisar el recorrido completo en la URL pública, configurar retención/copias de seguridad y el procedimiento de atención para pagos o sesiones pendientes.

Antes de publicar, configurar la URL pública de API en el build de Pages, desplegar/verificar el PHP y el receptor Panel en un entorno de pruebas, y revisar las cuentas bancarias y condiciones comerciales vigentes con Tony. DTE/IVA, dominio final y demás integraciones no autorizadas siguen pendientes.

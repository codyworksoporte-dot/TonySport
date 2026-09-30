# Revisión del sitio y pendientes de lanzamiento

Revisión del 30 de septiembre de 2026. El usuario autorizó revisar y aplicar mejoras directamente. Los datos legales se toman del sitio oficial si se pueden verificar; de lo contrario se completarán al preparar el dominio.

## Mejoras de esta revisión

- Política de privacidad ampliada: pedidos, cuentas cuando estén habilitadas, reseñas, propuestas de patrocinio, datos del equipo, proveedores externos y almacenamiento local. Las funciones opcionales se describen según su disponibilidad, sin prometer seguridad o servicios no comprobados.
- Página de cookies y almacenamiento: explica borradores, carrito, historial y preferencias, pérdida de datos al limpiar el navegador y servicios externos que se abren por elección del visitante.
- Términos accesibles antes de entrar al formulario: conservan los 13 puntos del pedido en `data/pedido/checkout.json` como fuente común y añaden orientación sobre cotización, aprobación, archivos, entrega y atención al cliente.
- Centro de ayuda con preguntas prácticas y un apartado de cambios, garantías y reclamos. Incluye contacto directo y qué información compartir para consultar un problema.
- Accesos desde el pie, menú Para ti, buscador, Contacto y preguntas de la portada. Avisos de privacidad junto a los formularios de reseñas y patrocinio, y enlace de condiciones en la aceptación del pedido.
- Corrección de un fallo en el inicio de pago con cuenta: se comprueba la persistencia de la sesión de cuenta en su propia clave. El visitante conserva su mecanismo anterior y se impide crear un pago cuando el navegador no puede recuperar la sesión al volver. Cuatro pruebas aisladas con respuestas simuladas cubren ambos casos y el retorno tras recarga.

## Lo que se conserva

La identidad visual, colores, tipografía, escamas, logo, catálogo, colecciones y editor. También el directorio de tiendas, contactos, separación entre boceto y arte aprobado, revisión antes de compartir, carga voluntaria de publicaciones sociales, controles de efectos y movimiento reducido. Estas funciones aportan identidad y permiten consultar y preparar diseños sin afirmar que existe disponibilidad comercial de todos los modelos.

## Datos y decisiones que todavía faltan

| Pendiente | Qué debe confirmarse |
| --- | --- |
| Identificación del proveedor | Razón social o nombre legal, NIT y domicilio para notificaciones. La portada y Contacto del sitio oficial muestran marca, WhatsApp y correo; en esas páginas no se encontró la identificación completa. No se debe inferir del titular de cuentas bancarias ni de una dirección de sucursal. |
| Garantías, cambios y devoluciones | Cobertura, procedimiento, plazos, tratamiento de defectos y diferencias con un cambio voluntario de un producto personalizado. Confirmar cómo se tramitan cancelaciones, retracto cuando corresponda y reversión de pagos. El mecanismo de consulta ya está visible; no equivale a una política comercial definitiva. |
| Privacidad operativa | Responsable y domicilio confirmados, criterios/plazos de conservación por tipo de dato, proceso de atención de solicitudes y eliminación, controles y respaldos del alojamiento, y condiciones vigentes de los proveedores. Borrar datos locales no elimina un pedido recibido en servidor o WhatsApp. |
| Pagos y recepción del pedido | Comprobar en el alojamiento definitivo la API PHP, recepción en Panel Tony, notificaciones, verificación del anticipo, webhooks, duplicados y fallos. La existencia del código no acredita una integración activa. Mantener deshabilitados los servicios sin verificar. |
| Transferencias | Confirmar las cuentas bancarias y mostrar el número de la cuenta elegida antes de activar este método; actualmente la pantalla muestra banco y titular. No se publicaron números nuevos sin contrastarlos. |
| Aprobación del diseño | El flujo actual requiere dos imágenes finales para aprobar y continuar; si la IA no está activa, esa etapa impide terminar el pedido. Verificar el servicio y definir con Tony una alternativa de aprobación manual. Mientras tanto, el centro de ayuda ofrece consulta directa. |
| Información fiscal y precios | Confirmar IVA, emisión de DTE/factura, vigencia del precio, anticipo y reglas comerciales aprobadas. No modificar importes ni convertir un documento del pedido en factura. |
| Entrega y tallas | Tabla de medidas oficial por molde, disponibilidad, horarios de tiendas, costo de envío, cobertura y fecha acordada de cada pedido. |
| Contenido real | Video tutorial definitivo y reseñas verificadas con autorización. Actualizar publicaciones y cifras sociales cuando se revise su fuente. |
| Dominio y buscadores | Definir URL definitiva, alojamiento y redirecciones; preparar canonical, sitemap y vistas para compartir. Se conserva `noindex` y el bloqueo de rastreo durante la preparación. Activar indexación al aprobar el lanzamiento. |

## Fuentes consultadas

- [Portada oficial de Tony](https://www.tonysportselsalvador.com/) y [Contacto oficial](https://www.tonysportselsalvador.com/contacto/), consultados en navegador el 30/09/2026. Confirman el teléfono 7015-5571 y `info@tonysportselsalvador.com`. La revisión no acredita que los datos legales no existan en otras páginas o documentos.
- El [configurador oficial usado como fuente](https://tonysportselsalvador.com/mockup-prueba/?v=58) muestra una indicación de versión V374 al consultarlo hoy. Los datos de pago y condiciones importados anteriormente deben revalidarse con Tony antes del lanzamiento; no se asumió que sigan iguales por conservar la misma URL.
- [Obligaciones publicadas por la Defensoría del Consumidor](https://www.defensoria.gob.sv/obligaciones/): identificación visible del proveedor, condiciones accesibles, medios de reclamo, garantías, pagos y entrega. Se usa para identificar pendientes; esta revisión no certifica cumplimiento legal ni inventa condiciones del negocio.
- Guías de la versión instalada en `node_modules/next/dist/docs/`: páginas, Link y metadata.

## Verificación de esta entrega

Las comprobaciones se realizaron localmente, sin enviar mensajes, pedidos ni pagos al negocio.

- TypeScript sin errores y compilación de la exportación estática completada: 28 entradas generadas, incluidas las nuevas páginas. Preparación local de recursos y prefijo `/TonySport` correcta.
- 13 casos de Playwright aprobados: sitio, formularios de clientes, menú móvil y revisión de enlaces/accesibilidad de secciones.
- Cuatro pruebas de sesión de pago aprobadas con `node --test tests/pedido/payment-session.test.cjs`: cuenta y visitante, retorno tras recarga y rechazo si no puede persistirse la sesión. Son respuestas simuladas; no validan la configuración de Wompi en producción.
- `/ayuda`, `/terminos`, `/privacidad`, `/cookies` y `/contacto` responden correctamente tanto en desarrollo como en la vista estática. Sin errores JavaScript o de consola en la última comprobación estática.
- Sin desbordamiento horizontal a 320, 390 y 1440 px. Sin infracciones detectadas por las reglas automáticas WCAG A/AA seleccionadas en esas cinco rutas; esto no equivale a una certificación completa de accesibilidad.
- Los 14 destinos internos comprobados en la vista estática responden; el buscador lleva al apartado de reclamos y quedan disponibles los 13 términos comunes. La impresión conserva el contenido legal y oculta el pie; se generó un PDF local como comprobación.
- Capturas de escritorio y móvil revisadas en `output/`, carpeta ignorada por Git. La vista previa está en `http://127.0.0.1:4173/TonySport/ayuda/`; su disponibilidad depende del servidor local de esta sesión.

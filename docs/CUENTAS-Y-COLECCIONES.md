# Cuentas, búsqueda y colecciones Tony

## Estado de publicación

La web estática continúa en GitHub Pages. El propietario dispone de hosting PHP y correo de Tony, pero todavía no hay acceso a ese panel. Por tanto, **el login obligatorio y el envío real de correos no están activados en producción**. La página de cuenta informa de ello sin simular un registro. La búsqueda, las colecciones y Contactos funcionan independientemente de ese acceso.

El módulo implementado incluye registro, confirmación de correo, login, recuperación, cambio de contraseña con contraseña actual y cierre de sesión. Se prueba con PHP real local y un buzón de captura que no envía correos. Esto no demuestra entrega a Gmail/Outlook ni configuración del hosting.

## Activación cuando esté disponible el hosting

1. Publicar `backend/pedido-api/` en el hosting HTTPS existente siguiendo `PEDIDO-BACKEND.md`, con una versión de PHP **soportada**, PDO SQLite y mbstring. La instalación local PHP 7.4 se usa únicamente para pruebas de compatibilidad, no se recomienda para producción.
2. Conservar los secretos del servicio en el hosting y su base SQLite fuera de la carpeta pública. Configurar `TONY_APP_SECRET`, `TONY_PRIVATE_DIR`, `TONY_FRONTEND_URL` y `TONY_ALLOWED_ORIGINS` como indica la guía. El secreto debe permanecer estable; rotarlo requiere planificar la migración de las claves de cuenta.
3. Configurar `TONY_AUTH_MAIL_FROM=info@tonysportselsalvador.com` y el transporte de correo del hosting que utiliza `mail()`. Comprobar SPF/DKIM/DMARC en el panel del dominio y entrega real. `mail()` aceptado por el servidor no garantiza llegada a la bandeja del cliente.
4. En producción: `TONY_ENV=production`, `TONY_API_MOCK=false`, `TONY_AUTH_ENABLED=true`. Nunca publicar el buzón de pruebas ni el directorio privado. No hay credenciales de correo dentro del frontend.
5. Probar confirmación y recuperación desde el dominio público con una cuenta de prueba autorizada, la recepción del correo, caducidad y reutilización del enlace, logout, expiración y acceso no autenticado a los endpoints de pedidos.
6. Establecer las variables de GitHub `NEXT_PUBLIC_TONY_API_BASE` (URL HTTPS de la carpeta PHP) y `NEXT_PUBLIC_TONY_AUTH_ENABLED=true`; volver a ejecutar Pages. Activar frontend/backend coordinadamente: con PHP protegido y frontend antiguo, el API rechazará los pedidos invitados hasta actualizar la web.

Con las cuentas activadas se puede consultar todo el sitio sin login. Crear uniformes (incluido el editor archivado), carrito, recientes y el formulario personal de reseñas requieren cuenta. WhatsApp, contacto, productos, búsqueda y reseñas publicadas siguen siendo públicos. El servidor valida la cuenta en cada solicitud privada de pedidos; el bloqueo visual no es la protección del API.

## Seguridad y almacenamiento

- Contraseñas bcrypt coste 12, mínimo 15 caracteres y máximo 72 bytes sin truncamiento silencioso. No se almacenan contraseñas en texto ni se envían por email.
- Tokens aleatorios de 256 bits; solo hashes de tokens en SQLite. Confirmación: 24 horas; recuperación: 30 minutos; sesión: 8 horas. El consumo de enlaces y la modificación de cuentas son atómicos.
- Cambiar o recuperar contraseña invalida todas las sesiones mediante una versión de credenciales. Logout revoca la sesión actual en el servidor.
- Mensajes uniformes para recuperación y registro; límites por IP y correo. El frontend conserva únicamente el token opaco en sessionStorage de esa pestaña. No hay cookies de autenticación entre orígenes.
- Enlaces por fragmento, origen de retorno fijo configurado y eliminación del token de la barra de dirección al abrir la cuenta. Deben abrirse y completarse en esa vista; si se recarga después de limpiar el fragmento, se debe reabrir el enlace original.
- La identidad de propiedad de pedidos se mantiene entre logins de la misma cuenta. Los antiguos pedidos anónimos no se asignan automáticamente a una persona.
- Los borradores, carritos, imágenes del editor archivado, referencias de pago y reseñas locales se separan por cuenta. El almacenamiento previo se conserva sin borrar ni atribuir a una cuenta. No hay sincronización de borradores entre dispositivos.
- Hacer copias privadas y definir con el administrador del hosting una política de conservación y purga de registros expirados. SQLite conserva fechas de vencimiento, pero no hay tarea automática de limpieza añadida.

## Colecciones oficiales

Origen: API pública de productos WooCommerce en `https://www.tonysportselsalvador.com/wp-json/wc/store/products`. Importación del 28 de septiembre de 2026: **240 productos/álbumes**, **48 categorías con productos** y **4.326 referencias de imágenes**. La API enumera 50 categorías; dos no tienen productos en esta respuesta pública.

Se conservaron los 70 diseños del editor. Mundial Anime incluye 34 imágenes y Mundial 2026 incluye 32. No se inventaron prendas, precios ni existencias. Los álbumes pueden incluir publicidad histórica; la interfaz aclara que hay que confirmar promociones y disponibilidad actuales.

- `scripts/import-official-catalog.mjs`: importación reproducible exclusivamente desde la API y recursos públicos oficiales. `--snapshot` reutiliza las respuestas de trabajo guardadas en `output/`.
- `data/official-collections.json`: índice de productos y categorías, sin datos de clientes ni pedidos.
- `data/collection-categories.json`: índice pequeño para búsqueda y menú, sin cargar galerías en todas las páginas.
- `public/assets/colecciones/`: 239 portadas WebP locales (8,47 MB en conjunto; no se cargan juntas) y 240 índices de álbumes. Un producto no tiene imagen publicada.
- Veinte tarjetas por página, imágenes diferidas y un álbum JSON bajo demanda. Las imágenes grandes se consultan en el hosting oficial una por una. No se copiaron las 4.326 imágenes completas al repositorio. Si el origen retira una imagen, se muestra un aviso y el enlace al producto original.
- La consulta de WhatsApp identifica el producto y la imagen seleccionada; abrir el enlace queda a decisión del visitante. No se envía ningún mensaje automáticamente.

## Navegación y archivos principales

- `lib/site-directory.ts`, `components/Header.tsx`: buscador con todos los apartados, subcategorías, colecciones, ayuda y acciones de cuenta. Los resultados no precargan todas las rutas a la vez.
- `components/Footer.tsx`: destino `#contactos`, WhatsApp y correo juntos. «Contactos» conserva el apartado actual y desplaza hasta ese destino.
- `components/CollectionGallery.tsx`, `app/colecciones/page.tsx`: filtros compartibles, paginación, galería con teclado y restauración de foco.
- `lib/auth.ts`, `components/AccountProvider.tsx`, `AccountGate.tsx`, `AccountExperience.tsx`: cuenta y protección visual coordinadas. El lagarto existente cierra los ojos al escribir la contraseña; respeta reducción de movimiento.
- `backend/pedido-api/auth-service.php`, `auth.php`, integración acotada en `core.php`: cuentas reales preparadas para el hosting.

## Comprobaciones reproducibles

```powershell
npm run typecheck
php backend/tests/auth.php
php backend/tests/run.php
npx playwright test tests/collections-directory.spec.ts tests/sections.spec.ts tests/mobile.spec.ts
# Detener primero cualquier dev server de prueba en 3000; esta suite requiere sus propias variables.
$env:TONY_AUTH_TEST='true'
$env:TONY_TEST_PHP='C:/ruta/a/php.exe'
npx playwright test tests/account.spec.ts
Remove-Item Env:TONY_AUTH_TEST
$env:TONY_GITHUB_PAGES='true'
npm run build
node scripts/prepare-pages.mjs
```

La suite de cuentas inicia PHP local, captura los correos fuera del proyecto y elimina únicamente sus propios archivos de prueba. Nunca contacta proveedores de correo ni pagos reales. La entrega real de correo, el despliegue PHP y las comprobaciones en un teléfono físico siguen pendientes del hosting y del dispositivo.

Revisión realizada: 42 comprobaciones PHP de cuentas y 42 del servicio existente de pedidos aprobadas. Flujos completos de cuentas con navegador y PHP local aprobados. Pruebas de colecciones, directorio, contactos, accesibilidad, cuatro anchos de pantalla, menús, asesora, transiciones y persistencia del carrito aprobadas; se corrigieron un resultado duplicado del buscador y el nombre accesible de la contraseña durante la revisión. Los avisos existentes sobre imágenes LCP del carrito no impiden las pruebas. La galería de Anime también se abrió manualmente y se comprobó una imagen original descargada desde el hosting oficial.

La exportación estática para GitHub Pages y `npm run typecheck` finalizaron correctamente. El proyecto no define un comando de lint. La auditoría de recursos comprobó los 240 índices de álbumes, las 4.326 referencias y todas las portadas locales.

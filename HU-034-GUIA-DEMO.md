# HU-034 — Guía de reporte y demostración del frontend

**Rama:** `HU-034-sonarqube-api-promociones`
**Repositorio:** `CafeSoft_React`
**Implementación complementaria:** API Java en `ApiCoffeSoft_Java`, misma rama.
**Reporte técnico y limitaciones de validación:** `HU-034-ANALISIS-SONAR-API.md` en el repositorio Java.

## Qué se implementó en el frontend

- La pantalla del carrito consulta promociones aplicables para el cliente y la
  cantidad de productos seleccionada.
- El carrito permite elegir una promoción o cotizar un canje de puntos; las dos
  opciones no se acumulan.
- La cotización de puntos se solicita al backend y, al confirmar la venta, el
  frontend envía `clienteId`, `promocionId` o `puntosCanjeados` junto con los
  datos existentes. El servidor vuelve a validar el descuento.
- La pantalla de promociones permite mantener promociones y muestra la
  información de segmentación disponible en la API.
- La consulta de puntos presenta el saldo e historial devueltos por el
  servidor e informa que los saldos se cargan administrativamente, sin
  acumulación automática en esta integración.
- Se añadieron pruebas del flujo de promoción y cotización/envío de puntos.

## Guion para la demostración

### Presentación

> “En HU-034 conecté el flujo del carrito con la API Java para consultar
> promociones por segmento y registrar ventas con un descuento validado por el
> servidor. También se puede cotizar el canje de puntos. El frontend muestra la
> cotización, pero no es la fuente de autoridad: el backend recalcula y valida
> al cobrar.”

### Pasos en la aplicación

1. Iniciar sesión con una cuenta autorizada de prueba y abrir el módulo de
   promociones.
2. Mostrar promociones y su segmento/vigencia. Si el entorno tiene permiso
   administrativo, crear o editar una promoción de prueba y guardar.
3. Abrir el carrito, agregar productos y seleccionar un cliente activo.
4. Mostrar que se consultan las promociones que aplican al cliente y a la
   cantidad elegida. Seleccionar una promoción.
5. Cambiar al canje de puntos en lugar de la promoción, ingresar puntos
   disponibles y solicitar cotización. Mostrar que no se combinan ambos tipos
   de descuento.
6. Para una prueba integrada, confirmar la venta en una base QA con datos
   preparados. Mostrar la respuesta de venta y después el saldo/historial
   actualizado; no realizar una venta real en producción.
7. Probar una cantidad inválida de puntos o un cliente sin saldo y mostrar el
   mensaje de validación. Aclarar que el backend también valida el saldo y el
   descuento al registrar.

### Evidencia técnica si el entorno no permite una prueba en vivo

El build y las seis pruebas Vitest pasan. Se pueden mostrar el test
`CarritoPromociones.test.jsx`, el código del carrito y el reporte Java de HU-034.
No se debe afirmar que la API hizo una transacción en vivo si no se conectó una
base QA y no se observó la respuesta real. La suite Java tuvo 22 de 23 pruebas
aprobadas; el test de contexto restante no pudo iniciar porque PostgreSQL
rechazó la contraseña configurada en el entorno local.

## Seguridad y alcance

- El cliente adjunta el JWT existente a las solicitudes de la API.
- La autorización se aplica en el backend: las operaciones administrativas
  requieren `ADMIN`; las consultas permitidas y ventas requieren `ADMIN` o
  `USER`.
- La interfaz nunca debe considerarse una barrera de autorización; el servidor
  valida rol, vigencia de promoción, segmento, precios, saldo y descuento.
- El despliegue local usa HTTP. En producción, la conexión debe protegerse con
  HTTPS.
- No mostrar credenciales, correos reales, tokens ni datos personales en la
  grabación/capturas.
- El análisis SonarQube completo de HU-034 y su Quality Gate siguen pendientes
  de Connected Mode/autenticación. Los análisis por archivo no equivalen a un
  análisis completo. No afirmar que esta HU está libre de vulnerabilidades.

## Evidencias sugeridas

- Carrito con una promoción aplicable seleccionada.
- Cotización de puntos y validación de datos incompletos/insuficientes.
- Respuesta de venta y consulta del saldo en un entorno QA, si está disponible.
- Salida de `npm run build`, ESLint focalizado y `npx vitest run` mostrando seis
  pruebas aprobadas.
- Reporte técnico HU-034 del backend con el estado real de pruebas y SonarQube.

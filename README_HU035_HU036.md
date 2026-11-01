# HU-035 y HU-036 — CafeSoft Sprint 4

## Entregables
- API Java Spring Boot: nuevos `SegmentacionRepository`, `SegmentacionService`, `SegmentacionController`; regla de seguridad ADMIN en `SecurityConfig`.
- Web React: `SegmentacionClientes.jsx`, menú exclusivo ADMIN y etiqueta de segmento en tarjetas de clientes.
- React Native: sin cambios, las historias son administrativas.

## Reglas propuestas (validar con Product Owner)
- POTENCIAL: sin compras asociadas.
- DORMIDO: última compra hace más de 90 días.
- ACTIVO: al menos 3 compras históricas y una en los últimos 30 días.
- POCO_FRECUENTE: tiene compras y no entra en los grupos anteriores.

La clasificación se calcula cada vez que se consulta, no se persiste, por lo que cambia al registrar ventas nuevas. Se usan `ventas.cliente_fidelidad_id` y `ventas.cliente_ruta_id` como asociaciones existentes. **Limitación:** si una venta tiene ambas referencias con el mismo ID, el agregado puede contarla dos veces; se debe definir un identificador canónico de cliente para producción. También se debe validar que las ventas canceladas no se cuenten si el negocio así lo requiere.

## Endpoints (JWT ADMIN)
- GET `/api/clientes/segmentos`
- GET `/api/clientes/segmentos?segmento=ACTIVO`
- GET `/api/clientes/segmentos/resumen`
- GET `/api/clientes/segmentos/cliente/{id}`

## Pruebas recomendadas
1. JWT ADMIN obtiene 200; JWT REPARTIDOR obtiene 403.
2. Cliente sin compras = POTENCIAL.
3. Cliente con compra de hace 91 días = DORMIDO.
4. Cliente con 3 compras y última hace 10 días = ACTIVO.
5. Cliente con 1 compra reciente = POCO_FRECUENTE.
6. Registrar nueva compra, actualizar pantalla y verificar reclasificación.
7. ID inexistente = 404, segmento inválido = 400.

**No se ha ejecutado Maven ni Vite en este entorno.** Probar en copia local con base de datos de pruebas antes de integrar. El ZIP excluye `.git`, dependencias, builds y archivos `.env` para evitar compartir credenciales o sobrescribir historial Git.

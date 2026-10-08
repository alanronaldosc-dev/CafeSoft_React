# HU-013 - Rutas

## Activación de ruta sin carga (cambio reciente)

Antes, activar una ruta requería seleccionar **una sola carga**, lo que
generaba incongruencias porque un repartidor puede llevar **varias cargas**
(una por tipo de garrafón: 20 Bonafont, 5 Ciel, etc.).

Ahora:

- Al activar una ruta **ya no se selecciona carga**. Solo se activa la
  ruta (requiere repartidor asignado y al menos un cliente).
- Las cargas se asignan al repartidor desde `Cargas de Garrafones`
  (`POST /api/cargas/multiple`) y el repartidor las acepta en la app
  móvil en "Mis cargas".
- La relación `Ruta.carga` dejó de usarse al activar (se conserva el
  campo por compatibilidad con datos existentes).
- En la lista de rutas se muestran los **clientes de cada ruta**
  (desplegable "👥 Ver clientes"), con domicilio, precio por garrafón,
  preferencia de garrafón y días de reparto. Al activar una ruta se
  despliega automáticamente su lista de clientes.

API:
- `PUT /api/rutas/{id}/activar` ya no recibe `cargaId`.
- Nuevo endpoint `GET /api/rutas/{id}/clientes` (clientes de una ruta,
  en el orden definido por el encargado).

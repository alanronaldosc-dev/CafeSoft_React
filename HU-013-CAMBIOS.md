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

## Paginado por días (cambio reciente)

### Cargas de Garrafones
- La lista de cargas se pagina **por día**: cada página muestra
  solo las cargas de un día (según `fechaHora`).
- Buscador por calendario (`<input type="date">`), botones
  ◀ ▶ para moverse entre días con cargas y botón "Hoy".
- Muestra cuántas cargas y garrafones hay del día, y la
  página actual (ej. "página 2 de 5 con cargas").

### Rutas
- Mismo paginado por día con calendario y botones
  ◀ ▶ / "Hoy".
- Como la ruta tiene `diasReparto` (ej. "Lunes,Jueves"),
  se muestran las rutas cuyo día de reparto coincida con
  el día de la fecha seleccionada (ej. si se marca para
  miércoles, se muestra ese miércoles).
- **Panel "Rutas pendientes del [día]"**: rutas programadas
  ese día que aún no se han activado, con botón "Activar"
  directo.
- Las rutas sin días de reparto se agrupan en una sección
  "📌 Sin día asignado".

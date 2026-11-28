# Reporte QA - HU-054: rendimiento de analitica

**Responsable QA:** Sofia Sanchez Duran<br>
**Fecha de revision:** 27 de noviembre de 2026<br>
**Alcance:** API Java, endpoints de analitica/ventas y vistas de dashboard React.

## Dictamen

**PARCIAL / NO APROBADA PARA UAT DE STAGING.** Se ejecutaron Newman, JMeter (20 usuarios y 50 de pico) y `EXPLAIN ANALYZE` satisfactoriamente contra una API local aislada con PostgreSQL 16 y datos sinteticos. Todas las respuestas medidas quedaron bajo 3 s y todas las consultas inspeccionadas bajo 150 ms. Estos resultados no representan staging/produccion ni carga real; Chrome/DevTools no se ejecuto y la evidencia de Hibernate no permite confirmar ni descartar N+1.

## Casos de prueba separados

- [CP-HU054-SIT-PERF-01](test-cases/CP-HU054-SIT-PERF-01.md)
- [CP-HU054-UAT-PERF-01](test-cases/CP-HU054-UAT-PERF-01.md)
- [CP-HU054-OAT-COV-01](test-cases/CP-HU054-OAT-COV-01.md)

## Estado de escenarios

| Caso | Resultado | Evidencia y limitacion |
|---|---|---|
| SIT-PERF-01 | Parcial | `EXPLAIN ANALYZE` en PostgreSQL 16 local: consultas revisadas entre 0.290 y 3.253 ms, todas bajo 150 ms con datos sinteticos. Newman: 6 requests y 18 aserciones aprobadas. La revision de Hibernate detecto lineas SQL repetidas de `venta_detalles`, pero no se pudo correlacionar el conteo por request para concluir si hay N+1. |
| UAT-PERF-01 | Parcial (prueba local), UAT real pendiente | JMeter: 20 usuarios/120 muestras y 50 usuarios/300 muestras, 0 errores; maxima observada 1,354 ms y 607 ms, respectivamente. Cumple localmente el umbral de 3 s para API. No se valido la experiencia del navegador/Chrome ni se uso staging; no equivale a aceptacion UAT. |
| OAT-COV-01 | Mixto / no cumple globalmente | PR Java #76 muestra 100 % de cobertura de líneas y ramas del código nuevo y 0 % de duplicación nueva; `InventarioService` completo reporta 49.4 % de líneas/90.3 % de ramas. `SegmentacionService` tiene 82.9 % líneas/67.6 % ramas. La duplicación total es 3.2 % React y 4.5 % Java. Hay dos issues críticos abiertos en React fuera del alcance Segmentación/IA; Java no muestra issues críticos abiertos en la rama consultada. |

## Ejecucion reproducible y resultados

Prueba efectuada el 26 de noviembre de 2026 contra contenedores locales aislados: PostgreSQL 16 publicado solo en `127.0.0.1:5433` y API Java de `origin/master` publicada en `127.0.0.1:8080`. Se usaron datos sinteticos (240 ventas, 480 detalles, 120 clientes y 5 productos) y autenticacion de una cuenta QA local. No se genero trafico hacia produccion ni staging.

### Newman

- 6 requests, 18 aserciones, 0 fallos; duracion total 4.2 s.
- Promedio 628 ms; minimo 74 ms; maximo 1,329 ms.
- Coleccion: [analitica-postman.json](performance/analitica-postman.json). Salida: `performance/results/2026-11-26/newman-results.txt`.

### JMeter

| Escenario / endpoint | 20 usuarios (20 muestras por ruta): promedio / maximo | 50 usuarios pico (50 muestras por ruta): promedio / maximo |
|---|---:|---:|
| Reporte de ventas | 118 / 430 ms | 43 / 329 ms |
| Top productos | 511 / 1,354 ms | 226 / 471 ms |
| Clientes frecuentes | 456 / 1,269 ms | 231 / 513 ms |
| Resumen de segmentos | 52 / 121 ms | 27 / 98 ms |
| Lista de segmentos | 54 / 159 ms | 26 / 58 ms |
| Dashboard | 447 / 1,027 ms | 224 / 607 ms |
| **Total** | **120 muestras; 0 errores** | **300 muestras; 0 errores** |

Los JTL finales de ambas corridas se conservan en `performance/results/2026-11-26/` (`normal-20-users-final.jtl` y `peak-50-users.jtl`). Los reportes HTML se generaron localmente y pueden regenerarse desde esos JTL; se omiten de la rama para no versionar los recursos estáticos generados de JMeter. El plan es [analitica.jmx](performance/analitica.jmx). Los promedios menores en la corrida de 50 usuarios no prueban que mas concurrencia mejore el sistema; las corridas son cortas, aisladas y sobre una base de datos pequena.

### PostgreSQL 16 / Hibernate

Los cuatro `EXPLAIN (ANALYZE, BUFFERS)` guardados en `performance/results/2026-11-26/sql-explain.txt` dieron tiempos de ejecucion de 1.237 ms (ventas filtradas por periodo/sucursal), 3.253 ms (agregado diagnostico de ranking), 0.290 ms (ventas de clientes frecuentes) y 0.334 ms (agrupacion de actividad por cliente). El ranking agregado se marca como consulta diagnostica: el servicio carga ventas y relaciones y calcula agregados en Java, por lo que no es el SQL exacto ejecutado por el endpoint.

En las lineas filtradas de logs Hibernate aparecieron consultas repetidas a `venta_detalles`. Como los logs no se pudieron correlacionar de forma acotada con cada request ni contar por entidad/consulta, el hallazgo queda **inconcluso**; no declarar libre de N+1. Repetir con logging SQL controlado por request/ventana y un conjunto de datos representativo.

### Limites de validez

- Los tiempos `EXPLAIN ANALYZE` y JMeter describen un entorno local y datos sinteticos; no son SLA de staging ni resultados de produccion.
- El umbral de JMeter <3 s se verifico sobre respuestas HTTP de API, no sobre carga percibida de pantallas. No se ejecuto Chrome DevTools ni se confirmo ausencia de spinners.
- El umbral de 150 ms se cumple para las cuatro consultas inspeccionadas, no para cada consulta que la aplicacion pudiera ejecutar.
- N+1, comportamiento con volumen real y aceptacion del administrador siguen pendientes.

## Endpoints identificados en el `master` remoto de API Java

| Necesidad de analitica | Ruta | Parametros observados |
|---|---|---|
| Agrupacion/resumen por periodo | `GET /api/ventas/reporte` | `periodo`: `hoy`, `mes` o `mes_anterior` |
| Ranking de productos | `GET /api/ventas/reporte/top-productos` | `periodo`: `hoy`, `mes` o `mes_anterior` |
| Clientes frecuentes / segmentos de compra | `GET /api/ventas/reporte/clientes-frecuentes` | `periodo`, `minimoCompras` |
| Patrones por rango | `GET /api/ventas/reporte/patrones` | `inicio`, `fin` (fechas ISO) |
| Segmentacion de clientes | `GET /api/clientes/segmentos`; `GET /api/clientes/segmentos/resumen`; `GET /api/clientes/segmentos/cliente/{id}` | Sin parametros de periodo documentados en la ruta |

Las rutas de combinaciones/recomendaciones analiticas de Java PR #74 estan en un PR abierto; no deben considerarse parte de `master` mientras no se integre.

## Evidencia adicional y limites

- Se ejecuto `npm run test:coverage` en React `main` (`5dd4803`); termino con codigo 1: 69 pruebas pasaron y 12 fallaron (3 archivos). Entre las fallas hay expectativas de rutas `/ventas/reporte...` y del dashboard que no coinciden con las solicitudes/render actual. La suite contiene tambien el test QA local no versionado `src/pages/ClientesFrecuentes.test.jsx`; no se modificaron pruebas ni codigo para ocultar los fallos.
- Al fallar la suite, este comando no es evidencia de cobertura aprobada para la HU. Los datos globales SonarCloud de React siguen siendo 12.7 % de lineas y 10.9 % de ramas.
- Los primeros intentos de ejecucion fallaron por heap de JMeter insuficiente y token no propagado; se corrigieron antes de la corrida final. Solo se reportan como resultado final los JTL `normal-20-users-final.jtl` y `peak-50-users.jtl`.
- El heap final de JMeter se limito a 384 MB. Newman recibio HTTP 200 en los seis endpoints; las corridas finales de JMeter registraron cero muestras fallidas.
- En una ejecucion anterior contra H2 local, Newman obtuvo 200 en ranking y segmentos, y 400 en reporte por periodo debido a sucursal/configuracion del usuario QA.
- En esa misma ejecucion, JMeter con 20 usuarios envio 20 solicitudes a ranking (promedio 18.1 ms, maximo 76 ms), 20 a segmentos (promedio 17.9 ms, maximo 35 ms) y 20 al reporte por periodo, que devolvio 400 por datos/configuracion.
- Ese ejercicio anterior contra H2 se conserva solo como evidencia exploratoria; los resultados actuales de PostgreSQL/JMeter estan separados en la seccion de ejecucion y tienen las limitaciones locales arriba descritas.
- Se revisaron lineas filtradas de logs Hibernate, pero no se obtuvo un recuento por request para confirmar o descartar N+1.

## PR y cobertura relacionados

[Java #74 - combinaciones y recomendaciones](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/74): Quality Gate `OK`, cobertura nueva combinada 84.5 %, líneas 90.99 %, ramas 77.08 %, duplicación nueva 0 %. `AnaliticaProductosService.java` tiene 98.1 % de cobertura total, 100 % de líneas y 97.0 % de ramas; la API publica el check en el PR. Esta historia no representa mediciones de rendimiento ni sustituye la cobertura de Segmentación/IA.

[Java #76 - predicción de demanda](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/76): Quality Gate `OK`; el código nuevo tiene 100 % de cobertura de líneas y ramas y 0 % de duplicación nueva. La clase completa `InventarioService.java` reporta 49.4 % de líneas y 90.3 % de ramas. Esto confirma la cobertura casi total del cambio nuevo que mostró el equipo, pero no de la clase completa.

## Requisitos para completar las pruebas

1. Repetir SIT-PERF-01 y UAT-PERF-01 en un staging autorizado con PostgreSQL 16 y datos representativos; no enviar carga a produccion.
2. Contar y correlacionar consultas Hibernate por request para confirmar o descartar N+1.
3. Medir percentiles, errores y timeouts en corridas de duracion acordada, ademas de promedios y maximos.
4. Usar Chrome DevTools para medir cada vista/filtro y verificar el limite percibido de 3 s, spinners y errores visuales.
5. Para OAT-COV-01, elevar cobertura de ramas, revisar la cobertura de `InventarioService` y el umbral de duplicacion; obtener el desglose de bugs criticos en Sonar.
6. Confirmar responsables y fechas de correccion de los hallazgos abiertos.

**Notificacion:** no se publico comentario sobre rendimiento en GitHub: no se encontro un PR directo de HU-054 y la prueba local no debe atribuirse al PR #74, que es de HU-055/056 y permanece abierto. La evidencia local queda documentada arriba; faltan las mediciones de staging para emitir un resultado aplicable a UAT.

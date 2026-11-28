# Documento de Caso de Prueba

## 1. Datos generales

| Campo | Valor | Campo | Valor |
|---|---|---|---|
| ID de la prueba | CP-HU054-SIT-PERF-01 | Fecha de ejecución | 26/11/2026 |
| Nombre de la prueba | Consultas PostgreSQL, endpoints de analítica y consultas Hibernate | Responsable (tester) | Sofía Sánchez Durán |
| Proyecto / Sistema | API Java CafeSoft | Versión / Build | `origin/master` `0c4e24f` |
| Módulo / Funcionalidad | Reporte, ranking, clientes frecuentes y segmentos | Ambiente | Docker local aislado; PostgreSQL 16; datos sintéticos |
| Requerimiento asociado | HU-054 / SIT-PERF-01 | Prioridad | Alta |

## 2. Clasificación

| Nivel de prueba | Tipo de prueba |
|---|---|
| Integración / rendimiento | Consultas de base de datos y API |
| Técnica: caja blanca | Ejecución: automatizada (EXPLAIN, Newman) y análisis de logs |

## 3. Descripción

| Campo | Detalle |
|---|---|
| Descripción | Medir consultas PostgreSQL y endpoints de analítica y revisar SQL de Hibernate en busca de consultas repetidas. |
| Objetivo | Verificar que las cuatro consultas inspeccionadas queden bajo 150 ms y detectar evidencia de N+1. |
| Precondiciones | PostgreSQL 16 y API local disponibles; cuenta QA sintética; variables de autenticación no incluidas en el reporte. |
| Datos de prueba | 240 ventas, 480 detalles, 120 clientes y 5 productos sintéticos. |

## 4. Pasos de la prueba

| # | Acción | Resultado esperado | Resultado obtenido |
|---:|---|---|---|
| 1 | Ejecutar las consultas de [analitica.sql](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/blob/HU-054-performance-qa/performance/analitica.sql) con `EXPLAIN (ANALYZE, BUFFERS)`. | Cada consulta medida <150 ms. | Parcial/pasa para las inspeccionadas: 1.237 ms (ventas/periodo), 3.253 ms (ranking diagnóstico), 0.290 ms (frecuentes), 0.334 ms (segmentos). |
| 2 | Ejecutar colección Newman de seis rutas analíticas. | HTTP 200, JSON y latencia <3 s en cada ruta. | Correcto: 6 requests, 18 aserciones, 0 fallos; promedio 628 ms, máximo 1,329 ms. |
| 3 | Revisar consultas de Hibernate emitidas durante la prueba. | No observar consultas repetidas por entidad/patrón N+1. | Inconcluso: se encontraron líneas SQL repetidas para `venta_detalles`, pero no se correlacionaron ni contaron por request. |
| 4 | Conservar scripts y salidas para repetición. | Archivos de configuración y evidencia disponibles. | Correcto: SQL, colección Newman, `newman-results.txt` y `sql-explain.txt` conservados. |

## 5. Resultado

| Campo | Detalle |
|---|---|
| Resultado final | Parcial |
| Evidencias (capturas, logs) | `performance/results/2026-11-26/newman-results.txt`; `sql-explain.txt`; colección `performance/analitica-postman.json`. |
| Defecto reportado (ID) | Posible N+1 en consultas relacionadas con `venta_detalles`; requiere medición por request para confirmarlo. |
| Severidad del defecto | Por determinar con evidencia reproducible |
| Observaciones | Todas las consultas medidas cumplen 150 ms, pero el ranking agregado fue diagnóstico y no el SQL exacto del servicio. Base pequeña/sintética; no representar staging/producción. |
| Ejecutado por (nombre y firma) | Revisado por (nombre y firma) |
| Sofía Sánchez Durán | No registrado |

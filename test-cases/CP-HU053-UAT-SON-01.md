# Documento de Caso de Prueba

## 1. Datos generales

| Campo | Valor | Campo | Valor |
|---|---|---|---|
| ID de la prueba | CP-HU053-UAT-SON-01 | Fecha de revisión de métricas | 27/11/2026 |
| Nombre de la prueba | Revisión de indicadores e incidencias Sonar | Responsable (tester) | Sofía Sánchez Durán |
| Proyecto / Sistema | CafeSoft API Java y Web React | Versión / Build | API `master` `0c4e24f`; React `main` `5dd4803`; PR #74/#76 |
| Módulo / Funcionalidad | Segmentación e IA/ML | Ambiente | SonarCloud Web UI y API pública; QA Lead no realizó aceptación guiada |
| Requerimiento asociado | HU-053 / UAT-SON-01 | Prioridad | Alta |

## 2. Clasificación

| Nivel de prueba | Tipo de prueba |
|---|---|
| Aceptación | Revisión manual de calidad |
| Técnica: caja blanca | Ejecución: revisión de datos; aceptación formal no registrada |

## 3. Descripción

| Campo | Detalle |
|---|---|
| Descripción | Interpretar bugs, vulnerabilidades, code smells, cobertura y duplicación, y seleccionar hallazgos de Segmentación/IA para revisión del QA Lead. |
| Objetivo | Preparar evidencia comprobable para aceptar o rechazar la calidad del código y registrar incidencias con responsable y fecha. |
| Precondiciones | Acceso al tablero SonarCloud/SonarQube y presencia del QA Lead para la revisión guiada. |
| Datos de prueba | Métricas de ramas principales y medidas por componente/PR consultadas el 27/11/2026. |

Interpretación para la demo: bugs representan defectos de fiabilidad; vulnerabilidades, riesgos de seguridad; code smells, problemas de mantenibilidad; cobertura, líneas/ramas ejecutadas por tests; duplicación, proporción de código repetido. No son métricas intercambiables: distinguir el proyecto completo, la clase completa y el código nuevo del PR.

## 4. Pasos de la prueba

| # | Acción | Resultado esperado | Resultado obtenido |
|---:|---|---|---|
| 1 | Interpretar bugs y vulnerabilidades de ramas principales. | Identificar conteos y severidad, sin confundir métricas globales con PR. | Java master: 1 bug/1 vulnerabilidad global; React main: 38 bugs/3 vulnerabilidades. No se hallaron issues Java `BLOCKER/CRITICAL`; React tiene 2 `CRITICAL` en `Cargas.jsx` y `Liquidaciones.jsx`, fuera de los módulos meta. |
| 2 | Interpretar code smells, cobertura y duplicación. | Comparar cobertura/duplicación con umbrales y delimitar clase vs código nuevo. | Java: cobertura combinada 17.5 %, líneas 18.6 %, ramas 12.8 %, duplicación 4.5 %. React: 12.7 %, líneas 14.0 %, ramas 10.9 %, duplicación 3.2 %. PR #76: código nuevo 100 % líneas/ramas; clase `InventarioService` 49.4 % líneas/90.3 % ramas. |
| 3 | Revisar tres hallazgos relevantes para explicar al equipo. | Cada hallazgo tiene responsable y fecha objetivo acordados. | Se identificaron los hallazgos de la tabla inferior; responsable y fecha no aparecen en los PR ni en los datos Sonar disponibles, por lo que no se inventan. |
| 4 | Abrir el [overview del PR Java #76 en SonarCloud](https://sonarcloud.io/project/overview?id=alanronaldosc-dev_ApiCoffeSoft_Java&pullRequest=76) y revisar los cinco indicadores. | La UI muestra los indicadores y el QA Lead acepta/firma el resultado. | Intentado en SonarCloud Web UI; las tarjetas permanecieron en “Loading visualization”. Se consultaron las métricas por API, pero no se completó la sesión guiada ni se obtuvo firma. La instancia solicitada de SonarQube Developer Edition tampoco fue verificada. |

### Hallazgos a presentar

| # | Hallazgo | Responsable | Fecha objetivo |
|---:|---|---|---|
| 1 | `SegmentacionService`, regla `javabugs:S2259`, severidad MAJOR: acceso con posible `NullPointerException` en línea 53. | Equipo API; persona por acordar | Por acordar |
| 2 | `SegmentacionClientes.jsx`, regla `javascript:S9383`, MAJOR: promesa sin `await`/gestión de rechazo en línea 102. | Equipo Web; persona por acordar | Por acordar |
| 3 | `InventarioService` en PR #76: 49.4 % de cobertura total de líneas, aunque el código nuevo del PR tiene 100 % líneas/ramas. | Responsable del PR #76/equipo API; confirmar | Por acordar |

## 5. Resultado

| Campo | Detalle |
|---|---|
| Resultado final | Parcial; no existe aceptación formal UAT |
| Evidencias | Consulta de métricas y Quality Gate SonarCloud; issues abiertos por componente; detalle en `HU-053-REPORTE-QA.md`. |
| Defecto reportado (ID) | `javabugs:S2259`; `javascript:S9383`; brecha de cobertura total `InventarioService`. |
| Severidad del defecto | MAJOR para las dos reglas Sonar; cobertura: observación de calidad |
| Observaciones | Para la demo, explicar que 100 % en código nuevo no significa 100 % en toda la clase. No se debe firmar aceptación ni atribuir responsables/fechas sin la revisión real con el equipo. |
| Ejecutado por (nombre y firma) | Revisado por (nombre y firma) |
| Sofía Sánchez Durán | No registrado |

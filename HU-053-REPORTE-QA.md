# Reporte QA - HU-053: SonarQube para segmentacion e IA/ML

**Responsable QA:** Sofia Sanchez Duran<br>
**Fecha de revision:** 27 de noviembre de 2026<br>
**Alcance:** CafeSoft React y ApiCoffeSoft Java. React Native se reviso solo como referencia adicional; no es parte del alcance de esta HU.

## Dictamen

**PARCIAL; NO SIGNIFICA QUE NINGUNA HISTORIA SUPERE 80 %.** La revisión actual confirma PRs con cobertura del código nuevo de 100 % en líneas y ramas, y una clase de servicio con cobertura total de 98.1 % de líneas y 97.0 % de ramas. A la vez, otras clases tienen cobertura total menor, y el PR de combinaciones tiene 77.1 % de ramas nuevas. HU-053 no se aprueba integralmente porque no todas estas métricas corresponden a clases de Segmentación/IA del alcance, el workflow Web React no publica Sonar y no todos los PR tienen Quality Gate verificable.

## Casos de prueba separados

- [CP-HU053-SIT-SON-01](test-cases/CP-HU053-SIT-SON-01.md)
- [CP-HU053-UAT-SON-01](test-cases/CP-HU053-UAT-SON-01.md)

## Estado de escenarios

| Caso | Resultado | Evidencia y limitacion |
|---|---|---|
| SIT-SON-01 | Parcial | Java #76 y #74 publicaron checks SonarCloud `success` y Quality Gate `OK` en menos de 5 min; #76 tiene 100 % de cobertura de líneas/ramas nuevas. React #54 no tiene check Sonar y el workflow React #44 terminó `failure` sin jobs. Se usó SonarCloud, no SonarQube Developer Edition. |
| UAT-SON-01 | Pendiente de aceptacion | Se documentan metricas e incidencias prioritarias abajo, pero no se realizo una revision guiada ni se obtuvo aceptacion del QA Lead. Responsable y fecha de correccion deben ser confirmados por los responsables; no se inventan asignaciones. |
| Cobertura >= 80 % | Mixto; alcance por clase | El código nuevo del PR Java #76 llega a 100 % en líneas y ramas; `AnaliticaProductosService` en #74 tiene 100 % de líneas y 97.0 % de ramas globales. Sin embargo, `InventarioService` completo en #76 tiene 49.4 % de líneas, `SegmentacionService` 67.6 % de ramas y `SegmentacionClientes.jsx` 0 % reportado. |

## Metricas de ramas principales

Valores consultados en SonarCloud el 27-nov-2026:

| Proyecto | Quality Gate | Cobertura combinada | Lineas | Ramas | Duplicacion | Bugs | Vulnerabilidades | Code smells |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| CafeSoft React (`main`) | OK | 12.7 % | 14.0 % | 10.9 % | 3.2 % | 38 | 3 | 108 |
| API Java (`master`) | OK | 17.5 % | 18.6 % | 12.8 % | 4.5 % | 1 | 1 | 1 |

El Quality Gate de React reporta cobertura de codigo nuevo 90.6 % y duplicacion nueva 0.0 %. El Gate de Java devuelve `OK`, pero sus condiciones consultadas no incluyen cobertura ni duplicacion; por tanto, ese estado no demuestra el umbral de HU-053. Los hallazgos de la tabla son metricas globales del proyecto, no necesariamente incidencias nuevas de los PR evaluados.

## Evidencia adicional de cobertura por clase

| Proyecto / clase | Evidencia | Resultado frente al criterio |
|---|---|---|
| API Java `SegmentacionService` en `master` | JaCoCo local: líneas 34/41 (82.9 %); ramas 23/34 (67.6 %). SonarCloud: cobertura combinada 76.9 %. | Líneas pasan; ramas y cobertura combinada no llegan a 80 %. |
| API Java `InventarioService` en PR #76 (HU-059) | SonarCloud: cobertura total de clase 49.4 % líneas/90.3 % ramas; código nuevo: 100 % líneas/100 % ramas. | El cambio nuevo pasa; la clase completa no llega a 80 % de líneas. No es PR directo de HU-053. |
| API Java `AnaliticaProductosService` en PR #74 (HU-055/056) | SonarCloud: 100 % líneas, 97.0 % ramas y 98.1 % cobertura combinada de la clase. | Sí supera 80 %, pero es otra historia/clase; no se atribuye a Segmentación/IA de HU-053. |
| PR Java #74 (HU-055/056) | Código nuevo: cobertura combinada 84.5 %, líneas 90.99 %, ramas 77.08 %, duplicación nueva 0 %. Quality Gate `OK`. | Gate pasa; ramas nuevas quedan debajo de 80 %. El Gate no usa `new_branch_coverage` como condición separada. |
| Web React `SegmentacionClientes.jsx` | SonarCloud: 0 % líneas/ramas. El reporte local focalizado no instrumentó el componente porque `vitest.config.js` no lo incluye en `coverage.include`. | Cobertura no demostrada para el componente. |

### Incidencias prioritarias para la UAT

Estas son incidencias/hallazgos observados en la evidencia disponible; no se asigna responsable ni fecha sin confirmacion del equipo.

| Prioridad | Hallazgo | Responsable | Fecha objetivo |
|---|---|---|---|
| 1 | `SegmentacionService`, `javabugs:S2259` (MAJOR): acceso que puede lanzar NullPointerException en línea 53. | Por asignar por el equipo Java | Por confirmar |
| 2 | `SegmentacionClientes.jsx`: promesa sin gestion de error en linea 102. | Por asignar por el equipo Web | Por confirmar |
| 3 | Cobertura de ramas de `SegmentacionService` 67.6 % en JaCoCo y 67.6 % en la medicion de ramas de SonarCloud. | Por asignar por el equipo Java | Por confirmar |

La tabla de métricas globales muestra conteos agregados. En la consulta actual de SonarCloud no hay issues Java abiertos con severidad BLOCKER/CRITICAL; React sí tiene dos issues CRITICAL (`javascript:S2871`) en `Cargas.jsx` y `Liquidaciones.jsx`, fuera de los archivos de Segmentación/IA. La aceptación formal del QA Lead y la asignación de responsables/fechas siguen sin constancia en GitHub.

## PR relacionados revisados

| Repositorio / PR | Hallazgo | Evaluacion QA |
|---|---|---|
| [Java #56 - pruebas de segmentacion](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/56) | Quality Gate `ERROR`; cobertura de codigo nuevo 0.0 % y duplicacion nueva 9.0 %. | No cumple. El PR esta abierto y su base no corresponde a la revision mas reciente de `master`; requiere actualizar/reanalizar. |
| [Java #73 - prediccion de productos](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/73) | Check de CI fallido y sin metricas Sonar accesibles para el PR; la base es anterior al `master` actual. | No se puede verificar el 80 %; el fallo no debe interpretarse como cobertura 0 %. |
| [Java #76 - predicción de demanda](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/76) | Quality Gate `OK`; código nuevo: líneas 100 %, ramas 100 %, duplicación nueva 0 %. `InventarioService.java` completo: 49.4 % líneas/90.3 % ramas. | Confirma el 100 % que mostró el equipo para el cambio nuevo; no significa 100 % de toda la clase. |
| [React #50 - HU-044 QA segmentos](https://github.com/alanronaldosc-dev/CafeSoft_React/pull/50) | Check visible solo para Vercel Preview; no hay check Sonar. | No permite verificar cobertura Sonar del PR. |
| [React #54 - HU-052 predicción productos](https://github.com/alanronaldosc-dev/CafeSoft_React/pull/54) | Check visible solo para Vercel Preview; SonarCloud devuelve 404 para el PR. | Cobertura Sonar del PR no verificable. |
| [React #57 - HU-059 predicción demanda](https://github.com/alanronaldosc-dev/CafeSoft_React/pull/57) | CI reportó `failure`; no hay check Sonar visible. | Cobertura Sonar del PR no verificable. |

Como referencia fuera del alcance directo de HU-053: [React Native #26](https://github.com/alanronaldosc-dev/CafeSoft_ReactNative/pull/26) pertenece a otra historia; no se usa para dictaminar API Java/Web React.

## Sincronizacion revisada

Se ejecutó `git fetch origin` en API Java, React Native y Web React y se inspeccionaron los PR remotos más recientes. Las ramas de trabajo actuales (`actividad-18-sincronizacion-movil`, `HU-043-qa-ranking` y `main`) estaban sincronizadas con su upstream (0 commits ahead/behind). No se cambió de rama ni se mezclaron PR en progreso: API Java tiene modificaciones locales sin confirmar y React conserva artefactos QA no versionados. Las refs de los PR Java #73/#74/#76 se descargaron únicamente para inspección.

El workflow React #44 terminó `failure` sin jobs asociados; React #54/#50 solo muestra Vercel Preview. Java #74 tiene `Build, Test & SonarCloud` exitoso, Quality Gate `OK`, check publicado y duración total 1 min 57 s. Java #76 también tuvo CI/SonarCloud exitosos en menos de 5 min. Java #73 falló al compilar `ApiSpringCafeSoftApplicationTests.java` (EOF while parsing), por lo que Sonar se omitió.

La suite React ejecutada localmente despues de sincronizar `main` (`npm run test:coverage`) termino con codigo 1: 69/81 pruebas pasaron y 12 fallaron en 3 archivos. Una de esas suites era un test QA local no versionado; no se acepto esta ejecucion como evidencia de cobertura.

## Acciones requeridas antes de aprobar

1. Habilitar y ejecutar análisis Sonar en los PR Web React del alcance, publicando el Quality Gate en GitHub; los PR #54/#57 actuales no lo muestran.
2. Revisar la regla del Gate para asegurar que la métrica de ramas también alcance 80 % donde el criterio pide líneas Y ramas; PR #74 tiene 77.08 % de ramas nuevas pese al Gate `OK`.
3. Analizar en Sonar la versión actual de `SegmentacionService`, `SegmentacionClientes.jsx` y clases IA/ML de los PR relevantes, distinguiendo cobertura de código nuevo y clase completa.
4. Corregir/fijar el PR Java #73 para que compilación de pruebas y análisis Sonar se ejecuten; analizar también PR #56 si sigue en el alcance acordado.
5. Realizar revisión guiada en Web UI; registrar aceptación del QA Lead, responsable y fecha objetivo acordados para los hallazgos.

## Notificaciones publicadas

Se publicaron comentarios QA para que los responsables reciban notificacion en estos PR relacionados:

- [API Java #56 - Gate fallido en segmentacion](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/56#issuecomment-7199420740)
- [React #54 - Sonar/cobertura no visibles en prediccion](https://github.com/alanronaldosc-dev/CafeSoft_React/pull/54#issuecomment-7199436825)
- [React #57 - Sonar/cobertura no visibles en prediccion de demanda](https://github.com/alanronaldosc-dev/CafeSoft_React/pull/57#issuecomment-7199444942)
- [API Java #73 - CI fallido y Sonar no verificable](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/73#issuecomment-7199454131)
- [API Java #76 - Gate de codigo nuevo OK, cobertura total de clase menor a 80 %](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/pull/76#issuecomment-7199463130)

**Corrección de alcance:** una notificación QA anterior se dejó en React #50, pero al refrescar los PR se verificó que #50 corresponde a HU-044, no a HU-053. No se cuenta como evidencia/notificación válida de HU-053.

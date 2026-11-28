# Documento de Caso de Prueba

## 1. Datos generales

| Campo | Valor | Campo | Valor |
|---|---|---|---|
| ID de la prueba | CP-HU054-OAT-COV-01 | Fecha de evidencia | 27/11/2026 |
| Nombre de la prueba | Cobertura de Segmentación/IA, duplicación e incidencias críticas | Responsable (tester) | Sofía Sánchez Durán |
| Proyecto / Sistema | CafeSoft API Java y Web React | Versión / Build | Java PR #76 `1afa0fe`; PR #74 `e8ecc83`; Java `master` `0c4e24f`; React `main` `5dd4803` |
| Módulo / Funcionalidad | Segmentación, inventario predictivo y componentes analíticos | Ambiente | GitHub Actions/SonarCloud y ejecución JaCoCo local previa |
| Requerimiento asociado | HU-054 / OAT-COV-01; evidencia relacionada HU-053 | Prioridad | Alta |

## 2. Clasificación

| Nivel de prueba | Tipo de prueba |
|---|---|
| Aceptación operacional | Cobertura y mantenibilidad |
| Técnica: caja blanca | Ejecución: automatizada (Surefire/JaCoCo/SonarCloud) |

## 3. Descripción

| Campo | Detalle |
|---|---|
| Descripción | Revisar evidencia de tests, JaCoCo, cobertura de líneas/ramas, duplicación y severidad de issues abiertos. Diferenciar código nuevo de clase/proyecto completo. |
| Objetivo | Validar ≥80 % líneas y ramas, duplicación <3 % y ausencia de bugs críticos en el alcance IA/ML/segmentación. |
| Precondiciones | PR con pipeline ejecutado, análisis Sonar disponible y reportes JaCoCo. El [pom.xml de Java](https://github.com/alanronaldosc-dev/ApiCoffeSoft_Java/blob/master/pom.xml) configura JaCoCo 0.8.12. |
| Datos de prueba | Medidas de SonarCloud por PR/clase y JaCoCo local de `SegmentacionService`. |

## 4. Pasos de la prueba

| # | Acción | Resultado esperado | Resultado obtenido |
|---:|---|---|---|
| 1 | Ejecutar/verificar Build, test y JaCoCo en Java PR #76. | Tests y análisis completan sin error; XML JaCoCo se importa. | Correcto en Actions: job Build/Test/SonarCloud `success`; el sensor JaCoCo fue ejecutado. No se atribuye un número de tests que no aparece en el resumen de Actions consultado. |
| 2 | Consultar métricas para PR #76 y clase `InventarioService`. | Código nuevo y clase deben alcanzar ≥80 % líneas/ramas. | Código nuevo: 100 % líneas y 100 % ramas; clase completa: 49.4 % líneas y 90.3 % ramas. Pasa cambio nuevo; no pasa líneas de la clase completa. |
| 3 | Consultar JaCoCo/Sonar para `SegmentacionService`. | Líneas y ramas ≥80 %. | JaCoCo local previo: 82.9 % líneas, 67.6 % ramas; SonarCloud: cobertura combinada 76.9 %. No cumple ramas. |
| 4 | Revisar duplicación e issues críticos. | Duplicación <3 % y 0 issues críticos en alcance. | Código nuevo #76/#74: 0 % duplicación. Proyecto total: Java 4.5 %, React 3.2 %. Sonar no reporta BLOCKER/CRITICAL abiertos en Java; React sí tiene dos CRITICAL en archivos fuera de Segmentación/IA (`Cargas.jsx`, `Liquidaciones.jsx`). |
| 5 | Revisar resultado consolidado, incluyendo análisis React. | Evidencia actual en API Java y Web React. | No cumple globalmente: SonarCloud React main tiene 12.7 % cobertura combinada y 3.2 % duplicación; React PRs relacionados no exponen check Sonar. La suite local React tuvo 69/81 pruebas aprobadas y 12 fallidas; el componente de segmentación no está incluido en `coverage.include`. |

## 5. Resultado

| Campo | Detalle |
|---|---|
| Resultado final | Parcial / criterio completo no cumple |
| Evidencias (capturas, logs) | GitHub Actions Java #76/#74; API SonarCloud para Quality Gate y medidas; JaCoCo local documentado en `HU-053-REPORTE-QA.md`. |
| Defecto reportado (ID) | Rama sin cobertura suficiente en `SegmentacionService`; cobertura total de líneas insuficiente en `InventarioService`; cobertura Web React no verificable en PR. |
| Severidad del defecto | Brecha de calidad; los issues Java críticos abiertos encontrados son 0, pero el criterio global de duplicación/cobertura no pasa. |
| Observaciones | El resultado cambia según el denominador: código nuevo del PR #76 = 100 % líneas/ramas; clase completa `InventarioService` = 49.4 % líneas/90.3 % ramas; proyecto Java = 17.5 % cobertura combinada. La evidencia de un PR con alta cobertura no prueba que todas las historias/clases estén por encima del umbral. |
| Ejecutado por (nombre y firma) | Revisado por (nombre y firma) |
| Sofía Sánchez Durán | No registrado |

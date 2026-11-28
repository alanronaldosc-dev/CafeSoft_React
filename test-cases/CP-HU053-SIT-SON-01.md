# Documento de Caso de Prueba

## 1. Datos generales

| Campo | Valor | Campo | Valor |
|---|---|---|---|
| ID de la prueba | CP-HU053-SIT-SON-01 | Fecha de ejecución | 27/11/2026 |
| Nombre de la prueba | Análisis Sonar y publicación de Quality Gate en PR | Responsable (tester) | Sofía Sánchez Durán |
| Proyecto / Sistema | CafeSoft API Java y Web React | Versión / Build | API PR #76 `1afa0fe`; PR #74 `e8ecc83`; React `main` `5dd4803` |
| Módulo / Funcionalidad | Segmentación e IA/ML / pipeline Sonar | Ambiente | GitHub Actions y SonarCloud |
| Requerimiento asociado | HU-053 / SIT-SON-01 | Prioridad | Alta |

## 2. Clasificación

| Nivel de prueba | Tipo de prueba |
|---|---|
| Sistema / integración CI | Calidad estática y cobertura |
| Técnica: caja blanca | Ejecución: automatizada |

## 3. Descripción

| Campo | Detalle |
|---|---|
| Descripción | Verificar que la CI ejecute pruebas, JaCoCo/Sonar, consulte el Quality Gate y publique el check en el pull request. |
| Objetivo | Comprobar la ejecución menor a 5 minutos y distinguir el estado global del Gate de cobertura de líneas/ramas por clase. |
| Precondiciones | PR abierto con análisis Sonar habilitado; acceso de lectura a GitHub Actions y a la API de SonarCloud. |
| Datos de prueba | Java #76 (HU-059), Java #74 (HU-055/056), React #54 (HU-052); métricas SonarCloud actuales. |

## 4. Pasos de la prueba

| # | Acción | Resultado esperado | Resultado obtenido |
|---:|---|---|---|
| 1 | Abrir los checks de Java PR #76 y verificar Build/Test/JaCoCo/SonarCloud. | El job concluye correctamente y antes de 5 min. | Correcto: job total <5 min; Build/Test y análisis SonarCloud finalizaron `success`. |
| 2 | Consultar `api/qualitygates/project_status` para Java PR #76. | Estado del Gate y condiciones de cobertura/duplicación visibles. | Correcto: `OK`; cobertura nueva 100 %, ramas nuevas 100 %, duplicación nueva 0 %. |
| 3 | Verificar el check publicado en el PR. | GitHub muestra check de Sonar en el commit del PR. | Correcto para Java #76: check `SonarCloud Code Analysis` publicado y exitoso. |
| 4 | Repetir revisión en Java PR #74. | Confirmar valores, tiempo y estado del Gate. | Gate `OK` y check publicado en 1 min 57 s; cobertura nueva combinada 84.5 %, líneas 90.99 %, ramas 77.08 %, duplicación nueva 0 %. El umbral de ramas no pasa aunque el Gate esté verde. |
| 5 | Verificar React PR #54 y último workflow React #44. | Sonar ejecuta y publica estado para Web React. | No pasa: #54 solo tiene check Vercel; no hay check Sonar. El workflow #44 terminó `failure` sin jobs asociados. |

## 5. Resultado

| Campo | Detalle |
|---|---|
| Resultado final | Parcial |
| Evidencias | Java PR #76 check/Quality Gate; Java PR #74 check/Quality Gate; API de SonarCloud; React PR #54 sin check Sonar; workflow React #44 fallido. |
| Defecto reportado (ID) | CI/sonar de Web React sin ejecución verificable; no se asignó ID de issue. |
| Severidad del defecto | Alta para la aceptación de HU-053 |
| Observaciones | La integración verificada es SonarCloud, no SonarQube Developer Edition. Java confirma la capacidad del pipeline; la cobertura de 100 % corresponde al código nuevo de #76 (HU-059), no a toda `InventarioService` ni a todos los componentes de HU-053. `AnaliticaProductosService` de #74 alcanza 98.1 % total, pero pertenece a HU-055/056. No afirmar cumplimiento conjunto API+Web ni umbral de ramas para #74. |
| Ejecutado por (nombre y firma) | Revisado por (nombre y firma) |
| Sofía Sánchez Durán | No registrado |

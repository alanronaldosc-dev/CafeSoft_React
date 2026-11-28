# Documento de Caso de Prueba

## 1. Datos generales

| Campo | Valor | Campo | Valor |
|---|---|---|---|
| ID de la prueba | CP-HU054-UAT-PERF-01 | Fecha de ejecución de carga | 26/11/2026 |
| Nombre de la prueba | Carga normal/pico de analítica y tiempo percibido del dashboard | Responsable (tester) | Sofía Sánchez Durán |
| Proyecto / Sistema | CafeSoft API y dashboard Web | Versión / Build | API `origin/master` `0c4e24f`; React `main` `5dd4803` |
| Módulo / Funcionalidad | Dashboard, filtros, ranking y segmentos | Ambiente | JMeter contra API local aislada; Chrome UAT no ejecutado |
| Requerimiento asociado | HU-054 / UAT-PERF-01 | Prioridad | Alta |

## 2. Clasificación

| Nivel de prueba | Tipo de prueba |
|---|---|
| Aceptación / carga | Rendimiento bajo concurrencia |
| Técnica: caja negra | Ejecución: automatizada JMeter; validación visual no realizada |

## 3. Descripción

| Campo | Detalle |
|---|---|
| Descripción | Medir seis endpoints bajo 20 usuarios concurrentes y un perfil de pico de 50; la aceptación final requiere verificar vistas en Chrome. |
| Objetivo | Comprobar que no haya respuestas API >3 s, errores ni timeouts bajo el perfil ejecutado. |
| Precondiciones | JMeter 5.6.3, API local autenticada, base sintética; no enviar carga a producción. |
| Datos de prueba | Seis rutas de analítica; cada una recibió 20 solicitudes en la corrida normal y 50 en la corrida pico. |

## 4. Pasos de la prueba

| # | Acción | Resultado esperado | Resultado obtenido |
|---:|---|---|---|
| 1 | Ejecutar `analitica.jmx` con 20 usuarios y revisar JTL. | Cero errores; cada respuesta API <3 s. | Correcto: 120 muestras, 0 errores; máximo 1,354 ms (top productos). |
| 2 | Ejecutar perfil pico con 50 usuarios y revisar JTL. | Sin fallos, errores ni timeouts; respuestas bajo 3 s. | Correcto en la corrida local: 300 muestras, 0 errores; máximo 607 ms. |
| 3 | Abrir dashboard en Google Chrome y navegar entre pestañas/cambiar periodos. | Todas las vistas <3 s percibidos, sin spinner prolongado ni timeout. | No ejecutado: la corrida fue HTTP contra API, no navegación de navegador; no se midieron carga visual ni spinners. |
| 4 | Comparar con JTL y documentar alcance. | Adjuntar muestras, tiempos y límites del ambiente. | Correcto para la parte JMeter; límites anotados en el reporte HU-054. |

## 5. Resultado

| Campo | Detalle |
|---|---|
| Resultado final | Parcial; criterio de API cumple localmente, criterio visual UAT no verificado |
| Evidencias (capturas, logs) | `performance/results/2026-11-26/normal-20-users-final.jtl`; `performance/results/2026-11-26/peak-50-users.jtl`. Los reportes HTML se regeneran desde los JTL. |
| Defecto reportado (ID) | Ninguno observado en las muestras JMeter; la falta de medición visual no es un defecto del producto. |
| Severidad del defecto | N/A |
| Observaciones | Los resultados son locales y sintéticos; no demuestran comportamiento con carga real o en staging ni sustituyen Google Chrome DevTools. |
| Ejecutado por (nombre y firma) | Revisado por (nombre y firma) |
| Sofía Sánchez Durán | No registrado |

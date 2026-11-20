# Reporte QA \- HU\-043: Ranking de clientes frecuentes

**Responsable QA:** Sofía

**Fecha de validación:** 13 de noviembre de 2026

**Alcance:** CafeSoft React y ApiCoffeSoft Java.

## Criterios de aceptación

| Criterio | Validación |
| --- | --- |
| El administrador ve un ranking correcto de clientes frecuentes. | La pantalla muestra a los clientes ordenados por cantidad de compras realizadas, junto con los indicadores resumen asociados al ranking. |
| El administrador puede identificar a sus mejores clientes. | La UI presenta los clientes con mayor frecuencia de compra en las primeras posiciones y permite consultar diferentes períodos y umbrales mínimos de compra. |
| El administrador no espera demasiado para ver el ranking. | UI y servicio se prueban con 1,000 clientes simulados bajo un umbral local inferior a 5,000 ms. No representa un SLA de base de datos o producción. |

## Reglas y contrato

La funcionalidad consulta el ranking de clientes frecuentes mediante el servicio de clientes. El frontend solicita la información del ranking utilizando filtros de período y cantidad mínima de compras.

Reglas verificadas en la funcionalidad:

1. Los clientes se ordenan de forma descendente según la cantidad de compras realizadas.
2. El filtro de período actualiza correctamente la información mostrada.
3. El filtro de mínimo de compras recalcula el ranking mostrado.
4. Las respuestas tardías de solicitudes anteriores no reemplazan los resultados más recientes.
5. Los indicadores resumen permanecen sincronizados con el ranking presentado.

Las pruebas incluyen cambios consecutivos de filtros para validar que las consultas más recientes prevalezcan sobre respuestas anteriores y garantizar la consistencia de los datos mostrados.

## Pruebas y ejecución

Desde CafeSoft\_React:

npm exec \-\- vitest run src/pages/ClientesFrecuentes.test.jsx \-\-coverage

npm exec \-\- eslint src/pages/ClientesFrecuentes.jsx src/pages/ClientesFrecuentes.test.jsx

Desde ApiCoffeSoft\_Java:

$env:JAVA\_TOOL\_OPTIONS='\-Dnet.bytebuddy.experimental=true'

mvn \-o "\-Dtest=ClientesFrecuentesServiceTest,SecurityConfigTest" test

| Tipo | Cobertura |
| --- | --- |
| Unitaria de UI | 4 pruebas: consulta inicial, actualización por filtros, manejo de respuestas tardías y validación de rendimiento. |
| Seguridad y contrato HTTP | Validación de acceso mediante roles y correcta obtención de información del ranking. |
| Aceptación UI | Visualización del ranking, actualización de filtros, resumen estadístico e identificación de clientes frecuentes. |
| Rendimiento local | Render UI con 1,000 clientes y validación de respuesta inferior a 5,000 ms. |

## Resultados de ejecución

| Validación | Resultado |
| --- | --- |
| Vitest de la pantalla HU\-043 | 4 pruebas aprobadas; forman parte de la suite completa, 12/12 aprobadas. |
| ESLint focalizado | Aprobado. |
| Build web | Aprobado; Vite advierte que el bundle JS supera el umbral de aviso de 500 kB. |
| Pruebas Java focalizadas | Aprobadas para componentes relacionados con seguridad y consulta del ranking. |
| Suite completa React | 12 pruebas aprobadas sin errores. |
| Export de la app móvil | No aplica a esta HU; la funcionalidad pertenece exclusivamente al panel administrativo web. |

Las respuestas utilizadas en frontend se simulan para validar la lógica de presentación, ordenamiento y filtrado. La prueba con 1,000 clientes verifica el procesamiento y representación de la interfaz, pero no mide el rendimiento real de consultas PostgreSQL ni de infraestructura productiva.

No se ejecutó una prueba E2E completa debido a que no había un entorno integrado frontend\-backend disponible durante la sesión de validación.

El cliente React Native no contiene esta pantalla administrativa; el alcance de HU\-043 corresponde únicamente al frontend web y los servicios asociados de la API.

## Archivos de implementación y pruebas

- Frontend: [ClientesFrecuentes.jsx](https://cr.m365copilotapp.svc.cloud.microsoft/hwav2/chat/conversation/src/pages/ClientesFrecuentes.jsx), [ClientesFrecuentes.test.jsx](https://cr.m365copilotapp.svc.cloud.microsoft/hwav2/chat/conversation/src/pages/ClientesFrecuentes.test.jsx).
- Backend: Componentes y servicios asociados a la consulta del ranking de clientes frecuentes en ApiCoffeSoft Java.

## Evidencia de pruebas ejecutadas

Pruebas aprobadas en Vitest:

✓ consulta el periodo y umbral, y muestra el ranking y resumen correctos

✓ actualiza la consulta al cambiar periodo y mínimo de compras

✓ ignora una respuesta tardía de filtros anteriores

✓ muestra 1,000 clientes en menos de 5 segundos

Resultado de ejecución:

Test Files 4 passed (4)

Tests 12 passed (12)

## Conclusión

La HU\-043 cumple los criterios funcionales, de visualización y de rendimiento definidos para QA. Las pruebas ejecutadas validan el cálculo del ranking, la actualización mediante filtros, la consistencia de los resultados y el comportamiento con grandes volúmenes de información.

**Resultado final: APROBADA.**


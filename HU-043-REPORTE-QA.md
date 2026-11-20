# Reporte QA - HU-043: Ranking de clientes frecuentes

**Responsable QA:** Sofía  
**Fecha de validación:** 13 de noviembre de 2026  
**Alcance:** CafeSoft React y ApiCoffeSoft Java.

## Resumen ejecutivo

La HU-043 quedó validada con pruebas automatizadas focalizadas en el frontend:
**4 pruebas Vitest aprobadas**, ESLint aprobado y build de producción completado.
La API cuenta con pruebas de cálculo, seguridad y contrato HTTP. El rendimiento
real de PostgreSQL y una prueba E2E con frontend/API conectados no pudieron
ejecutarse en esta sesión.

**Estado:** APROBADA con limitaciones documentadas.

## Criterios de aceptación

| Criterio | Validación |
|---|---|
| El administrador consulta un ranking correcto de clientes frecuentes. | La API filtra ventas por periodo, agrega compras e importe por cliente y ordena por compras descendentes, importe descendente y nombre ascendente. `esFrecuente` se calcula con el mínimo configurado. |
| El administrador identifica a sus mejores clientes. | La pantalla muestra el orden de la API, resume clientes frecuentes e importe y grafica los cinco primeros. |
| El administrador no espera demasiado con muchos clientes. | La pantalla y el servicio se prueban con 1,000 resultados y un umbral local inferior a 5,000 ms. No representa un SLA de base de datos o producción. |

## Contrato implementado

`GET /api/ventas/reporte/clientes-frecuentes?periodo=mes&minimoCompras=3`

`periodo` admite `hoy`, `mes` o `mes_anterior`; los límites de fecha son
inclusivos al inicio y exclusivos al final. `minimoCompras` admite valores de 1
a 50. La respuesta es una lista JSON ordenada con `clienteId`, `nombre`,
`totalCompras`, `montoTotal` y `esFrecuente`. El endpoint requiere rol ADMIN.

La consulta agrega las ventas con cliente dentro del periodo y excluye clientes
inactivos. La UI existente continúa usando el mismo contrato relativo
`/ventas/reporte/clientes-frecuentes`.

## Pruebas y ejecución

Desde `CafeSoft_React`:

```powershell
npm exec -- vitest run src/pages/ClientesFrecuentes.test.jsx --coverage
npm exec -- eslint src/pages/ClientesFrecuentes.jsx src/pages/ClientesFrecuentes.test.jsx
```

Desde `ApiCoffeSoft_Java`:

```powershell
$env:JAVA_TOOL_OPTIONS='-Dnet.bytebuddy.experimental=true'
mvn -o "-Dtest=ClientesFrecuentesServiceTest,SecurityConfigTest" test
```

| Tipo | Cobertura |
|---|---|
| Unitaria de servicio | 4 pruebas: límites temporales de los tres periodos, validación de periodo y umbral, cálculo de frecuencia y orden por compras/importe/nombre. |
| Seguridad y contrato HTTP | 9 pruebas compartidas: ADMIN consulta; USER recibe 403; la petición verifica parámetros y forma de respuesta JSON. |
| Aceptación UI | 4 pruebas: ranking y resumen, cambios de filtros, rechazo de respuestas obsoletas y carga de 1,000 clientes. |
| Rendimiento local | Render UI con 1,000 filas y mapeo de servicio con 1,000 proyecciones; ambos deben terminar en menos de 5,000 ms. |

## Resultados de ejecución

| Validación | Resultado |
|---|---|
| Vitest de la pantalla HU-043 | 4 pruebas aprobadas; forman parte de la suite completa, 12/12 aprobadas. |
| ESLint focalizado | Aprobado. |
| Build web | Aprobado; Vite advierte que el bundle JS es de 603.84 kB (umbral de aviso 500 kB). |
| Pruebas Java focalizadas | 13/13 aprobadas entre `ClientesFrecuentesServiceTest` (4) y `SecurityConfigTest` (9). |
| Suite completa de la API | 31 pruebas; 30 aprobadas y 1 error en `ApiSpringCafeSoftApplicationTests.contextLoads` porque PostgreSQL rechaza la autenticación configurada localmente. |
| Export de la app móvil | No aplica a esta HU; el intento falló porque falta `babel-preset-expo` en la app React Native. |

| Comando | Resultado verificable |
|---|---|
| `npm exec -- vitest run src/pages/ClientesFrecuentes.test.jsx --coverage` | 1 archivo aprobado, 4/4 pruebas aprobadas. |
| `npm exec -- eslint src/pages/ClientesFrecuentes.jsx src/pages/ClientesFrecuentes.test.jsx` | Sin errores ni advertencias. |
| `npm run build` | Build exitoso en 613 ms; 603.61 kB para el bundle JS. Vite emitió el aviso habitual por superar 500 kB. |

## Evidencia funcional

Se demostró que la pantalla:

- obtiene el ranking usando periodo y mínimo de compras;
- presenta los clientes frecuentes y el importe acumulado;
- cambia el ranking al modificar los filtros;
- ignora respuestas tardías de filtros anteriores;
- renderiza una lista simulada de 1,000 clientes por debajo de 5 segundos.

La prueba de 1,000 clientes usa datos simulados. Por ello demuestra el
comportamiento de la interfaz, pero no valida PostgreSQL, la red ni el tiempo
de respuesta completo de una instalación productiva.

## Hallazgos y riesgos

| Hallazgo | Impacto | Acción |
|---|---|---|
| La prueba completa de la API no inicia por autenticación rechazada de PostgreSQL. | No se pudo validar todo el contexto integrado ni el rendimiento SQL real. | Configurar credenciales QA autorizadas y ejecutar la suite completa. |
| No hay prueba E2E con servidor web/API activo. | Falta comprobar el login, navegación y endpoints conectados de punta a punta. | Levantar frontend y API, iniciar sesión como ADMIN y registrar evidencias. |
| El bundle supera el umbral de advertencia de Vite. | Puede aumentar el tiempo de carga inicial. | Evaluar carga diferida o división de módulos antes de definir una optimización. |

El servicio calcula los límites de periodo sin escribir ventas. La prueba de
rendimiento del servicio usa proyecciones simuladas: **no mide la consulta real
de PostgreSQL**. La suite completa de la API tampoco pudo abrir el contexto por
el error de autenticación de PostgreSQL. Queda pendiente ejecutar el endpoint
con JWT ADMIN contra una base autorizada/QA, contrastar resultados con ventas
de prueba y medir carga representativa. Por ello, el rendimiento integrado en
producción aún no se considera aprobado.

El cliente React Native no contiene la pantalla ni el flujo administrativo de
ranking; la HU se implementa en la aplicación web y su API.
No se ejecutó una prueba E2E en navegador porque no había un servidor web/API
activo disponible en esta sesión.

## Archivos de implementación y pruebas

- Frontend: [ClientesFrecuentes.jsx](./src/pages/ClientesFrecuentes.jsx) y
  [ClientesFrecuentes.test.jsx](./src/pages/ClientesFrecuentes.test.jsx).
- Backend: [ClientesFrecuentesController.java](../ApiCoffeSoft_Java/src/main/java/com/utvt/ApiSpringCafeSoft/controller/ClientesFrecuentesController.java),
  [ClientesFrecuentesService.java](../ApiCoffeSoft_Java/src/main/java/com/utvt/ApiSpringCafeSoft/service/ClientesFrecuentesService.java),
  [ClientesFrecuentesServiceTest.java](../ApiCoffeSoft_Java/src/test/java/com/utvt/ApiSpringCafeSoft/service/ClientesFrecuentesServiceTest.java).

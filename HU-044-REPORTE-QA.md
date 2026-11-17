# Reporte QA - HU-044: Comparación de segmentos de clientes

**Responsable QA:** Sofía  
**Fecha de validación:** 13 de noviembre de 2026  
**Alcance:** CafeSoft React y ApiCoffeSoft Java.

## Criterios de aceptación

| Criterio | Validación |
|---|---|
| El administrador ve clientes correctamente clasificados. | El servicio usa cantidad de compras y fecha de última compra para clasificar en Activo, Potencial, Dormido o Poco frecuente; genera un total para cada segmento. |
| El administrador puede comparar los segmentos visualmente. | La UI muestra cuatro tarjetas con conteo y porcentaje, directorio con etiquetas, filtros y búsqueda. |
| La comparación aparece oportunamente con muchos clientes. | UI y servicio se prueban con 1,000 registros (250 por segmento) bajo un umbral local inferior a 5,000 ms. No representa un SLA de base de datos o producción. |

## Reglas y contrato

La API proporciona `GET /api/clientes/segmentos` y
`GET /api/clientes/segmentos/resumen`; ambos requieren rol ADMIN. El frontend
solicita resumen y clientes en paralelo.

Reglas verificadas en el servicio:

1. Sin compras o sin fecha de última compra: **Potencial**.
2. Última compra hace más de 90 días: **Dormido**.
3. Tres compras o más y última compra dentro de los últimos 30 días:
   **Activo**.
4. Los demás clientes con compras: **Poco frecuente**.

Los límites se comprueban con casos justo en 30, 90 y 91 días. Las reglas son
las que ya implementa la API; el negocio debe confirmar que esos umbrales son
los aprobados.

## Pruebas y ejecución

Desde `CafeSoft_React`:

```powershell
npm exec -- vitest run src/pages/SegmentacionClientes.test.jsx --coverage
npm exec -- eslint src/pages/SegmentacionClientes.jsx src/pages/SegmentacionClientes.test.jsx
```

Desde `ApiCoffeSoft_Java`:

```powershell
$env:JAVA_TOOL_OPTIONS='-Dnet.bytebuddy.experimental=true'
mvn -o "-Dtest=SegmentacionClienteServiceTest,SecurityConfigTest" test
```

| Tipo | Cobertura |
|---|---|
| Unitaria de servicio | 2 pruebas: clasificación y límites de recencia, más conteo del resumen para los cuatro segmentos. |
| Seguridad y contrato HTTP | 9 pruebas compartidas: USER recibe 403 y ADMIN obtiene los cuatro conteos y el directorio clasificado. |
| Aceptación UI | 4 pruebas de carga, comparación de conteo/porcentajes, búsqueda/filtro, actualización y respuesta 403 visible. |
| Rendimiento local | Render UI con 1,000 clientes clasificados equitativamente, y comprobación de que estén presentes 250 filas por segmento. Umbral inferior a 5,000 ms. |

## Resultados de ejecución

| Validación | Resultado |
|---|---|
| Vitest de la pantalla HU-044 | 4 pruebas aprobadas; forman parte de la suite completa, 12/12 aprobadas. |
| ESLint focalizado | Aprobado. |
| Build web | Aprobado; Vite advierte que el bundle JS es de 603.84 kB (umbral de aviso 500 kB). |
| Pruebas Java focalizadas | 11/11 aprobadas entre `SegmentacionClienteServiceTest` (2) y `SecurityConfigTest` (9). |
| Suite completa de la API | 31 pruebas; 30 aprobadas y 1 error en `ApiSpringCafeSoftApplicationTests.contextLoads` porque PostgreSQL rechaza la autenticación configurada localmente. |
| Export de la app móvil | No aplica a esta HU; el intento falló porque falta `babel-preset-expo` en la app React Native. |

Las respuestas de frontend se simulan; el servicio Java sí valida clasificación
y resumen, pero el caso de 1,000 clientes es una prueba de mapeo con proyecciones
simuladas. No mide la consulta real de PostgreSQL ni la pintura del navegador.
La suite completa de la API no pudo abrir el contexto debido al error de
autenticación de PostgreSQL. Queda pendiente aceptación integrada con backend
QA y datos representativos; el rendimiento en producción no se considera
aprobado hasta esa medición.

El cliente React Native no contiene esta pantalla administrativa; el alcance de
HU-044 corresponde al frontend web y API.
No se ejecutó una prueba E2E en navegador porque no había un servidor web/API
activo disponible en esta sesión.

## Archivos de implementación y pruebas

- Frontend: [SegmentacionClientes.jsx](./src/pages/SegmentacionClientes.jsx),
  [SegmentacionClientes.test.jsx](./src/pages/SegmentacionClientes.test.jsx).
- Backend: [SegmentacionClienteController.java](../ApiCoffeSoft_Java/src/main/java/com/utvt/ApiSpringCafeSoft/controller/SegmentacionClienteController.java),
  [SegmentacionClienteService.java](../ApiCoffeSoft_Java/src/main/java/com/utvt/ApiSpringCafeSoft/service/SegmentacionClienteService.java),
  [SegmentacionClienteServiceTest.java](../ApiCoffeSoft_Java/src/test/java/com/utvt/ApiSpringCafeSoft/service/SegmentacionClienteServiceTest.java).

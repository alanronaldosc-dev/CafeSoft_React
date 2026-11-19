# Reporte QA - HU-044: Comparación de segmentos de clientes

**Responsable QA:** Sofía
**Fecha de validación:** 19 de noviembre de 2026
**Alcance:** CafeSoft React y ApiCoffeSoft Java.

## Resumen ejecutivo

La HU-044 quedó validada con pruebas automatizadas focalizadas en el frontend:
**4 pruebas Vitest aprobadas**, ESLint aprobado y build de producción completado.
La clasificación y la seguridad de los cuatro segmentos cuentan con pruebas
unitarias y HTTP en la API.

**Estado:** APROBADA con limitaciones documentadas.

## Criterios de aceptación

| Criterio | Validación |
|---|---|
| El administrador ve clientes correctamente clasificados. | La API clasifica en Activo, Potencial, Dormido o Poco frecuente y genera el total de cada segmento. |
| El administrador puede comparar segmentos visualmente. | La UI muestra cuatro tarjetas con conteo y porcentaje, filtros y un directorio clasificado. |
| La comparación aparece oportunamente con muchos clientes. | La UI se prueba con 1,000 registros, distribuidos en 250 por segmento, con un umbral local menor a 5,000 ms. |

## Reglas y contrato

La API proporciona:

- `GET /api/clientes/segmentos`
- `GET /api/clientes/segmentos/resumen`

Ambos endpoints requieren rol ADMIN. El frontend solicita el resumen y los
clientes en paralelo.

1. Sin compras o sin fecha de última compra: **Potencial**.
2. Última compra hace más de 90 días: **Dormido**.
3. Tres compras o más y última compra dentro de los últimos 30 días:
   **Activo**.
4. Los demás clientes con compras: **Poco frecuente**.

Los límites se comprueban con casos justo en 30, 90 y 91 días.

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
| Unitaria de servicio | Clasificación, límites de recencia y conteo de los cuatro segmentos. |
| Seguridad y contrato HTTP | USER recibe 403 y ADMIN obtiene los cuatro conteos y el directorio clasificado. |
| Aceptación UI | Carga, comparación visual, filtros, búsqueda, actualización y 403 visible. |
| Rendimiento local | Render de 1,000 clientes con 250 filas por segmento y umbral menor a 5,000 ms. |

## Resultados verificables

| Comando o validación | Resultado |
|---|---|
| Vitest focalizado de SegmentacionClientes | 1 archivo aprobado y 4/4 pruebas aprobadas. |
| ESLint de implementación y pruebas | Sin errores ni advertencias. |
| Build web con Vite | Build exitoso en 536 ms. |
| Pruebas Java focalizadas | 11/11 aprobadas entre el servicio y seguridad. |
| Bundle de producción | 603.61 kB para el JavaScript; Vite advierte por superar 500 kB. |

## Evidencia funcional

Se demostró que la pantalla:

- carga los cuatro segmentos con conteos y porcentajes;
- permite filtrar por segmento y buscar clientes por nombre;
- refresca simultáneamente el resumen y el directorio;
- informa cuando el usuario no tiene el rol administrador;
- renderiza 1,000 clientes y conserva 250 registros por segmento.

La prueba de 1,000 clientes usa datos simulados. Por ello demuestra el
comportamiento de la interfaz y el listado local, pero no mide PostgreSQL,
la red ni el tiempo real de una instalación productiva.

## Hallazgos y riesgos

| Hallazgo | Impacto | Acción |
|---|---|---|
| Las reglas de 30 y 90 días deben ser confirmadas por negocio. | Riesgo de interpretación incorrecta de los límites. | Confirmar los umbrales aprobados con el dueño del producto. |
| La suite completa de la API no inicia por autenticación rechazada de PostgreSQL. | No se pudo validar el contexto completo ni el rendimiento SQL real. | Configurar credenciales QA autorizadas y ejecutar la suite completa. |
| No hay prueba E2E con servidor web/API activo. | Falta comprobar la navegación real de punta a punta. | Levantar frontend y API, iniciar sesión como ADMIN y registrar evidencia. |
| El bundle supera el umbral de advertencia de Vite. | Puede aumentar el tiempo de carga inicial. | Evaluar carga diferida o división de módulos. |

## Archivos relacionados

- Frontend: [SegmentacionClientes.jsx](./src/pages/SegmentacionClientes.jsx)
- Prueba frontend: [SegmentacionClientes.test.jsx](./src/pages/SegmentacionClientes.test.jsx)
- Backend: `ApiCoffeSoft_Java/src/main/java/com/utvt/ApiSpringCafeSoft/controller/SegmentacionClienteController.java`
- Servicio: `ApiCoffeSoft_Java/src/main/java/com/utvt/ApiSpringCafeSoft/service/SegmentacionClienteService.java`
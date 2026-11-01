# React + Vite

## HU-023: Canje de puntos en el pago

La pantalla de carrito integra la API de fidelización:

- `GET /clientes` debe incluir `saldoPuntos` (entero no negativo) en cada cliente.
- El canje configurado es de 5 puntos por $1.00 MXN; la cotización limita el
  descuento al total de compra y devuelve el número exacto de puntos consumibles.
- `POST /clientes/{id}/beneficios/cotizaciones` recibe
  `{ "puntosSolicitados": number, "totalCompra": number }` y responde con
  `{ "puntosCanjeados": number, "descuento": number }`. La cotización no debe
  consumir puntos.
- `POST /ventas` recibe `clienteId`, `puntosCanjeados` y `descuento` junto con
  los campos existentes. Debe guardar la venta y descontar puntos en una sola
  operación, y responder con `saldoPuntosRestante`.

La automatización Selenium necesita la aplicación y una API que implemente ese
contrato, un usuario autorizado y Chrome instalado. Configura `APP_BASE_URL`,
`VITE_API_URL` con la URL base de la API QA (por ejemplo,
`http://localhost:8080/api`), `TEST_EMAIL` y `TEST_PASSWORD` de un usuario
administrador, luego ejecuta `npm run test:e2e`. Reinicia Vite después de
cambiar `VITE_API_URL`. Opcionalmente,
`TEST_CLIENT_NAME` y `TEST_PRODUCT_NAME` fijan el cliente y producto de prueba;
si se omiten, el test elige el primer cliente activo con puntos disponibles y
el primer producto mostrado. El test realiza una venta real,
por lo que solo debe ejecutarse con datos de prueba. Genera capturas
`01-cliente-seleccionado.png` a `04-saldo-actualizado-en-ficha.png` dentro de
`tests/evidence` (o el directorio indicado en `EVIDENCE_DIR`).

Para generar evidencia local de la interfaz sin consumir puntos ni registrar
ventas en QA, inicia `node tests/e2e/mock-loyalty-api.js` y Vite con
`VITE_API_URL=http://127.0.0.1:9090/api`, luego ejecuta
`npm run test:e2e:mock` con `APP_BASE_URL=http://localhost:5174/` y credenciales
de prueba cualesquiera. Esta variante valida la interfaz con API simulada; no
sustituye la validación integrada contra el backend de QA.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

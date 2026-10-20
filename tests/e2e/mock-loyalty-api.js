import { createServer } from "node:http";
import process from "node:process";

const port = Number(process.env.MOCK_API_PORT || 9090);
const pointsPerPeso = 5;
const client = {
  id: 560023,
  nombre: "Cliente QA HU-023",
  activo: true,
  saldoPuntos: 500,
  domicilio: "Datos simulados de prueba",
  frecuencia: "Semanal",
  precioPorGarrafon: 0,
};

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
};

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url, `http://localhost:${port}`);

  if (request.method === "POST" && url.pathname === "/api/usuarios/login") {
    sendJson(response, 200, {
      usuario: { id: 1, idUsuario: 1, nombre: "Tester HU-023", userTipo: 0 },
      token: "local-e2e-test-token",
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/productos") {
    sendJson(response, 200, [
      { id: 23001, nombre: "Producto de prueba HU-023", precio: 150, categoriaId: 1 },
    ]);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/categorias/activas") {
    sendJson(response, 200, []);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/clientes") {
    sendJson(response, 200, [client]);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === `/api/clientes/${client.id}/beneficios/cotizaciones`
  ) {
    const body = await readJson(request);
    const points = Number(body.puntosSolicitados);
    const total = Number(body.totalCompra);
    if (!Number.isInteger(points) || points <= 0 || points > client.saldoPuntos) {
      sendJson(response, 400, { message: "Saldo de puntos insuficiente." });
      return;
    }

    const redeemablePoints = Math.min(points, Math.floor(total * pointsPerPeso));
    sendJson(response, 200, {
      puntosCanjeados: redeemablePoints,
      descuento: Number((redeemablePoints / pointsPerPeso).toFixed(2)),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ventas") {
    const body = await readJson(request);
    const points = Number(body.puntosCanjeados || 0);
    if (
      (points > 0 && Number(body.clienteId) !== client.id) ||
      points > client.saldoPuntos
    ) {
      sendJson(response, 400, { message: "No se pudo confirmar el canje simulado." });
      return;
    }

    client.saldoPuntos -= points;
    const subtotal = body.detalles.reduce(
      (sum, detail) => sum + detail.precioUnitario * detail.cantidad,
      0
    );
    const impuestos = subtotal * 0.16;
    const total = subtotal + impuestos - Number(body.descuento || 0);
    sendJson(response, 201, {
      folio: "TEST-HU023",
      total,
      metodoPago: body.metodoPago,
      nombreCliente: body.nombreCliente,
      estadoPedido: "PENDIENTE",
      cambio: 0,
      saldoPuntosRestante: client.saldoPuntos,
    });
    return;
  }

  sendJson(response, 404, { message: `Ruta simulada no encontrada: ${url.pathname}` });
});

function readJson(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

server.listen(port, "127.0.0.1", () => {
  console.log(`HU-023 mock API ready at http://127.0.0.1:${port}/api`);
});

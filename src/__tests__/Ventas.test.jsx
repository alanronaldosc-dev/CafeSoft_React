import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import Ventas from "../pages/Ventas";
import api from "../services/api";

vi.mock("../services/api", () => ({ default: { get: vi.fn() } }));
vi.mock("../components/PatronesConsumo", () => ({
  default: ({ modo }) => <div data-testid="reporte-patrones">Reporte seleccionado: {modo}</div>,
}));
// Los componentes hijos tienen sus propias pruebas. Aquí comprobamos su integración.
vi.mock("../components/DashboardVentas", () => ({
  default: ({ datos, cargando, error, periodo, periodos, onCambiarPeriodo }) => (
    <div data-testid="dashboard-ventas">
      <span>Periodo actual: {periodo}</span>
      {periodos.map(({ id, etiqueta }) => (
        <button key={id} type="button" onClick={() => onCambiarPeriodo(id)}>{etiqueta}</button>
      ))}
      {cargando && <span>Cargando dashboard</span>}
      {error && <span role="alert">{error}</span>}
      {datos && <span>Resumen total: {datos.montoTotal}</span>}
    </div>
  ),
}));
vi.mock("../components/ProductosMasVendidos", () => ({
  default: ({ productos, cargando, error }) => (
    <div data-testid="productos-mas-vendidos">
      {cargando && <span>Cargando productos</span>}
      {error && <span role="alert">{error}</span>}
      {productos.map((p) => <span key={p.productoId}>{p.nombre}</span>)}
    </div>
  ),
}));

const usuario = { id: 1, nombre: "Administrador", sucursalId: 1 };
const ventasEjemplo = [
  { id: 1, folio: "VEN-001", sucursalId: 1, fecha: "2026-11-18T10:00:00", subtotal: 100, impuestos: 16, total: 116, metodoPago: "Efectivo", cambio: 4, usuarioNombre: "Uriel", sucursalNombre: "Sucursal Centro", clienteFidelidadId: 5, puntosGenerados: 10 },
  { id: 2, folio: "VEN-002", sucursalId: 2, fecha: "2026-11-18T11:00:00", subtotal: 200, impuestos: 32, total: 232, metodoPago: "Tarjeta", cambio: 0, usuarioNombre: "Otro cajero", sucursalNombre: "Otra sucursal" },
];
const productosEjemplo = [
  { productoId: 1, nombre: "Café americano", unidadesVendidas: 10, montoTotal: 300 },
  { productoId: 2, nombre: "Capuchino", unidadesVendidas: 8, montoTotal: 320 },
  { productoId: 3, nombre: "Latte", unidadesVendidas: 6, montoTotal: 240 },
  { productoId: 4, nombre: "Moka", unidadesVendidas: 5, montoTotal: 250 },
  { productoId: 5, nombre: "Espresso", unidadesVendidas: 4, montoTotal: 120 },
  { productoId: 6, nombre: "Chocolate", unidadesVendidas: 3, montoTotal: 135 },
];
const dashboardEjemplo = {
  periodoEtiqueta: "Hoy", sucursalNombre: "Sucursal Centro", numeroVentas: 5,
  montoTotal: 580, subtotal: 500, impuestos: 80,
  desglosePorDia: [{ fecha: "2026-11-18", numeroVentas: 5, montoTotal: 580 }],
  desglosePorMetodoPago: [
    { metodoPago: "Efectivo", numeroVentas: 3, montoTotal: 350 },
    { metodoPago: "Tarjeta", numeroVentas: 2, montoTotal: 230 },
  ],
  topProductos: productosEjemplo,
};
function configurarApi({ ventas = ventasEjemplo, dashboard = dashboardEjemplo } = {}) {
  api.get.mockImplementation((url) => {
    if (url === "/ventas") return Promise.resolve({ data: ventas });
    if (url.startsWith("/ventas/dashboard?periodo=")) return Promise.resolve({ data: dashboard });
    return Promise.reject(new Error(`Ruta inesperada: ${url}`));
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  configurarApi();
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("HU-045 y HU-046: Navegación de ventas", () => {
  it("muestra el panel principal de ventas", async () => {
    render(<Ventas usuario={usuario} />);
    expect(screen.getByRole("heading", { name: "Panel de ventas" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Secciones de ventas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Por horario/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Por día/i })).toBeInTheDocument();
    expect(await screen.findByText("VEN-001")).toBeInTheDocument();
  });
  it("abre el reporte de ventas por horario", () => {
    render(<Ventas usuario={usuario} />);
    fireEvent.click(screen.getByRole("button", { name: /Por horario/i }));
    expect(screen.getByTestId("reporte-patrones")).toHaveTextContent("Reporte seleccionado: horarios");
    expect(screen.getByRole("button", { name: /Por horario/i })).toHaveAttribute("aria-pressed", "true");
  });
  it("abre el reporte de consumo diario", () => {
    render(<Ventas usuario={usuario} />);
    fireEvent.click(screen.getByRole("button", { name: /Por día/i }));
    expect(screen.getByTestId("reporte-patrones")).toHaveTextContent("Reporte seleccionado: diarios");
    expect(screen.getByRole("button", { name: /Por día/i })).toHaveAttribute("aria-pressed", "true");
  });
  it("permite regresar al panel de ventas", () => {
    render(<Ventas usuario={usuario} />);
    fireEvent.click(screen.getByRole("button", { name: /Por horario/i }));
    expect(screen.getByTestId("reporte-patrones")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Resumen general/i }));
    expect(screen.queryByTestId("reporte-patrones")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resumen general/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("dashboard-ventas")).toBeInTheDocument();
  });
});

describe("Panel principal de ventas", () => {
  it("consulta ventas y el dashboard unificado", async () => {
    render(<Ventas usuario={usuario} />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/ventas");
      expect(api.get).toHaveBeenCalledWith("/ventas/dashboard?periodo=hoy");
    });
    expect(api.get).toHaveBeenCalledTimes(2);
  });
  it("filtra las ventas por sucursal", async () => {
    render(<Ventas usuario={usuario} />);
    expect(await screen.findByText("VEN-001")).toBeInTheDocument();
    expect(screen.queryByText("VEN-002")).not.toBeInTheDocument();
  });
  it("muestra el resumen económico y el desglose", async () => {
    render(<Ventas usuario={usuario} />);
    expect(await screen.findByText("Resumen total: 580")).toBeInTheDocument();
    expect(screen.getByText("Desglose del periodo", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("2026-11-18")).toBeInTheDocument();
  });
  it("cambia el periodo a Este mes", async () => {
    render(<Ventas usuario={usuario} />);
    fireEvent.click(screen.getByRole("button", { name: "Este mes" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/ventas/dashboard?periodo=mes"));
  });
  it("cambia el periodo a Mes anterior", async () => {
    render(<Ventas usuario={usuario} />);
    fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/ventas/dashboard?periodo=mes_anterior"));
  });
  it("envía los productos del dashboard al componente de ranking", async () => {
    render(<Ventas usuario={usuario} />);
    expect(await screen.findByText("Café americano")).toBeInTheDocument();
    expect(screen.getByText("Capuchino")).toBeInTheDocument();
    expect(screen.getByText("Latte")).toBeInTheDocument();
  });
  it("incluye todos los productos recibidos del dashboard", async () => {
    render(<Ventas usuario={usuario} />);
    expect(await screen.findByText("Chocolate")).toBeInTheDocument();
    expect(screen.getByTestId("productos-mas-vendidos")).toBeInTheDocument();
  });
  it("muestra un mensaje cuando no hay ventas", async () => {
    configurarApi({ ventas: [], dashboard: { ...dashboardEjemplo, numeroVentas: 0, montoTotal: 0, desglosePorDia: [], desglosePorMetodoPago: [], topProductos: [] } });
    render(<Ventas usuario={usuario} />);
    expect(await screen.findByText(/No hay ventas registradas/)).toBeInTheDocument();
  });
  it("muestra error si no existe sucursal asignada", async () => {
    render(<Ventas usuario={{ id: 1, sucursalId: null }} />);
    expect(await screen.findByText(/no tiene una sucursal asignada/)).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/ventas");
  });
  it("muestra error cuando falla la consulta de ventas", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockImplementation((url) => url === "/ventas" ? Promise.reject(new Error("Error de conexión")) : Promise.resolve({ data: dashboardEjemplo }));
    render(<Ventas usuario={usuario} />);
    expect(await screen.findByText(/No se pudieron cargar las ventas/i)).toBeInTheDocument();
  });
  it("muestra el error del dashboard y lo comunica a productos", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockImplementation((url) => url === "/ventas" ? Promise.resolve({ data: [] }) : Promise.reject({ response: { data: { mensaje: "Servicio no disponible" } } }));
    render(<Ventas usuario={usuario} />);
    await waitFor(() => expect(screen.getAllByRole("alert").filter((e) => e.textContent.includes("Servicio no disponible"))).toHaveLength(2));
  });
});

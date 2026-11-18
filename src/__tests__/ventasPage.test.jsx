import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import api from "../services/api";
import Ventas from "../pages/Ventas";

vi.mock("../services/api", () => ({ default: { get: vi.fn() } }));

// ── Fixtures ──

const USUARIO = { id: 7, nombre: "Ana", sucursalId: 1, sucursalNombre: "Bonafont" };

const DASHBOARD = {
  periodo: "hoy",
  periodoEtiqueta: "16 de noviembre de 2026",
  sucursalNombre: "Bonafont",
  numeroVentas: 4,
  montoTotal: 1400,
  subtotal: 1206.9,
  impuestos: 193.1,
  ticketPromedio: 350,
  diasConVentas: 1,
  desglosePorDia: [{ fecha: "2026-11-16", numeroVentas: 4, montoTotal: 1400 }],
  desglosePorMetodoPago: [{ metodoPago: "efectivo", numeroVentas: 4, montoTotal: 1400 }],
  topProductos: [
    { productoId: 1, nombre: "Garrafón 20L", unidadesVendidas: 2, montoTotal: 700 },
  ],
  actualizadoEn: "2026-11-16T10:30:00",
};

const VENTAS = [
  {
    id: 1,
    folio: "V-001",
    sucursalId: 1,
    sucursalNombre: "Bonafont",
    clienteFidelidadId: 9,
    puntosGenerados: 5,
    fecha: "2026-11-16T09:00:00",
    subtotal: 603.45,
    impuestos: 96.55,
    total: 700,
    metodoPago: "efectivo",
    cambio: 50,
    usuarioNombre: "Ana",
  },
  {
    id: 2,
    folio: "V-002",
    sucursalId: 2,
    sucursalNombre: null,
    clienteFidelidadId: null,
    fecha: "2026-11-16T10:00:00",
    subtotal: 100,
    impuestos: 16,
    total: 116,
    metodoPago: "tarjeta",
    cambio: null,
    usuarioNombre: "Luis",
  },
  {
    id: 3,
    folio: "V-003",
    sucursalId: 1,
    sucursalNombre: null,
    clienteFidelidadId: null,
    fecha: "2026-11-16T11:00:00",
    subtotal: 200,
    impuestos: 32,
    total: 232,
    metodoPago: "transferencia",
    cambio: null,
    usuarioNombre: "Ana",
  },
];

/**
 * Configura el mock de la API.
 * El endpoint del dashboard recibe ?periodo=... y devuelve el fixture
 * con el periodo solicitado, para comprobar que se refetchea.
 */
function configurarApi({
  ventas = VENTAS,
  dashboard = DASHBOARD,
  falloVentas = null,
  falloDashboard = null,
} = {}) {
  api.get.mockImplementation((url) => {
    if (url.startsWith("/ventas/dashboard")) {
      if (falloDashboard) return Promise.reject(falloDashboard);
      const periodo = new URLSearchParams(url.split("?")[1]).get("periodo");
      return Promise.resolve({ data: { ...dashboard, periodo } });
    }
    if (falloVentas) return Promise.reject(falloVentas);
    return Promise.resolve({ data: ventas });
  });
}

beforeEach(() => {
  api.get.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── HU-041 / HU-042: página "Ver ventas" ──

describe("Ventas (HU-041 / HU-042)", () => {
  it("muestra el dashboard del periodo y el desglose del reporte", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    expect(await screen.findByText("Ventas del periodo")).toBeInTheDocument();
    expect(screen.getAllByText("$1,400.00").length).toBeGreaterThan(0);
    expect(screen.getByText("16 de noviembre de 2026")).toBeInTheDocument();

    // Desglose diario y por método de pago (HU-016).
    expect(screen.getByText("📅 Ventas por día")).toBeInTheDocument();
    expect(screen.getByText("2026-11-16")).toBeInTheDocument();
    expect(screen.getByText("💳 Ventas por método de pago")).toBeInTheDocument();
    expect(screen.getAllByText("efectivo").length).toBeGreaterThan(0);
  });

  it("consulta el dashboard del periodo seleccionado", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");
    expect(api.get).toHaveBeenCalledWith("/ventas/dashboard?periodo=hoy");
  });

  it("vuelve a consultar el dashboard al cambiar el periodo", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");
    fireEvent.click(screen.getByRole("button", { name: "Este mes" }));

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/ventas/dashboard?periodo=mes"),
    );
  });

  it("solo lista las ventas de la sucursal del usuario", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("V-001");
    expect(screen.queryByText("V-002")).toBeNull();

    // Venta con cliente frecuente: muestra los puntos generados.
    expect(screen.getByText("+5 (cliente #9)")).toBeInTheDocument();
    // Venta sin cliente y sin cambio: usa los valores por defecto.
    const fila = screen.getByText("V-003").closest("tr");
    expect(within(fila).getByText("Sin cliente asociado")).toBeInTheDocument();
    expect(within(fila).getAllByText("—")).toHaveLength(2);
  });

  it("avisa cuando la cuenta no tiene sucursal asignada", async () => {
    configurarApi();
    render(<Ventas usuario={{ id: 7, nombre: "Ana" }} />);

    expect(
      await screen.findByText(/no tiene una sucursal asignada/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hay ventas registradas para esta sucursal."),
    ).toBeInTheDocument();
    // El dashboard sí se carga, porque el endpoint resuelve la sucursal por token.
    expect(screen.getByText("Ventas del periodo")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/ventas");
  });

  it("muestra el mensaje de error que devuelve el dashboard", async () => {
    configurarApi({
      falloDashboard: { response: { data: { mensaje: "Periodo no válido." } } },
    });
    render(<Ventas usuario={USUARIO} />);

    const alertas = await screen.findAllByRole("alert");
    expect(
      alertas.some((a) => a.textContent.includes("Periodo no válido.")),
    ).toBe(true);
  });

  it("usa un mensaje genérico si el dashboard falla sin respuesta del servidor", async () => {
    configurarApi({ falloDashboard: new Error("offline") });
    render(<Ventas usuario={USUARIO} />);

    const alertas = await screen.findAllByRole("alert");
    expect(
      alertas.some((a) =>
        a.textContent.includes("No se pudo cargar el dashboard."),
      ),
    ).toBe(true);
  });

  it("avisa cuando no se pudo cargar el detalle de ventas", async () => {
    configurarApi({ falloVentas: new Error("500") });
    render(<Ventas usuario={USUARIO} />);

    expect(
      await screen.findByText(/No se pudieron cargar las ventas/i),
    ).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando el periodo no tiene ventas", async () => {
    configurarApi({
      ventas: [],
      dashboard: {
        ...DASHBOARD,
        desglosePorDia: [],
        desglosePorMetodoPago: [],
        topProductos: [],
      },
    });
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");
    expect(screen.getAllByText("Sin ventas en el periodo.")).toHaveLength(2);
    expect(
      screen.getByText("No hay ventas registradas para esta sucursal."),
    ).toBeInTheDocument();
    expect(screen.getByText(/El ranking aparecerá/i)).toBeInTheDocument();
  });
});

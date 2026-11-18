import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import api from "../services/api";
import Ventas from "../pages/Ventas";

vi.mock("../services/api", () => ({ default: { get: vi.fn() } }));

const USUARIO = {
  id: 7,
  nombre: "Ana",
  sucursalId: 1,
};

const REPORTE = {
  periodo: "hoy",
  periodoEtiqueta: "16 de noviembre de 2026",
  sucursalNombre: "Bonafont",
  numeroVentas: 4,
  montoTotal: 1400,
  subtotal: 1206.9,
  impuestos: 193.1,
  desglosePorDia: [
    { fecha: "2026-11-16", numeroVentas: 4, montoTotal: 1400 },
  ],
  desglosePorMetodoPago: [
    { metodoPago: "efectivo", numeroVentas: 4, montoTotal: 1400 },
  ],
};

const PRODUCTOS = [
  {
    productoId: 1,
    nombre: "Garrafón 20L",
    unidadesVendidas: 8,
    montoTotal: 400,
  },
  {
    productoId: 2,
    nombre: "Botella 1L",
    unidadesVendidas: 20,
    montoTotal: 300,
  },
];

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
    fecha: "2026-11-16T10:00:00",
    subtotal: 100,
    impuestos: 16,
    total: 116,
    metodoPago: "tarjeta",
    usuarioNombre: "Luis",
  },
];

function configurarApi({
  ventas = VENTAS,
  reporte = REPORTE,
  productos = PRODUCTOS,
  falloVentas = null,
  falloReporte = null,
  falloProductos = null,
} = {}) {
  api.get.mockImplementation((url) => {
    if (url === "/ventas") {
      return falloVentas
        ? Promise.reject(falloVentas)
        : Promise.resolve({ data: ventas });
    }

    if (url.startsWith("/ventas/reporte/top-productos?")) {
      return falloProductos
        ? Promise.reject(falloProductos)
        : Promise.resolve({ data: productos });
    }

    if (url.startsWith("/ventas/reporte?")) {
      return falloReporte
        ? Promise.reject(falloReporte)
        : Promise.resolve({ data: reporte });
    }

    return Promise.reject(new Error(`Endpoint inesperado: ${url}`));
  });
}

beforeEach(() => {
  api.get.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Ventas (HU-050)", () => {
  it("muestra el dashboard, el desglose y los productos del periodo", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    expect(await screen.findByText("Ventas del periodo")).toBeInTheDocument();
    expect(screen.getAllByText("$1,400.00").length).toBeGreaterThan(0);
    expect(screen.getByText("$350.00")).toBeInTheDocument();
    expect(screen.getAllByText("16 de noviembre de 2026").length).toBeGreaterThan(0);

    expect(screen.getByText("📅 Ventas por día")).toBeInTheDocument();
    expect(screen.getByText("2026-11-16")).toBeInTheDocument();
    expect(screen.getByText("💳 Ventas por método de pago")).toBeInTheDocument();

    expect(screen.getAllByText("Garrafón 20L").length).toBeGreaterThan(0);
    expect(screen.getByText("V-001")).toBeInTheDocument();
    expect(screen.queryByText("V-002")).not.toBeInTheDocument();

    const fila = screen.getByText("V-001").closest("tr");
    expect(within(fila).getByText("+5 (cliente #9)")).toBeInTheDocument();
  });

  it("consulta los endpoints de reporte y productos con el periodo inicial", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");

    expect(api.get).toHaveBeenCalledWith("/ventas/reporte?periodo=hoy");
    expect(api.get).toHaveBeenCalledWith(
      "/ventas/reporte/top-productos?periodo=hoy"
    );
  });

  it("actualiza el reporte y los productos al seleccionar otro periodo", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");
    fireEvent.click(screen.getByRole("button", { name: "Esta semana" }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/ventas/reporte?periodo=semana");
      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte/top-productos?periodo=semana"
      );
    });
  });

  it("aplica un rango personalizado a ambos endpoints", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");
    fireEvent.click(screen.getByRole("button", { name: "Personalizado" }));

    fireEvent.change(screen.getByLabelText("Fecha inicial del reporte"), {
      target: { value: "2026-11-01" },
    });
    fireEvent.change(screen.getByLabelText("Fecha final del reporte"), {
      target: { value: "2026-11-18" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Aplicar período" }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte?periodo=personalizado&desde=2026-11-01&hasta=2026-11-18"
      );
      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte/top-productos?periodo=personalizado&desde=2026-11-01&hasta=2026-11-18"
      );
    });
  });

  it("impide aplicar un rango personalizado sin fechas", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");
    fireEvent.click(screen.getByRole("button", { name: "Personalizado" }));

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Selecciona una fecha inicial y una fecha final.");

    expect(
      screen.getByRole("button", { name: "Aplicar período" }),
    ).toBeDisabled();

    expect(api.get).not.toHaveBeenCalledWith(
      expect.stringContaining("periodo=personalizado")
    );
  });

  it("impide aplicar un rango donde la fecha inicial es posterior a la final", async () => {
    configurarApi();
    render(<Ventas usuario={USUARIO} />);

    await screen.findByText("Ventas del periodo");
    fireEvent.click(screen.getByRole("button", { name: "Personalizado" }));

    fireEvent.change(screen.getByLabelText("Fecha inicial del reporte"), {
      target: { value: "2026-11-20" },
    });
    fireEvent.change(screen.getByLabelText("Fecha final del reporte"), {
      target: { value: "2026-11-18" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "La fecha inicial no puede ser posterior a la fecha final."
    );
    expect(
      screen.getByRole("button", { name: "Aplicar período" }),
    ).toBeDisabled();
  });

  it("muestra el mensaje de error devuelto por el reporte", async () => {
    configurarApi({
      falloReporte: {
        response: { data: { mensaje: "Periodo no válido." } },
      },
    });

    render(<Ventas usuario={USUARIO} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Periodo no válido."
    );
  });

  it("muestra un mensaje si falla la consulta de productos", async () => {
    configurarApi({
      falloProductos: new Error("Error de conexión"),
    });

    render(<Ventas usuario={USUARIO} />);

    const alertas = await screen.findAllByRole("alert");
    expect(
      alertas.some((alerta) =>
        alerta.textContent.includes("No se pudo cargar el ranking de productos.")
      )
    ).toBe(true);
  });

  it("muestra un aviso cuando falla la carga del detalle de ventas", async () => {
    configurarApi({
      falloVentas: new Error("Error de conexión"),
    });

    render(<Ventas usuario={USUARIO} />);

    const alertas = await screen.findAllByRole("alert");
    expect(
      alertas.some((alerta) =>
        alerta.textContent.includes("No se pudieron cargar las ventas.")
      )
    ).toBe(true);
  });

  it("avisa cuando el usuario no tiene sucursal asignada", async () => {
    configurarApi();
    render(<Ventas usuario={{ id: 7, nombre: "Ana" }} />);

    expect(
      await screen.findByText(/no tiene una sucursal asignada/i),
    ).toBeInTheDocument();

    expect(api.get).not.toHaveBeenCalledWith("/ventas");
  });

  it("muestra los estados vacíos cuando no existen ventas ni productos", async () => {
    configurarApi({
      ventas: [],
      productos: [],
      reporte: {
        ...REPORTE,
        numeroVentas: 0,
        montoTotal: 0,
        desglosePorDia: [],
        desglosePorMetodoPago: [],
      },
    });

    render(<Ventas usuario={USUARIO} />);

    expect(
      await screen.findByText("Sin ventas registradas en el periodo. La tendencia aparecerá cuando se registre la primera venta."),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/El ranking aparecerá cuando se registre la primera venta/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText("No hay ventas registradas para esta sucursal."),
    ).toBeInTheDocument();
  });
});
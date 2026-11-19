
import React from "react";
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";

import Ventas from "../pages/Ventas";
import api from "../services/api";

// Simular las solicitudes al backend
vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Simular el componente de reportes.
// Sus funcionalidades ya se prueban en
// PatronesConsumo.test.jsx.
vi.mock("../components/PatronesConsumo", () => ({
  default: ({ modo }) => (
    <div data-testid="reporte-patrones">
      Reporte seleccionado: {modo}
    </div>
  ),
}));

const usuario = {
  id: 1,
  nombre: "Administrador",
  sucursalId: 1,
};

const ventasEjemplo = [
  {
    id: 1,
    folio: "VEN-001",
    sucursalId: 1,
    fecha: "2026-11-18T10:00:00",
    subtotal: 100,
    impuestos: 16,
    total: 116,
    metodoPago: "Efectivo",
    cambio: 4,
    usuarioNombre: "Uriel",
    sucursalNombre: "Sucursal Centro",
    clienteFidelidadId: 5,
    puntosGenerados: 10,
  },
  {
    id: 2,
    folio: "VEN-002",
    sucursalId: 2,
    fecha: "2026-11-18T11:00:00",
    subtotal: 200,
    impuestos: 32,
    total: 232,
    metodoPago: "Tarjeta",
    cambio: 0,
    usuarioNombre: "Otro cajero",
    sucursalNombre: "Otra sucursal",
  },
];

const reporteEjemplo = {
  periodoEtiqueta: "Hoy",
  sucursalNombre: "Sucursal Centro",
  numeroVentas: 5,
  montoTotal: 580,
  subtotal: 500,
  impuestos: 80,
  desglosePorDia: [
    {
      fecha: "2026-11-18",
      numeroVentas: 5,
      montoTotal: 580,
    },
  ],
  desglosePorMetodoPago: [
    {
      metodoPago: "Efectivo",
      numeroVentas: 3,
      montoTotal: 350,
    },
    {
      metodoPago: "Tarjeta",
      numeroVentas: 2,
      montoTotal: 230,
    },
  ],
};

const productosEjemplo = [
  {
    productoId: 1,
    nombre: "Café americano",
    unidadesVendidas: 10,
    montoTotal: 300,
  },
  {
    productoId: 2,
    nombre: "Capuchino",
    unidadesVendidas: 8,
    montoTotal: 320,
  },
  {
    productoId: 3,
    nombre: "Latte",
    unidadesVendidas: 6,
    montoTotal: 240,
  },
  {
    productoId: 4,
    nombre: "Moka",
    unidadesVendidas: 5,
    montoTotal: 250,
  },
  {
    productoId: 5,
    nombre: "Espresso",
    unidadesVendidas: 4,
    montoTotal: 120,
  },
  {
    productoId: 6,
    nombre: "Chocolate",
    unidadesVendidas: 3,
    montoTotal: 135,
  },
];

// Configurar respuestas del backend
function configurarApi({
  ventas = ventasEjemplo,
  reporte = reporteEjemplo,
  productos = productosEjemplo,
} = {}) {
  api.get.mockImplementation((url) => {
    if (url === "/ventas") {
      return Promise.resolve({
        data: ventas,
      });
    }

    if (url.startsWith(
      "/ventas/reporte/top-productos"
    )) {
      return Promise.resolve({
        data: productos,
      });
    }

    if (url.startsWith(
      "/ventas/reporte?periodo="
    )) {
      return Promise.resolve({
        data: reporte,
      });
    }

    return Promise.reject(
      new Error(`Ruta inesperada: ${url}`)
    );
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  configurarApi();

  vi.spyOn(console, "log")
    .mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HU-045 y HU-046: Navegación de ventas", () => {

  it("muestra el panel principal de ventas", async () => {
    render(<Ventas usuario={usuario} />);

    expect(
      screen.getByRole("heading", {
        name: "Panel de ventas",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("navigation", {
        name: "Secciones de ventas",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Por horario/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Por día/i,
      })
    ).toBeInTheDocument();

    await screen.findByText("VEN-001");
  });

  it("abre el reporte de ventas por horario", async () => {
    render(<Ventas usuario={usuario} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Por horario/i,
      })
    );

    expect(
      screen.getByTestId("reporte-patrones")
    ).toHaveTextContent(
      "Reporte seleccionado: horarios"
    );

    expect(
      screen.getByRole("button", {
        name: /Por horario/i,
      })
    ).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("abre el reporte de consumo diario", async () => {
    render(<Ventas usuario={usuario} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Por día/i,
      })
    );

    expect(
      screen.getByTestId("reporte-patrones")
    ).toHaveTextContent(
      "Reporte seleccionado: diarios"
    );

    expect(
      screen.getByRole("button", {
        name: /Por día/i,
      })
    ).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("permite regresar al panel de ventas", async () => {
    render(<Ventas usuario={usuario} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Por horario/i,
      })
    );

    expect(
      screen.getByTestId("reporte-patrones")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Resumen general/i,
      })
    );

    expect(
      screen.queryByTestId("reporte-patrones")
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Resumen general/i,
      })
    ).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});

describe("Panel principal de ventas", () => {

  it("consulta los tres endpoints principales", async () => {
    render(<Ventas usuario={usuario} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/ventas"
      );

      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte?periodo=hoy"
      );

      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte/top-productos?periodo=hoy"
      );
    });
  });

  it("filtra las ventas por sucursal", async () => {
    render(<Ventas usuario={usuario} />);

    expect(
      await screen.findByText("VEN-001")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("VEN-002")
    ).not.toBeInTheDocument();
  });

  it("muestra el resumen económico", async () => {
    render(<Ventas usuario={usuario} />);

    expect(
      (await screen.findAllByText("$580.00")).length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("$500.00").length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("$80.00").length
    ).toBeGreaterThan(0);
  });

  it("cambia el periodo a Este mes", async () => {
    render(<Ventas usuario={usuario} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Este mes",
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte?periodo=mes"
      );

      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte/top-productos?periodo=mes"
      );
    });
  });

  it("cambia el periodo a Mes anterior", async () => {
    render(<Ventas usuario={usuario} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mes anterior",
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte?periodo=mes_anterior"
      );
    });
  });

  it("muestra los productos más vendidos", async () => {
    const { container } = render(<Ventas usuario={usuario} />);

    await waitFor(() => {
      expect(container.querySelector(".tabla-productos")).not.toBeNull();
    });

    const tabla = within(container.querySelector(".tabla-productos"));
    expect(tabla.getByText("Café americano")).toBeInTheDocument();
    expect(tabla.getByText("Capuchino")).toBeInTheDocument();
    expect(tabla.getByText("Latte")).toBeInTheDocument();
  });

  it("permite ver todos los productos", async () => {
    const { container } = render(<Ventas usuario={usuario} />);

    await waitFor(() => {
      expect(container.querySelector(".tabla-productos")).not.toBeNull();
    });

    const tabla = within(container.querySelector(".tabla-productos"));
    expect(tabla.queryByText("Chocolate")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Ver todos los productos/i })
    );

    expect(tabla.getByText("Chocolate")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Mostrar solo top 5/i })
    );

    expect(tabla.queryByText("Chocolate")).not.toBeInTheDocument();
  });

  it("muestra un mensaje cuando no hay ventas", async () => {
    configurarApi({
      ventas: [],
      productos: [],
      reporte: {
        ...reporteEjemplo,
        numeroVentas: 0,
        montoTotal: 0,
        desglosePorDia: [],
        desglosePorMetodoPago: [],
      },
    });

    render(<Ventas usuario={usuario} />);

    expect(
      await screen.findByText(
        /No hay ventas registradas/
      )
    ).toBeInTheDocument();
  });

  it("muestra error si no existe sucursal asignada", async () => {
    render(
      <Ventas
        usuario={{
          id: 1,
          sucursalId: null,
        }}
      />
    );

    expect(
      await screen.findByText(
        /no tiene una sucursal asignada/
      )
    ).toBeInTheDocument();

    expect(api.get).not.toHaveBeenCalledWith(
      "/ventas"
    );
  });

  it("muestra error cuando falla la consulta de ventas", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url === "/ventas") {
        return Promise.reject(
          new Error("Error de conexión")
        );
      }

      if (url.includes("top-productos")) {
        return Promise.resolve({
          data: [],
        });
      }

      return Promise.resolve({
        data: reporteEjemplo,
      });
    });

    render(<Ventas usuario={usuario} />);

    expect(
      await screen.findByText(
        /No se pudieron cargar las ventas/i
      )
    ).toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it("muestra errores de reportes y productos", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url === "/ventas") {
        return Promise.resolve({
          data: [],
        });
      }

      return Promise.reject({
        response: {
          data: {
            mensaje: "Servicio no disponible",
          },
        },
      });
    });

    render(<Ventas usuario={usuario} />);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Servicio no disponible",
          { exact: false }
        )
      ).toBeTruthy();
    });

    errorSpy.mockRestore();
  });
});

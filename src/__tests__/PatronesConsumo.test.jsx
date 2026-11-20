
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
} from "@testing-library/react";

import PatronesConsumo from "../components/PatronesConsumo";
import api from "../services/api";
import { exportarPatronesExcel } from "../utils/exportarPatronesExcel";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../utils/exportarPatronesExcel", () => ({
  exportarPatronesExcel: vi.fn(),
}));

const reporteEjemplo = {
  sucursalNombre: "Sucursal Centro",
  numeroVentas: 12,
  montoTotal: 950,
  franjas: [
    {
      hora: 8,
      franja: "08:00",
      numeroVentas: 3,
      montoTotal: 200,
    },
    {
      hora: 10,
      franja: "10:00",
      numeroVentas: 7,
      montoTotal: 500,
    },
    {
      hora: 15,
      franja: "15:00",
      numeroVentas: 2,
      montoTotal: 250,
    },
  ],
  dias: [
    {
      fecha: "2026-11-16",
      diaSemana: "Lunes",
      numeroVentas: 5,
      montoTotal: 400,
    },
    {
      fecha: "2026-11-17",
      diaSemana: "Martes",
      numeroVentas: 7,
      montoTotal: 550,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();

  api.get.mockResolvedValue({
    data: reporteEjemplo,
  });

  exportarPatronesExcel.mockResolvedValue(
    undefined
  );
});

afterEach(() => {
  cleanup();
});

describe("HU-045: Reportes de ventas por horario", () => {

  it("muestra el título del reporte por horario", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    expect(
      screen.getByRole("heading", {
        name: "Reportes por horario",
      })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });

  it("consulta correctamente el endpoint de reportes", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte/patrones",
        {
          params: {
            inicio: expect.any(String),
            fin: expect.any(String),
          },
        }
      );
    });
  });

  it("muestra el resumen de ventas de la sucursal", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    expect(
      await screen.findByText(
        "Sucursal Centro"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("12")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /950,00|950\.00/
      )
    ).toBeInTheDocument();
  });

  it("identifica la hora de mayor consumo", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    expect(
      await screen.findByText("10:00")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "7 ventas por franja"
      )
    ).toBeInTheDocument();
  });

  it("muestra las franjas horarias en la gráfica", async () => {
    const { container } = render(
      <PatronesConsumo modo="horarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    expect(
      container.querySelectorAll(
        ".patrones-bar"
      )
    ).toHaveLength(3);

    expect(
      container.querySelectorAll(
        ".patrones-bar-pico"
      )
    ).toHaveLength(1);
  });

  it("actualiza el reporte al presionar Actualizar", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Actualizar/i,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it("permite modificar las fechas y consultar nuevamente", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    fireEvent.change(
      screen.getByLabelText(
        "Fecha inicial"
      ),
      {
        target: {
          value: "2026-11-01",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(
        "Fecha final"
      ),
      {
        target: {
          value: "2026-11-18",
        },
      }
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/ventas/reporte/patrones",
        {
          params: {
            inicio: "2026-11-01",
            fin: "2026-11-18",
          },
        }
      );
    });
  });

  it("rechaza un rango de fechas inválido", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    fireEvent.change(
      screen.getByLabelText(
        "Fecha inicial"
      ),
      {
        target: {
          value: "2026-11-20",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(
        "Fecha final"
      ),
      {
        target: {
          value: "2026-11-10",
        },
      }
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      /rango de fechas/
    );

    expect(
      screen.getByRole("button", {
        name: /Exportar Excel/i,
      })
    ).toBeDisabled();
  });

  it("exporta el reporte de horarios a Excel", async () => {
    render(
      <PatronesConsumo modo="horarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Exportar Excel/i,
      })
    );

    await waitFor(() => {
      expect(
        exportarPatronesExcel
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          reporte: reporteEjemplo,
          modo: "horarios",
        })
      );
    });
  });

  it("muestra un error cuando falla la consulta", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    api.get.mockRejectedValueOnce({
      response: {
        data: {
          message:
            "Error del servidor",
        },
      },
    });

    render(
      <PatronesConsumo modo="horarios" />
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Error del servidor"
    );

    errorSpy.mockRestore();
  });

  it("muestra un error si falla la exportación", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    exportarPatronesExcel.mockRejectedValueOnce(
      new Error("Error Excel")
    );

    render(
      <PatronesConsumo modo="horarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Exportar Excel/i,
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "No fue posible generar el archivo Excel."
    );

    errorSpy.mockRestore();
  });
});

describe("HU-046: Patrones de consumo diario", () => {

  it("muestra el título del reporte diario", async () => {
    render(
      <PatronesConsumo modo="diarios" />
    );

    expect(
      screen.getByRole("heading", {
        name: "Patrones de consumo diario",
      })
    ).toBeInTheDocument();

    await screen.findByText(
      "Sucursal Centro"
    );
  });

  it("muestra los días registrados", async () => {
    const { container } = render(
      <PatronesConsumo modo="diarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    expect(
      container.querySelectorAll(
        ".patrones-dia"
      )
    ).toHaveLength(2);

    expect(
      screen.getByText("Lunes")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Martes")
    ).toBeInTheDocument();
  });

  it("muestra el total de ventas por día", async () => {
    render(
      <PatronesConsumo modo="diarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    expect(
      screen.getByText("5 ventas")
    ).toBeInTheDocument();

    expect(
      screen.getByText("7 ventas")
    ).toBeInTheDocument();
  });

  it("exporta el consumo diario a Excel", async () => {
    render(
      <PatronesConsumo modo="diarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Exportar Excel/i,
      })
    );

    await waitFor(() => {
      expect(
        exportarPatronesExcel
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          reporte: reporteEjemplo,
          modo: "diarios",
        })
      );
    });
  });

  it("muestra información cuando no hay ventas", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        sucursalNombre:
          "Sucursal Centro",
        numeroVentas: 0,
        montoTotal: 0,
        franjas: [],
        dias: [],
      },
    });

    const { container } = render(
      <PatronesConsumo modo="diarios" />
    );

    await screen.findByText(
      "Sucursal Centro"
    );

    expect(
      container.querySelectorAll(
        ".patrones-dia"
      )
    ).toHaveLength(0);

    expect(
      screen.getByText("0")
    ).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import api from "../services/api";
import ClientesEnRiesgo from "./ClientesEnRiesgo";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("ClientesEnRiesgo - HU-060", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta y muestra las anomalías de los clientes", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/clientes/segmentos/riesgo") {
        return Promise.resolve({ data: [] });
      }

      if (url === "/acciones-retencion/resumen") {
        return Promise.resolve({ data: [] });
      }

      if (url === "/clientes/segmentos/anomalias") {
        return Promise.resolve({
          data: [
            {
              clienteId: 7,
              nombre: "Ana López",
              tipo: "COMPRA_ATIPICA",
              fechaDeteccion: "2026-11-20T10:30:00",
              metrica: "TOTAL_VS_PROMEDIO_HISTORICO",
              valorDetectado: 650,
              detalle: "Compra superior a cinco veces su promedio histórico.",
            },
          ],
        });
      }

      return Promise.resolve({ data: [] });
    });

    render(<ClientesEnRiesgo usuario={{ nombre: "Administrador" }} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Anomalías de clientes/i,
      })
    );

    expect(
      await screen.findByRole("heading", {
        name: "Anomalías de clientes",
      })
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith(
      "/clientes/segmentos/anomalias"
    );

    expect(await screen.findByText("Ana López")).toBeInTheDocument();

    expect(screen.getByText("COMPRA ATIPICA")).toBeInTheDocument();

    expect(
      screen.getByText("TOTAL VS PROMEDIO HISTORICO")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Compra superior a cinco veces su promedio histórico.")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Volver a clientes en riesgo/i,
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Clientes en riesgo de abandono",
      })
    ).toBeInTheDocument();
  });

  it("muestra un mensaje cuando no existen anomalías", async () => {
    api.get.mockResolvedValue({ data: [] });

    render(<ClientesEnRiesgo usuario={{ nombre: "Administrador" }} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Anomalías de clientes/i,
      })
    );

    expect(
      await screen.findByText(
        "No se detectaron anomalías de clientes."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("0 anomalía(s) identificada(s).")
    ).toBeInTheDocument();
  });
});
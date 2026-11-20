import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import api from "../services/api";
import DesempenoRepartidores from "./DesempenoRepartidores";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("DesempenoRepartidores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta y muestra el desempeño de los repartidores", async () => {
    api.get.mockResolvedValue({
      data: {
        sucursalNombre: "Sucursal Centro",
        totalVentas: 5,
        montoTotal: 1250,
        rankingVentas: [
          {
            posicion: 1,
            repartidorId: 10,
            nombre: "Ana López",
            cantidadVentas: 5,
          },
        ],
        rankingMonto: [
          {
            posicion: 1,
            repartidorId: 10,
            nombre: "Ana López",
            montoTotal: 1250,
          },
        ],
      },
    });

    const onVolver = vi.fn();

    render(<DesempenoRepartidores onVolver={onVolver} />);

    expect(
      await screen.findByText("Desempeño de repartidores")
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith(
      "/ventas/desempeno-repartidores"
    );

    expect(screen.getByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getAllByText("Ana López")).toHaveLength(2);
    expect(
      screen.getByText("Ranking por número de ventas")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ranking por monto")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Volver a ventas/i })
    );

    expect(onVolver).toHaveBeenCalledTimes(1);
  });

  it("muestra valores predeterminados cuando no hay rankings", async () => {
    api.get.mockResolvedValue({
      data: {},
    });

    render(<DesempenoRepartidores />);

    expect(await screen.findByText(/Sin nombre/)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "No hay entregas confirmadas para mostrar."
      )
    ).toHaveLength(2);
    expect(screen.getByText("Ventas entregadas")).toBeInTheDocument();
    expect(screen.getByText("Monto cobrado")).toBeInTheDocument();
  });

  it("muestra un mensaje cuando la respuesta no contiene información", async () => {
    api.get.mockResolvedValue({
      data: null,
    });

    render(<DesempenoRepartidores />);

    expect(
      await screen.findByText("No hay información disponible.")
    ).toBeInTheDocument();
  });

  it.each([
    [
      { response: { data: { mensaje: "No tienes autorización." } } },
      "No tienes autorización.",
    ],
    [
      { response: { data: { error: "Error del servidor." } } },
      "Error del servidor.",
    ],
    [
      new Error("Error de conexión"),
      "No fue posible consultar el desempeño de los repartidores.",
    ],
  ])("muestra el mensaje correspondiente cuando falla la consulta", async (error, mensaje) => {
    api.get.mockRejectedValue(error);

    render(<DesempenoRepartidores />);

    expect(await screen.findByRole("alert")).toHaveTextContent(mensaje);
  });
});

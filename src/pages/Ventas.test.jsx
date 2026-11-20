import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import api from "../services/api";
import Ventas from "./Ventas";

vi.mock("../services/api", () => ({
  default: { get: vi.fn() },
}));

vi.mock("../components/DashboardVentas", () => ({
  default: () => <div>Dashboard de ventas</div>,
}));

vi.mock("../components/ProductosMasVendidos", () => ({
  default: () => <div>Productos más vendidos</div>,
}));

describe("Ventas - HU-049", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockImplementation((url) => {
      if (url === "/ventas") {
        return Promise.resolve({ data: [] });
      }

      if (url.startsWith("/ventas/dashboard?")) {
        return Promise.resolve({
          data: {
            periodoEtiqueta: "Hoy",
            sucursalNombre: "Sucursal Centro",
            numeroVentas: 0,
            montoTotal: 0,
            ticketPromedio: 0,
            diasConVentas: 0,
            desglosePorDia: [],
            desglosePorMetodoPago: [],
            topProductos: [],
          },
        });
      }

      return Promise.resolve({ data: [] });
    });
  });

  it("permite al administrador abrir el desempeño de repartidores", () => {
    const onNavegar = vi.fn();

    render(
      <Ventas
        usuario={{ userTipo: 0, sucursalId: 10 }}
        onNavegar={onNavegar}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Desempeño de repartidores/i,
      })
    );

    expect(onNavegar).toHaveBeenCalledWith("desempenoRepartidores");
  });

  it("oculta el acceso al desempeño para usuarios que no son administradores", () => {
    render(
      <Ventas usuario={{ userTipo: 1, sucursalId: 10 }} />
    );

    expect(
      screen.queryByRole("button", {
        name: /Desempeño de repartidores/i,
      })
    ).not.toBeInTheDocument();
  });
});
// Runtime validation coverage for applying a targeted promotion at checkout.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import Carrito from "./Carrito";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Carrito promotions", () => {
  it("loads promotions for the selected customer and submits the promotion ID", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/productos") {
        return Promise.resolve({
          data: [{ id: 11, nombre: "Garrafón", precio: 100, categoriaId: 1 }],
        });
      }
      if (path === "/categorias/activas") {
        return Promise.resolve({ data: [] });
      }
      if (path === "/clientes") {
        return Promise.resolve({
          data: [
            {
              id: 31,
              nombre: "Ana López",
              saldoPuntos: 0,
              activo: true,
            },
          ],
        });
      }
      if (path === "/promociones/aplicables") {
        return Promise.resolve({
          data: [
            {
              id: 7,
              nombre: "Promo Activo",
              descuentoPorcentaje: 10,
              segmentoObjetivo: "ACTIVO",
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });
    api.post.mockResolvedValue({
      data: { folio: "V-0001", total: 106, metodoPago: "tarjeta" },
    });

    render(<Carrito usuario={{ id: 5 }} />);

    await screen.findByText("Garrafón");
    fireEvent.click(screen.getByTestId("producto-card"));
    fireEvent.change(screen.getByTestId("cliente-fidelizacion"), {
      target: { value: "31" },
    });

    const promotion = await screen.findByRole("option", {
      name: /Promo Activo/,
    });
    expect(api.get).toHaveBeenCalledWith("/promociones/aplicables", {
      params: { clienteId: 31, cantidadGarrafones: 1 },
    });
    fireEvent.change(screen.getByLabelText("Promoción"), {
      target: { value: promotion.value },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. Uriel"), {
      target: { value: "Ana López" },
    });
    fireEvent.change(screen.getByTestId("metodo-pago"), {
      target: { value: "tarjeta" },
    });
    fireEvent.click(screen.getByTestId("cobrar-venta"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/ventas",
        expect.objectContaining({
          clienteId: 31,
          promocionId: 7,
          descuento: 0,
        }),
      );
    });
    expect(await screen.findByText("V-0001")).toBeTruthy();
  });

  it("quotes points with the server and submits the server-quoted amount", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/productos") {
        return Promise.resolve({
          data: [{ id: 11, nombre: "Garrafón", precio: 100, categoriaId: 1 }],
        });
      }
      if (path === "/categorias/activas") {
        return Promise.resolve({ data: [] });
      }
      if (path === "/clientes") {
        return Promise.resolve({
          data: [
            {
              id: 31,
              nombre: "Ana López",
              saldoPuntos: 500,
              activo: true,
            },
          ],
        });
      }
      if (path === "/promociones/aplicables") {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });
    api.post.mockImplementation((path) => {
      if (path === "/clientes/31/beneficios/cotizaciones") {
        return Promise.resolve({
          data: { puntosCanjeados: 50, descuento: 10 },
        });
      }
      if (path === "/ventas") {
        return Promise.resolve({
          data: {
            folio: "V-0002",
            total: 106,
            metodoPago: "tarjeta",
            saldoPuntosRestante: 450,
          },
        });
      }
      return Promise.reject(new Error(`Unexpected POST ${path}`));
    });

    render(<Carrito usuario={{ id: 5 }} />);

    await screen.findByText("Garrafón");
    fireEvent.click(screen.getByTestId("producto-card"));
    fireEvent.change(screen.getByTestId("cliente-fidelizacion"), {
      target: { value: "31" },
    });
    fireEvent.change(screen.getByTestId("puntos-a-canjear"), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByTestId("aplicar-canje"));

    await screen.findByTestId("canje-aplicado");
    expect(api.post).toHaveBeenCalledWith(
      "/clientes/31/beneficios/cotizaciones",
      { puntosSolicitados: 50, totalCompra: 116 },
    );

    fireEvent.change(screen.getByPlaceholderText("Ej. Uriel"), {
      target: { value: "Ana López" },
    });
    fireEvent.change(screen.getByTestId("metodo-pago"), {
      target: { value: "tarjeta" },
    });
    fireEvent.click(screen.getByTestId("cobrar-venta"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/ventas",
        expect.objectContaining({
          clienteId: 31,
          puntosCanjeados: 50,
          descuento: 10,
          promocionId: null,
        }),
      );
    });
    expect(await screen.findByText("V-0002")).toBeTruthy();
  });
});

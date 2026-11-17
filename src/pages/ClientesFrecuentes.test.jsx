// Runtime validation coverage for frequent-customer ranking and large lists.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import ClientesFrecuentes from "./ClientesFrecuentes";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function crearCliente(indice, totalCompras = 10 - indice) {
  return {
    clienteId: indice,
    nombre: `Cliente ${String(indice).padStart(4, "0")}`,
    totalCompras,
    montoTotal: totalCompras * 25,
    esFrecuente: totalCompras >= 5,
  };
}

describe("ClientesFrecuentes", () => {
  it("consulta el periodo y umbral, y muestra el ranking y resumen correctos", async () => {
    api.get.mockResolvedValue({
      data: [
        { clienteId: 1, nombre: "Ana López", totalCompras: 12, montoTotal: 120, esFrecuente: true },
        { clienteId: 2, nombre: "Beto Ruiz", totalCompras: 9, montoTotal: 90, esFrecuente: true },
        { clienteId: 3, nombre: "Caro Díaz", totalCompras: 7, montoTotal: 70, esFrecuente: true },
        { clienteId: 4, nombre: "Dani Solís", totalCompras: 4, montoTotal: 40, esFrecuente: false },
        { clienteId: 5, nombre: "Eva Cruz", totalCompras: 2, montoTotal: 20, esFrecuente: false },
        { clienteId: 6, nombre: "Fede Rey", totalCompras: 1, montoTotal: 10, esFrecuente: false },
      ],
    });

    const { container } = render(<ClientesFrecuentes />);

    expect(await screen.findAllByText("Ana López")).toHaveLength(2);
    expect(api.get).toHaveBeenCalledWith(
      "/ventas/reporte/clientes-frecuentes?periodo=mes&minimoCompras=3",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByText("Fede Rey")).toBeTruthy();
    expect(screen.getByText("$280.00")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Top 5 clientes más frecuentes/ }),
    ).toBeTruthy();

    const nombresTopCinco = Array.from(
      container.querySelectorAll("ul li span:nth-of-type(2)"),
      (elemento) => elemento.textContent,
    );
    expect(nombresTopCinco).toEqual([
      "Ana López",
      "Beto Ruiz",
      "Caro Díaz",
      "Dani Solís",
      "Eva Cruz",
    ]);

    const nombresOrdenados = Array.from(
      container.querySelectorAll("tbody tr td:nth-child(2) strong"),
      (elemento) => elemento.textContent,
    );
    expect(nombresOrdenados).toEqual([
      "Ana López",
      "Beto Ruiz",
      "Caro Díaz",
      "Dani Solís",
      "Eva Cruz",
      "Fede Rey",
    ]);
  });

  it("actualiza la consulta al cambiar periodo y mínimo de compras", async () => {
    api.get.mockResolvedValue({ data: [] });
    render(<ClientesFrecuentes />);

    await screen.findByText("No hay compras registradas en el periodo seleccionado.");
    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "5" },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        "/ventas/reporte/clientes-frecuentes?periodo=hoy&minimoCompras=5",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it("ignora una respuesta tardía de filtros anteriores", async () => {
    const respuestas = {};
    api.get.mockImplementation((url) => new Promise((resolve) => {
      respuestas[url.includes("periodo=hoy") ? "hoy" : "mes"] = resolve;
    }));

    const { container } = render(<ClientesFrecuentes />);
    await waitFor(() => expect(respuestas.mes).toBeTypeOf("function"));
    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    await waitFor(() => expect(respuestas.hoy).toBeTypeOf("function"));

    await act(async () => {
      respuestas.hoy({
        data: [
          { clienteId: 2, nombre: "Resultado actual", totalCompras: 4, montoTotal: 80, esFrecuente: true },
        ],
      });
    });
    await act(async () => {
      respuestas.mes({
        data: [
          { clienteId: 1, nombre: "Resultado obsoleto", totalCompras: 9, montoTotal: 180, esFrecuente: true },
        ],
      });
    });

    const filas = Array.from(
      container.querySelectorAll("tbody tr td:nth-child(2) strong"),
      (elemento) => elemento.textContent,
    );
    expect(filas).toEqual(["Resultado actual"]);
  });

  it("muestra 1,000 clientes en menos de 5 segundos", async () => {
    api.get.mockResolvedValue({
      data: Array.from({ length: 1000 }, (_, indice) =>
        crearCliente(indice + 1, 1000 - indice),
      ),
    });

    const inicio = performance.now();
    const { container } = render(<ClientesFrecuentes />);

    expect(await screen.findByText("Cliente 1000")).toBeTruthy();
    const duracionMs = performance.now() - inicio;

    expect(container.textContent).toContain("Listado completo — 1000 clientes");
    expect(duracionMs).toBeLessThan(5000);
  }, 10000);
});

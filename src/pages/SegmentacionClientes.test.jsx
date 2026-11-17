// Runtime validation coverage for customer segment loading and filtering.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import SegmentacionClientes from "./SegmentacionClientes";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const summary = {
  total: 4,
  segmentos: {
    ACTIVO: 1,
    POTENCIAL: 1,
    DORMIDO: 1,
    POCO_FRECUENTE: 1,
  },
};

const customers = [
  {
    clienteId: 31,
    nombre: "Ana López",
    segmento: "ACTIVO",
    compras: 5,
    ultimaCompra: "2026-10-25",
  },
  {
    clienteId: 32,
    nombre: "Beto Ruiz",
    segmento: "POTENCIAL",
    compras: 0,
    ultimaCompra: null,
  },
  {
    clienteId: 33,
    nombre: "Caro Díaz",
    segmento: "DORMIDO",
    compras: 4,
    ultimaCompra: "2026-06-01",
  },
  {
    clienteId: 34,
    nombre: "Dani Solís",
    segmento: "POCO_FRECUENTE",
    compras: 2,
    ultimaCompra: "2026-10-10",
  },
];

function mockSegmentResponses() {
  api.get.mockImplementation((path) =>
    Promise.resolve({
      data: path.endsWith("/resumen") ? summary : customers,
    }),
  );
}

function crearCliente(indice) {
  const segmentos = ["ACTIVO", "POTENCIAL", "DORMIDO", "POCO_FRECUENTE"];
  const segmento = segmentos[(indice - 1) % segmentos.length];

  return {
    clienteId: indice,
    nombre: `Cliente ${String(indice).padStart(4, "0")}`,
    segmento,
    compras: indice % 8,
    ultimaCompra: segmento === "POTENCIAL" ? null : "2026-10-25",
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SegmentacionClientes", () => {
  it("loads segments and filters the customer directory", async () => {
    mockSegmentResponses();

    render(<SegmentacionClientes />);

    expect(await screen.findByText("Ana López")).toBeTruthy();
    expect(screen.getByText("Beto Ruiz")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Activo/ }));

    expect(screen.getByText("Ana López")).toBeTruthy();
    expect(screen.queryByText("Beto Ruiz")).toBeNull();
    expect(screen.queryByText("Caro Díaz")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Activo/ }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cliente" }), {
      target: { value: "Beto" },
    });

    expect(screen.getByText("Beto Ruiz")).toBeTruthy();
    expect(screen.queryByText("Ana López")).toBeNull();
  });

  it("compara visualmente los cuatro segmentos y sus porcentajes", async () => {
    mockSegmentResponses();
    const { container } = render(<SegmentacionClientes />);

    await screen.findByText("Ana López");

    for (const nombre of ["Activo", "Potencial", "Dormido", "Poco frecuente"]) {
      const tarjeta = screen.getByRole("button", { name: new RegExp(nombre, "i") });
      expect(tarjeta.textContent).toContain(nombre);
      expect(tarjeta.querySelector(".sc-tarjeta-porcentaje").textContent).toBe("25.0%");
      expect(tarjeta.querySelector(".sc-numero").textContent).toBe("1");
    }

    expect(container.querySelector(".sc-total strong").textContent).toBe("4");
  });

  it("refreshes both segment endpoints and reports forbidden access", async () => {
    mockSegmentResponses();

    render(<SegmentacionClientes />);

    await screen.findByText("Ana López");
    fireEvent.click(
      screen.getByRole("button", { name: /Actualizar clasificación/ }),
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(4));

    cleanup();
    api.get.mockRejectedValue({ response: { status: 403 } });
    render(<SegmentacionClientes />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "Solo los administradores pueden consultar la segmentación.",
    );
  });

  it("muestra 1,000 clientes y conserva las cuatro clasificaciones en menos de 5 segundos", async () => {
    const clientes = Array.from({ length: 1000 }, (_, indice) =>
      crearCliente(indice + 1),
    );
    api.get.mockImplementation((path) =>
      Promise.resolve({
        data: path.endsWith("/resumen")
          ? {
              total: clientes.length,
              segmentos: {
                ACTIVO: 250,
                POTENCIAL: 250,
                DORMIDO: 250,
                POCO_FRECUENTE: 250,
              },
            }
          : clientes,
      }),
    );

    const inicio = performance.now();
    const { container } = render(<SegmentacionClientes />);

    expect(await screen.findByText("Cliente 1000")).toBeTruthy();
    const duracionMs = performance.now() - inicio;

    expect(screen.getByText("1000 resultados")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(1001);
    const cantidadesPorSegmento = Array.from(
      container.querySelectorAll(".sc-tabla tbody .sc-etiqueta"),
      (etiqueta) => etiqueta.textContent.trim(),
    ).reduce((conteos, segmento) => {
      conteos[segmento] = (conteos[segmento] || 0) + 1;
      return conteos;
    }, {});
    expect(cantidadesPorSegmento).toEqual({
      Activo: 250,
      Potencial: 250,
      Dormido: 250,
      "Poco frecuente": 250,
    });
    expect(duracionMs).toBeLessThan(5000);
  }, 10000);
});

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
  total: 2,
  segmentos: {
    ACTIVO: 1,
    POTENCIAL: 1,
    DORMIDO: 0,
    POCO_FRECUENTE: 0,
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
];

function mockSegmentResponses() {
  api.get.mockImplementation((path) =>
    Promise.resolve({
      data: path.endsWith("/resumen") ? summary : customers,
    }),
  );
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

    fireEvent.click(screen.getByRole("button", { name: /Activo/ }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cliente" }), {
      target: { value: "Beto" },
    });

    expect(screen.getByText("Beto Ruiz")).toBeTruthy();
    expect(screen.queryByText("Ana López")).toBeNull();
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
});

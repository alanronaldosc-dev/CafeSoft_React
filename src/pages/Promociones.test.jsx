// Runtime validation coverage for promotions loading, editing, and creation.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import Promociones from "./Promociones";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const existingPromotion = {
  id: 17,
  nombre: "Aniversario",
  descripcion: "Campaña de temporada",
  descuentoPorcentaje: 15,
  fechaInicio: "2026-01-01T10:00:00",
  fechaFin: "2026-12-01T10:00:00",
  minGarrafones: 8,
  acumulaPuntos: false,
  sucursalNombre: "Centro",
  activa: true,
  vigente: true,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Promociones", () => {
  it("loads remote records and preserves optional fields when editing", async () => {
    api.get.mockResolvedValue({ data: [existingPromotion] });

    render(<Promociones usuario={{ sucursalNombre: "Centro" }} />);

    expect(await screen.findByText("Aniversario")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Editar/ }));

    expect(screen.getByLabelText(/Mínimo de garrafones/).value).toBe("8");
    expect(
      screen.getByRole("checkbox", {
        name: /Acumular puntos con esta promoción/,
      }).checked,
    ).toBe(false);
  });

  it("posts normalized promotion data and reloads the remote list", async () => {
    const newPromotion = {
      ...existingPromotion,
      id: 18,
      nombre: "Campaña noviembre",
      descuentoPorcentaje: 20,
      minGarrafones: 0,
      acumulaPuntos: true,
    };
    api.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [newPromotion] });
    api.post.mockResolvedValue({ data: newPromotion });

    render(<Promociones usuario={{ sucursalNombre: "Centro" }} />);

    await screen.findByText("No hay promociones registradas.");
    fireEvent.click(screen.getByRole("button", { name: /Nueva promoción/ }));
    fireEvent.change(screen.getByLabelText(/^Nombre/), {
      target: { value: "Campaña noviembre" },
    });
    fireEvent.change(screen.getByLabelText(/Descuento/), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de inicio/), {
      target: { value: "2026-11-03T10:00" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de fin/), {
      target: { value: "2026-11-30T10:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Crear promoción/ }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/promociones",
        expect.objectContaining({
          nombre: "Campaña noviembre",
          descuentoPorcentaje: 20,
          fechaInicio: "2026-11-03T10:00:00",
          fechaFin: "2026-11-30T10:00:00",
          minGarrafones: 0,
          acumulaPuntos: true,
        }),
      );
    });
    expect(await screen.findByText("Campaña noviembre")).toBeTruthy();
    expect(
      await screen.findByText("✅ Promoción creada correctamente."),
    ).toBeTruthy();
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

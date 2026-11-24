import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import DashboardVentas from "../components/DashboardVentas";
import ProductosMasVendidos from "../components/ProductosMasVendidos";

// ── Fixtures ──

const PERIODOS = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "mes", etiqueta: "Este mes" },
  { id: "mes_anterior", etiqueta: "Mes anterior" },
];

const DASHBOARD = {
  periodo: "mes",
  periodoEtiqueta: "noviembre de 2026",
  sucursalNombre: "Bonafont",
  numeroVentas: 4,
  montoTotal: 1400,
  subtotal: 1206.9,
  impuestos: 193.1,
  ticketPromedio: 350,
  diasConVentas: 2,
  desglosePorDia: [
    { fecha: "2026-11-10", numeroVentas: 2, montoTotal: 700 },
    { fecha: "2026-11-11", numeroVentas: 2, montoTotal: 700 },
  ],
  desglosePorMetodoPago: [
    { metodoPago: "efectivo", numeroVentas: 3, montoTotal: 1050 },
  ],
  topProductos: [],
  actualizadoEn: "2026-11-16T10:30:00",
};

const PRODUCTOS = [
  { productoId: 1, nombre: "Garrafón 20L", unidadesVendidas: 8, montoTotal: 400 },
  { productoId: 2, nombre: "Botella 1L", unidadesVendidas: 20, montoTotal: 300 },
  { productoId: 3, nombre: "Hielo 5kg", unidadesVendidas: 5, montoTotal: 900 },
];

const propsDashboard = (extra = {}) => ({
  datos: DASHBOARD,
  cargando: false,
  error: null,
  periodo: "mes",
  periodos: PERIODOS,
  onCambiarPeriodo: () => {},
  ...extra,
});

// ── HU-041: dashboard ──

describe("DashboardVentas (HU-041)", () => {
  it("muestra las ventas del periodo y el número de transacciones", () => {
    render(<DashboardVentas {...propsDashboard()} />);

    expect(screen.getByText("Ventas del periodo")).toBeInTheDocument();
    expect(screen.getByText("$1,400.00")).toBeInTheDocument();
    expect(screen.getByText("Transacciones")).toBeInTheDocument();
    expect(screen.getByText("Ticket promedio")).toBeInTheDocument();
    expect(screen.getByText("$350.00")).toBeInTheDocument();
    expect(screen.getByText("Días con ventas")).toBeInTheDocument();
    expect(screen.getByText("noviembre de 2026")).toBeInTheDocument();
    expect(screen.getByText("Bonafont")).toBeInTheDocument();
  });

  it("dibuja la tendencia diaria con los días del periodo", () => {
    render(<DashboardVentas {...propsDashboard()} />);

    expect(
      screen.getByRole("img", { name: /Tendencia de ventas por día: 2 día/i }),
    ).toBeInTheDocument();
  });

  it("cambia el periodo al pulsar un filtro", () => {
    const alCambiar = vi.fn();
    render(
      <DashboardVentas
        {...propsDashboard({ periodo: "hoy", onCambiarPeriodo: alCambiar })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Este mes" }));
    expect(alCambiar).toHaveBeenCalledWith("mes");
  });

  it("informa cuando el periodo no se pudo cargar", () => {
    render(
      <DashboardVentas
        {...propsDashboard({ datos: null, error: "Periodo no válido." })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Periodo no válido.");
  });

  it("muestra el estado vacío de la tendencia sin ventas", () => {
    render(
      <DashboardVentas
        {...propsDashboard({
          datos: { ...DASHBOARD, desglosePorDia: [] },
        })}
      />,
    );

    expect(
      screen.getByText(/Sin ventas registradas en el periodo/i),
    ).toBeInTheDocument();
  });
});

// ── HU-042: productos más vendidos ──

describe("ProductosMasVendidos (HU-042)", () => {
  const ranking = () => screen.getByRole("list", { name: "Ranking de productos" });
  const filas = () => within(ranking()).getAllByRole("listitem");

  it("ordena las barras de mayor a menor por unidades vendidas", () => {
    render(
      <ProductosMasVendidos productos={PRODUCTOS} cargando={false} error={null} />,
    );

    const nombres = filas().map((f) => f.textContent);
    expect(nombres[0]).toContain("Botella 1L");
    expect(nombres[1]).toContain("Garrafón 20L");
    expect(nombres[2]).toContain("Hielo 5kg");
  });

  it("reordena la gráfica al cambiar la métrica a monto", () => {
    render(
      <ProductosMasVendidos productos={PRODUCTOS} cargando={false} error={null} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Monto" }));

    const nombres = filas().map((f) => f.textContent);
    expect(nombres[0]).toContain("Hielo 5kg");
    expect(nombres[1]).toContain("Garrafón 20L");
    expect(nombres[2]).toContain("Botella 1L");
  });

  it("mantiene la dona con la participación de los productos", () => {
    render(
      <ProductosMasVendidos productos={PRODUCTOS} cargando={false} error={null} />,
    );

    expect(
      screen.getByRole("img", {
        name: /Participación de los productos más vendidos/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("33")).toBeInTheDocument();
  });

  it("dibuja un sector de dona por cada producto del top", () => {
    render(
      <ProductosMasVendidos productos={PRODUCTOS} cargando={false} error={null} />,
    );

    const dona = screen.getByRole("img", {
      name: /Participación de los productos más vendidos/i,
    });
    const sectores = dona.querySelectorAll("path");

    expect(sectores).toHaveLength(PRODUCTOS.length);
    sectores.forEach((sector) => {
      expect(sector.getAttribute("d")).toMatch(/^M [-\d.]+ [-\d.]+ A /);
    });
  });

  it("despliega la tabla completa con todos los productos", () => {
    render(
      <ProductosMasVendidos productos={PRODUCTOS} cargando={false} error={null} />,
    );

    expect(screen.queryByRole("table")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /Ver tabla completa \(3 productos\)/i }),
    );

    const tabla = screen.getByRole("table");
    expect(within(tabla).getAllByRole("row")).toHaveLength(PRODUCTOS.length + 1);
    expect(within(tabla).getByText("Hielo 5kg")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay ventas", () => {
    render(<ProductosMasVendidos productos={[]} cargando={false} error={null} />);

    expect(screen.getByText(/Sin ventas en el periodo/i)).toBeInTheDocument();
  });
});

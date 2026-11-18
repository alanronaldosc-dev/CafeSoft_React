import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import api from "../services/api";
import Ventas from "./Ventas";

vi.mock("../services/api", () => ({
  default: { get: vi.fn() },
}));

const datosVentas = [
  {
    id: 1,
    folio: "F-001",
    sucursalId: 10,
    fecha: "2026-11-18T10:00:00",
    subtotal: 86.21,
    impuestos: 13.79,
    total: 100,
    metodoPago: "Efectivo",
    cambio: 0,
    usuarioNombre: "Carlos",
    sucursalNombre: "Sucursal Norte",
  },
  {
    id: 2,
    folio: "F-002",
    sucursalId: 20,
    fecha: "2026-11-18T11:00:00",
    subtotal: 172.42,
    impuestos: 27.58,
    total: 200,
    metodoPago: "Tarjeta",
    cambio: null,
    usuarioNombre: "Ana",
    sucursalNombre: "Sucursal Sur",
  },
];

const reporte = {
  periodoEtiqueta: "Hoy",
  sucursalNombre: "Sucursal Norte",
  numeroVentas: 1,
  montoTotal: 100,
  subtotal: 86.21,
  impuestos: 13.79,
  desglosePorDia: [
    { fecha: "2026-11-18", numeroVentas: 1, montoTotal: 100 },
  ],
  desglosePorMetodoPago: [
    { metodoPago: "Efectivo", numeroVentas: 1, montoTotal: 100 },
  ],
};

const productos = Array.from({ length: 6 }, (_, i) => ({
  productoId: i + 1,
  nombre: `Producto ${i + 1}`,
  unidadesVendidas: i + 1,
  montoTotal: (i + 1) * 50,
}));

function prepararApi() {
  api.get.mockImplementation((url) => {
    if (url === "/ventas") {
      return Promise.resolve({ data: datosVentas });
    }

    if (url.startsWith("/ventas/reporte?")) {
      const periodo = url.split("periodo=")[1];
      return Promise.resolve({
        data: { ...reporte, periodoEtiqueta: periodo },
      });
    }

    if (url.startsWith("/ventas/reporte/top-productos?")) {
      return Promise.resolve({ data: productos });
    }

    return Promise.resolve({ data: [] });
  });
}

describe("Ventas - HU-049", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepararApi();
  });

  it("muestra el botón de desempeño al administrador y permite navegar", async () => {
    const onNavegar = vi.fn();

    render(
      <Ventas
        usuario={{ userTipo: 0, sucursalId: 10 }}
        onNavegar={onNavegar}
      />
    );

    const boton = await screen.findByRole("button", {
      name: /Desempeño de repartidores/i,
    });

    expect(boton).toBeInTheDocument();

    fireEvent.click(boton);

    expect(onNavegar).toHaveBeenCalledWith("desempenoRepartidores");
  });

  it("filtra las ventas por la sucursal del usuario", async () => {
    render(
      <Ventas usuario={{ userTipo: 1, sucursalId: 10 }} />
    );

    expect(await screen.findByText("F-001")).toBeInTheDocument();
    expect(screen.queryByText("F-002")).not.toBeInTheDocument();
  });

  it("permite cambiar el periodo del reporte", async () => {
    render(
      <Ventas usuario={{ userTipo: 0, sucursalId: 10 }} />
    );

    await screen.findByText("F-001");

    fireEvent.click(
      screen.getByRole("button", { name: "Mes anterior" })
    );

    expect(await screen.findByText("mes_anterior")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(
      "/ventas/reporte?periodo=mes_anterior"
    );
    expect(api.get).toHaveBeenCalledWith(
      "/ventas/reporte/top-productos?periodo=mes_anterior"
    );
  });

  it("permite mostrar todos los productos y regresar al top cinco", async () => {
    render(
      <Ventas usuario={{ userTipo: 0, sucursalId: 10 }} />
    );

    const boton = await screen.findByRole("button", {
      name: /Ver todos los productos/i,
    });

    expect(screen.queryByText("Producto 6")).not.toBeInTheDocument();

    fireEvent.click(boton);

    expect(screen.getByText("Producto 6")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Mostrar solo top 5/i })
    );

    expect(screen.queryByText("Producto 6")).not.toBeInTheDocument();
  });

  it("oculta el acceso al desempeño para usuarios que no son administradores", async () => {
    render(
      <Ventas usuario={{ userTipo: 1, sucursalId: 10 }} />
    );

    await screen.findByText("F-001");

    expect(
      screen.queryByRole("button", {
        name: /Desempeño de repartidores/i,
      })
    ).not.toBeInTheDocument();
  });

  it("muestra el aviso cuando el usuario no tiene sucursal", async () => {
    render(<Ventas usuario={{ userTipo: 1 }} />);

    expect(
      screen.getByText(/Tu cuenta no tiene una sucursal asignada/i)
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Asigna una sucursal a tu cuenta/i)
    ).toBeInTheDocument();

    expect(api.get).not.toHaveBeenCalledWith("/ventas");
  });

  it("muestra errores independientes de ventas y productos", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url === "/ventas") {
        return Promise.reject(new Error("Ventas fuera de servicio"));
      }

      if (url.startsWith("/ventas/reporte?")) {
        return Promise.resolve({ data: reporte });
      }

      if (url.startsWith("/ventas/reporte/top-productos?")) {
        return Promise.reject({
          response: { data: { mensaje: "Productos fuera de servicio" } },
        });
      }

      return Promise.resolve({ data: [] });
    });

    render(
      <Ventas usuario={{ userTipo: 0, sucursalId: 10 }} />
    );

    expect(
      await screen.findByText((_, elemento) =>
        elemento?.tagName === "P" &&
        elemento.textContent.includes("No se pudieron cargar las ventas.")
      )
    ).toBeInTheDocument();

    expect(
      await screen.findByText((_, elemento) => elemento?.tagName === "P" && elemento.textContent.includes("Productos fuera de servicio"))
    ).toBeInTheDocument();

    vi.restoreAllMocks();
  });
  it("muestra el error cuando falla la consulta del reporte", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url === "/ventas") {
        return Promise.resolve({ data: [] });
      }

      if (url.startsWith("/ventas/reporte?")) {
        return Promise.reject({
          response: { data: { mensaje: "Reporte no disponible" } },
        });
      }

      if (url.startsWith("/ventas/reporte/top-productos?")) {
        return Promise.resolve({ data: [] });
      }

      return Promise.resolve({ data: [] });
    });

    render(
      <Ventas usuario={{ userTipo: 0, sucursalId: 10 }} />
    );

    expect(
      await screen.findByText((_, elemento) =>
        elemento?.tagName === "P" &&
        elemento.textContent.includes("Reporte no disponible")
      )
    ).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});

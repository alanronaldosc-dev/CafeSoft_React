import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./Home";

vi.mock("./MonitorVehiculos", () => ({ default: () => null }));
vi.mock("./InicioPage", () => ({
  default: () => <div>Inicio principal</div>,
}));
vi.mock("./Register", () => ({ default: () => null }));
vi.mock("./Productos", () => ({ default: () => null }));
vi.mock("./Ventas", () => ({
  default: ({ onNavegar }) => (
    <button onClick={() => onNavegar("desempenoRepartidores")}>
      Abrir desempeño
    </button>
  ),
}));
vi.mock("./DesempenoRepartidores", () => ({
  default: ({ onVolver }) => (
    <section>
      <h1>Vista de desempeño</h1>
      <button onClick={onVolver}>Regresar a ventas</button>
    </section>
  ),
}));
vi.mock("./Pedidos", () => ({ default: () => null }));
vi.mock("./Usuarios", () => ({ default: () => null }));
vi.mock("./CrearProducto", () => ({ default: () => null }));
vi.mock("./Insumos", () => ({ default: () => null }));
vi.mock("./CrearInsumo", () => ({ default: () => null }));
vi.mock("./Lotes", () => ({ default: () => null }));
vi.mock("./CrearLote", () => ({ default: () => null }));
vi.mock("./Carrito", () => ({ default: () => null }));
vi.mock("./Categorias", () => ({ default: () => null }));
vi.mock("./CrearCategoria", () => ({ default: () => null }));
vi.mock("./AgregarProductosCategoria", () => ({ default: () => null }));
vi.mock("./ClientesFrecuentes", () => ({ default: () => null }));
vi.mock("./Promociones", () => ({ default: () => null }));
vi.mock("./PerfilUsuario", () => ({ default: () => null }));
vi.mock("./InventarioProductos", () => ({ default: () => null }));
vi.mock("./Proveedores", () => ({ default: () => null }));
vi.mock("./CrearProveedor", () => ({ default: () => null }));
vi.mock("./Clientes", () => ({ default: () => null }));
vi.mock("./SegmentacionClientes", () => ({ default: () => null }));
vi.mock("./CrearCliente", () => ({ default: () => null }));
vi.mock("./EditarCliente", () => ({ default: () => null }));
vi.mock("./Rutas", () => ({ default: () => null }));
vi.mock("./CrearRuta", () => ({ default: () => null }));
vi.mock("./EditarRuta", () => ({ default: () => null }));
vi.mock("./Cargas", () => ({ default: () => null }));
vi.mock("./Liquidaciones", () => ({ default: () => null }));

describe("Home - HU-049", () => {
  it("permite al administrador abrir el desempeño y regresar a ventas", () => {
    render(
      <Home
        usuario={{ userTipo: 0, nombre: "Administrador" }}
        cerrarSesion={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("menu-ventas"));

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir desempeño" })
    );

    expect(screen.getByText("Vista de desempeño")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Regresar a ventas" })
    );

    expect(
      screen.getByRole("button", { name: "Abrir desempeño" })
    ).toBeInTheDocument();
  });

  it("impide que un usuario normal acceda al desempeño", () => {
    const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <Home
        usuario={{ userTipo: 1, nombre: "Usuario" }}
        cerrarSesion={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("menu-ventas"));

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir desempeño" })
    );

    expect(alerta).toHaveBeenCalledWith(
      "No tienes permisos para acceder a este apartado."
    );

    expect(screen.getByText("Inicio principal")).toBeInTheDocument();

    alerta.mockRestore();
  });
});

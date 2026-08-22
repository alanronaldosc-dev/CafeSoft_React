import { useState, useEffect } from "react";
import api from "../services/api";
import Register from "./Register";
import Productos from "./Productos";
import Ventas from "./Ventas";
import Pedidos from "./Pedidos";
import Usuarios from "./Usuarios";
import CrearProducto from "./CrearProducto";
import Insumos from "./Insumos";
import CrearInsumo from "./CrearInsumo";
import Lotes from "./Lotes";
import CrearLote from "./CrearLote";
import Carrito from "./Carrito";
import Categorias from "./Categorias";
import CrearCategoria from "./CrearCategoria";
import AgregarProductosCategoria from "./AgregarProductosCategoria";

// HU-013 - PROVEEDORES
import Proveedores from "./Proveedores";
import CrearProveedor from "./CrearProveedor";

function Home({ usuario, cerrarSesion }) {
  const [seccion, setSeccion] = useState("inicio");
  const [categoriaParaProductos, setCategoriaParaProductos] = useState(null);

  // ============================================
  // HU-015
  // Todos los módulos disponibles
  // ============================================
  const menu = [
    { id: "inicio", texto: "🏠 Inicio" },
    { id: "crearProducto", texto: "☕ Crear Producto" },
    { id: "ventas", texto: "🧾 Ver Ventas" },
    { id: "pedidos", texto: "🍽️ Pedidos" },
    { id: "productos", texto: "📦 Ver Productos" },
    { id: "usuarios", texto: "👥 Ver Usuarios" },
    { id: "reportes", texto: "📊 Reportes" },
    { id: "carrito", texto: "🛒 Carrito de Compras" },
    { id: "registro", texto: "👤 Registrar Usuario" },
    { id: "insumos", texto: "🧂 Ver Insumos" },
    { id: "lotes", texto: "📦 Lotes de Insumos" },
    { id: "categorias", texto: "🏷️ Categorías" },
    // HU-013
    { id: "proveedores", texto: "🚚 Proveedores" },
  ];

  // ============================================
  // HU-015
  // Determina si el usuario puede visualizar
  // un módulo determinado.
  // ============================================
  const tienePermiso = (permiso) => {
    // Administrador: acceso completo.
    if (usuario.userTipo === 0) return true;

    // Personalizado: solamente permisos asignados.
    if (usuario.userTipo === 3) return usuario.permisos?.includes(permiso) || false;

    // Usuario normal: permisos predeterminados.
    if (usuario.userTipo === 1) {
      return ["productos", "pedidos", "ventas", "carrito"].includes(permiso);
    }

    // Cliente: acceso básico.
    if (usuario.userTipo === 2) {
      return ["productos", "pedidos", "carrito"].includes(permiso);
    }

    return false;
  };

  // ============================================
  // HU-015
  // Evita que un usuario entre directamente
  // escribiendo una sección que no tiene.
  // ============================================
  const cambiarSeccion = (nuevaSeccion) => {
    if (nuevaSeccion === "inicio") {
      setSeccion("inicio");
      return;
    }
    if (!tienePermiso(nuevaSeccion)) {
      alert("No tienes permisos para acceder a este apartado.");
      setSeccion("inicio");
      return;
    }
    setSeccion(nuevaSeccion);
  };

  // ============================================
  // ROL PARA MOSTRAR EN LA INTERFAZ
  // ============================================
  const obtenerNombreRol = () => {
    if (usuario.userTipo === 0) return "Administrador";
    if (usuario.userTipo === 1) return "Usuario";
    if (usuario.userTipo === 3) return "Personalizado";
    return "Cliente";
  };

  // ============================================
  // CONTENIDO
  // ============================================
  const renderContenido = () => {
    // Protección adicional.
    if (seccion !== "inicio" && !tienePermiso(seccion)) {
      return (
        <section className="panel">
          <h1>🔒 Acceso restringido</h1>
          <p>No tienes permisos para acceder a este apartado.</p>
        </section>
      );
    }

    switch (seccion) {
      case "inicio":
        return (
          <>
            <section className="header">
              <div>
                <h1>Bienvenido a CafeSoft</h1>
                <p>
                  Hola, {usuario.nombre}. Administra tu cafetería desde un solo
                  lugar.
                </p>
              </div>

              {tienePermiso("ventas") && (
                <button
                  className="history-btn"
                  onClick={() => cambiarSeccion("ventas")}
                >
                  Ver historial
                </button>
              )}
            </section>

            <section className="cards">
              <div className="card">
                <span className="card-icon">💵</span>
                <p>Total vendido hoy</p>
                <h2>$470.00</h2>
              </div>

              <div className="card">
                <span className="card-icon">🧾</span>
                <p>Tickets generados</p>
                <h2>1</h2>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="panel">
                <h2>👑 Top productos de hoy</h2>
                <div className="donut"></div>
                <div className="legend">
                  <p>☕ Café Americano</p>
                  <p>🍫 Chocolate Caliente</p>
                  <p>🍵 Té Chai Latte</p>
                  <p>🥕 Pastel de Zanahoria</p>
                </div>
              </div>

              <div className="panel">
                <h2>🕒 Detalle de ventas</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Mesa</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>11:29 PM</td>
                      <td>Mesa 9</td>
                      <td>$470.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        );

      case "crearProducto":
        return <CrearProducto />;

      case "ventas":
        return <Ventas />;

      case "pedidos":
        return <Pedidos />;

      case "productos":
        return <Productos />;

      case "usuarios":
        return <Usuarios />;

      case "reportes":
        return (
          <section className="panel">
            <h1>📊 Reportes</h1>
            <p>Aquí irán las gráficas y reportes del sistema.</p>
          </section>
        );

      case "carrito":
        return <Carrito usuario={usuario} />;

      case "registro":
        return (
          <div className="dashboard-form">
            <Register
              cambiarVista={() => setSeccion("inicio")}
              esAdministrador={usuario.userTipo === 0}
            />
          </div>
        );

      case "insumos":
        return <Insumos onCrear={() => cambiarSeccion("crearInsumo")} />;

      case "crearInsumo":
        return <CrearInsumo onVolver={() => cambiarSeccion("insumos")} />;

      case "lotes":
        return <Lotes onCrear={() => cambiarSeccion("crearLote")} />;

      case "crearLote":
        return <CrearLote onVolver={() => cambiarSeccion("lotes")} />;

      // ============================================
      // HU-013 - PROVEEDORES
      // ============================================
      case "proveedores":
        return (
          <Proveedores onCrear={() => cambiarSeccion("crearProveedor")} />
        );

      case "crearProveedor":
        return (
          <CrearProveedor onVolver={() => cambiarSeccion("proveedores")} />
        );

      case "categorias":
        return (
          <Categorias
            onCrear={() => cambiarSeccion("crearCategoria")}
            onAgregarProductos={(categoria) => {
              setCategoriaParaProductos(categoria);
              cambiarSeccion("agregarProductosCategoria");
            }}
          />
        );

      case "crearCategoria":
        return <CrearCategoria onVolver={() => cambiarSeccion("categorias")} />;

      case "agregarProductosCategoria":
        return (
          <AgregarProductosCategoria
            categoria={categoriaParaProductos}
            onVolver={() => cambiarSeccion("categorias")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="home">
      <aside className="sidebar">
        <div className="logo">
          ☕ CafeSoft
          <span>Sistema de Gestión</span>
        </div>

        <div className="user-card">
          <div className="avatar">
            {usuario.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{usuario.nombre}</h3>
            <p>{obtenerNombreRol()}</p>
          </div>
        </div>

        <nav className="menu">
          {menu
            .filter((item) => {
              if (item.id === "inicio") return true;
              return tienePermiso(item.id);
            })
            .map((item) => (
              <p
                key={item.id}
                onClick={() => cambiarSeccion(item.id)}
                className={seccion === item.id ? "active-menu" : ""}
                style={{ cursor: "pointer" }}
              >
                {item.texto}
              </p>
            ))}
        </nav>

        <button className="logout" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <main className="content">{renderContenido()}</main>
    </div>
  );
}

export default Home;

import { useState } from "react";
import Register from "./Register";
import Productos from "./Productos";
import Ventas from "./Ventas";
import Usuarios from "./Usuarios";
import CrearProducto from "./CrearProducto";
import Insumos from "./Insumos";
import CrearInsumo from "./CrearInsumo";
import Lotes from "./Lotes";
import CrearLote from "./CrearLote";


function Home({ usuario, cerrarSesion }) {
  const [seccion, setSeccion] = useState("inicio");

  const menu = [
    { id: "inicio", texto: "🏠 Inicio" },
    { id: "crearProducto", texto: "☕ Crear Producto" },
    { id: "ventas", texto: "🧾 Ver Ventas" },
    { id: "productos", texto: "📦 Ver Productos" },
    { id: "usuarios", texto: "👥 Ver Usuarios" },
    { id: "reportes", texto: "📊 Reportes" },
    { id: "carrito", texto: "🛒 Carrito de Compras" },
    { id: "registro", texto: "👤 Registrar Usuario" },
    { id: "insumos", texto: "🧂 Ver Insumos" },
    { id: "lotes", texto: "📦 Lotes de Insumos" },


  ];

  const renderContenido = () => {
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

              <button
                className="history-btn"
                onClick={() => setSeccion("ventas")}
              >
                Ver historial
              </button>
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
        return (
          <section className="panel">
            <h1>🛒 Carrito de Compras</h1>
            <p>Aquí podrás agregar productos al carrito.</p>
          </section>
        );

      case "registro":
        return (
          <div className="dashboard-form">
            <Register cambiarVista={() => setSeccion("inicio")} />
          </div>
        );
      
      case "insumos":
        return <Insumos onCrear={() => setSeccion("crearInsumo")} />;

      case "crearInsumo":
        return <CrearInsumo onVolver={() => setSeccion("insumos")} />;
      case "lotes":
        return <Lotes onCrear={() => setSeccion("crearLote")} />;
      case "crearLote":
        return <CrearLote onVolver={() => setSeccion("lotes")} />;



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
            <p>
              {usuario.userTipo === 0
                ? "Administrador"
                : usuario.userTipo === 1
                ? "Empleado"
                : "Cliente"}
            </p>
          </div>
        </div>

        <nav className="menu">
          {menu.map((item) => (
            <p
              key={item.id}
              onClick={() => setSeccion(item.id)}
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
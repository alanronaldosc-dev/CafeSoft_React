import { useState } from "react";

import InicioPage from "./InicioPage";
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
import PerfilUsuario from "./PerfilUsuario";

import Dashboard from "./Dashboard";
import InventarioProductos from "./InventarioProductos";
import RecibirProducto from "./RecibirProducto";

// HU-013 - PROVEEDORES
import Proveedores from "./Proveedores";
import CrearProveedor from "./CrearProveedor";

// HU-011 - CLIENTES
import Clientes from "./Clientes";
import CrearCliente from "./CrearCliente";
import EditarCliente from "./EditarCliente";

// RUTAS
import Rutas from "./Rutas";
import CrearRuta from "./CrearRuta";
import EditarRuta from "./EditarRuta";

// HU-005 - CARGAS DE GARRAFONES
import Cargas from "./Cargas";

// HU-016 - LIQUIDACIÓN DE REPARTIDORES
import Liquidaciones from "./Liquidaciones";

function Home({ usuario, cerrarSesion, tema, toggleTema }) {
  const [seccion, setSeccion] = useState("inicio");
  const [categoriaParaProductos, setCategoriaParaProductos] = useState(null);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [rutaParaEditar, setRutaParaEditar] = useState(null);

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
    // HU-011
    { id: "clientes", texto: "🧑 Clientes" },
    // RUTAS
    { id: "rutas", texto: "🗺️ Rutas" },
    // HU-005
    { id: "cargas", texto: "🚰 Cargas de Garrafones" },
    // HU-016
    { id: "liquidaciones", texto: "💵 Liquidación de Repartidores" },
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
      return ["productos", "pedidos", "ventas", "carrito", "cargas", "liquidaciones", "rutas", "crearRuta", "editarRuta"].includes(permiso);
    }

    // Cliente: acceso básico.
    if (usuario.userTipo === 2) {
      return ["productos", "pedidos", "carrito"].includes(permiso);
    }

    // Repartidor: puede gestionar clientes (sus rutas).
    if (usuario.userTipo === 4) {
      return ["clientes", "crearCliente", "editarCliente", "rutas", "crearRuta", "editarRuta"].includes(permiso);
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
    if (usuario.userTipo === 4) return "Repartidor";
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
          <InicioPage


            usuario={usuario}
            tienePermiso={tienePermiso}
            onNavegar={cambiarSeccion}
          />
        );

      case "inventarioProductos":
        return (
          <InventarioProductos
            onRecibirProducto={() => cambiarSeccion("recibirProducto")}

            usuario={usuario}
            tienePermiso={tienePermiso}
            onNavegar={cambiarSeccion}
          />
        );


      case "crearProducto":
        return <CrearProducto usuario={usuario} />;

      case "ventas":
        return <Ventas usuario={usuario} />;

      case "pedidos":
        return <Pedidos />;

      case "productos":
        return <Productos usuario={usuario} />;

      case "usuarios":
        return <Usuarios usuario={usuario} />;

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
              usuario={usuario}
            />
          </div>
        );

      case "insumos":
        return <Insumos onCrear={() => cambiarSeccion("crearInsumo")} usuario={usuario} />;

      case "crearInsumo":
        return <CrearInsumo onVolver={() => cambiarSeccion("insumos")} usuario={usuario} />;

      case "lotes":
        return <Lotes onCrear={() => cambiarSeccion("crearLote")} usuario={usuario} />;

      case "crearLote":
        return <CrearLote onVolver={() => cambiarSeccion("lotes")} usuario={usuario} />;

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

      // ============================================
      // HU-011 - CLIENTES
      // ============================================
      case "clientes":
        return (
          <Clientes
            onCrear={() => cambiarSeccion("crearCliente")}
            onEditar={(cliente) => {
              setClienteParaEditar(cliente);
              cambiarSeccion("editarCliente");
            }}
          />
        );

      case "crearCliente":
        return (
          <CrearCliente onVolver={() => cambiarSeccion("clientes")} />
        );

      case "editarCliente":
        return (
          <EditarCliente
            cliente={clienteParaEditar}
            onVolver={() => cambiarSeccion("clientes")}
          />
        );

      // ============================================
      // RUTAS
      // ============================================
      case "rutas":
        return (
          <Rutas
            onCrear={() => cambiarSeccion("crearRuta")}
            onEditar={(ruta) => {
              setRutaParaEditar(ruta);
              cambiarSeccion("editarRuta");
            }}
          />
        );

      case "crearRuta":
        return <CrearRuta onVolver={() => cambiarSeccion("rutas")} />;

      case "editarRuta":
        return <EditarRuta ruta={rutaParaEditar} onVolver={() => cambiarSeccion("rutas")} />;

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

      case "miPerfil":
        return (
          <PerfilUsuario
            usuario={usuario}
            onVolver={() => setSeccion("inicio")}
            esPropio={true}
            tema={tema}
            toggleTema={toggleTema}
          />
        );

      // ==========================================
      // HU-005 - CARGAS
      // ==========================================
      case "cargas":
        return <Cargas usuario={usuario} />;

      // ==========================================
      // HU-016 - LIQUIDACIONES
      // ==========================================
      case "liquidaciones":
        return <Liquidaciones />;

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

        <div
          className="user-card"
          onClick={() => cambiarSeccion("miPerfil")}
          style={{ cursor: "pointer" }}
          title="Ver mi perfil"
        >
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
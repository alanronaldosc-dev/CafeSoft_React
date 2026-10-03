import { useState, useEffect } from "react";
import api from "../services/api";

/**
 * HU-011 – Gestión de perfiles de usuarios
 */

// HU-011 / HU-015: catálogo de permisos disponibles para roles personalizados
const PERMISOS = [
  { id: "crearProducto", texto: "☕ Crear Producto" },
  { id: "ventas",        texto: "🧾 Ver Ventas" },
  { id: "pedidos",       texto: "🍽️ Pedidos" },
  { id: "productos",     texto: "📦 Ver Productos" },
  { id: "usuarios",      texto: "👥 Ver Usuarios" },
  { id: "reportes",      texto: "📊 Reportes" },
  { id: "carrito",       texto: "🛒 Carrito de Compras" },
  { id: "registro",      texto: "👤 Registrar Usuario" },
  { id: "insumos",       texto: "🧂 Ver Insumos" },
  { id: "lotes",         texto: "📦 Lotes de Insumos" },
  { id: "categorias",    texto: "🏷️ Categorías" },
  { id: "proveedores",   texto: "🚚 Proveedores" },
];

/**
 * HU-011 – Formulario de registro / alta de usuario
 *
 * @param {function} cambiarVista    - Callback para navegar entre vistas
 * @param {boolean}  esAdministrador - true → admin registra empleados
 *                                     false → registro público de clientes
 * @param {object}   usuario         - Usuario logueado (admin)
 */
function Register({
  cambiarVista,
  esAdministrador = false,
  usuario = null,
}) {
  const [form, setForm] = useState({
    nombre:     "",
    email:      "",
    password:   "",
    direccion:  "",
    telefono:   "",
    userTipo:   esAdministrador ? 1 : 2,
    permisos:   [],
    sucursalId: "",   // ← nuevo campo
  });

  const [sucursales, setSucursales] = useState([]);  // ← lista de sucursales
  const [cargando,   setCargando]   = useState(false);

  // Carga las sucursales activas cuando el admin abre el formulario
  useEffect(() => {
    if (!esAdministrador) return;

    api.get("/sucursales/activas")
      .then((res) => setSucursales(res.data))
      .catch((err) => console.error("Error al cargar sucursales:", err));
  }, [esAdministrador]);

  const cambiarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const cambiarRol = (valor) => {
    const nuevoTipo = Number(valor);
    setForm((actual) => ({ ...actual, userTipo: nuevoTipo, permisos: [] }));
  };

  const cambiarPermiso = (permiso) => {
    setForm((actual) => {
      const permisosActuales = actual.permisos || [];
      const yaExiste = permisosActuales.includes(permiso);
      return {
        ...actual,
        permisos: yaExiste
          ? permisosActuales.filter((p) => p !== permiso)
          : [...permisosActuales, permiso],
      };
    });
  };

  const seleccionarTodos = () => {
    setForm((actual) => ({ ...actual, permisos: PERMISOS.map((p) => p.id) }));
  };

  const limpiarPermisos = () => {
    setForm((actual) => ({ ...actual, permisos: [] }));
  };

  const registrar = async (e) => {
    e.preventDefault();

    // Validación de permisos personalizados
    if (esAdministrador && form.userTipo === 3 && form.permisos.length === 0) {
      alert("Debes seleccionar al menos un permiso para el rol personalizado.");
      return;
    }

    // Validación de sucursal cuando es admin
    if (esAdministrador && !form.sucursalId) {
      alert("Debes seleccionar la sucursal a la que pertenecerá el usuario.");
      return;
    }

    setCargando(true);

    try {
      const datosUsuario = {
        nombre:    form.nombre.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        direccion: form.direccion.trim(),
        telefono:  form.telefono.trim(),
        userTipo:  form.userTipo,
        permisos:  form.userTipo === 3 ? form.permisos : [],
        // Sucursal elegida por el admin en el formulario
        sucursal:  form.sucursalId ? { id: Number(form.sucursalId) } : null,
      };

      await api.post("/usuarios", datosUsuario);

      alert("✅ Usuario registrado correctamente");

      setForm({
        nombre:     "",
        email:      "",
        password:   "",
        direccion:  "",
        telefono:   "",
        userTipo:   esAdministrador ? 1 : 2,
        permisos:   [],
        sucursalId: "",
      });

      cambiarVista("login");

    } catch (error) {
      console.error("Error al registrar usuario:", error);
      const mensaje =
        error.response?.data?.error || "No fue posible registrar el usuario.";
      alert(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="register-container">

        <div className="auth-logo">☕</div>
        <h1>CafeSoft</h1>

        <p className="auth-subtitle">
          {esAdministrador ? "Registrar nuevo usuario" : "Crea una cuenta para comenzar"}
        </p>

        <form onSubmit={registrar} className="auth-form">

          <label>Nombre completo</label>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => cambiarCampo("nombre", e.target.value)}
            required
            disabled={cargando}
          />

          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="correo@gmail.com"
            value={form.email}
            onChange={(e) => cambiarCampo("email", e.target.value)}
            required
            disabled={cargando}
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => cambiarCampo("password", e.target.value)}
            required
            disabled={cargando}
          />

          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) => cambiarCampo("direccion", e.target.value)}
            disabled={cargando}
          />

          <label>Teléfono</label>
          <input
            type="text"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => cambiarCampo("telefono", e.target.value)}
            disabled={cargando}
          />

          {/* ======================================
              SELECTOR DE ROL (solo admin)
          ====================================== */}
          {esAdministrador && (
            <>
              <label>Tipo de rol</label>
              <select
                value={form.userTipo}
                onChange={(e) => cambiarRol(e.target.value)}
                disabled={cargando}
              >
                <option value={1}>Usuario</option>
                <option value={3}>Personalizado</option>
                <option value={0}>Administrador</option>
                <option value={4}>Repartidor</option>
              </select>
            </>
          )}

          {/* ======================================
              SELECTOR DE SUCURSAL (solo admin)
          ====================================== */}
          {esAdministrador && (
            <>
              <label>Sucursal</label>
              <select
                value={form.sucursalId}
                onChange={(e) => cambiarCampo("sucursalId", e.target.value)}
                required
                disabled={cargando}
              >
                <option value="">-- Selecciona una sucursal --</option>
                {sucursales.map((suc) => (
                  <option key={suc.id} value={suc.id}>
                    {suc.nombre}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* ======================================
              PERMISOS PERSONALIZADOS (solo admin)
          ====================================== */}
          {esAdministrador && form.userTipo === 3 && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                border: "1px solid var(--borde)",
                borderRadius: "10px",
                background: "var(--humo)",
              }}
            >
              <h3>Permisos personalizados</h3>
              <p style={{ fontSize: "14px", marginBottom: "15px" }}>
                Selecciona los apartados que podrá utilizar este usuario.
              </p>

              <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
                <button type="button" onClick={seleccionarTodos} disabled={cargando}>
                  Seleccionar todos
                </button>
                <button type="button" onClick={limpiarPermisos} disabled={cargando}>
                  Limpiar selección
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {PERMISOS.map((permiso) => (
                  <label
                    key={permiso.id}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={form.permisos.includes(permiso.id)}
                      onChange={() => cambiarPermiso(permiso.id)}
                      disabled={cargando}
                    />
                    <span>{permiso.texto}</span>
                  </label>
                ))}
              </div>

              <p style={{ marginTop: "15px", fontSize: "13px" }}>
                Permisos seleccionados: <strong>{form.permisos.length}</strong>
              </p>
            </div>
          )}

          <button type="submit" className="btn-glow" disabled={cargando}>
            <span>{cargando ? "Registrando..." : "Crear Cuenta"}</span>
          </button>

        </form>

        <p className="auth-footer">
          ¿Ya tienes una cuenta?{" "}
          <span onClick={() => cambiarVista("login")} style={{ cursor: "pointer" }}>
            Iniciar
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;

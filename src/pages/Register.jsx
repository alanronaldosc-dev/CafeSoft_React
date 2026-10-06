import { useState, useEffect } from "react";
import api from "../services/api";

/**
 * HU-011 – Gestión de perfiles de usuarios
 */

// HU-011 / HU-015: catálogo de permisos disponibles para roles personalizados
const PERMISOS = [
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
  { id: "proveedores", texto: "🚚 Proveedores" },
];

/**
 * HU-011 – Formulario de registro / alta de usuario
 *
 * @param {function} cambiarVista
 * @param {boolean} esAdministrador
 * @param {object} usuario
 */
function Register({
  cambiarVista,
  esAdministrador = false,
  usuario = null,
}) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    direccion: "",
    telefono: "",
    userTipo: esAdministrador ? 1 : 2,
    permisos: [],
    sucursalId: "",
  });

  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoSucursales, setCargandoSucursales] = useState(true);

  // ============================================
  // CARGAR SUCURSALES
  // ============================================

  useEffect(() => {
    const cargarSucursales = async () => {
      setCargandoSucursales(true);

      try {
        const response = await api.get(
          "/sucursales/activas"
        );

        const lista = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        setSucursales(lista);

        // Si solo existe una sucursal,
        // se selecciona automáticamente.
        if (lista.length === 1) {
          setForm((actual) => ({
            ...actual,
            sucursalId: String(lista[0].id),
          }));
        }
      } catch (error) {
        console.error(
          "Error al cargar sucursales:",
          error
        );

        setSucursales([]);
      } finally {
        setCargandoSucursales(false);
      }
    };

    cargarSucursales();
  }, []);

  // ============================================
  // CAMBIAR CAMPOS
  // ============================================

  const cambiarCampo = (campo, valor) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  // ============================================
  // CAMBIAR ROL
  // ============================================

  const cambiarRol = (valor) => {
    const nuevoTipo = Number(valor);

    setForm((actual) => ({
      ...actual,
      userTipo: nuevoTipo,
      permisos: [],
    }));
  };

  // ============================================
  // PERMISOS
  // ============================================

  const cambiarPermiso = (permiso) => {
    setForm((actual) => {
      const permisosActuales =
        actual.permisos || [];

      const yaExiste =
        permisosActuales.includes(permiso);

      return {
        ...actual,
        permisos: yaExiste
          ? permisosActuales.filter(
              (p) => p !== permiso
            )
          : [
              ...permisosActuales,
              permiso,
            ],
      };
    });
  };

  const seleccionarTodos = () => {
    setForm((actual) => ({
      ...actual,
      permisos: PERMISOS.map(
        (permiso) => permiso.id
      ),
    }));
  };

  const limpiarPermisos = () => {
    setForm((actual) => ({
      ...actual,
      permisos: [],
    }));
  };

  // ============================================
  // REGISTRAR USUARIO
  // ============================================

  const registrar = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!form.nombre.trim()) {
      alert("Debes ingresar el nombre.");
      return;
    }

    if (!form.email.trim()) {
      alert("Debes ingresar el correo.");
      return;
    }

    if (!form.password) {
      alert("Debes ingresar la contraseña.");
      return;
    }

    if (form.password.length < 8) {
      alert(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    // Validación de permisos personalizados
    if (
      esAdministrador &&
      form.userTipo === 3 &&
      form.permisos.length === 0
    ) {
      alert(
        "Debes seleccionar al menos un permiso para el rol personalizado."
      );

      return;
    }

    // La sucursal ahora es obligatoria
    if (!form.sucursalId) {
      alert(
        "Debes seleccionar la sucursal a la que pertenecerá el usuario."
      );

      return;
    }

    setCargando(true);

    try {
      const datosUsuario = {
        nombre:
          form.nombre.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        password:
          form.password,

        direccion:
          form.direccion.trim(),

        telefono:
          form.telefono.trim(),

        userTipo:
          Number(form.userTipo),

        permisos:
          form.userTipo === 3
            ? form.permisos
            : [],

        sucursal: {
          id: Number(
            form.sucursalId
          ),
        },
      };

      await api.post(
        "/usuarios",
        datosUsuario
      );

      alert(
        "✅ Usuario registrado correctamente"
      );

      setForm({
        nombre: "",
        email: "",
        password: "",
        direccion: "",
        telefono: "",
        userTipo:
          esAdministrador
            ? 1
            : 2,
        permisos: [],
        sucursalId:
          sucursales.length === 1
            ? String(
                sucursales[0].id
              )
            : "",
      });

      cambiarVista("login");

    } catch (error) {
      console.error(
        "Error al registrar usuario:",
        error
      );

      const mensaje =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        "No fue posible registrar el usuario.";

      alert(mensaje);

    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // INTERFAZ
  // ============================================

  return (
    <div className="auth-page">
      <div className="register-container">

        <div className="auth-logo">
          ☕
        </div>

        <h1>
          CafeSoft
        </h1>

        <p className="auth-subtitle">
          {esAdministrador
            ? "Registrar nuevo usuario"
            : "Crea una cuenta para comenzar"}
        </p>

        <form
          onSubmit={registrar}
          className="auth-form"
        >

          {/* NOMBRE */}

          <label>
            Nombre completo
          </label>

          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) =>
              cambiarCampo(
                "nombre",
                e.target.value
              )
            }
            required
            disabled={cargando}
          />

          {/* CORREO */}

          <label>
            Correo electrónico
          </label>

          <input
            type="email"
            placeholder="correo@gmail.com"
            value={form.email}
            onChange={(e) =>
              cambiarCampo(
                "email",
                e.target.value
              )
            }
            required
            disabled={cargando}
          />

          {/* CONTRASEÑA */}

          <label>
            Contraseña
          </label>

          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) =>
              cambiarCampo(
                "password",
                e.target.value
              )
            }
            required
            minLength={8}
            disabled={cargando}
          />

          {/* DIRECCIÓN */}

          <label>
            Dirección
          </label>

          <input
            type="text"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) =>
              cambiarCampo(
                "direccion",
                e.target.value
              )
            }
            required
            disabled={cargando}
          />

          {/* TELÉFONO */}

          <label>
            Teléfono
          </label>

          <input
            type="text"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) =>
              cambiarCampo(
                "telefono",
                e.target.value
              )
            }
            required
            disabled={cargando}
          />

          {/* ======================================
              SELECTOR DE ROL
              SOLO ADMINISTRADOR
          ====================================== */}

          {esAdministrador && (
            <>
              <label>
                Tipo de rol
              </label>

              <select
                value={form.userTipo}
                onChange={(e) =>
                  cambiarRol(
                    e.target.value
                  )
                }
                disabled={cargando}
              >
                <option value={1}>
                  Usuario
                </option>

                <option value={3}>
                  Personalizado
                </option>

                <option value={0}>
                  Administrador
                </option>

                <option value={4}>
                  Repartidor
                </option>
              </select>
            </>
          )}

          {/* ======================================
              SELECTOR DE SUCURSAL
          ====================================== */}

          <label>
            Sucursal
          </label>

          <select
            value={form.sucursalId}
            onChange={(e) =>
              cambiarCampo(
                "sucursalId",
                e.target.value
              )
            }
            required
            disabled={
              cargando ||
              cargandoSucursales
            }
          >
            <option value="">
              {cargandoSucursales
                ? "Cargando sucursales..."
                : "Selecciona una sucursal"}
            </option>

            {sucursales.map(
              (sucursal) => (
                <option
                  key={sucursal.id}
                  value={sucursal.id}
                >
                  {sucursal.nombre}
                </option>
              )
            )}
          </select>

          {!cargandoSucursales &&
            sucursales.length === 0 && (
              <p
                style={{
                  color: "#c62828",
                  fontSize: "13px",
                  marginTop: "5px",
                }}
              >
                No hay sucursales
                disponibles.
              </p>
            )}

          {/* ======================================
              PERMISOS PERSONALIZADOS
              SOLO ADMIN
          ====================================== */}

          {esAdministrador &&
            form.userTipo === 3 && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  border:
                    "1px solid var(--borde)",
                  borderRadius: "10px",
                  background:
                    "var(--humo)",
                }}
              >
                <h3>
                  Permisos personalizados
                </h3>

                <p
                  style={{
                    fontSize: "14px",
                    marginBottom:
                      "15px",
                  }}
                >
                  Selecciona los apartados
                  que podrá utilizar este
                  usuario.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom:
                      "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      seleccionarTodos
                    }
                    disabled={cargando}
                  >
                    Seleccionar todos
                  </button>

                  <button
                    type="button"
                    onClick={
                      limpiarPermisos
                    }
                    disabled={cargando}
                  >
                    Limpiar selección
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "10px",
                  }}
                >
                  {PERMISOS.map(
                    (permiso) => (
                      <label
                        key={
                          permiso.id
                        }
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "10px",
                          cursor:
                            "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.permisos.includes(
                            permiso.id
                          )}
                          onChange={() =>
                            cambiarPermiso(
                              permiso.id
                            )
                          }
                          disabled={
                            cargando
                          }
                        />

                        <span>
                          {
                            permiso.texto
                          }
                        </span>
                      </label>
                    )
                  )}
                </div>

                <p
                  style={{
                    marginTop:
                      "15px",
                    fontSize:
                      "13px",
                  }}
                >
                  Permisos seleccionados:{" "}
                  <strong>
                    {
                      form.permisos
                        .length
                    }
                  </strong>
                </p>
              </div>
            )}

          {/* BOTÓN */}

          <button
            type="submit"
            className="btn-glow"
            disabled={
              cargando ||
              cargandoSucursales ||
              sucursales.length === 0
            }
          >
            <span>
              {cargando
                ? "Registrando..."
                : "Crear Cuenta"}
            </span>
          </button>

        </form>

        {/* LOGIN */}

        <p className="auth-footer">
          ¿Ya tienes una cuenta?{" "}

          <span
            onClick={() =>
              cambiarVista("login")
            }
            style={{
              cursor: "pointer",
            }}
          >
            Iniciar
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;
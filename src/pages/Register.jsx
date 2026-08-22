import { useState } from "react";
import api from "../services/api";

/**
 * HU-011 – Gestión de perfiles de usuarios
 * "Como administrador, quiero registrar, consultar y actualizar los perfiles
 * de los usuarios administrador, empleado y cliente."
 *
 * Este componente cumple con el criterio de aceptación:
 *  ✅ Formulario único para dar de alta y editar datos básicos del empleado.
 *
 * Cuando es invocado con `esAdministrador=true` permite al administrador
 * elegir el tipo de rol (Administrador, Usuario o Personalizado) antes de
 * registrar el perfil.  En modo público registra clientes (userTipo = 2).
 */

// HU-011 / HU-015: catálogo de permisos disponibles para roles personalizados
const PERMISOS = [
  {
    id: "crearProducto",
    texto: "☕ Crear Producto",
  },
  {
    id: "ventas",
    texto: "🧾 Ver Ventas",
  },
  {
    id: "pedidos",
    texto: "🍽️ Pedidos",
  },
  {
    id: "productos",
    texto: "📦 Ver Productos",
  },
  {
    id: "usuarios",
    texto: "👥 Ver Usuarios",
  },
  {
    id: "reportes",
    texto: "📊 Reportes",
  },
  {
    id: "carrito",
    texto: "🛒 Carrito de Compras",
  },
  {
    id: "registro",
    texto: "👤 Registrar Usuario",
  },
  {
    id: "insumos",
    texto: "🧂 Ver Insumos",
  },
  {
    id: "lotes",
    texto: "📦 Lotes de Insumos",
  },
  {
    id: "categorias",
    texto: "🏷️ Categorías",
  },
  {
    id: "proveedores",
    texto: "🚚 Proveedores",
  },
];

/**
 * HU-011 – Formulario de registro / alta de usuario
 *
 * @param {function} cambiarVista    - Callback para navegar entre vistas (login / register)
 * @param {boolean}  esAdministrador - true  → el admin registra empleados/administradores
 *                                     false → registro público de clientes
 */
function Register({
  cambiarVista,
  esAdministrador = false,
}) {
  /**
   * HU-011: estado del formulario con los datos básicos del perfil.
   * Campos requeridos por el criterio de aceptación:
   *   nombre, email, contraseña, dirección, teléfono, tipo de rol.
   */
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    direccion: "",
    telefono: "",

    /*
     * HU-011: tipo de usuario según quién realiza el registro.
     * Registro público:         Cliente = 2
     * Registro desde admin:     Usuario = 1
     */
    userTipo: esAdministrador ? 1 : 2,

    permisos: [],
  });

  const [cargando, setCargando] = useState(false);

  // HU-011: actualiza un campo individual del formulario de perfil
  const cambiarCampo = (campo, valor) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  /**
   * HU-011: cambia el tipo de rol del perfil que se está registrando.
   * Al cambiar el rol se limpian los permisos personalizados para evitar
   * inconsistencias entre rol y permisos.
   */
  const cambiarRol = (valor) => {
    const nuevoTipo = Number(valor);

    setForm((actual) => ({
      ...actual,
      userTipo: nuevoTipo,
      permisos: [],
    }));
  };

  const cambiarPermiso = (permiso) => {
    setForm((actual) => {
      const permisosActuales = actual.permisos || [];

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

  /**
   * HU-011 – Dar de alta un nuevo perfil de usuario
   * Envía los datos del formulario a POST /usuarios.
   * Construye el payload con los datos básicos exigidos por el criterio
   * de aceptación (nombre, email, contraseña, dirección, teléfono, rol).
   */
  const registrar = async (e) => {
    e.preventDefault();

    /*
     * Validación HU-015
     */
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

    setCargando(true);

    try {
      // HU-011: payload con los datos básicos del perfil a registrar
      const datosUsuario = {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        direccion: form.direccion.trim(),
        telefono: form.telefono.trim(),
        userTipo: form.userTipo,

        /*
         * Los permisos solamente se envían
         * cuando corresponde a un rol personalizado.
         */
        permisos:
          form.userTipo === 3
            ? form.permisos
            : [],
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
        userTipo: esAdministrador
          ? 1
          : 2,
        permisos: [],
      });

      cambiarVista("login");

    } catch (error) {

      console.error(
        "Error al registrar usuario:",
        error
      );

      const mensaje =
        error.response?.data?.error ||
        "No fue posible registrar el usuario.";

      alert(mensaje);

    } finally {

      setCargando(false);
    }
  };

  return (
    // HU-011: contenedor del formulario único de alta de usuario
    <div className="auth-page">
      <div className="register-container">

        <div className="auth-logo">
          ☕
        </div>

        <h1>CafeSoft</h1>

        {/* HU-011: subtítulo diferenciado según el contexto de registro */}
        <p className="auth-subtitle">
          {esAdministrador
            ? "Registrar nuevo usuario"
            : "Crea una cuenta para comenzar"}
        </p>

        {/*
         * HU-011 – Formulario único de alta de perfil
         * Criterio de aceptación: "Formulario único para dar de alta
         * y editar datos básicos del empleado."
         */}
        <form
          onSubmit={registrar}
          className="auth-form"
        >

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
            disabled={cargando}
          />

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
            disabled={cargando}
          />

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
            disabled={cargando}
          />

          {/*
           * ======================================
           * HU-015
           * SELECTOR DE ROL
           * ======================================
           */}

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
              </select>
            </>
          )}

          {/*
           * ======================================
           * HU-015
           * PERMISOS PERSONALIZADOS
           * ======================================
           */}

          {esAdministrador &&
            form.userTipo === 3 && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  background: "#fafafa",
                }}
              >

                <h3>
                  Permisos personalizados
                </h3>

                <p
                  style={{
                    fontSize: "14px",
                    marginBottom: "15px",
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
                    marginBottom: "15px",
                    flexWrap: "wrap",
                  }}
                >

                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    disabled={cargando}
                  >
                    Seleccionar todos
                  </button>

                  <button
                    type="button"
                    onClick={limpiarPermisos}
                    disabled={cargando}
                  >
                    Limpiar selección
                  </button>

                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >

                  {PERMISOS.map(
                    (permiso) => (
                      <label
                        key={permiso.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
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
                          {permiso.texto}
                        </span>

                      </label>
                    )
                  )}

                </div>

                <p
                  style={{
                    marginTop: "15px",
                    fontSize: "13px",
                  }}
                >
                  Permisos seleccionados:{" "}
                  <strong>
                    {form.permisos.length}
                  </strong>
                </p>

              </div>
            )}

          <button
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? "Registrando..."
              : "Crear Cuenta"}
          </button>

        </form>

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
            Iniciar sesión
          </span>

        </p>

      </div>
    </div>
  );
}

export default Register;
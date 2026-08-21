import { useState } from "react";
import api from "../services/api";

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

function Register({
  cambiarVista,
  esAdministrador = false,
}) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    direccion: "",
    telefono: "",

    /*
     * Registro público:
     * Cliente = 2
     *
     * Registro desde administrador:
     * Usuario = 1
     */
    userTipo: esAdministrador ? 1 : 2,

    permisos: [],
  });

  const [cargando, setCargando] = useState(false);

  const cambiarCampo = (campo, valor) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

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
    <div className="auth-page">
      <div className="register-container">

        <div className="auth-logo">
          ☕
        </div>

        <h1>CafeSoft</h1>

        <p className="auth-subtitle">
          {esAdministrador
            ? "Registrar nuevo usuario"
            : "Crea una cuenta para comenzar"}
        </p>

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
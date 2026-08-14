import { useState } from "react";
import api from "../services/api";

function Login({ cambiarVista, setUsuario }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    // Validación local (campos vacíos)
    if (!form.email.trim() || !form.password.trim()) {
      alert("Ingresa tu correo y contraseña");
      return;
    }

    setCargando(true);

    try {

      // Validación contra la API
      const res = await api.post("/usuarios/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const usuario = res.data.usuario;

      if (!usuario) {
        alert("No se recibió información del usuario");
        return;
      }

      // Guardar sesión
      localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );

      // Actualizar usuario en React
      setUsuario(usuario);

    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error
      );

      if (error.response) {
        const mensaje =
          error.response.data?.error ||
          "Correo o contraseña incorrectos";

        alert(mensaje);
      } else {
        alert(
          "No se pudo conectar con la API"
        );
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">

      {/* DERECHA — bienvenida */}
      <div className="auth-welcome">
        <h1>CafeSoft</h1>
        <h1>tu sistema de gestión</h1>
        <h1>para cafeterías y más.</h1>

        <ul>
          <li>
            Gestión de productos e insumos
          </li>

          <li>
            Control de ventas y carrito
          </li>

          <li>
            Reportes y estadísticas
          </li>

          <li>
            Administración de usuarios
          </li>
        </ul>
      </div>


      {/* IZQUIERDA — formulario */}
      <div className="login-container">

        <div className="auth-logo">
          ☕
        </div>

        <h1>CafeSoft</h1>

        <p className="auth-subtitle">
          Sistema de Gestión para Cafetería
        </p>

        <form
          onSubmit={iniciarSesion}
          className="auth-form"
        >

          {/* CORREO */}
          <label>
            Correo electrónico
          </label>

          <input
            type="email"
            placeholder="ejemplo@gmail.com"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
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
            placeholder="Ingresa tu contraseña"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            required
            disabled={cargando}
          />


          {/* BOTÓN */}
          <button
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? "Entrando..."
              : "Iniciar Sesión"}
          </button>

        </form>


        {/* REGISTRO */}
        <p className="auth-footer">

          ¿No tienes cuenta?{" "}

          <span
            onClick={() =>
              cambiarVista("registro")
            }
            style={{
              cursor: "pointer",
            }}
          >
            Crear una cuenta
          </span>

        </p>

      </div>

    </div>
  );
}

export default Login;
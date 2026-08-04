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

    const emailLimpio = form.email.trim().toLowerCase();
    const passwordLimpia = form.password.trim();

    if (!emailLimpio || !passwordLimpia) {
      alert("Completa todos los campos");
      return;
    }

    setCargando(true);

    try {
      const res = await api.post("/usuarios/login", {
        email: emailLimpio,
        password: passwordLimpia,
      });

      const usuario = res.data.usuario;

      if (!usuario) {
        alert("La API no devolvió los datos del usuario");
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(usuario));
      setUsuario(usuario);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      if (error.response?.status === 400) {
        alert(error.response?.data?.error || "Completa correctamente los datos");
      } else if (error.response?.status === 401) {
        alert("Correo o contraseña incorrectos");
      } else if (error.response?.status === 403) {
        alert("Tu usuario no tiene permiso para entrar");
      } else if (!error.response) {
        alert("No se pudo conectar con la API");
      } else {
        alert(error.response?.data?.error || "Ocurrió un error al iniciar sesión");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-container">
        <div className="auth-logo">☕</div>

        <h1>CafeSoft</h1>
        <p className="auth-subtitle">
          Sistema de Gestión para Cafetería
        </p>

        <form onSubmit={iniciarSesion} className="auth-form">
          <label>Correo electrónico</label>

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
            autoComplete="email"
            required
          />

          <label>Contraseña</label>

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
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={cargando}>
            {cargando ? "Entrando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{" "}
          <span onClick={() => cambiarVista("registro")}>
            Crear una cuenta
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
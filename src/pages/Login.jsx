import { useState } from "react";
import api from "../services/api";

function Login({ cambiarVista, setUsuario }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      alert("Ingresa tu correo y contraseña");
      return;
    }

    setCargando(true);

    try {
      const res = await api.post("/usuarios/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const usuario = res.data.usuario;
      const token   = res.data.token;

      if (!usuario) {
        alert("No se recibió información del usuario");
        return;
      }

      // Guardar token para peticiones autenticadas
      if (token) {
        localStorage.setItem("jwt_token", token);
      }

      // Guardar sesión
      localStorage.setItem("usuario", JSON.stringify(usuario));
      setUsuario(usuario);

    } catch (error) {
      if (error.response) {
        alert(error.response.data?.error || "Correo o contraseña incorrectos");
      } else {
        alert("No se pudo conectar con la API");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Izquierda — animación camión */}
      <div className="auth-welcome-car">
        <h2>☕ CafeSoft</h2>
        <p>Tu sistema de gestión para cafeterías</p>

        <div className="car-scene">
          <div className="car-body">
            <div className="car-window" />
            <div className="car-cargo" />
            <div className="car-door" />
            <div className="car-lights" />
          </div>
          <div className="car-wheels" />
          <div className="car-wheels car-wheels-2" />
          <div className="car-street" />
          <div className="car-post" />
        </div>
      </div>

      {/* Derecha — formulario */}
      <div className="login-container">

        <div className="auth-logo">☕</div>
        <h1>CafeSoft</h1>
        <p className="auth-subtitle">Sistema de Gestión para Cafetería</p>

        <form onSubmit={iniciarSesion} className="auth-form">

          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="ejemplo@gmail.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={cargando}
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={cargando}
          />

          <button type="submit" className="btn-glow" disabled={cargando}>
            <span>{cargando ? "Entrando..." : "Iniciar Sesión"}</span>
          </button>

        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{" "}
          <span onClick={() => cambiarVista("registro")} style={{ cursor: "pointer" }}>
            Crear una cuenta
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;

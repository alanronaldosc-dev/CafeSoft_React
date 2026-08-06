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
    setCargando(true);

    try {
      const res = await api.get("/usuarios");

      const usuarioEncontrado = res.data.find(
        (usuario) => usuario.email === form.email
      );

      if (usuarioEncontrado) {
        localStorage.setItem("usuario", JSON.stringify(usuarioEncontrado));
        setUsuario(usuarioEncontrado);
      } else {
        alert("Correo no encontrado");
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      alert("No se pudo conectar con la API");
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
      <h1>para cafeterías y mas.</h1>
      <ul>
        <li>Gestión de productos e insumos</li>
        <li>Control de ventas y carrito</li>
        <li>Reportes y estadísticas</li>
        <li>Administración de usuarios</li>
      </ul>
    </div>

      {/* IZQUIERDA — formulario */}
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
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
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
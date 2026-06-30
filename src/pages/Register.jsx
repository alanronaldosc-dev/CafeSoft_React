import { useState } from "react";
import api from "../services/api";

function Register({ cambiarVista }) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    direccion: "",
    telefono: "",
    user_type: 2,
  });

  const [cargando, setCargando] = useState(false);

  const registrar = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      await api.post("/usuarios/registro", form);

      alert("✅ Usuario registrado correctamente");

      setForm({
        nombre: "",
        email: "",
        password: "",
        direccion: "",
        telefono: "",
        user_type: 2,
      });

      cambiarVista("login");
    } catch (error) {
      console.error(error);
      alert("No fue posible registrar el usuario.");
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
          Crea una cuenta para comenzar
        </p>

        <form onSubmit={registrar} className="auth-form">

          <label>Nombre completo</label>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) =>
              setForm({ ...form, nombre: e.target.value })
            }
            required
          />

          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="correo@gmail.com"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) =>
              setForm({ ...form, direccion: e.target.value })
            }
          />

          <label>Teléfono</label>
          <input
            type="text"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) =>
              setForm({ ...form, telefono: e.target.value })
            }
          />

          <button type="submit" disabled={cargando}>
            {cargando ? "Registrando..." : "Crear Cuenta"}
          </button>

        </form>

        <p className="auth-footer">
          ¿Ya tienes una cuenta?{" "}
          <span onClick={() => cambiarVista("login")}>
            Iniciar sesión
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;
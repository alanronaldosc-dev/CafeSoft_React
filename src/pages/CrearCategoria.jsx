import { useState } from "react";
import api from "../services/api";

function CrearCategoria({ onVolver }) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const registrarCategoria = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await api.post("/categorias", form);
      alert("Categoría creada correctamente");
      onVolver();
    } catch (error) {
      if (error.response) {
        alert("Error: " + (error.response.data?.message || JSON.stringify(error.response.data)));
      } else {
        alert("No se pudo conectar con la API.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="panel">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={onVolver}>← Volver</button>
        <h1>🏷️ Nueva Categoría</h1>
      </div>

      <form onSubmit={registrarCategoria} className="auth-form">
        <label>Nombre *</label>
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej: Bebidas Calientes"
          maxLength={100}
          required
        />

        <label>Descripción</label>
        <input
          type="text"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Ej: Cafés y tés calientes"
          maxLength={255}
        />

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
          />
          Categoría activa
        </label>

        <button type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Crear Categoría"}
        </button>
      </form>
    </section>
  );
}

export default CrearCategoria;

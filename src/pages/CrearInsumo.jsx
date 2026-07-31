import { useState } from "react";
import api from "../services/api";

function CrearInsumo({ onVolver }) {
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    unidadMedida: "",
    proveedor: "",
    precio: "",
  });

  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const registrarInsumo = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const res = await api.post("/insumos", form);
      console.log("Insumo registrado:", res.data);
      alert("Insumo registrado correctamente");
      setForm({
        nombre: "",
        tipo: "",
        unidadMedida: "",
        proveedor: "",
        precio: "",
      });
      onVolver();
    } catch (error) {
      console.error("Error completo:", error);
      if (error.response) {
        alert(
          "Error " +
            error.response.status +
            "\n\n" +
            JSON.stringify(error.response.data)
        );
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
        <h1>🧂 Crear Insumo</h1>
      </div>

      <form onSubmit={registrarInsumo} className="auth-form">
        <label>Nombre</label>
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <label>Tipo</label>
        <input
          type="text"
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          required
        />

        <label>Tipo de Cantidad</label>
        <select
        name="unidadMedida"
        value={form.unidadMedida}
        onChange={handleChange}
        required
        >
        <option value="">-- Selecciona una opción --</option>
        <option value="piezas">Piezas</option>
        <option value="kilogramos">Kilos</option>
        <option value="litros">Litros</option>
        </select>

        <label>Proveedor</label>
        <input
          type="text"
          name="proveedor"
          value={form.proveedor}
          onChange={handleChange}
          required
        />

        <label>Precio</label>
        <input
          type="text"
          name="precio"
          value={form.precio}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Registrar Insumo"}
        </button>
      </form>
    </section>
  );
}

export default CrearInsumo;

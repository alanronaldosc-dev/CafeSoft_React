import { useState, useEffect } from "react";
import api from "../services/api";

function CrearLote({ onVolver }) {
  const [insumos, setInsumos] = useState([]);
  const [form, setForm] = useState({
    insumoId: "",
    cantidad: "",
    fechaCaducidad: "",
    observaciones: "",
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.get("/insumos").then((res) => setInsumos(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const registrarLote = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const payload = {
        insumoId: parseInt(form.insumoId),
        cantidad: parseFloat(form.cantidad),
        fechaCaducidad: form.fechaCaducidad,
        observaciones: form.observaciones || null,
      };
      await api.post("/lotes", payload);
      alert("Lote registrado correctamente");
      setForm({ insumoId: "", cantidad: "", fechaCaducidad: "", observaciones: "" });
      onVolver();
    } catch (error) {
      if (error.response) {
        alert("Error " + error.response.status + "\n\n" + JSON.stringify(error.response.data));
      } else {
        alert("No se pudo conectar con la API.");
      }
    } finally {
      setCargando(false);
    }
  };

  const insumoSeleccionado = insumos.find((i) => i.id === parseInt(form.insumoId));

  return (
    <section className="panel">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={onVolver}>← Volver</button>
        <h1>📦 Registrar Lote</h1>
      </div>

      <form onSubmit={registrarLote} className="auth-form">
        <label>Insumo</label>
        <select name="insumoId" value={form.insumoId} onChange={handleChange} required>
          <option value="">-- Selecciona un insumo --</option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre} ({i.unidadMedida})
            </option>
          ))}
        </select>

        <label>
          Cantidad {insumoSeleccionado ? `(${insumoSeleccionado.unidadMedida})` : ""}
        </label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          name="cantidad"
          value={form.cantidad}
          onChange={handleChange}
          required
        />

        <label>Fecha de Caducidad</label>
        <input
          type="date"
          name="fechaCaducidad"
          value={form.fechaCaducidad}
          onChange={handleChange}
          required
        />

        <label>Observaciones (opcional)</label>
        <input
          type="text"
          name="observaciones"
          value={form.observaciones}
          onChange={handleChange}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Registrar Lote"}
        </button>
      </form>
    </section>
  );
}

export default CrearLote;

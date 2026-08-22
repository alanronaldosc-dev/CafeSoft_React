import { useState, useEffect } from "react";
import api from "../services/api";

function CrearLote({ onVolver }) {
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    insumoId: "",
    proveedorId: "",
    cantidad: "",
    fechaCaducidad: "",
    observaciones: "",
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .get("/insumos")
      .then((res) => setInsumos(Array.isArray(res.data) ? res.data : []));
    api
      .get("/proveedores")
      .then((res) => {
        const lista = Array.isArray(res.data) ? res.data : [];
        setProveedores(lista.filter((p) => p.activo !== false));
      })
      .catch(() => setProveedores([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "insumoId" && value) {
        const insumo = insumos.find((i) => i.id === parseInt(value, 10));
        if (insumo?.proveedorId) {
          next.proveedorId = String(insumo.proveedorId);
        }
      }
      return next;
    });
  };

  const registrarLote = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const payload = {
        insumoId: parseInt(form.insumoId, 10),
        proveedorId: form.proveedorId ? parseInt(form.proveedorId, 10) : null,
        cantidad: parseFloat(form.cantidad),
        fechaCaducidad: form.fechaCaducidad,
        observaciones: form.observaciones || null,
      };
      await api.post("/lotes", payload);
      alert("Lote registrado correctamente");
      setForm({
        insumoId: "",
        proveedorId: "",
        cantidad: "",
        fechaCaducidad: "",
        observaciones: "",
      });
      onVolver();
    } catch (error) {
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

  const insumoSeleccionado = insumos.find(
    (i) => i.id === parseInt(form.insumoId, 10)
  );

  return (
    <section className="panel">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={onVolver}>← Volver</button>
        <h1>📦 Registrar Lote</h1>
      </div>

      <form onSubmit={registrarLote} className="auth-form">
        <label>Insumo</label>
        <select
          name="insumoId"
          value={form.insumoId}
          onChange={handleChange}
          required
        >
          <option value="">-- Selecciona un insumo --</option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre} ({i.unidadMedida})
              {i.proveedorNombre ? ` — ${i.proveedorNombre}` : ""}
            </option>
          ))}
        </select>

        <label>Proveedor del lote</label>
        <select
          name="proveedorId"
          value={form.proveedorId}
          onChange={handleChange}
        >
          <option value="">
            -- Usar proveedor del insumo / sin especificar --
          </option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombreEmpresa}
            </option>
          ))}
        </select>

        <label>
          Cantidad{" "}
          {insumoSeleccionado ? `(${insumoSeleccionado.unidadMedida})` : ""}
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

        <label>Observaciones</label>
        <textarea
          name="observaciones"
          value={form.observaciones}
          onChange={handleChange}
          rows={3}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Registrar Lote"}
        </button>
      </form>
    </section>
  );
}

export default CrearLote;
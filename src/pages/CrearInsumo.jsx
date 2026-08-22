import { useState, useEffect } from "react";
import api from "../services/api";

function CrearInsumo({ onVolver }) {
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    unidadMedida: "",
    proveedorId: "",
    precio: "",
  });
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .get("/proveedores")
      .then((res) => {
        const lista = Array.isArray(res.data) ? res.data : [];
        setProveedores(lista.filter((p) => p.activo !== false));
      })
      .catch(() => setProveedores([]));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const registrarInsumo = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const payload = {
        nombre: form.nombre,
        tipo: form.tipo,
        unidadMedida: form.unidadMedida,
        precio: parseFloat(form.precio),
        proveedorId: form.proveedorId ? parseInt(form.proveedorId, 10) : null,
      };
      await api.post("/insumos", payload);
      alert("Insumo registrado correctamente");
      setForm({
        nombre: "",
        tipo: "",
        unidadMedida: "",
        proveedorId: "",
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
        <select
          name="proveedorId"
          value={form.proveedorId}
          onChange={handleChange}
        >
          <option value="">-- Selecciona un proveedor (opcional) --</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombreEmpresa}
              {p.insumoPrincipal ? ` — ${p.insumoPrincipal}` : ""}
            </option>
          ))}
        </select>

        <label>Precio</label>
        <input
          type="number"
          step="0.01"
          min="0"
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
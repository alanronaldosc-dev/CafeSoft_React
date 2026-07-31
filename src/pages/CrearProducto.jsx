import { useState, useEffect } from "react";
import api from "../services/api";

function CrearProducto() {
  const [form, setForm] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
  });

  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.get("/inventario")
      .then((res) => {
        console.log("Inventario cargado:", res.data);
        setInsumosDisponibles(res.data);
      })
      .catch((err) => {
        console.error("Error cargando inventario:", err);
        alert("No se pudo cargar el inventario");
      });
  }, []);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarInsumo = () => {
    if (!insumoSeleccionado || !cantidadInsumo || parseFloat(cantidadInsumo) <= 0) {
      alert("Selecciona un insumo y una cantidad válida");
      return;
    }
    const insumo = insumosDisponibles.find((i) => i.id === parseInt(insumoSeleccionado));
    if (!insumo) return;

    // Evitar duplicados
    if (insumosSeleccionados.find((i) => i.insumoId === insumo.id)) {
      alert("Este insumo ya fue agregado");
      return;
    }

    setInsumosSeleccionados([
      ...insumosSeleccionados,
      {
        insumoId: insumo.id,
        insumoNombre: insumo.nombre,
        cantidad: parseFloat(cantidadInsumo),
        unidadMedida: insumo.unidadMedida,
      },
    ]);
    setInsumoSeleccionado("");
    setCantidadInsumo("");
  };

  const quitarInsumo = (insumoId) => {
    setInsumosSeleccionados(insumosSeleccionados.filter((i) => i.insumoId !== insumoId));
  };

  const registrarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);

    const payload = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      descripcion: form.descripcion,
      insumos: insumosSeleccionados.map((i) => ({
        insumoId: i.insumoId,
        cantidad: i.cantidad,
        unidadMedida: i.unidadMedida,
      })),
    };

    try {
      await api.post("/productos", payload);
      alert("Producto registrado correctamente");
      setForm({ nombre: "", precio: "", descripcion: "" });
      setInsumosSeleccionados([]);
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

  return (
    <section className="panel">
      <h1>☕ Crear Producto</h1>

      <form onSubmit={registrarProducto} className="auth-form">
        <label>Nombre del producto</label>
        <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />

        <label>Precio</label>
        <input type="number" step="0.01" name="precio" value={form.precio} onChange={handleChange} required />

        <label>Descripción</label>
        <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} required />

        <hr />
        <label>Agregar insumos</label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={insumoSeleccionado}
            onChange={(e) => setInsumoSeleccionado(e.target.value)}
          >
            <option value="">-- Selecciona un insumo --</option>
            {insumosDisponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.unidadMedida})
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Cantidad"
            value={cantidadInsumo}
            onChange={(e) => setCantidadInsumo(e.target.value)}
            style={{ width: "120px" }}
          />

          <button type="button" onClick={agregarInsumo}>+ Agregar</button>
        </div>

        {insumosSeleccionados.length > 0 && (
          <table style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {insumosSeleccionados.map((i) => (
                <tr key={i.insumoId}>
                  <td>{i.insumoNombre}</td>
                  <td>{i.cantidad}</td>
                  <td>{i.unidadMedida}</td>
                  <td>
                    <button type="button" onClick={() => quitarInsumo(i.insumoId)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button type="submit" disabled={cargando} style={{ marginTop: "1rem" }}>
          {cargando ? "Guardando..." : "Registrar Producto"}
        </button>
      </form>
    </section>
  );
}

export default CrearProducto;

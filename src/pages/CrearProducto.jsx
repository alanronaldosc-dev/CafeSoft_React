import { useState, useEffect } from "react";
import api from "../services/api";

function CrearProducto() {
  const [modo, setModo] = useState("definir"); // "definir" | "producir"

  // --- Modo definir (receta) ---
  const [form, setForm] = useState({ nombre: "", precio: "", descripcion: "" });
  const [imagenBase64, setImagenBase64] = useState(null);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState("");
  const [cargando, setCargando] = useState(false);

  // --- Modo producir ---
  const [productos, setProductos] = useState([]);
  const [producirForm, setProducirForm] = useState({
    productoId: "",
    cantidad: "",
    fechaCaducidad: "",
    observaciones: "",
  });
  const [produciendo, setProduciendo] = useState(false);
  const [mensajeProducir, setMensajeProducir] = useState(null);

  useEffect(() => {
    // Cargar insumos del inventario (para la receta)
    api.get("/inventario")
      .then((res) => setInsumosDisponibles(Array.isArray(res.data) ? res.data : []))
      .catch(() => alert("No se pudo cargar el inventario"));

    // Cargar productos (para producir)
    api.get("/productos")
      .then((res) => setProductos(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
  }, []);

  // ── Modo definir ──
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagenBase64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const agregarInsumo = () => {
    if (!insumoSeleccionado || !cantidadInsumo || parseFloat(cantidadInsumo) <= 0) {
      alert("Selecciona un insumo y una cantidad válida");
      return;
    }
    const insumo = insumosDisponibles.find((i) => i.id === parseInt(insumoSeleccionado));
    if (!insumo) return;
    if (insumosSeleccionados.find((i) => i.insumoId === insumo.id)) {
      alert("Este insumo ya fue agregado");
      return;
    }
    setInsumosSeleccionados([...insumosSeleccionados, {
      insumoId: insumo.id,
      insumoNombre: insumo.nombre,
      cantidad: parseFloat(cantidadInsumo),
      unidadMedida: insumo.unidadMedida,
    }]);
    setInsumoSeleccionado("");
    setCantidadInsumo("");
  };

  const quitarInsumo = (insumoId) =>
    setInsumosSeleccionados(insumosSeleccionados.filter((i) => i.insumoId !== insumoId));

  const registrarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);
    const payload = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      descripcion: form.descripcion,
      imagen: imagenBase64 || null,
      insumos: insumosSeleccionados.map((i) => ({
        insumoId: i.insumoId,
        cantidad: i.cantidad,
        unidadMedida: i.unidadMedida,
      })),
    };
    try {
      await api.post("/productos", payload);
      alert("✅ Producto (receta) registrado correctamente");
      setForm({ nombre: "", precio: "", descripcion: "" });
      setInsumosSeleccionados([]);
      setImagenBase64(null);
      // Refrescar lista de productos para el modo producir
      const res = await api.get("/productos");
      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert("Error: " + (error.response ? JSON.stringify(error.response.data) : "Sin conexión"));
    } finally {
      setCargando(false);
    }
  };

  // ── Modo producir ──
  const handleProducirChange = (e) =>
    setProducirForm({ ...producirForm, [e.target.name]: e.target.value });

  const producirProducto = async (e) => {
    e.preventDefault();
    if (!producirForm.productoId || !producirForm.cantidad || Number(producirForm.cantidad) <= 0) {
      setMensajeProducir({ tipo: "error", texto: "Selecciona un producto y una cantidad válida." });
      return;
    }
    setProduciendo(true);
    setMensajeProducir(null);
    try {
      await api.post("/lotes/producir", {
        productoId: Number(producirForm.productoId),
        cantidad: Number(producirForm.cantidad),
        fechaCaducidad: producirForm.fechaCaducidad || null,
        observaciones: producirForm.observaciones || null,
      });
      setMensajeProducir({ tipo: "ok", texto: `✅ Se produjeron ${producirForm.cantidad} unidades y se descontaron los insumos del inventario.` });
      setProducirForm({ productoId: "", cantidad: "", fechaCaducidad: "", observaciones: "" });
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || "Error al producir";
      setMensajeProducir({ tipo: "error", texto: "❌ " + msg });
    } finally {
      setProduciendo(false);
    }
  };

  return (
    <section className="panel">
      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => setModo("definir")}
          style={{
            padding: "10px 20px",
            background: modo === "definir" ? "var(--primario, #3a2010)" : "transparent",
            color: modo === "definir" ? "#fff" : "inherit",
            border: "1px solid var(--borde, #ccc)",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          📋 Definir Producto (Receta)
        </button>
        <button
          type="button"
          onClick={() => setModo("producir")}
          style={{
            padding: "10px 20px",
            background: modo === "producir" ? "var(--primario, #3a2010)" : "transparent",
            color: modo === "producir" ? "#fff" : "inherit",
            border: "1px solid var(--borde, #ccc)",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🏭 Producir Unidades
        </button>
      </div>

      {/* ── MODO DEFINIR ── */}
      {modo === "definir" && (
        <>
          <h1>☕ Definir Producto</h1>
          <p style={{ color: "var(--texto-suave)", fontSize: "14px", marginBottom: "16px" }}>
            Define la receta del producto (nombre, precio, insumos que necesita).
          </p>
          <form onSubmit={registrarProducto} className="auth-form">
            <label>Nombre del producto</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />

            <label>Precio</label>
            <input type="number" step="0.01" name="precio" value={form.precio} onChange={handleChange} required />

            <label>Descripción</label>
            <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} required />

            <label>Imagen</label>
            <input type="file" accept="image/*" onChange={handleImagen} />
            {imagenBase64 && (
              <img src={`data:image/jpeg;base64,${imagenBase64}`} alt="preview"
                style={{ width: "100px", marginTop: "0.5rem" }} />
            )}

            <hr />
            <label>Agregar insumos a la receta</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <select value={insumoSeleccionado} onChange={(e) => setInsumoSeleccionado(e.target.value)}>
                <option value="">-- Selecciona un insumo --</option>
                {insumosDisponibles.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre} ({i.unidadMedida})</option>
                ))}
              </select>
              <input type="number" step="0.001" min="0.001" placeholder="Cantidad"
                value={cantidadInsumo} onChange={(e) => setCantidadInsumo(e.target.value)}
                style={{ width: "120px" }} />
              <button type="button" onClick={agregarInsumo}>+ Agregar</button>
            </div>

            {insumosSeleccionados.length > 0 && (
              <table style={{ marginTop: "1rem" }}>
                <thead>
                  <tr><th>Insumo</th><th>Cantidad</th><th>Unidad</th><th></th></tr>
                </thead>
                <tbody>
                  {insumosSeleccionados.map((i) => (
                    <tr key={i.insumoId}>
                      <td>{i.insumoNombre}</td>
                      <td>{i.cantidad}</td>
                      <td>{i.unidadMedida}</td>
                      <td><button type="button" onClick={() => quitarInsumo(i.insumoId)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button type="submit" disabled={cargando} style={{ marginTop: "1rem" }}>
              {cargando ? "Guardando..." : "Registrar Receta"}
            </button>
          </form>
        </>
      )}

      {/* ── MODO PRODUCIR ── */}
      {modo === "producir" && (
        <>
          <h1>🏭 Producir Unidades</h1>
          <p style={{ color: "var(--texto-suave)", fontSize: "14px", marginBottom: "16px" }}>
            Selecciona un producto y cuántas unidades vas a producir. Se descontarán
            automáticamente los insumos del inventario.
          </p>

          <form onSubmit={producirProducto} className="auth-form">
            <label>Producto *</label>
            <select name="productoId" value={producirForm.productoId} onChange={handleProducirChange} required>
              <option value="">— Selecciona un producto —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (${p.precio})
                  {p.insumos?.length > 0 ? ` — ${p.insumos.length} insumo(s)` : " — sin receta"}
                </option>
              ))}
            </select>

            {/* Mostrar receta del producto seleccionado */}
            {producirForm.productoId && (() => {
              const prod = productos.find((p) => p.id === Number(producirForm.productoId));
              if (!prod || !prod.insumos?.length) return null;
              return (
                <div style={{ background: "#f5f0eb", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                  <p style={{ fontWeight: "700", marginBottom: "8px", fontSize: "13px" }}>
                    📋 Receta (por unidad):
                  </p>
                  {prod.insumos.map((ins) => (
                    <p key={ins.insumoId} style={{ margin: "4px 0", fontSize: "13px" }}>
                      • {ins.insumoNombre}: {ins.cantidad} {ins.unidadMedida}
                    </p>
                  ))}
                </div>
              );
            })()}

            <label>Cantidad a producir *</label>
            <input type="number" name="cantidad" min="1" step="1"
              value={producirForm.cantidad} onChange={handleProducirChange}
              placeholder="Ej: 5" required />

            {/* Costo estimado */}
            {producirForm.productoId && producirForm.cantidad > 0 && (() => {
              const prod = productos.find((p) => p.id === Number(producirForm.productoId));
              if (!prod || !prod.insumos?.length) return null;
              return (
                <div style={{ background: "#e8f4fd", borderRadius: "8px", padding: "10px", fontSize: "13px" }}>
                  <strong>📦 Insumos que se descontarán:</strong>
                  {prod.insumos.map((ins) => (
                    <p key={ins.insumoId} style={{ margin: "3px 0" }}>
                      • {ins.insumoNombre}: {(ins.cantidad * Number(producirForm.cantidad)).toFixed(3)} {ins.unidadMedida}
                    </p>
                  ))}
                </div>
              );
            })()}

            <label>Fecha de caducidad</label>
            <input type="date" name="fechaCaducidad"
              value={producirForm.fechaCaducidad} onChange={handleProducirChange} />

            <label>Observaciones</label>
            <input type="text" name="observaciones"
              value={producirForm.observaciones} onChange={handleProducirChange}
              placeholder="Ej: Producción turno mañana" />

            {mensajeProducir && (
              <div style={{
                padding: "10px 14px", borderRadius: "8px",
                background: mensajeProducir.tipo === "ok" ? "#E8FEF0" : "#FEF0EE",
                color: mensajeProducir.tipo === "ok" ? "#2A8B5A" : "#E05252",
                fontSize: "14px", fontWeight: "500",
              }}>
                {mensajeProducir.texto}
              </div>
            )}

            <button type="submit" disabled={produciendo} style={{ marginTop: "1rem" }}>
              {produciendo ? "Produciendo..." : "🏭 Confirmar Producción"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default CrearProducto;

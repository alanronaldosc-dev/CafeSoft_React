import { useEffect, useState } from "react";
import api from "../services/api";

function RecibirProducto({ onVolver }) {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    api.get("/productos")
      .then((res) => setProductos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error al cargar productos:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productoId || !cantidad || Number(cantidad) <= 0) {
      setMensaje({ tipo: "error", texto: "Selecciona un producto y una cantidad válida." });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      await api.post("/inventario/producto", {
        productoId: Number(productoId),
        cantidad: Number(cantidad),
      });
      setMensaje({ tipo: "ok", texto: "✅ Producto recibido correctamente en inventario." });
      setProductoId("");
      setCantidad("");
    } catch (err) {
      setMensaje({ tipo: "error", texto: "❌ No se pudo registrar el ingreso." });
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "520px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>📥 Recibir Producto</h1>
          <p style={{ margin: "4px 0 0", color: "var(--texto-suave)", fontSize: "14px" }}>
            Agrega existencias de un producto terminado al inventario
          </p>
        </div>
        {onVolver && (
          <button onClick={onVolver} style={{ padding: "8px 16px", cursor: "pointer" }}>
            ← Volver
          </button>
        )}
      </div>

      {/* Formulario */}
      <div style={{
        background: "var(--fondo-card)", border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)", padding: "24px",
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
              Producto *
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: "1px solid var(--borde)", fontSize: "14px" }}
              required
            >
              <option value="">— Selecciona un producto —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (${p.precio})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
              Cantidad recibida *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej: 10"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: "1px solid var(--borde)", fontSize: "14px", boxSizing: "border-box" }}
              required
            />
          </div>

          {mensaje && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px",
              background: mensaje.tipo === "ok" ? "#E8FEF0" : "#FEF0EE",
              color: mensaje.tipo === "ok" ? "#2A8B5A" : "#E05252",
              fontSize: "14px", fontWeight: "500",
            }}>
              {mensaje.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            style={{ padding: "12px", cursor: "pointer", fontWeight: "600" }}
          >
            {guardando ? "Registrando..." : "Registrar ingreso"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RecibirProducto;

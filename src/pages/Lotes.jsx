import { useEffect, useState } from "react";
import api from "../services/api";

function Lotes({ onCrear }) {
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerLotes();
  }, []);

  const obtenerLotes = async () => {
    try {
      const res = await api.get("/lotes");
      setLotes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert("No se pudieron cargar los lotes");
    } finally {
      setCargando(false);
    }
  };

  const eliminarLote = async (id) => {
    if (!confirm("¿Eliminar este lote?")) return;
    try {
      await api.delete(`/lotes/${id}`);
      setLotes(lotes.filter((l) => l.id !== id));
    } catch (error) {
      alert("No se pudo eliminar el lote");
    }
  };

  return (
    <section className="panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>📦 Lotes de Insumos</h1>
        <button onClick={onCrear}>+ Registrar Lote</button>
      </div>

      {cargando ? (
        <p>Cargando lotes...</p>
      ) : lotes.length === 0 ? (
        <p>No hay lotes registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Insumo</th>
              <th>Proveedor</th>
              <th>Cantidad</th>
              <th>Fecha Entrada</th>
              <th>Fecha Caducidad</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote) => (
              <tr key={lote.id} style={{
                background: lote.tipoLote === "produccion" ? "#f0f9f0" : undefined
              }}>
                <td>{lote.id}</td>
                <td>
                  {lote.tipoLote === "produccion"
                    ? <span>🏭 <strong>{lote.productoNombre}</strong></span>
                    : lote.insumoNombre}
                </td>
                <td>{lote.proveedorNombre || (lote.tipoLote === "produccion" ? "Producción propia" : "—")}</td>
                <td>{lote.cantidad} {lote.tipoLote === "produccion" ? "pzs" : lote.insumoUnidad}</td>
                <td>{lote.fechaEntrada}</td>
                <td>{lote.fechaCaducidad}</td>
                <td>{lote.observaciones || "—"}</td>
                <td>
                  {lote.tipoLote === "produccion"
                    ? <span style={{ background: "#e8f4fd", color: "#1a6fa8", borderRadius: "999px",
                        padding: "3px 10px", fontSize: "12px", fontWeight: "600" }}>Producción</span>
                    : <button onClick={() => eliminarLote(lote.id)}>🗑️ Eliminar</button>}
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      )}
    </section>
  );
}

export default Lotes;
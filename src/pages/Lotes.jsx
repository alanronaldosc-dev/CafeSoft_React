import { useEffect, useState } from "react";
import api from "../services/api";

function Lotes({ onCrear, usuario }) {
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerLotes();
  }, [usuario]);

  const obtenerLotes = async () => {
    try {
      const res = await api.get("/lotes");
      const todos = Array.isArray(res.data) ? res.data : [];

      const sucursalId = usuario?.sucursalId;
      const filtrados = sucursalId
        ? todos.filter((l) => Number(l.sucursalId) === Number(sucursalId))
        : todos;

      setLotes(filtrados);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>📦 Lotes de Insumos</h1>
        <button onClick={onCrear}>+ Registrar Lote</button>
      </div>

      {cargando ? (
        <p>Cargando lotes...</p>
      ) : lotes.length === 0 ? (
        <p>No hay lotes registrados para esta sucursal.</p>
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
              <th>Sucursal</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote) => (
              <tr key={lote.id} style={{
                background: lote.tipoLote === "produccion" ? "#1A2B1A" : undefined
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
                <td>{lote.sucursalNombre || "—"}</td>
                <td>{lote.observaciones || "—"}</td>
                <td>
                  {lote.tipoLote === "produccion"
                    ? <span style={{ background: "#0D1E2B", color: "#4A9FD4", borderRadius: "999px",
                        padding: "3px 10px", fontSize: "12px", fontWeight: "600",
                        border: "1px solid #4A9FD433" }}>Producción</span>
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

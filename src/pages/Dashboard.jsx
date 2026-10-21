import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard({ usuario }) {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = () => {
    const sucursalId = usuario?.sucursalId;

    // Todos ven solo su sucursal, sin excepción
    const url = sucursalId
      ? `/inventario/sucursal/${sucursalId}`
      : "/inventario";

    api.get(url)
      .then((res) => setInventario(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("No se pudo cargar el inventario."))
      .finally(() => setCargando(false));
  };

  const eliminarInsumo = async (id, nombre) => {
    if (!confirm(`¿Eliminar el insumo "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/inventario/${id}`);
      setInventario((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "No se pudo eliminar el insumo";
      alert("Error: " + msg);
    }
  };

  if (cargando) return (
    <section className="panel">
      <h1>📊 Panel de Estado</h1>
      <p style={{ color: "#8D9DB6" }}>Cargando datos...</p>
    </section>
  );

  if (error) return (
    <section className="panel">
      <h1>📊 Panel de Estado</h1>
      <p style={{ color: "#E05252" }}>{error}</p>
    </section>
  );

  const insumos   = inventario.filter((i) => i.tipo !== "producto");
  const productos = inventario.filter((i) => i.tipo === "producto");

  const getBadge = (cantidad, minima) => {
    if (cantidad <= 0)      return { label: "Agotado",    color: "#E05252", bg: "#FEF0EE" };
    if (cantidad <= minima) return { label: "Stock bajo", color: "#C8783A", bg: "#FEF3E8" };
    return                         { label: "Normal",     color: "#3AC87A", bg: "#E8FEF0" };
  };

  const Badge = ({ color, bg, label }) => (
    <span style={{
      background: bg, color, border: `1px solid ${color}33`,
      borderRadius: "999px", padding: "3px 12px",
      fontSize: "12px", fontWeight: "600",
    }}>
      {label}
    </span>
  );

  return (
    <section className="panel">
      <h1>📊 Panel de Estado</h1>
      <p style={{ color: "#8D9DB6", marginBottom: "1.5rem" }}>
        Existencias en tiempo real de insumos y productos terminados.
      </p>

      {/* PRODUCTOS TERMINADOS */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ borderBottom: "2px solid #2D3B4E", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#D4E5F5" }}>
          📦 Productos terminados ({productos.length})
        </h2>
        {productos.length === 0 ? (
          <p style={{ color: "#5A6B7E" }}>Sin productos en inventario.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {productos.map((p) => {
              const badge = getBadge(p.cantidad, p.cantidadMinima);
              return (
                <div key={p.id} style={{
                  background: "#1E2B3A", border: `1px solid ${badge.color}44`,
                  borderRadius: "10px", padding: "1rem", textAlign: "center",
                }}>
                  <span style={{ fontSize: "2rem" }}>📦</span>
                  <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1rem", color: "#D4E5F5" }}>{p.nombre}</h3>
                  <p style={{ fontSize: "1.8rem", fontWeight: "800", color: badge.color, margin: "0.25rem 0" }}>
                    {p.cantidad}
                  </p>
                  <p style={{ color: "#8D9DB6", fontSize: "0.8rem", margin: 0 }}>piezas en existencia</p>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Badge color={badge.color} bg={badge.bg} label={badge.label} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INSUMOS */}
      <div>
        <h2 style={{ borderBottom: "2px solid #2D3B4E", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#D4E5F5" }}>
          🧂 Insumos en inventario ({insumos.length})
        </h2>
        {insumos.length === 0 ? (
          <p style={{ color: "#5A6B7E" }}>Sin insumos registrados.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1A2332" }}>
                <th style={th}>Insumo</th>
                <th style={th}>Tipo</th>
                <th style={th}>Existencia</th>
                <th style={th}>Unidad</th>
                <th style={th}>Mínimo</th>
                <th style={th}>Proveedor</th>
                <th style={th}>Estado</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((ins) => {
                const badge = getBadge(ins.cantidad, ins.cantidadMinima);
                return (
                  <tr key={ins.id} style={{ borderBottom: "1px solid #2D3B4E" }}>
                    <td style={td}><strong>{ins.nombre}</strong></td>
                    <td style={td}>{ins.tipo}</td>
                    <td style={{ ...td, fontWeight: "700", color: badge.color, fontSize: "1rem" }}>{ins.cantidad}</td>
                    <td style={td}>{ins.unidadMedida}</td>
                    <td style={{ ...td, color: "#8D9DB6" }}>{ins.cantidadMinima}</td>
                    <td style={td}>{ins.proveedor || "—"}</td>
                    <td style={td}><Badge color={badge.color} bg={badge.bg} label={badge.label} /></td>
                    <td style={td}>
                      <button onClick={() => eliminarInsumo(ins.id, ins.nombre)} style={{
                        background: "#2D1A1A", color: "#E05252", border: "1px solid #E0525233",
                        borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
                        fontSize: "12px", fontWeight: "600",
                      }}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

const th = { textAlign: "left", padding: "0.6rem 1rem", fontWeight: "600", fontSize: "0.85rem", color: "#8D9DB6" };
const td = { padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#D4E5F5" };

export default Dashboard;

import { useEffect, useState } from "react";
import api from "../services/api";

function InventarioAnalisis({ onCrear }) {
  const [insumos, setInsumos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    Promise.all([api.get("/insumos"), api.get("/lotes")])
      .then(([resInsumos, resLotes]) => {
        setInsumos(Array.isArray(resInsumos.data) ? resInsumos.data : []);
        setLotes(Array.isArray(resLotes.data) ? resLotes.data : []);
      })
      .catch((err) => console.error("Error al cargar análisis:", err))
      .finally(() => setCargando(false));
  };

  const eliminarInsumo = async (id, nombre) => {
    if (!confirm(`¿Eliminar el insumo "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/insumos/${id}`);
      setInsumos((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "No se pudo eliminar el insumo";
      alert("Error: " + msg);
    }
  };

  const encabezado = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ margin: 0 }}>🧂 Insumos</h1>
        <p style={{ margin: "4px 0 0", color: "var(--texto-suave)", fontSize: "14px" }}>
          Análisis de inventario y stock
        </p>
      </div>
      {onCrear && (
        <button onClick={onCrear} style={{ padding: "10px 18px", cursor: "pointer" }}>
          + Nuevo Insumo
        </button>
      )}
    </div>
  );

  if (cargando) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {encabezado}
        <p style={{ color: "var(--texto-suave)" }}>Cargando análisis...</p>
      </div>
    );
  }

  const stockPorInsumo = insumos.map((insumo) => {
    const lotesDelInsumo = lotes.filter(
      (l) => l.insumoId === insumo.id || l.insumoNombre === insumo.nombre
    );
    const stockTotal = lotesDelInsumo.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
    const proximoVencer = lotesDelInsumo
      .filter((l) => l.fechaVencimiento)
      .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))[0];

    return { ...insumo, stockTotal, proximoVencer, totalLotes: lotesDelInsumo.length };
  });

  const criticos = stockPorInsumo.filter((i) => i.stockTotal === 0);
  const bajos    = stockPorInsumo.filter((i) => i.stockTotal > 0 && i.stockTotal <= 5);
  const normales = stockPorInsumo.filter((i) => i.stockTotal > 5);

  const hoy = new Date();
  const en7dias = new Date(hoy);
  en7dias.setDate(hoy.getDate() + 7);

  const porVencer = lotes.filter((l) => {
    if (!l.fechaVencimiento) return false;
    const fecha = new Date(l.fechaVencimiento);
    return fecha >= hoy && fecha <= en7dias;
  });

  const tarjetaStyle = (color, bg) => ({
    background: bg,
    border: `1px solid ${color}33`,
    borderRadius: "var(--r-md)",
    padding: "18px 22px",
  });

  const Badge = ({ color, bg, texto }) => (
    <span style={{
      background: bg, color,
      border: `1px solid ${color}33`,
      borderRadius: "999px",
      padding: "3px 12px",
      fontSize: "12px",
      fontWeight: "600",
    }}>
      {texto}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {encabezado}

      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        <div style={tarjetaStyle("#E05252", "#FEF0EE")}>
          <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
            letterSpacing: "0.5px", color: "#E05252", marginBottom: "6px" }}>🔴 Sin stock</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: "#E05252" }}>{criticos.length}</p>
          <p style={{ fontSize: "12px", color: "#9B3A3A" }}>insumos agotados</p>
        </div>
        <div style={tarjetaStyle("#C8783A", "#FEF3E8")}>
          <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
            letterSpacing: "0.5px", color: "#C8783A", marginBottom: "6px" }}>🟠 Stock bajo</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: "#C8783A" }}>{bajos.length}</p>
          <p style={{ fontSize: "12px", color: "#8B5E3C" }}>5 unidades o menos</p>
        </div>
        <div style={tarjetaStyle("#3AC87A", "#E8FEF0")}>
          <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
            letterSpacing: "0.5px", color: "#3AC87A", marginBottom: "6px" }}>🟢 Stock normal</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: "#3AC87A" }}>{normales.length}</p>
          <p style={{ fontSize: "12px", color: "#2A8B5A" }}>insumos bien abastecidos</p>
        </div>
      </div>

      {/* Por vencer */}
      {porVencer.length > 0 && (
        <div style={tarjetaStyle("#C8783A", "#FEF3E8")}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#C8783A", marginBottom: "12px" }}>
            ⚠️ Lotes por vencer en los próximos 7 días
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {porVencer.map((l, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(255,255,255,0.6)", borderRadius: "var(--r-sm)", padding: "10px 14px",
              }}>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>{l.insumoNombre || "Insumo"}</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                    {l.cantidad} {l.unidadMedida || "uds"}
                  </span>
                  <Badge color="#C8783A" bg="#FDEBD0"
                    texto={`Vence: ${new Date(l.fechaVencimiento).toLocaleDateString("es-MX")}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: "var(--fondo-card)", border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--borde)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: 0 }}>
            📊 Estado de inventario por insumo
          </h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Unidad</th>
              <th>Stock total</th>
              <th>Lotes</th>
              <th>Próx. vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stockPorInsumo.map((insumo) => {
              const estado = insumo.stockTotal === 0
                ? { label: "Agotado",    color: "#E05252", bg: "#FEF0EE" }
                : insumo.stockTotal <= 5
                ? { label: "Stock bajo", color: "#C8783A", bg: "#FEF3E8" }
                : { label: "Normal",     color: "#3AC87A", bg: "#E8FEF0" };

              return (
                <tr key={insumo.id}>
                  <td><strong>{insumo.nombre}</strong></td>
                  <td>{insumo.unidadMedida || "—"}</td>
                  <td style={{ fontWeight: "700", color: estado.color }}>{insumo.stockTotal}</td>
                  <td>{insumo.totalLotes}</td>
                  <td style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                    {insumo.proximoVencer
                      ? new Date(insumo.proximoVencer.fechaVencimiento).toLocaleDateString("es-MX")
                      : "—"}
                  </td>
                  <td>
                    <Badge color={estado.color} bg={estado.bg} texto={estado.label} />
                  </td>
                  <td>
                    <button
                      onClick={() => eliminarInsumo(insumo.id, insumo.nombre)}
                      style={{
                        background: "#FEF0EE",
                        color: "#E05252",
                        border: "1px solid #E0525233",
                        borderRadius: "6px",
                        padding: "5px 12px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventarioAnalisis;

import { useEffect, useState } from "react";
import api from "../services/api";

function InventarioAnalisis({ onCrear, usuario }) {
  const [insumos, setInsumos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [productosInventario, setProductosInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = () => {
    Promise.all([
      api.get("/insumos"),
      api.get("/lotes"),
      api.get("/inventario/productos"),
    ])
      .then(([resInsumos, resLotes, resProductos]) => {
        const todosInsumos   = Array.isArray(resInsumos.data)   ? resInsumos.data   : [];
        const todosLotes     = Array.isArray(resLotes.data)     ? resLotes.data     : [];
        const todosProductos = Array.isArray(resProductos.data) ? resProductos.data : [];

        const insumosFiltrados =
          usuario?.userTipo === 0
            ? todosInsumos
            : todosInsumos.filter((i) => i.sucursalId === usuario?.sucursalId);

        const lotesFiltrados =
          usuario?.userTipo === 0
            ? todosLotes
            : todosLotes.filter((l) => l.sucursalId === usuario?.sucursalId);

        const productosFiltrados =
          usuario?.userTipo === 0
            ? todosProductos
            : todosProductos.filter((p) => p.sucursalId === usuario?.sucursalId);

        setInsumos(insumosFiltrados);
        setLotes(lotesFiltrados);
        setProductosInventario(productosFiltrados);
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

  const totalGarrafones = productosInventario.reduce(
    (acc, p) => acc + (Number(p.cantidad) || 0),
    0
  );
  const garrafonesCriticos = productosInventario.filter(
    (p) => (Number(p.cantidad) || 0) === 0
  );
  const garrafonesBajos = productosInventario.filter(
    (p) => (Number(p.cantidad) || 0) > 0 && (Number(p.cantidad) || 0) <= (Number(p.cantidadMinima) || 5)
  );
  const garrafonesNormales = productosInventario.filter(
    (p) => (Number(p.cantidad) || 0) > (Number(p.cantidadMinima) || 5)
  );

  const tarjetaStyle = (color) => ({
    background: "#1A2332",
    border: `1px solid ${color}44`,
    borderRadius: "var(--r-md)",
    padding: "18px 22px",
  });

  const Badge = ({ color, bg, texto }) => (
    <span style={{
      background: bg,
      color,
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

      {/* ── PANEL GARRAFONES VACÍOS (insumos) ── */}
      <div style={{
        background: "var(--fondo-card)",
        border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)",
        padding: "18px 22px",
      }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: "0 0 14px" }}>
          ♻️ Garrafones Vacíos — Insumos
        </h3>

        {/* Tarjetas resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
          <div style={tarjetaStyle("#E05252")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#E05252", marginBottom: "6px" }}>🔴 Sin stock</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#E05252" }}>{criticos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>insumos agotados</p>
          </div>
          <div style={tarjetaStyle("#FF9900")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#FF9900", marginBottom: "6px" }}>🟠 Stock bajo</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#FF9900" }}>{bajos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>5 unidades o menos</p>
          </div>
          <div style={tarjetaStyle("#3AC87A")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#3AC87A", marginBottom: "6px" }}>🟢 Stock normal</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#3AC87A" }}>{normales.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>insumos bien abastecidos</p>
          </div>
        </div>

        {/* Alerta por vencer */}
        {porVencer.length > 0 && (
          <div style={{
            background: "#1A2332",
            border: "1px solid #C8783A44",
            borderRadius: "var(--r-md)",
            padding: "14px 18px",
            marginBottom: "18px",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#C8783A", marginBottom: "12px" }}>
              ⚠️ Lotes por vencer en los próximos 7 días
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {porVencer.map((l, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "rgba(255,255,255,0.06)", borderRadius: "var(--r-sm)", padding: "10px 14px",
                }}>
                  <span style={{ fontWeight: "600", fontSize: "14px" }}>{l.insumoNombre || "Insumo"}</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                      {l.cantidad} {l.unidadMedida || "uds"}
                    </span>
                    <Badge
                      color="#C8783A"
                      bg="#FDEBD0"
                      texto={`Vence: ${new Date(l.fechaVencimiento).toLocaleDateString("es-MX")}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla insumos */}
        <div style={{ borderTop: "1px solid var(--borde)", paddingTop: "14px" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--texto-suave)",
            textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
            📊 Estado de inventario por insumo
          </p>
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
                          background: "#2D1A1A",
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

      {/* ── PANEL GARRAFONES LLENOS (productos en inventario) ── */}
      <div style={{
        background: "var(--fondo-card)",
        border: "1px solid #0073BB44",
        borderRadius: "var(--r-md)",
        padding: "18px 22px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: 0 }}>
            🚰 Garrafones Llenos — Stock de Productos
          </h3>
          <span style={{
            background: "#0073BB22",
            color: "#0073BB",
            border: "1px solid #0073BB44",
            borderRadius: "999px",
            padding: "4px 14px",
            fontSize: "13px",
            fontWeight: "700",
          }}>
            Total: {totalGarrafones} piezas
          </span>
        </div>

        {/* Tarjetas resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
          <div style={tarjetaStyle("#E05252")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#E05252", marginBottom: "6px" }}>🔴 Sin stock</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#E05252" }}>{garrafonesCriticos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>productos agotados</p>
          </div>
          <div style={tarjetaStyle("#FF9900")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#FF9900", marginBottom: "6px" }}>🟠 Stock bajo</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#FF9900" }}>{garrafonesBajos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bajo mínimo</p>
          </div>
          <div style={tarjetaStyle("#3AC87A")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#3AC87A", marginBottom: "6px" }}>🟢 Stock normal</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#3AC87A" }}>{garrafonesNormales.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bien abastecidos</p>
          </div>
        </div>

        {/* Tabla garrafones llenos */}
        <div style={{ borderTop: "1px solid #0073BB22", paddingTop: "14px" }}>
          {productosInventario.length === 0 ? (
            <p style={{ color: "var(--texto-suave)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
              No hay productos registrados en inventario.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th>Stock actual</th>
                  <th>Mínimo</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productosInventario.map((prod) => {
                  const cant = Number(prod.cantidad) || 0;
                  const min  = Number(prod.cantidadMinima) || 5;
                  const estado =
                    cant === 0
                      ? { label: "Agotado",    color: "#E05252", bg: "#FEF0EE" }
                      : cant <= min
                      ? { label: "Stock bajo", color: "#C8783A", bg: "#FEF3E8" }
                      : { label: "Normal",     color: "#3AC87A", bg: "#E8FEF0" };

                  return (
                    <tr key={prod.id}>
                      <td><strong>{prod.nombre}</strong></td>
                      <td>{prod.unidadMedida || "piezas"}</td>
                      <td style={{ fontWeight: "700", color: estado.color }}>{cant}</td>
                      <td style={{ color: "var(--texto-suave)" }}>{min}</td>
                      <td style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                        {prod.sucursalNombre || "—"}
                      </td>
                      <td>
                        <Badge color={estado.color} bg={estado.bg} texto={estado.label} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}

export default InventarioAnalisis;

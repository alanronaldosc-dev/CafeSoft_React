import { useEffect, useState } from "react";
import api from "../services/api";

function InventarioAnalisis({ onCrear, usuario }) {
  const [productosInventario, setProductosInventario] = useState([]);
  const [inventarioVacios, setInventarioVacios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [resProductos, resInventario] = await Promise.all([
          api.get("/inventario/productos"),
          api.get("/inventario"),
        ]);

        if (!activo) return;

        const todosProductos = Array.isArray(resProductos.data)
          ? resProductos.data
          : [];

        const todoInventario = Array.isArray(resInventario.data)
          ? resInventario.data
          : [];

        const productosFiltrados =
          usuario?.userTipo === 0
            ? todosProductos
            : todosProductos.filter(
                (p) =>
                  p.sucursalId == null ||
                  Number(p.sucursalId) === Number(usuario?.sucursalId)
              );

        const normalizar = (valor) =>
          String(valor || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const vacios = todoInventario.filter((item) => {
          const nombre = normalizar(item.nombre);
          const tipo = normalizar(item.tipo);

          const esVacio =
            nombre.includes("vac") ||
            tipo.includes("vac") ||
            nombre.includes("envase") ||
            tipo.includes("envase");

          const esSucursalCorrecta =
            usuario?.userTipo === 0 ||
            item.sucursalId == null ||
            Number(item.sucursalId) === Number(usuario?.sucursalId);

          return esVacio && esSucursalCorrecta;
        });

        setProductosInventario(productosFiltrados);
        setInventarioVacios(vacios);
      } catch (err) {
        console.error("Error al cargar inventario:", err);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [usuario]);

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

  const totalVacios = inventarioVacios.reduce(
    (acc, item) => acc + (Number(item.cantidad) || 0),
    0
  );

  const vaciosCriticos = inventarioVacios.filter(
    (item) => (Number(item.cantidad) || 0) === 0
  );

  const vaciosBajos = inventarioVacios.filter((item) => {
    const cantidad = Number(item.cantidad) || 0;
    const minimo = Number(item.cantidadMinima) || 5;
    return cantidad > 0 && cantidad <= minimo;
  });

  const vaciosNormales = inventarioVacios.filter((item) => {
    const cantidad = Number(item.cantidad) || 0;
    const minimo = Number(item.cantidadMinima) || 5;
    return cantidad > minimo;
  });

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

      {/* ── PANEL GARRAFONES VACÍOS (inventario real) ── */}
      <div style={{
        background: "var(--fondo-card)",
        border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)",
        padding: "18px 22px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: 0 }}>
            ♻️ Garrafones Vacíos — Inventario
          </h3>
          <span style={{
            background: "#3AC87A22",
            color: "#3AC87A",
            border: "1px solid #3AC87A44",
            borderRadius: "999px",
            padding: "4px 14px",
            fontSize: "13px",
            fontWeight: "700",
          }}>
            Total: {totalVacios} piezas
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
          <div style={tarjetaStyle("#E05252")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#E05252", marginBottom: "6px" }}>🔴 Sin stock</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#E05252" }}>{vaciosCriticos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>tipos de vacío agotados</p>
          </div>
          <div style={tarjetaStyle("#FF9900")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#FF9900", marginBottom: "6px" }}>🟠 Stock bajo</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#FF9900" }}>{vaciosBajos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bajo mínimo</p>
          </div>
          <div style={tarjetaStyle("#3AC87A")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#3AC87A", marginBottom: "6px" }}>🟢 Stock normal</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#3AC87A" }}>{vaciosNormales.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bien abastecidos</p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--borde)", paddingTop: "14px" }}>
          {inventarioVacios.length === 0 ? (
            <p style={{ color: "var(--texto-suave)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
              No hay inventarios de garrafones vacíos registrados.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Envase vacío</th>
                  <th>Unidad</th>
                  <th>Stock actual</th>
                  <th>Mínimo</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {inventarioVacios.map((item) => {
                  const cantidad = Number(item.cantidad) || 0;
                  const minimo = Number(item.cantidadMinima) || 5;
                  const estado =
                    cantidad === 0
                      ? { label: "Agotado", color: "#E05252", bg: "#FEF0EE" }
                      : cantidad <= minimo
                      ? { label: "Stock bajo", color: "#C8783A", bg: "#FEF3E8" }
                      : { label: "Normal", color: "#3AC87A", bg: "#E8FEF0" };

                  return (
                    <tr key={item.id}>
                      <td><strong>{item.nombre}</strong></td>
                      <td>{item.unidadMedida || "piezas"}</td>
                      <td style={{ fontWeight: "700", color: estado.color }}>{cantidad}</td>
                      <td style={{ color: "var(--texto-suave)" }}>{minimo}</td>
                      <td style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                        {item.sucursalNombre || "—"}
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

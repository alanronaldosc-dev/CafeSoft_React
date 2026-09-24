import { useEffect, useState } from "react";
import api from "../services/api";

function InventarioProductos({ onRecibirProducto }) {
  const [productosInventario, setProductosInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await api.get("/inventario/productos");
      setProductosInventario(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar productos en inventario:", err);
    } finally {
      setCargando(false);
    }
  };

  const Badge = ({ color, bg, texto }) => (
    <span style={{
      background: bg, color, border: `1px solid ${color}33`,
      borderRadius: "999px", padding: "3px 12px",
      fontSize: "12px", fontWeight: "600",
    }}>
      {texto}
    </span>
  );

  const getEstado = (cantidad, minima) => {
    if (cantidad <= 0)        return { label: "Agotado",    color: "#E05252", bg: "#FEF0EE" };
    if (cantidad <= minima)   return { label: "Stock bajo", color: "#C8783A", bg: "#FEF3E8" };
    return                           { label: "Normal",     color: "#3AC87A", bg: "#E8FEF0" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>📦 Inventario de Productos</h1>
          <p style={{ margin: "4px 0 0", color: "var(--texto-suave)", fontSize: "14px" }}>
            Existencias de productos terminados
          </p>
        </div>
        {onRecibirProducto && (
          <button onClick={onRecibirProducto} style={{ padding: "10px 18px", cursor: "pointer" }}>
            + Recibir Producto
          </button>
        )}
      </div>

      {/* Tabla */}
      <div style={{
        background: "var(--fondo-card)", border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)", overflow: "hidden",
      }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--borde)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: 0 }}>
            📊 Existencias actuales
          </h3>
        </div>

        {cargando ? (
          <p style={{ padding: "20px" }}>Cargando...</p>
        ) : productosInventario.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--texto-suave)" }}>
            No hay productos en inventario. Usa "Recibir Producto" para agregar existencias.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Mínimo</th>
                <th>Precio unitario</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productosInventario.map((item) => {
                const estado = getEstado(item.cantidad, item.cantidadMinima);
                return (
                  <tr key={item.id}>
                    <td><strong>{item.nombre}</strong></td>
                    <td style={{ fontWeight: "700", color: estado.color }}>{item.cantidad} pzs</td>
                    <td>{item.cantidadMinima} pzs</td>
                    <td>${item.precioUnitario?.toFixed(2)}</td>
                    <td><Badge color={estado.color} bg={estado.bg} texto={estado.label} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default InventarioProductos;

import { useEffect, useState } from "react";
import api from "../services/api";

function AgregarProductosCategoria({ categoria, onVolver }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null); // id del producto que se está actualizando

  useEffect(() => {
    api.get("/productos")
      .then((res) => setProductos(Array.isArray(res.data) ? res.data : []))
      .catch(() => alert("No se pudieron cargar los productos"))
      .finally(() => setCargando(false));
  }, []);

  const toggleCategoria = async (producto) => {
    const yaAsignado = producto.categoriaId === categoria.id;
    const nuevaCategoriaId = yaAsignado ? null : categoria.id;

    setGuardando(producto.id);
    try {
      await api.put(`/productos/${producto.id}`, {
        nombre: producto.nombre,
        precio: producto.precio,
        descripcion: producto.descripcion,
        imagen: producto.imagen,
        categoriaId: nuevaCategoriaId,
        insumos: producto.insumos?.map((i) => ({
          insumoId: i.insumoId,
          cantidad: i.cantidad,
          unidadMedida: i.unidadMedida,
        })) || [],
      });

      // Actualizar estado local para reflejar el cambio sin recargar
      setProductos((prev) =>
        prev.map((p) =>
          p.id === producto.id
            ? {
                ...p,
                categoriaId: nuevaCategoriaId,
                categoriaNombre: nuevaCategoriaId ? categoria.nombre : null,
              }
            : p
        )
      );
    } catch (error) {
      alert("No se pudo actualizar el producto");
    } finally {
      setGuardando(null);
    }
  };

  return (
    <section className="panel">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
        <button onClick={onVolver}>← Volver</button>
        <h1>📋 Productos — {categoria.nombre}</h1>
      </div>
      <p style={{ color: "rgba(245,241,234,0.55)", marginBottom: "1.5rem" }}>
        Haz clic en un producto para asignarlo o quitarlo de esta categoría.
      </p>

      {cargando ? (
        <p>Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Categoría actual</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const asignado = p.categoriaId === categoria.id;
              return (
                <tr key={p.id} style={{
                  background: asignado ? "rgba(34,197,94,0.08)" : "transparent",
                }}>
                  <td>
                    {p.imagen ? (
                      <img
                        src={`data:image/jpeg;base64,${p.imagen}`}
                        alt={p.nombre}
                        style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    ) : (
                      <span style={{ fontSize: "24px" }}>☕</span>
                    )}
                  </td>
                  <td>{p.nombre}</td>
                  <td>${p.precio}</td>
                  <td>
                    {p.categoriaNombre ? (
                      <span style={{
                        padding: "2px 10px", borderRadius: "20px", fontSize: "0.8rem",
                        background: asignado ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)",
                        color: asignado ? "#22c55e" : "rgba(245,241,234,0.7)",
                      }}>
                        {p.categoriaNombre}
                      </span>
                    ) : (
                      <span style={{ color: "#aaa" }}>Sin categoría</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleCategoria(p)}
                      disabled={guardando === p.id}
                      style={{
                        background: asignado ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                        color: asignado ? "#ef4444" : "#22c55e",
                        border: `1px solid ${asignado ? "#ef4444" : "#22c55e"}`,
                      }}
                    >
                      {guardando === p.id ? "..." : asignado ? "✕ Quitar" : "✓ Asignar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default AgregarProductosCategoria;

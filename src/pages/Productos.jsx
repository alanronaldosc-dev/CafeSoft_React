import { useEffect, useState } from "react";
import api from "../services/api";

function Productos({ onCrear }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const res = await api.get("/productos");
      if (Array.isArray(res.data)) {
        setProductos(res.data);
      } else {
        setProductos([]);
        console.error("La API no devolvió un arreglo:", res.data);
      }
    } catch (error) {
      console.error("Error completo:", error);
      alert("No se pudieron cargar los productos");
    } finally {
      setCargando(false);
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await api.delete(`/productos/${id}`);
      setProductos(productos.filter((p) => p.id !== id));
    } catch (error) {
      alert("No se pudo eliminar el producto");
    }
  };

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>📦 Productos</h1>
        {onCrear && <button onClick={onCrear}>+ Crear Producto</button>}
      </div>

      {cargando ? (
        <p>Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Descripción</th>
              <th>Insumos</th>
              <th>Imagen</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td>{producto.id}</td>
                <td>{producto.nombre}</td>
                <td>${producto.precio}</td>
                <td>{producto.descripcion}</td>
                <td>
                  {producto.insumos && producto.insumos.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      {producto.insumos.map((insumo) => (
                        <li key={insumo.insumoId}>
                          {insumo.insumoNombre} — {insumo.cantidad} {insumo.unidadMedida}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: "#aaa" }}>Sin insumos</span>
                  )}
                </td>
                <td>  {producto.imagen ? (
                <img
                  src={`data:image/jpeg;base64,${producto.imagen}`}
                  alt={producto.nombre}
                  style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                />
              ) : (
                <span style={{ color: "#aaa" }}>Sin imagen</span>
              )}
              </td>
                <td>
                  <button onClick={() => eliminarProducto(producto.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Productos;

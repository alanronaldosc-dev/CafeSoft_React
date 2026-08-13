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

      setProductos((productosActuales) =>
        productosActuales.filter((p) => p.id !== id)
      );
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("No se pudo eliminar el producto");
    }
  };

  // Función para determinar el estado del stock
  const obtenerEstadoStock = (stock) => {
    const cantidad = Number(stock);

    if (cantidad === 0) {
      return {
        texto: "Agotado",
        color: "#dc3545",
      };
    }

    if (cantidad <= 5) {
      return {
        texto: "Stock bajo",
        color: "#ffc107",
      };
    }

    return {
      texto: "Disponible",
      color: "#28a745",
    };
  };

  return (
    <section>
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>📦 Productos</h2>

        {onCrear && (
          <button onClick={onCrear}>
            ➕ Crear Producto
          </button>
        )}
      </div>

      {/* Contenido */}
      {cargando ? (
        <p>Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Insumos</th>
                <th>Imagen</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((producto) => {
                const estadoStock = obtenerEstadoStock(producto.stock);

                return (
                  <tr key={producto.id}>
                    {/* ID */}
                    <td>{producto.id}</td>

                    {/* Nombre */}
                    <td>{producto.nombre}</td>

                    {/* Precio */}
                    <td>
                      $
                      {Number(producto.precio || 0).toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td>
                      {producto.stock !== undefined &&
                      producto.stock !== null
                        ? producto.stock
                        : 0}
                    </td>

                    {/* Estado del stock */}
                    <td>
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: "5px",
                          backgroundColor: estadoStock.color,
                          color:
                            estadoStock.texto === "Stock bajo"
                              ? "#000"
                              : "#fff",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      >
                        {estadoStock.texto}
                      </span>
                    </td>

                    {/* Categoría */}
                    <td>
                      {producto.categoria ||
                        producto.categoriaNombre ||
                        "Sin categoría"}
                    </td>

                    {/* Descripción */}
                    <td>
                      {producto.descripcion || "Sin descripción"}
                    </td>

                    {/* Insumos */}
                    <td>
                      {producto.insumos &&
                      producto.insumos.length > 0 ? (
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "1rem",
                          }}
                        >
                          {producto.insumos.map((insumo, index) => (
                            <li
                              key={
                                insumo.insumoId ||
                                index
                              }
                            >
                              {insumo.insumoNombre ||
                                "Insumo"}{" "}
                              — {insumo.cantidad}{" "}
                              {insumo.unidadMedida || ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span
                          style={{
                            color: "#aaa",
                          }}
                        >
                          Sin insumos
                        </span>
                      )}
                    </td>

                    {/* Imagen */}
                    <td>
                      {producto.imagen ? (
                        <img
                          src={`data:image/jpeg;base64,${producto.imagen}`}
                          alt={producto.nombre}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            color: "#aaa",
                          }}
                        >
                          Sin imagen
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td>
                      <button
                        onClick={() =>
                          eliminarProducto(producto.id)
                        }
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
      )}
    </section>
  );
}

export default Productos;
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

  // Obtiene la categoría independientemente de cómo
  // venga estructurada desde la API.
  const obtenerCategoria = (producto) => {
    if (producto.categoria?.nombre) {
      return producto.categoria.nombre;
    }

    if (producto.categoriaNombre) {
      return producto.categoriaNombre;
    }

    if (typeof producto.categoria === "string") {
      return producto.categoria;
    }

    return "Sin categoría";
  };

  return (
    <section className="panel productos-panel">

      {/* Encabezado */}
      <div className="productos-header">
        <div>
          <h1>📦 Productos</h1>
          <p className="productos-subtitle">
            Consulta los productos disponibles.
          </p>
        </div>

        {onCrear && (
          <button
            className="crear-producto-button"
            onClick={onCrear}
          >
            + Crear Producto
          </button>
        )}
      </div>

      {/* Cargando */}
      {cargando ? (
        <div className="productos-mensaje">
          <p>Cargando productos...</p>
        </div>

      ) : productos.length === 0 ? (

        /* Sin productos */
        <div className="productos-mensaje">
          <span className="productos-empty-icon">📦</span>
          <p>No hay productos registrados.</p>
        </div>

      ) : (

        /* Tarjetas */
        <div className="productos-grid">

          {productos.map((producto) => {

            const categoria = obtenerCategoria(producto);

            return (
              <article
                className="producto-card"
                key={producto.id}
              >

                {/* Imagen */}
                <div className="producto-image-container">

                  {producto.imagen ? (
                    <img
                      src={`data:image/jpeg;base64,${producto.imagen}`}
                      alt={`Imagen de ${producto.nombre}`}
                      className="producto-image"
                    />
                  ) : (
                    <div className="producto-image-placeholder">
                      <span>📦</span>
                      <p>Sin imagen</p>
                    </div>
                  )}

                </div>

                {/* Información */}
                <div className="producto-card-content">

                  <h2 className="producto-name">
                    {producto.nombre}
                  </h2>

                  {/* Categoría */}
                  <span className="producto-category">
                    {categoria}
                  </span>

                  {/* Precio */}
                  <p className="producto-price">
                    ${producto.precio} MXN
                  </p>

                  {/* Descripción */}
                  {producto.descripcion && (
                    <p className="producto-description">
                      {producto.descripcion}
                    </p>
                  )}

                  {/* Insumos */}
                  {producto.insumos &&
                    producto.insumos.length > 0 && (
                      <details className="producto-insumos">

                        <summary>
                          Insumos utilizados
                        </summary>

                        <ul>
                          {producto.insumos
                            .slice(0, 3)
                            .map((insumo) => (
                              <li key={insumo.insumoId}>
                                {insumo.insumoNombre}
                                {" — "}
                                {insumo.cantidad}{" "}
                                {insumo.unidadMedida}
                              </li>
                            ))}
                        </ul>

                        {producto.insumos.length > 3 && (
                          <small>
                            +
                            {producto.insumos.length - 3}
                            {" "}insumos más
                          </small>
                        )}

                      </details>
                    )}

                  {/* Acciones */}
                  <div className="producto-actions">

                    <button
                      className="producto-delete-button"
                      onClick={() =>
                        eliminarProducto(producto.id)
                      }
                    >
                      🗑️ Eliminar
                    </button>

                  </div>

                </div>

              </article>
            );
          })}

        </div>
      )}

    </section>
  );
}

export default Productos;

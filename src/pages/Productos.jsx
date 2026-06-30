import { useEffect, useState } from "react";
import api from "../services/api";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const res = await api.get("/productos");

      console.log("Respuesta productos:", res.data);

      if (Array.isArray(res.data)) {
        setProductos(res.data);
      } else {
        setProductos([]);
        console.error("La API no devolvió un arreglo:", res.data);
      }
    } catch (error) {
      console.error("Error completo:", error);
      console.error("Status:", error.response?.status);
      console.error("Respuesta:", error.response?.data);

      alert("No se pudieron cargar los productos");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="panel">
      <h1>📦 Productos</h1>

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
            </tr>
          </thead>

          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td>{producto.id}</td>
                <td>{producto.nombre}</td>
                <td>${producto.precio}</td>
                <td>{producto.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Productos;
import { useEffect, useState } from "react";
import api from "../services/api";

function Categorias({ onCrear, onAgregarProductos }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerCategorias();
  }, []);

  const obtenerCategorias = async () => {
    try {
      const res = await api.get("/categorias");
      if (Array.isArray(res.data)) {
        setCategorias(res.data);
      } else {
        setCategorias([]);
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      alert("No se pudieron cargar las categorías");
    } finally {
      setCargando(false);
    }
  };

  const eliminarCategoria = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    try {
      await api.delete(`/categorias/${id}`);
      setCategorias(categorias.filter((c) => c.id !== id));
    } catch (error) {
      alert("No se pudo eliminar la categoría");
    }
  };

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>🏷️ Categorías</h1>
        <button onClick={onCrear}>+ Nueva Categoría</button>
      </div>

      {cargando ? (
        <p>Cargando categorías...</p>
      ) : categorias.length === 0 ? (
        <p>No hay categorías registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Creada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>{cat.nombre}</td>
                <td>{cat.descripcion || <span style={{ color: "#aaa" }}>—</span>}</td>
                <td>
                  <span style={{
                    padding: "2px 10px", borderRadius: "20px", fontSize: "0.8rem",
                    background: cat.activo ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                    color: cat.activo ? "#22c55e" : "#ef4444",
                  }}>
                    {cat.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  {cat.createdAt
                    ? new Date(cat.createdAt).toLocaleDateString("es-MX")
                    : "—"}
                </td>
                <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button onClick={() => onAgregarProductos(cat)}>
                    📋 Agregar Productos
                  </button>
                  <button onClick={() => eliminarCategoria(cat.id)}>
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Categorias;

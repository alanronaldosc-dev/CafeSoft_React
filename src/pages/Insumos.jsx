import { useEffect, useState } from "react";
import api from "../services/api";

function Insumos({ onCrear }) {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerInsumos();
  }, []);

  const obtenerInsumos = async () => {
    try {
      const res = await api.get("/insumos");
      if (Array.isArray(res.data)) {
        setInsumos(res.data);
      } else {
        setInsumos([]);
        console.error("La API no devolvió un arreglo:", res.data);
      }
    } catch (error) {
      console.error("Error al cargar insumos:", error);
      alert("No se pudieron cargar los insumos");
    } finally {
      setCargando(false);
    }
  };

  const eliminarInsumo = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este insumo?")) return;
    try {
      await api.delete(`/insumos/${id}`);
      setInsumos(insumos.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el insumo");
    }
  };

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>🧂 Insumos</h1>
        <button onClick={onCrear}>+ Agregar Insumo</button>
      </div>

      {cargando ? (
        <p>Cargando insumos...</p>
      ) : insumos.length === 0 ? (
        <p>No hay insumos registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Tipo de Cantidad</th>
              <th>Proveedor</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((insumo) => (
              <tr key={insumo.id}>
                <td>{insumo.id}</td>
                <td>{insumo.nombre}</td>
                <td>{insumo.tipo}</td>
                <td>{insumo.unidadMedida}</td>
                <td>{insumo.proveedor}</td>
                <td>{insumo.precio}</td>
                <td>
                  <button onClick={() => eliminarInsumo(insumo.id)}>
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

export default Insumos;

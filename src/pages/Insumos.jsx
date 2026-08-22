import { useEffect, useState } from "react";
import api from "../services/api";


function Insumos({ onCrear }) {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("inventario");

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
    if (!confirm("¿Seguro que deseas eliminar este insumo?")) {
      return;
    }
    try {
      await api.delete(`/insumos/${id}`);
      setInsumos((anteriores) =>
        anteriores.filter((insumo) => insumo.id !== id)
      );
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el insumo");
    }
  };

  return (
    <section className="panel insumos-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div>
          <h1>🧂 Insumos</h1>
          <p>Gestión y análisis del inventario de materias primas.</p>
        </div>

        {vista === "inventario" && (
          <button onClick={onCrear}>＋ Agregar Insumo</button>
        )}
      </div>

      <div className="ventas-tabs">
        <button
          className={
            vista === "inventario"
              ? "ventas-tab ventas-tab-activo"
              : "ventas-tab"
          }
          onClick={() => setVista("inventario")}
        >
          📦 Inventario
        </button>

        <button
          className={
            vista === "analisis"
              ? "ventas-tab ventas-tab-activo"
              : "ventas-tab"
          }
          onClick={() => setVista("analisis")}
        >
          📈 Análisis predictivo
        </button>
      </div>

      {vista === "inventario" && (
        <div>
          {cargando ? (
            <p>Cargando insumos...</p>
          ) : insumos.length === 0 ? (
            <div className="sin-datos">
              <p>No hay insumos registrados.</p>
            </div>
          ) : (
            <div className="ventas-tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Unidad</th>
                    <th>Proveedor</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((insumo) => (
                    <tr key={insumo.id}>
                      <td>{insumo.id}</td>
                      <td>
                        <strong>{insumo.nombre}</strong>
                      </td>
                      <td>{insumo.tipo || "—"}</td>
                      <td>{insumo.unidadMedida || "—"}</td>
                      <td>
                        {insumo.proveedorNombre || insumo.proveedor || "—"}
                      </td>
                      <td>
                        ${Number(insumo.precio || 0).toFixed(2)}
                      </td>
                      <td>
                        <button onClick={() => eliminarInsumo(insumo.id)}>
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {vista === "analisis" && (
        <div style={{ marginTop: "10px" }}>
          <InventarioAnalisis />
        </div>
      )}
    </section>
  );
}

export default Insumos;
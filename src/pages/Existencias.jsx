import { useEffect, useState } from "react";
import api from "../services/api";

function Existencias() {
  const [existencias, setExistencias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarExistencias();
  }, []);

  const cargarExistencias = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await api.get("/inventario");
      setExistencias(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las existencias.");
    } finally {
      setCargando(false);
    }
  };

  const existenciasFiltradas = existencias.filter((item) =>
    item.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const esBajoStock = (item) =>
    Number(item.cantidad) <= Number(item.cantidadMinima);

  if (cargando) {
    return (
      <section className="panel">
        <h1>📊 Consulta de Existencias</h1>
        <p>Cargando existencias...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h1>📊 Consulta de Existencias</h1>
        <p>{error}</p>

        <button onClick={cargarExistencias}>
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="header">
        <div>
          <h1>📊 Consulta de Existencias</h1>
          <p>
            Consulta las existencias actuales y detecta productos con bajo
            stock.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔎 Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Tipo</th>
              <th>Existencia actual</th>
              <th>Unidad</th>
              <th>Mínimo</th>
              <th>Proveedor</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {existenciasFiltradas.length > 0 ? (
              existenciasFiltradas.map((item) => {
                const bajoStock = esBajoStock(item);

                return (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>{item.tipo}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.unidadMedida}</td>
                    <td>{item.cantidadMinima}</td>
                    <td>{item.proveedor || "—"}</td>

                    <td>
                      {bajoStock ? (
                        <span
                          style={{
                            color: "#b91c1c",
                            fontWeight: "bold",
                          }}
                        >
                          ⚠️ Bajo stock
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#15803d",
                            fontWeight: "bold",
                          }}
                        >
                          ✓ Stock suficiente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No se encontraron existencias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Existencias;

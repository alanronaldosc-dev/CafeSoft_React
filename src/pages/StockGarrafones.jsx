import { useEffect, useState } from "react";
import api from "../services/api";

function StockGarrafones() {
  const [stock, setStock] = useState({
    llenosEnPlanta: 0,
    enTransito: 0,
    vaciosEnPlanta: 0,
    stockMinimo: 0,
    alertaStockBajo: false,
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarStock = async () => {
    try {
      setError("");

      const response = await api.get(
        "/dashboard/stock-garrafones"
      );

      setStock(response.data);
    } catch (err) {
      console.error(
        "Error al consultar el stock de garrafones:",
        err
      );

      setError(
        "No fue posible obtener el stock de garrafones."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarStock();

    // Actualización automática para mantener
    // los contadores del dashboard actualizados.
    const intervalo = setInterval(() => {
      cargarStock();
    }, 30000);

    return () => clearInterval(intervalo);
  }, []);

  if (cargando) {
    return (
      <section className="panel">
        <p>Cargando stock de garrafones...</p>
      </section>
    );
  }

  return (
    <>
      <section
        style={{
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2>Stock de Garrafones</h2>
            <p>
              Estado actual de los garrafones de la planta.
            </p>
          </div>

          <button
            type="button"
            className="history-btn"
            onClick={cargarStock}
          >
            Actualizar
          </button>
        </div>
      </section>

      {error && (
        <section
          className="panel"
          style={{
            marginBottom: "20px",
          }}
        >
          <strong>{error}</strong>
        </section>
      )}

      {stock.alertaStockBajo && (
        <section
          className="panel"
          style={{
            marginBottom: "20px",
            border: "2px solid #dc3545",
          }}
        >
          <h3>⚠️ Stock bajo de garrafones llenos</h3>

          <p>
            Actualmente existen{" "}
            <strong>{stock.llenosEnPlanta}</strong>{" "}
            garrafones llenos en planta y el mínimo de
            seguridad es{" "}
            <strong>{stock.stockMinimo}</strong>.
          </p>
        </section>
      )}

      <section className="cards">
        <div className="card">
          <span className="card-icon">💧</span>

          <p>Llenos en Planta</p>

          <h2>{stock.llenosEnPlanta}</h2>
        </div>

        <div className="card">
          <span className="card-icon">🚚</span>

          <p>En Tránsito con Repartidor</p>

          <h2>{stock.enTransito}</h2>
        </div>

        <div className="card">
          <span className="card-icon">♻️</span>

          <p>Vacíos en Planta</p>

          <h2>{stock.vaciosEnPlanta}</h2>
        </div>
      </section>
    </>
  );
}

export default StockGarrafones;

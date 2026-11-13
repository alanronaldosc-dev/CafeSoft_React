import { useEffect, useState } from "react";
import api from "../services/api";
import "./DesempenoRepartidores.css";

const moneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function Ranking({ titulo, descripcion, filas, tipo }) {
  return (
    <section className="desempeno-ranking">
      <div className="desempeno-ranking-heading">
        <div>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
        </div>
        <span className="desempeno-ranking-count">{filas.length} repartidores</span>
      </div>

      {filas.length === 0 ? (
        <div className="desempeno-vacio">No hay entregas confirmadas para mostrar.</div>
      ) : (
        <div className="desempeno-tabla-wrap">
          <table className="desempeno-tabla">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Repartidor</th>
                {tipo === "ventas" && <th>Ventas</th>}
                {tipo === "monto" && <th>Monto cobrado</th>}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.repartidorId}>
                  <td>
                    <span className={`desempeno-posicion ${fila.posicion <= 3 ? "destacada" : ""}`}>
                      #{fila.posicion}
                    </span>
                  </td>
                  <td>
                    <strong>{fila.nombre}</strong>
                    <small>ID: {fila.repartidorId}</small>
                  </td>
                  {tipo === "ventas" && <td>{fila.cantidadVentas ?? 0}</td>}
                  {tipo === "monto" && <td className="desempeno-monto">{moneda.format(Number(fila.montoTotal) || 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function DesempenoRepartidores({ onVolver }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarDesempeno = async () => {
      setCargando(true);
      setError("");
      try {
        const respuesta = await api.get("/ventas/desempeno-repartidores");
        if (activo) setDatos(respuesta.data);
      } catch (err) {
        const mensaje = err?.response?.data?.mensaje
          || err?.response?.data?.error
          || "No fue posible consultar el desempeño de los repartidores.";
        if (activo) {
          setError(mensaje);
          setDatos(null);
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDesempeno();
    return () => { activo = false; };
  }, []);

  return (
    <section className="panel desempeno-panel">
      <header className="desempeno-encabezado">
        <div>
          <span className="desempeno-kicker">ANÁLISIS DE ENTREGAS</span>
          <h1>Desempeño de repartidores</h1>
          <p>Resultados basados en las entregas confirmadas desde CafeSoft móvil.</p>
        </div>
        <button type="button" className="btn-secondary desempeno-volver" onClick={onVolver}>
          ← Volver a ventas
        </button>
      </header>

      {cargando ? (
        <p className="desempeno-mensaje">Cargando desempeño...</p>
      ) : error ? (
        <div className="desempeno-error" role="alert">{error}</div>
      ) : datos ? (
        <>
          <p className="desempeno-contexto">
            Sucursal: <strong>{datos.sucursalNombre || "Sin nombre"}</strong>
            <span> · Histórico de entregas confirmadas</span>
          </p>

          <div className="desempeno-resumen">
            <article className="desempeno-indicador">
              <span>Ventas entregadas</span>
              <strong>{Number(datos.totalVentas) || 0}</strong>
            </article>
            <article className="desempeno-indicador">
              <span>Monto cobrado</span>
              <strong>{moneda.format(Number(datos.montoTotal) || 0)}</strong>
            </article>
            <article className="desempeno-indicador">
              <span>Repartidores con entregas</span>
              <strong>{datos.rankingVentas?.length || 0}</strong>
            </article>
          </div>

          <div className="desempeno-rankings">
            <Ranking
              titulo="Ranking por número de ventas"
              descripcion="Ordenado por cantidad de entregas confirmadas."
              filas={datos.rankingVentas || []}
              tipo="ventas"
            />
            <Ranking
              titulo="Ranking por monto"
              descripcion="Ordenado por el importe cobrado en las entregas."
              filas={datos.rankingMonto || []}
              tipo="monto"
            />
          </div>
          <p className="desempeno-nota">
            Solo se contabilizan entregas con resultado ENTREGADO. Las incidencias y entregas no confirmadas no forman parte de los rankings.
          </p>
        </>
      ) : (
        <p className="desempeno-mensaje">No hay información disponible.</p>
      )}
    </section>
  );
}

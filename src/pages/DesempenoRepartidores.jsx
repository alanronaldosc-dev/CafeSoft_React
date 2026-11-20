import { useEffect, useState } from "react";
import api from "../services/api";
import "./DesempenoRepartidores.css";

const fmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const PERIODOS = [
  { id: "hoy",          etiqueta: "Hoy" },
  { id: "semana",       etiqueta: "Esta semana" },
  { id: "mes",          etiqueta: "Este mes" },
  { id: "mes_anterior", etiqueta: "Mes anterior" },
  { id: "personalizado",etiqueta: "Personalizado" },
];

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
        <div className="desempeno-vacio">No hay entregas confirmadas en este período.</div>
      ) : (
        <div className="desempeno-tabla-wrap">
          <table className="desempeno-tabla">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Repartidor</th>
                {tipo === "ventas" && <th>Ventas</th>}
                {tipo === "monto"  && <th>Monto cobrado</th>}
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
                  {tipo === "monto"  && <td className="desempeno-monto">{fmt.format(Number(fila.montoTotal) || 0)}</td>}
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
  const [periodo,     setPeriodo]     = useState("mes");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin,    setFechaFin]    = useState("");
  const [filtro,      setFiltro]      = useState({ periodo: "mes" });

  const [datos,     setDatos]     = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState("");

  const errorFechas =
    periodo !== "personalizado" ? null
    : !fechaInicio || !fechaFin ? "Selecciona fecha inicial y final."
    : fechaInicio > fechaFin    ? "La fecha inicial no puede ser posterior a la final."
    : null;

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError("");

    const params = new URLSearchParams({ periodo: filtro.periodo });
    if (filtro.periodo === "personalizado") {
      params.set("desde", filtro.desde);
      params.set("hasta", filtro.hasta);
    }

    api.get(`/ventas/desempeno-repartidores?${params}`)
      .then((r) => { if (activo) setDatos(r.data); })
      .catch((err) => {
        const msg = err?.response?.data?.mensaje
          || err?.response?.data?.error
          || "No fue posible consultar el desempeño.";
        if (activo) { setError(msg); setDatos(null); }
      })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [filtro]);

  const aplicar = () => {
    if (errorFechas) return;
    if (periodo === "personalizado") {
      setFiltro({ periodo: "personalizado", desde: fechaInicio, hasta: fechaFin });
    } else {
      setFiltro({ periodo });
    }
  };

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

{/* ── FILTRO DE PERÍODO ── */}
<div className="desempeno-filtro">
  <div className="desempeno-filtro-row">
    <div className="desempeno-filtro-periodos">
      {PERIODOS.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`desempeno-filtro-btn ${periodo === p.id ? "activo" : ""}`}
          onClick={() => setPeriodo(p.id)}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>

    {periodo !== "personalizado" && (
      <button
        type="button"
        className="btn-primary desempeno-filtro-aplicar"
        onClick={aplicar}
      >
        Aplicar filtro
      </button>
    )}
  </div>

  {periodo === "personalizado" && (
    <div className="desempeno-filtro-row">
      <div className="desempeno-filtro-fechas">
        <label>
          Desde
          <input type="date" value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)} />
        </label>
      </div>
      {errorFechas && <p className="desempeno-error-fechas" role="alert">{errorFechas}</p>}
      <button
        type="button"
        className="btn-primary desempeno-filtro-aplicar"
        disabled={Boolean(errorFechas)}
        onClick={aplicar}
      >
        Aplicar filtro
      </button>
    </div>
  )}
</div>

      {/* ── PERÍODO ACTIVO ── */}
      {datos?.periodoEtiqueta && (
        <p className="desempeno-periodo-activo">
          Período: <strong>{datos.periodoEtiqueta}</strong>
          {datos.periodoDesde && datos.periodoHasta &&
            ` (${datos.periodoDesde} → ${datos.periodoHasta})`}
        </p>
      )}

      {/* ── CONTENIDO ── */}
      {cargando ? (
        <p className="desempeno-mensaje">Cargando desempeño...</p>
      ) : error ? (
        <div className="desempeno-error" role="alert">{error}</div>
      ) : datos ? (
        <>
          <p className="desempeno-contexto">
            Sucursal: <strong>{datos.sucursalNombre || "Sin nombre"}</strong>
          </p>

          <div className="desempeno-resumen">
            <article className="desempeno-indicador">
              <span>Ventas entregadas</span>
              <strong>{Number(datos.totalVentas) || 0}</strong>
            </article>
            <article className="desempeno-indicador">
              <span>Monto cobrado</span>
              <strong>{fmt.format(Number(datos.montoTotal) || 0)}</strong>
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
            Solo se contabilizan entregas con resultado ENTREGADO.
          </p>
        </>
      ) : (
        <p className="desempeno-mensaje">No hay información disponible.</p>
      )}
    </section>
  );
}

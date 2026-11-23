import { horaCorta, numero } from "../utils/formato";
import "./RankingPredictivo.css";

const HORIZONTES = [7, 30, 90];

function RankingPredictivo({
  datos,
  cargando,
  error,
  horizonte,
  onCambiarHorizonte,
}) {
  return (
    <section className="prediccion" aria-labelledby="prediccion-titulo">
      <header className="prediccion-head">
        <div>
          <p className="prediccion-eyebrow">Pronóstico de demanda</p>
          <h2 id="prediccion-titulo" className="prediccion-titulo">
            Ranking predictivo de productos
          </h2>
          <p className="prediccion-contexto">
            <span className="prediccion-estimacion">ⓘ Estimación</span>{" "}
            Unidades estimadas para los próximos {horizonte} días
          </p>
        </div>

        <div
          className="prediccion-horizonte"
          role="group"
          aria-label="Horizonte de predicción"
        >
          {HORIZONTES.map((dias) => (
            <button
              key={dias}
              type="button"
              className={horizonte === dias ? "activo" : ""}
              aria-pressed={horizonte === dias}
              onClick={() => onCambiarHorizonte(dias)}
            >
              {dias} días
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <p className="prediccion-error" role="alert">
          ⚠️ {error}
        </p>
      ) : cargando ? (
        <div className="prediccion-tarjetas" aria-hidden="true">
          <div className="prediccion-tarjeta prediccion-tarjeta--cargando" />
          <div className="prediccion-tarjeta prediccion-tarjeta--cargando" />
        </div>
      ) : datos ? (
        <>
          <div className="prediccion-tarjetas">
            <TarjetaRanking
              titulo="Top 5 más vendidos"
              descripcion="Mayor demanda estimada"
              productos={datos.masVendidos || []}
              horizonte={horizonte}
              tipo="alza"
            />
            <TarjetaRanking
              titulo="Top 5 menos vendidos"
              descripcion="Menor demanda estimada"
              productos={datos.menosVendidos || []}
              horizonte={horizonte}
              tipo="baja"
            />
          </div>

          <p className="prediccion-nota">
            ⓘ Resultado estimado con base en el promedio diario de los últimos{" "}
            {datos.historialDias ?? 28} días
            {datos.generadoEn
              ? ` · calculado el ${new Date(datos.generadoEn).toLocaleDateString("es-MX")} a las ${horaCorta(datos.generadoEn)}`
              : ""}
            . Las cifras no representan ventas reales.
          </p>
        </>
      ) : null}
    </section>
  );
}

function TarjetaRanking({ titulo, descripcion, productos, horizonte, tipo }) {
  const maximo = Math.max(
    ...productos.map((p) => Number(p.unidadesEstimadas) || 0),
    1,
  );

  return (
    <article className={`prediccion-tarjeta prediccion-tarjeta--${tipo}`}>
      <header className="prediccion-tarjeta-head">
        <h3>{titulo}</h3>
        <p>
          {descripcion} · {horizonte} días
        </p>
      </header>

      {productos.length ? (
        <ol className="prediccion-lista">
          {productos.map((p, i) => (
            <li key={p.productoId ?? `${titulo}-${i}`} className="prediccion-fila">
              <span className="prediccion-puesto">{i + 1}</span>
              <span className="prediccion-nombre" title={p.nombre}>
                {p.nombre}
              </span>
              <span className="prediccion-barra" aria-hidden="true">
                <span
                  className="prediccion-relleno"
                  style={{
                    width: `${((Number(p.unidadesEstimadas) || 0) / maximo) * 100}%`,
                  }}
                />
              </span>
              <span className="prediccion-valor">
                {numero(p.unidadesEstimadas)} uds
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="prediccion-vacio">Sin productos para estimar.</p>
      )}

      <p className="prediccion-tarjeta-pie">ⓘ Estimación · no son ventas reales</p>
    </article>
  );
}

export default RankingPredictivo;

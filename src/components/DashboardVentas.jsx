import { useId } from "react";
import { diaCorto, horaCorta, moneda, numero } from "../utils/formato";

/**
 * HU-041: Dashboard de ventas.
 *
 * Muestra en una sola vista las ventas del periodo, el numero de
 * transacciones, el ticket promedio y la tendencia diaria.
 *
 * Los valores llegan desde GET /api/ventas/dashboard, que a su vez
 * se construye con el mismo reporte de ventas, por lo que siempre
 * coinciden con el reporte.
 */
function DashboardVentas({
  datos,
  cargando,
  error,
  periodo,
  periodos,
  onCambiarPeriodo,
}) {
  return (
    <section className="dash" aria-labelledby="dash-titulo">
      <header className="dash-head">
        <div>
          <p className="dash-eyebrow">Dashboard de ventas</p>
          <h2 id="dash-titulo" className="dash-titulo">
            Desempeño del negocio
          </h2>
          {datos && (
            <p className="dash-contexto">
              <span>{datos.periodoEtiqueta}</span>
              <span aria-hidden="true"> · </span>
              <span>{datos.sucursalNombre}</span>
              {datos.actualizadoEn && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>Actualizado {horaCorta(datos.actualizadoEn)}</span>
                </>
              )}
            </p>
          )}
        </div>

        <div
          className="reporte-periodos dash-periodos"
          role="group"
          aria-label="Periodo del dashboard"
        >
          {periodos.map((p) => (
            <button
              key={p.id}
              type="button"
              className={periodo === p.id ? "activo" : ""}
              aria-pressed={periodo === p.id}
              onClick={() => onCambiarPeriodo(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <p className="dash-error" role="alert">
          ⚠️ {error}
        </p>
      ) : cargando && !datos ? (
        <div className="dash-kpis" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="dash-kpi dash-kpi--cargando" />
          ))}
        </div>
      ) : datos ? (
        <>
          <div className="dash-kpis">
            <Kpi
              etiqueta="Ventas del periodo"
              valor={moneda(datos.montoTotal)}
              pie="Monto total con IVA"
              acento
            />
            <Kpi
              etiqueta="Transacciones"
              valor={numero(datos.numeroVentas)}
              pie="Ventas registradas"
            />
            <Kpi
              etiqueta="Ticket promedio"
              valor={moneda(datos.ticketPromedio)}
              pie="Por transacción"
            />
            <Kpi
              etiqueta="Días con ventas"
              valor={numero(datos.diasConVentas)}
              pie="Con al menos una venta"
            />
          </div>

          <TendenciaDias dias={datos.desglosePorDia || []} />
        </>
      ) : null}
    </section>
  );
}

function Kpi({ etiqueta, valor, pie, acento = false }) {
  return (
    <div className={`dash-kpi${acento ? " dash-kpi--acento" : ""}`}>
      <p className="dash-kpi-label">{etiqueta}</p>
      <p className="dash-kpi-value">{valor}</p>
      <p className="dash-kpi-foot">{pie}</p>
    </div>
  );
}

const ANCHO = 720;
const ALTO = 176;
const MARGEN = { arriba: 14, derecha: 10, abajo: 26, izquierda: 10 };

/**
 * Tendencia del monto vendido por dia. SVG puro: sin dependencias
 * nuevas y sin recalcular los totales del reporte.
 */
function TendenciaDias({ dias }) {
  const idGradiente = useId();

  if (!dias.length) {
    return (
      <p className="trend-vacio">
        Sin ventas registradas en el periodo. La tendencia aparecerá
        cuando se registre la primera venta.
      </p>
    );
  }

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const maximo = Math.max(...dias.map((d) => Number(d.montoTotal) || 0), 1);
  const paso = dias.length > 1 ? anchoUtil / (dias.length - 1) : 0;

  const puntos = dias.map((d, i) => {
    const x = MARGEN.izquierda + i * paso;
    const y = MARGEN.arriba + altoUtil * (1 - (Number(d.montoTotal) || 0) / maximo);
    return { x, y, dato: d };
  });

  const linea = puntos
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const base = ALTO - MARGEN.abajo;
  const area = `${linea} L ${puntos[puntos.length - 1].x.toFixed(1)} ${base} L ${puntos[0].x.toFixed(1)} ${base} Z`;

  const etiquetas = [0, Math.floor((dias.length - 1) / 2), dias.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((i) => puntos[i]);

  return (
    <div className="dash-trend">
      <div className="trend-head">
        <h3>Monto vendido por día</h3>
        <span className="trend-max">Máximo {moneda(maximo)}</span>
      </div>

      <svg
        className="trend-svg"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={`Tendencia de ventas por día: ${dias.length} día(s)`}
      >
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9900" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF9900" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((proporcion) => (
          <line
            key={proporcion}
            className="trend-grid"
            x1={MARGEN.izquierda}
            x2={ANCHO - MARGEN.derecha}
            y1={MARGEN.arriba + altoUtil * proporcion}
            y2={MARGEN.arriba + altoUtil * proporcion}
          />
        ))}

        <path d={area} fill={`url(#${idGradiente})`} />
        <path className="trend-line" d={linea} />

        {puntos.map((p) => (
          <g key={p.dato.fecha}>
            <circle className="trend-dot" cx={p.x} cy={p.y} r="4" />
            <title>
              {`${diaCorto(p.dato.fecha)}: ${moneda(p.dato.montoTotal)} · ${p.dato.numeroVentas} venta(s)`}
            </title>
          </g>
        ))}

        {etiquetas.map((p) => (
          <text
            key={`eje-${p.dato.fecha}`}
            className="trend-label"
            x={p.x}
            y={ALTO - 6}
            textAnchor={
              p.x <= MARGEN.izquierda + 1
                ? "start"
                : p.x >= ANCHO - MARGEN.derecha - 1
                  ? "end"
                  : "middle"
            }
          >
            {diaCorto(p.dato.fecha)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default DashboardVentas;

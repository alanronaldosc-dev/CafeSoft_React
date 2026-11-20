import React, { useId, useState } from "react";
import { moneda, numero } from "../utils/formato";

const COLORES_PASTEL = [
  "#7e4cfe",
  "#956bff",
  "#a37fff",
  "#b291fd",
  "#b597ff",
  "#c4acff",
];

const METRICAS = [
  { id: "unidades", etiqueta: "Unidades" },
  { id: "monto", etiqueta: "Monto" },
];

const MAXIMO_BARRAS = 8;

/**
 * HU-042: Productos mas vendidos del periodo.
 *
 * Muestra tres lecturas del mismo ranking:
 *  - dona con la participacion de los productos principales,
 *  - barras ordenadas de mayor a menor por la metrica elegida,
 *  - tabla desplegable con todos los productos.
 *
 * El orden y los totales vienen del backend
 * (GET /api/ventas/dashboard -> topProductos), ya calculados sobre
 * las ventas del periodo seleccionado.
 */
function ProductosMasVendidos({ productos, cargando, error }) {
  const idBase = useId();
  const [metrica, setMetrica] = useState("unidades");
  const [tablaAbierta, setTablaAbierta] = useState(false);

  if (cargando) {
    return <p className="productos-estado">Cargando productos...</p>;
  }

  if (error) {
    return (
      <p className="productos-estado productos-estado--error" role="alert">
        ⚠️ {error}
      </p>
    );
  }

  if (!productos.length) {
    return (
      <p className="productos-estado">
        Sin ventas en el periodo. El ranking aparecerá cuando se
        registre la primera venta.
      </p>
    );
  }

  const totalUnidades = productos.reduce(
    (acumulado, p) => acumulado + (p.unidadesVendidas || 0),
    0,
  );

  const valorDe = (p) =>
    metrica === "monto" ? p.montoTotal || 0 : p.unidadesVendidas || 0;

  const ordenados = [...productos].sort((a, b) => {
    const diferencia = valorDe(b) - valorDe(a);
    return diferencia !== 0
      ? diferencia
      : (b.montoTotal || 0) - (a.montoTotal || 0);
  });

  const maximo = Math.max(...ordenados.map(valorDe), 1);
  const barras = ordenados.slice(0, MAXIMO_BARRAS);

  const etiquetaValor = (p) =>
    metrica === "monto" ? moneda(p.montoTotal) : `${numero(p.unidadesVendidas)} uds`;

  const participacion = (p) =>
    totalUnidades > 0
      ? ((p.unidadesVendidas / totalUnidades) * 100).toFixed(1)
      : "0.0";

  const segmentos = construirSegmentos(productos, totalUnidades);

  return (
    <div className="productos">
      <div className="productos-layout">
        <Donut
          idBase={idBase}
          segmentos={segmentos}
          totalUnidades={totalUnidades}
        />

        <ul className="leyenda-donut">
          {segmentos.map((s) => (
            <li key={s.nombre}>
              <span className="swatch" style={{ background: s.color }} />
              <span className="nombre">{s.nombre}</span>
              <span className="valor">
                {numero(s.unidades)} uds · {moneda(s.monto)} ·{" "}
                {((s.unidades / totalUnidades) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="ranking">
        <div className="ranking-head">
          <h4>Ranking por {metrica === "monto" ? "monto vendido" : "unidades vendidas"}</h4>
          <div
            className="ranking-toggle"
            role="group"
            aria-label="Métrica del ranking"
          >
            {METRICAS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={metrica === m.id ? "activo" : ""}
                aria-pressed={metrica === m.id}
                onClick={() => setMetrica(m.id)}
              >
                {m.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <ol className="ranking-lista" aria-label="Ranking de productos">
          {barras.map((p, i) => (
            <li key={p.productoId} className="ranking-fila">
              <span
                className={`ranking-puesto${i < 3 ? " ranking-puesto--top" : ""}`}
              >
                {i + 1}
              </span>
              <span className="ranking-nombre" title={p.nombre}>
                {p.nombre}
              </span>
              <span className="ranking-barra" aria-hidden="true">
                <span
                  className="ranking-relleno"
                  style={{ width: `${(valorDe(p) / maximo) * 100}%` }}
                />
              </span>
              <span className="ranking-valor">
                {etiquetaValor(p)}
                {" "}
                <span className="ranking-participacion">
                  {participacion(p)}% del total
                </span>
              </span>
            </li>
          ))}
        </ol>

        {ordenados.length > MAXIMO_BARRAS && !tablaAbierta && (
          <p className="ranking-resto">
            +{ordenados.length - MAXIMO_BARRAS} producto(s) más en la tabla completa.
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn-desplegar"
        aria-expanded={tablaAbierta}
        aria-controls="tabla-productos-completa"
        onClick={() => setTablaAbierta((abierta) => !abierta)}
      >
        {tablaAbierta
          ? "▲ Ocultar tabla completa"
          : `▼ Ver tabla completa (${ordenados.length} productos)`}
      </button>

      {tablaAbierta && (
        <div id="tabla-productos-completa" className="tabla-productos-completa">
          <table className="tabla-productos">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Producto</th>
                <th scope="col" className="col-numero">Unidades</th>
                <th scope="col" className="col-numero">Monto</th>
                <th scope="col" className="col-numero">Participación</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((p, i) => (
                <tr key={p.productoId}>
                  <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                  <td>{p.nombre}</td>
                  <td className="col-numero">{numero(p.unidadesVendidas)}</td>
                  <td className="col-numero">{moneda(p.montoTotal)}</td>
                  <td className="col-numero">{participacion(p)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Top 5 + "Otros" para la dona. */
function construirSegmentos(productos, totalUnidades) {
  if (totalUnidades <= 0) return [];

  const top5 = productos.slice(0, 5);
  const resto = productos.slice(5);

  const segmentos = top5.map((p, i) => ({
    nombre: p.nombre,
    unidades: p.unidadesVendidas || 0,
    monto: p.montoTotal || 0,
    color: COLORES_PASTEL[i % COLORES_PASTEL.length],
  }));

  const restoUnidades = resto.reduce((a, p) => a + (p.unidadesVendidas || 0), 0);
  if (restoUnidades > 0) {
    segmentos.push({
      nombre: "Otros",
      unidades: restoUnidades,
      monto: resto.reduce((a, p) => a + (p.montoTotal || 0), 0),
      color: COLORES_PASTEL[5],
    });
  }

  return segmentos;
}

/** Dona en SVG puro (sin librerías de gráficas). */
function Donut({ idBase, segmentos, totalUnidades }) {
  const RADIO = 420;
  const RADIO_INTERNO = RADIO / 1.625;
  const HUECO = 0.015;

  const fracciones = segmentos.map((s) => s.unidades / totalUnidades);

  // Los ángulos se calculan sin mutar variables durante el render.
  const arcos = segmentos.map((s, i) => {
    const fraccionPrevia = fracciones
      .slice(0, i)
      .reduce((acumulado, f) => acumulado + f, 0);
    return {
      segmento: s,
      indice: i,
      inicio:
        -Math.PI / 2 + fraccionPrevia * 2 * Math.PI + HUECO / 2,
      angulo: fracciones[i] * 2 * Math.PI - HUECO,
    };
  });

  return (
    <div className="donut-contenedor">
      <div className="donut-centro" aria-hidden="true">
        <p className="donut-centro-label">Total</p>
        <p className="donut-centro-valor">{numero(totalUnidades)}</p>
        <p className="donut-centro-label">unidades</p>
      </div>

      <svg
        className="donut-svg"
        viewBox="-420 -420 840 840"
        role="img"
        aria-label="Participación de los productos más vendidos"
      >
        <defs>
          {segmentos.map((s, i) => (
            <linearGradient key={i} id={`${idBase}-grad-${i}`}>
              <stop offset="55%" stopColor={s.color} stopOpacity="0.95" />
            </linearGradient>
          ))}
        </defs>

        {arcos.map(({ segmento: s, indice: i, inicio, angulo }) => {
          const fin = inicio + angulo;

          const x1o = Math.cos(inicio) * RADIO;
          const y1o = Math.sin(inicio) * RADIO;
          const x2o = Math.cos(fin) * RADIO;
          const y2o = Math.sin(fin) * RADIO;
          const x1i = Math.cos(fin) * RADIO_INTERNO;
          const y1i = Math.sin(fin) * RADIO_INTERNO;
          const x2i = Math.cos(inicio) * RADIO_INTERNO;
          const y2i = Math.sin(inicio) * RADIO_INTERNO;

          const arcoGrande = angulo > Math.PI ? 1 : 0;
          const d = [
            `M ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
            `A ${RADIO} ${RADIO} 0 ${arcoGrande} 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)}`,
            `L ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
            `A ${RADIO_INTERNO} ${RADIO_INTERNO} 0 ${arcoGrande} 0 ${x2i.toFixed(2)} ${y2i.toFixed(2)}`,
            "Z",
          ].join(" ");

          const medio = inicio + angulo / 2;
          const etiquetaR = RADIO * 0.75;
          const lx = Math.cos(medio) * etiquetaR;
          const ly = Math.sin(medio) * etiquetaR;
          const mostrarEtiqueta = angulo * (180 / Math.PI) > 20;

          return (
            <g key={i}>
              <path
                d={d}
                fill={`url(#${idBase}-grad-${i})`}
                stroke="#ffffff22"
                strokeWidth={18}
              />
              {mostrarEtiqueta && (
                <g>
                  <text
                    x={lx}
                    y={ly - 14}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight="600"
                    fill="#eee"
                  >
                    {s.nombre.length > 8 ? `${s.nombre.slice(0, 8)}…` : s.nombre}
                  </text>
                  <text
                    x={lx}
                    y={ly + 22}
                    textAnchor="middle"
                    fontSize={28}
                    fill="#eee"
                    fillOpacity="0.7"
                  >
                    {((s.unidades / totalUnidades) * 100).toFixed(0)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default ProductosMasVendidos;

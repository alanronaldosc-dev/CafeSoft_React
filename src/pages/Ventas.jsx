import { useEffect, useState } from "react";
import api from "../services/api";

const PERIODOS = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "mes", etiqueta: "Este mes" },
  { id: "mes_anterior", etiqueta: "Mes anterior" },
];

const COLORES_PASTEL = [
  "#7e4cfe",
  "#956bff",
  "#a37fff",
  "#b291fd",
  "#b597ff",
  "#c4acff",
];

function Ventas({ usuario }) {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // ── Estado del reporte (HU-016) ──
  const [periodo, setPeriodo] = useState("hoy");
  const [reporte, setReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(true);
  const [errorReporte, setErrorReporte] = useState(null);

  // ── Estado de productos más vendidos (HU-017) ──
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState(null);
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    cargarVentas();
  }, [usuario]);

  useEffect(() => {
    cargarReporte();
    cargarProductos();
    setVerTodos(false);
  }, [periodo, usuario]);

  const cargarVentas = async () => {
      console.log("usuario completo:", usuario);
  console.log("sucursalId:", usuario?.sucursalId);
  console.log("tipo:", typeof usuario?.sucursalId);
    try {
      const sucursalId = usuario?.sucursalId;

      if (!sucursalId) {
        setError("Tu cuenta no tiene una sucursal asignada. Contacta al administrador.");
        setCargando(false);
        return;
      }

      const res = await api.get("/ventas");
      const todas = Array.isArray(res.data) ? res.data : [];

      const filtradas = todas.filter((v) => Number(v.sucursalId) === Number(sucursalId));

      setVentas(filtradas);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las ventas.");
    } finally {
      setCargando(false);
    }
  };

  // ── Consulta el reporte del periodo seleccionado ──
  const cargarReporte = async () => {
    setCargandoReporte(true);
    setErrorReporte(null);
    try {
      const res = await api.get(`/ventas/reporte?periodo=${periodo}`);
      setReporte(res.data);
    } catch (err) {
      console.error(err);
      const mensaje = err?.response?.data?.mensaje;
      setErrorReporte(mensaje || "No se pudo cargar el reporte.");
      setReporte(null);
    } finally {
      setCargandoReporte(false);
    }
  };

  // ── Consulta los productos más vendidos del periodo ──
  const cargarProductos = async () => {
    setCargandoProductos(true);
    setErrorProductos(null);
    try {
      const res = await api.get(`/ventas/reporte/top-productos?periodo=${periodo}`);
      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      const mensaje = err?.response?.data?.mensaje;
      setErrorProductos(mensaje || "No se pudo cargar el ranking de productos.");
      setProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  const fmt = (valor) =>
    valor != null ? `$${Number(valor).toFixed(2)}` : "$0.00";

  // ── Cálculos del pastel (top 5 + "Otros") ──
  const totalUnidades = productos.reduce((a, p) => a + p.unidadesVendidas, 0);
  const top5 = productos.slice(0, 5);
  const resto = productos.slice(5);
  const restoUnidades = resto.reduce((a, p) => a + p.unidadesVendidas, 0);
  const restoMonto = resto.reduce((a, p) => a + (p.montoTotal || 0), 0);

  const segmentos = top5.map((p, i) => ({
    nombre: p.nombre,
    unidades: p.unidadesVendidas,
    monto: p.montoTotal || 0,
    color: COLORES_PASTEL[i % COLORES_PASTEL.length],
  }));
  if (restoUnidades > 0) {
    segmentos.push({
      nombre: "Otros",
      unidades: restoUnidades,
      monto: restoMonto,
      color: COLORES_PASTEL[5],
    });
  }

  let acc = 0;
  const stops = totalUnidades > 0
    ? segmentos.map((s) => {
        const ini = (acc / totalUnidades) * 360;
        acc += s.unidades;
        const fin = (acc / totalUnidades) * 360;
        return `${s.color} ${ini.toFixed(2)}deg ${fin.toFixed(2)}deg`;
      })
    : [];
  const estiloDonut = { background: `conic-gradient(${stops.join(", ")})` };

  const filasMostradas = verTodos ? productos : productos.slice(0, 5);

  return (
    <section className="panel">
      <h1>🧾 Ventas</h1>

      {error && (
        <p style={{ color: "#E05252", marginBottom: "1rem" }}>⚠️ {error}</p>
      )}

      {/* ==================================================
          HU-016: REPORTE DE VENTAS DIARIAS Y MENSUALES
          ================================================== */}
      <div className="reporte-box">
        <h2>📊 Reporte de ventas</h2>

        <div className="reporte-periodos">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              className={periodo === p.id ? "activo" : ""}
              onClick={() => setPeriodo(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        {cargandoReporte ? (
          <p>Cargando reporte...</p>
        ) : errorReporte ? (
          <p style={{ color: "#E05252" }}>⚠️ {errorReporte}</p>
        ) : reporte ? (
          <>
            <p className="reporte-contexto">
              Periodo: <strong>{reporte.periodoEtiqueta}</strong> ·
              Sucursal: <strong>{reporte.sucursalNombre}</strong>
            </p>

            <div className="cards reporte-cards">
              <div className="card">
                <p>Número de ventas</p>
                <h2>{reporte.numeroVentas}</h2>
              </div>
              <div className="card">
                <p>Monto total</p>
                <h2 className="total">{fmt(reporte.montoTotal)}</h2>
              </div>
              <div className="card">
                <p>Subtotal (sin IVA)</p>
                <h2>{fmt(reporte.subtotal)}</h2>
              </div>
              <div className="card">
                <p>Impuestos (IVA)</p>
                <h2>{fmt(reporte.impuestos)}</h2>
              </div>
            </div>

            <h3 className="reporte-h3">📅 Desglose por día</h3>
            {reporte.desglosePorDia?.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ventas</th>
                    <th>Monto total</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.desglosePorDia.map((d) => (
                    <tr key={d.fecha}>
                      <td>{d.fecha}</td>
                      <td>{d.numeroVentas}</td>
                      <td>{fmt(d.montoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Sin ventas en el periodo.</p>
            )}

            <h3 className="reporte-h3">💳 Desglose por método de pago</h3>
            {reporte.desglosePorMetodoPago?.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Método de pago</th>
                    <th>Ventas</th>
                    <th>Monto total</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.desglosePorMetodoPago.map((m) => (
                    <tr key={m.metodoPago}>
                      <td>{m.metodoPago}</td>
                      <td>{m.numeroVentas}</td>
                      <td>{fmt(m.montoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Sin ventas en el periodo.</p>
            )}

            {/* ==================================================
                HU-017: PRODUCTOS MÁS VENDIDOS
                ================================================== */}
            <h3 className="reporte-h3">🏆 Productos más vendidos</h3>
            {cargandoProductos ? (
              <p>Cargando productos...</p>
            ) : errorProductos ? (
              <p style={{ color: "#E05252" }}>⚠️ {errorProductos}</p>
            ) : productos.length === 0 ? (
              <p>Sin ventas en el periodo.</p>
            ) : (
              <>
<div className="productos-layout">

  {/* Gráfica de dona estilo D3 con SVG puro */}
  <div style={{ position: "relative", width: "220px", flexShrink: 0 }}>

    {/* Texto central */}
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", pointerEvents: "none",
    }}>
      <p style={{ margin: 0, fontSize: "12px", color: "#8D9DB6" }}>Total</p>
      <p style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#f1f5f9" }}>
        {totalUnidades}
      </p>
      <p style={{ margin: 0, fontSize: "11px", color: "#8D9DB6" }}>unidades</p>
    </div>

    <svg
      viewBox="-420 -420 840 840"
      style={{ width: "220px", height: "220px", overflow: "visible" }}
    >
      <defs>
        {segmentos.map((s, i) => (
          <linearGradient key={i} id={`donut-grad-${i}`}>
            <stop offset="55%" stopColor={s.color} stopOpacity="0.95" />
          </linearGradient>
        ))}
      </defs>

      {(() => {
        const R = 420;
        const innerR = R / 1.625;
        const gap = 0.015;
        let anguloActual = -Math.PI / 2;

        return segmentos.map((s, i) => {
          const fraccion = s.unidades / totalUnidades;
          const angulo = fraccion * 2 * Math.PI - gap;
          const inicio = anguloActual + gap / 2;
          const fin = inicio + angulo;
          anguloActual += fraccion * 2 * Math.PI;

          const x1o = Math.cos(inicio) * R;
          const y1o = Math.sin(inicio) * R;
          const x2o = Math.cos(fin) * R;
          const y2o = Math.sin(fin) * R;
          const x1i = Math.cos(fin) * innerR;
          const y1i = Math.sin(fin) * innerR;
          const x2i = Math.cos(inicio) * innerR;
          const y2i = Math.sin(inicio) * innerR;

          const largeArc = angulo > Math.PI ? 1 : 0;
          const cornerR = 18;

          const d = [
            `M ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
            `A ${R} ${R} 0 ${largeArc} 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)}`,
            `L ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i.toFixed(2)} ${y2i.toFixed(2)}`,
            "Z",
          ].join(" ");

          // Etiqueta si el segmento es suficientemente grande
          const midAngle = inicio + angulo / 2;
          const labelR = R * 0.75;
          const lx = Math.cos(midAngle) * labelR;
          const ly = Math.sin(midAngle) * labelR;
          const pct = (fraccion * 100).toFixed(0);
          const mostrarLabel = angulo * (180 / Math.PI) > 20;

          return (
            <g key={i}>
              <path
                d={d}
                fill={`url(#donut-grad-${i})`}
                stroke="#ffffff22"
                strokeWidth={cornerR}
              />
              {mostrarLabel && (
                <g>
                  <text
                    x={lx} y={ly - 14}
                    textAnchor="middle"
                    fontSize={32} fontWeight="600" fill="#eee"
                  >
                    {s.nombre.length > 8 ? s.nombre.slice(0, 8) + "…" : s.nombre}
                  </text>
                  <text
                    x={lx} y={ly + 22}
                    textAnchor="middle"
                    fontSize={28} fill="#eee" fillOpacity="0.7"
                  >
                    {pct}%
                  </text>
                </g>
              )}
            </g>
          );
        });
      })()}
    </svg>
  </div>

  {/* Leyenda */}
  <ul className="leyenda-donut">
    {segmentos.map((s) => (
      <li key={s.nombre}>
        <span className="swatch" style={{ background: s.color }}></span>
        <span className="nombre">{s.nombre}</span>
        <span className="valor">
          {s.unidades} uds · {fmt(s.monto)} ·{" "}
          {((s.unidades / totalUnidades) * 100).toFixed(1)}%
        </span>
      </li>
    ))}
  </ul>
</div>


                <table className="tabla-productos">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Unidades vendidas</th>
                      <th>Monto total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasMostradas.map((p, i) => (
                      <tr key={p.productoId}>
                        <td>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </td>
                        <td>{p.nombre}</td>
                        <td>{p.unidadesVendidas}</td>
                        <td>{fmt(p.montoTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {productos.length > 5 && (
                  <button
                    className="btn-desplegar"
                    onClick={() => setVerTodos(!verTodos)}
                  >
                    {verTodos
                      ? "▲ Mostrar solo top 5"
                      : `▼ Ver todos los productos (${productos.length})`}
                  </button>
                )}
              </>
            )}

            <p className="reporte-nota">
              Los totales corresponden a las ventas registradas en el
              periodo y la sucursal seleccionados.
            </p>
          </>
        ) : null}
      </div>

      {/* ==================================================
          LISTA DETALLADA DE VENTAS
          ================================================== */}
      <h2>🧾 Detalle de ventas</h2>

      {cargando ? (
        <p>Cargando...</p>
      ) : ventas.length === 0 ? (
        <p>No hay ventas registradas para esta sucursal.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Puntos HU-025</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>IVA</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Cambio</th>
              <th>Cajero</th>
              <th>Sucursal</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id}>
                <td>{v.folio}</td>
                <td>{v.clienteFidelidadId ? `+${v.puntosGenerados ?? 0} (cliente #${v.clienteFidelidadId})` : "Sin cliente asociado"}</td>
                <td>{new Date(v.fecha).toLocaleString()}</td>
                <td>${v.subtotal?.toFixed(2)}</td>
                <td>${v.impuestos?.toFixed(2)}</td>
                <td><strong>${v.total?.toFixed(2)}</strong></td>
                <td>{v.metodoPago}</td>
                <td>{v.cambio != null ? `$${v.cambio.toFixed(2)}` : "—"}</td>
                <td>{v.usuarioNombre}</td>
                <td>{v.sucursalNombre || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Ventas;

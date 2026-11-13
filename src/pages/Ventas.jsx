import { useEffect, useState } from "react";
import api from "../services/api";

const PERIODOS = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "semana", etiqueta: "Esta semana" },
  { id: "mes", etiqueta: "Este mes" },
  { id: "mes_anterior", etiqueta: "Mes anterior" },
  { id: "anio", etiqueta: "Este año" },
  { id: "personalizado", etiqueta: "Personalizado" },
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

  // Estado del reporte y los filtros de HU-050.
  const [periodo, setPeriodo] = useState("hoy");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [reporte, setReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(true);
  const [errorReporte, setErrorReporte] = useState(null);

  // Estado de productos más vendidos.
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState(null);
  const [verTodos, setVerTodos] = useState(false);

  // El filtro aplicado es independiente de los valores que el usuario
  // está editando. Así evitamos consultar rangos incompletos.
  const [filtroAplicado, setFiltroAplicado] = useState({ periodo: "hoy" });
  const [filtroPendiente, setFiltroPendiente] = useState(false);

  const errorFiltroPeriodo =
    periodo !== "personalizado"
      ? null
      : !fechaInicio || !fechaFin
        ? "Selecciona una fecha inicial y una fecha final."
        : fechaInicio > fechaFin
          ? "La fecha inicial no puede ser posterior a la fecha final."
          : null;

  // Lista detallada: la respuesta de la API actualiza el estado únicamente
  // dentro de callbacks asíncronos, no de forma síncrona en el efecto.
  useEffect(() => {
    let activo = true;
    const sucursalId = usuario?.sucursalId;

    if (!sucursalId) {
      return () => {
        activo = false;
      };
    }

    api.get("/ventas")
      .then((res) => {
        if (!activo) return;
        const todas = Array.isArray(res.data) ? res.data : [];
        const filtradas = todas.filter(
          (v) => Number(v.sucursalId) === Number(sucursalId)
        );
        setVentas(filtradas);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (activo) setError("No se pudieron cargar las ventas.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [usuario?.sucursalId]);

  // El reporte y el ranking consultan exactamente el mismo período aplicado.
  useEffect(() => {
    let activo = true;
    const params = new URLSearchParams({ periodo: filtroAplicado.periodo });

    if (filtroAplicado.periodo === "personalizado") {
      params.set("desde", filtroAplicado.desde);
      params.set("hasta", filtroAplicado.hasta);
    }

    api.get(`/ventas/reporte?${params.toString()}`)
      .then((res) => {
        if (activo) setReporte(res.data);
      })
      .catch((err) => {
        console.error(err);
        if (activo) {
          const mensaje = err?.response?.data?.mensaje;
          setErrorReporte(mensaje || "No se pudo cargar el reporte.");
          setReporte(null);
        }
      })
      .finally(() => {
        if (activo) setCargandoReporte(false);
      });

    api.get(`/ventas/reporte/top-productos?${params.toString()}`)
      .then((res) => {
        if (activo) {
          setProductos(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        console.error(err);
        if (activo) {
          const mensaje = err?.response?.data?.mensaje;
          setErrorProductos(
            mensaje || "No se pudo cargar el ranking de productos."
          );
          setProductos([]);
        }
      })
      .finally(() => {
        if (activo) setCargandoProductos(false);
      });

    return () => {
      activo = false;
    };
  }, [filtroAplicado, usuario?.id, usuario?.sucursalId]);

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

  const filasMostradas = verTodos ? productos : productos.slice(0, 5);

  return (
    <section className="panel">
      <h1>🧾 Ventas</h1>

      {(error || !usuario?.sucursalId) && (
        <p style={{ color: "#E05252", marginBottom: "1rem" }}>
          ⚠️ {error || "Tu cuenta no tiene una sucursal asignada. Contacta al administrador."}
        </p>
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
              type="button"
              className={periodo === p.id ? "activo" : ""}
              onClick={() => {
                setPeriodo(p.id);
                setVerTodos(false);
                setFiltroPendiente(p.id === "personalizado");
                if (p.id !== "personalizado") {
                  setCargandoReporte(true);
                  setCargandoProductos(true);
                  setErrorReporte(null);
                  setErrorProductos(null);
                  setFiltroAplicado({ periodo: p.id });
                }
              }}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        {periodo === "personalizado" && (
          <div
            className="reporte-fechas-personalizadas"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <label style={{ display: "grid", gap: "6px", minWidth: "190px" }}>
              Fecha inicial
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setFiltroPendiente(true);
                  setVerTodos(false);
                }}
                aria-label="Fecha inicial del reporte"
              />
            </label>

            <label style={{ display: "grid", gap: "6px", minWidth: "190px" }}>
              Fecha final
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setFiltroPendiente(true);
                  setVerTodos(false);
                }}
                aria-label="Fecha final del reporte"
              />
            </label>
            <button
              type="button"
              disabled={Boolean(errorFiltroPeriodo)}
              onClick={() => {
                setVerTodos(false);
                setErrorReporte(null);
                setErrorProductos(null);
                setCargandoReporte(true);
                setCargandoProductos(true);
                setFiltroPendiente(false);
                setFiltroAplicado({
                  periodo: "personalizado",
                  desde: fechaInicio,
                  hasta: fechaFin,
                });
              }}
            >
              Aplicar período
            </button>
          </div>
        )}

        {errorFiltroPeriodo && (
          <p role="alert" style={{ color: "#E05252", marginBottom: "12px" }}>
            {errorFiltroPeriodo}
          </p>
        )}

        {errorFiltroPeriodo ? null : filtroPendiente ? (
          <p>Selecciona las fechas y pulsa Aplicar período para actualizar el reporte.</p>
        ) : cargandoReporte ? (
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

      {!usuario?.sucursalId ? (
        <p>No se puede consultar el detalle sin una sucursal asignada.</p>
      ) : cargando ? (
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

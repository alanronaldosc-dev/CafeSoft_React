
import { useEffect, useState } from "react";
import api from "../services/api";
import "./PatronesConsumo.css";
import { exportarPatronesExcel } from "../utils/exportarPatronesExcel";

// ==========================================
// FUNCIONES DE FORMATO
// ==========================================
const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

const fechaBonita = (fecha) => {
  if (!fecha) return "—";

  const [anio, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${anio}`;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function PatronesConsumo({
  modo = "horarios",
}) {
  // ========================================
  // ESTADOS
  // ========================================
  const [inicio, setInicio] = useState(() =>
    localDate(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
    )
  );

  const [fin, setFin] = useState(() =>
    localDate(new Date())
  );

  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const esHorario = modo === "horarios";

  const rangoValido = Boolean(
    inicio && fin && inicio <= fin
  );

  // ========================================
  // CONSULTAR REPORTE
  // ========================================
  useEffect(() => {
    if (!rangoValido) {
      setReporte(null);
      setError("Selecciona un rango de fechas válido.");
      return;
    }

    let activo = true;

    setLoading(true);
    setError("");
    setReporte(null);

    api
      .get("/ventas/reporte/patrones", {
        params: { inicio, fin },
      })
      .then(({ data }) => {
        if (activo) {
          setReporte(data);
        }
      })
      .catch((err) => {
        if (activo) {
          console.error(
            "Error al consultar patrones:",
            err
          );

          setReporte(null);

          setError(
            err.response?.data?.message ||
              err.response?.data?.mensaje ||
              "No se pudo cargar el análisis."
          );
        }
      })
      .finally(() => {
        if (activo) {
          setLoading(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [inicio, fin, revision, rangoValido]);

  // ========================================
  // EXPORTAR REPORTE EXCEL
  // ========================================
  async function exportar() {
    if (
      !reporte ||
      !rangoValido ||
      loading ||
      exportando
    ) {
      return;
    }

    setExportando(true);
    setError("");

    try {
      await exportarPatronesExcel({
        reporte,
        inicio,
        fin,
        modo,
      });
    } catch (err) {
      console.error(
        "Error al exportar Excel:",
        err
      );

      setError(
        "No fue posible generar el archivo Excel."
      );
    } finally {
      setExportando(false);
    }
  }

  // ========================================
  // DATOS PARA GRÁFICAS
  // ========================================
  const franjas = reporte?.franjas || [];
  const dias = reporte?.dias || [];

  const maxHora = Math.max(
    1,
    ...franjas.map((f) =>
      Number(f.numeroVentas || 0)
    )
  );

  const maxDia = Math.max(
    1,
    ...dias.map((d) =>
      Number(d.numeroVentas || 0)
    )
  );

  // ========================================
  // HORAS DE MAYOR CONSUMO
  // ========================================
  const mayorNumeroVentas = Math.max(
    0,
    ...franjas.map((f) =>
      Number(f.numeroVentas || 0)
    )
  );

  const horasPico =
    mayorNumeroVentas > 0
      ? franjas.filter(
          (f) =>
            Number(f.numeroVentas || 0) ===
            mayorNumeroVentas
        )
      : [];

  // ========================================
  // TÍTULOS
  // ========================================
  const titulo = esHorario
    ? "Reportes por horario"
    : "Patrones de consumo diario";

  const descripcion = esHorario
    ? "Descubre las horas con más ventas y analiza los ingresos de tu sucursal."
    : "Consulta el comportamiento de las ventas por día para planificar recursos y promociones.";

  // ========================================
  // INTERFAZ
  // ========================================
  return (
    <section className="patrones-panel">
      {/* ===================================
          ENCABEZADO
      =================================== */}
      <header className="patrones-header">
        <div className="patrones-header-icon">
          {esHorario ? "🕒" : "📊"}
        </div>

        <div className="patrones-header-text">
          <span className="patrones-eyebrow">
            ANÁLISIS DE VENTAS
          </span>

          <h2>{titulo}</h2>

          <p>{descripcion}</p>
        </div>
      </header>

      {/* ===================================
          FILTROS DE FECHAS
      =================================== */}
      <div className="patrones-toolbar">
        <div className="patrones-toolbar-heading">
          <h3>📅 Periodo de consulta</h3>

          <p>
            Selecciona las fechas que deseas analizar.
          </p>
        </div>

        <div className="patrones-filtros">
          {/* FECHA INICIAL */}
          <label className="patrones-campo">
            <span>Desde</span>

            <input
              aria-label="Fecha inicial"
              type="date"
              value={inicio}
              onChange={(e) =>
                setInicio(e.target.value)
              }
            />
          </label>

          {/* FECHA FINAL */}
          <label className="patrones-campo">
            <span>Hasta</span>

            <input
              aria-label="Fecha final"
              type="date"
              value={fin}
              onChange={(e) =>
                setFin(e.target.value)
              }
            />
          </label>

          {/* ACTUALIZAR */}
          <button
            type="button"
            className="patrones-btn patrones-btn-primary"
            onClick={() =>
              setRevision((valor) => valor + 1)
            }
            disabled={loading || !rangoValido}
          >
            <span>↻</span>

            {loading
              ? "Actualizando..."
              : "Actualizar"}
          </button>

          {/* EXPORTAR EXCEL */}
          <button
            type="button"
            className="patrones-btn patrones-btn-export"
            onClick={exportar}
            disabled={
              !reporte ||
              loading ||
              exportando ||
              !rangoValido
            }
          >
            <span>↓</span>

            {exportando
              ? "Generando Excel..."
              : "Exportar Excel"}
          </button>
        </div>
      </div>

      {/* ===================================
          MENSAJES DE ERROR
      =================================== */}
      {error && (
        <div
          role="alert"
          className="patrones-error"
        >
          ⚠️ {error}
        </div>
      )}

      {/* ===================================
          CARGANDO INFORMACIÓN
      =================================== */}
      {loading && (
        <div className="patrones-loading">
          <div className="patrones-spinner" />

          <p>
            Cargando información de ventas...
          </p>
        </div>
      )}

      {/* ===================================
          REPORTE
      =================================== */}
      {!loading && reporte && (
        <>
          {/* ===============================
              RESUMEN DEL PERIODO
          =============================== */}
          <div className="patrones-resumen-header">
            <div>
              <h3>Resumen del periodo</h3>

              <p>
                {fechaBonita(inicio)} al{" "}
                {fechaBonita(fin)}
              </p>
            </div>
          </div>

          {/* TARJETAS */}
          <div className="patrones-kpis">
            {/* SUCURSAL */}
            <div className="patrones-kpi">
              <div className="patrones-kpi-top">
                <span>Sucursal</span>

                <span className="patrones-kpi-icon">
                  🏪
                </span>
              </div>

              <strong>
                {reporte.sucursalNombre || "—"}
              </strong>

              <small>
                Sucursal consultada
              </small>
            </div>

            {/* TOTAL DE VENTAS */}
            <div className="patrones-kpi">
              <div className="patrones-kpi-top">
                <span>Total de ventas</span>

                <span className="patrones-kpi-icon">
                  🧾
                </span>
              </div>

              <strong>
                {reporte.numeroVentas ?? 0}
              </strong>

              <small>
                Ventas registradas
              </small>
            </div>

            {/* INGRESOS TOTALES */}
            <div className="patrones-kpi">
              <div className="patrones-kpi-top">
                <span>Ingresos totales</span>

                <span className="patrones-kpi-icon">
                  💰
                </span>
              </div>

              <strong className="patrones-kpi-money">
                {money(reporte.montoTotal)}
              </strong>

              <small>
                Ingresos del periodo
              </small>
            </div>

            {/* MAYOR CONSUMO */}
            {esHorario && (
              <div className="patrones-kpi patrones-kpi-highlight">
                <div className="patrones-kpi-top">
                  <span>Mayor consumo</span>

                  <span className="patrones-kpi-icon">
                    🔥
                  </span>
                </div>

                <strong>
                  {horasPico.length
                    ? horasPico
                        .map((f) => f.franja)
                        .join(", ")
                    : "Sin ventas"}
                </strong>

                <small>
                  {horasPico.length
                    ? `${mayorNumeroVentas} ventas por franja`
                    : "No hay ventas en el periodo"}
                </small>
              </div>
            )}
          </div>

          {/* ===============================
              GRÁFICA POR HORARIO
          =============================== */}
          {esHorario && (
            <div className="patrones-grafica-card">
              <div className="patrones-section-heading">
                <div>
                  <h3>
                    🕒 Ventas por franja horaria
                  </h3>

                  <p>
                    Distribución de ventas durante
                    las 24 horas del día.
                  </p>
                </div>

                <span className="patrones-section-tag">
                  24 horas
                </span>
              </div>

              <div className="patrones-chart">
                {franjas.map((f) => {
                  const ventas = Number(
                    f.numeroVentas || 0
                  );

                  const esPico =
                    mayorNumeroVentas > 0 &&
                    ventas === mayorNumeroVentas;

                  return (
                    <div
                      className={`patrones-bar ${
                        esPico
                          ? "patrones-bar-pico"
                          : ""
                      }`}
                      key={f.hora}
                      title={`${f.franja}: ${ventas} ventas · ${money(f.montoTotal)}`}
                    >
                      <span className="patrones-bar-value">
                        {ventas}
                      </span>

                      <div className="patrones-bar-area">
                        <div
                          className="patrones-bar-fill"
                          style={{
                            height: `${
                              ventas > 0
                                ? Math.max(
                                    5,
                                    (ventas / maxHora) *
                                      100
                                  )
                                : 2
                            }%`,
                          }}
                        />
                      </div>

                      <small>
                        {String(f.hora).padStart(
                          2,
                          "0"
                        )}
                      </small>
                    </div>
                  );
                })}
              </div>

              <div className="patrones-leyenda">
                <span>
                  <i className="patrones-dot" />
                  Ventas por hora
                </span>

                <span>
                  <i className="patrones-dot patrones-dot-pico" />
                  Horas de mayor consumo
                </span>
              </div>
            </div>
          )}

          {/* ===============================
              CONSUMO POR DÍA
          =============================== */}
          {!esHorario && (
            <div className="patrones-grafica-card">
              <div className="patrones-section-heading">
                <div>
                  <h3>📅 Consumo por día</h3>

                  <p>
                    Comparación de ventas e ingresos
                    por fecha.
                  </p>
                </div>

                <span className="patrones-section-tag">
                  {dias.length} días
                </span>
              </div>

              <div className="patrones-dias">
                {dias.map((d) => {
                  const ventas = Number(
                    d.numeroVentas || 0
                  );

                  return (
                    <div
                      key={d.fecha}
                      className="patrones-dia"
                    >
                      <div className="patrones-dia-fecha">
                        <strong>
                          {fechaBonita(d.fecha)}
                        </strong>

                        <small>
                          {d.diaSemana}
                        </small>
                      </div>

                      <div className="patrones-track">
                        <div
                          style={{
                            width: `${
                              (ventas / maxDia) *
                              100
                            }%`,
                          }}
                        />
                      </div>

                      <div className="patrones-dia-total">
                        <strong>
                          {ventas}{" "}
                          {ventas === 1
                            ? "venta"
                            : "ventas"}
                        </strong>

                        <small>
                          {money(d.montoTotal)}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===============================
              NOTA FINAL
          =============================== */}
          <footer className="patrones-footer">
            <span>ⓘ</span>

            <p>
              Los resultados corresponden a las
              ventas registradas entre{" "}
              <strong>
                {fechaBonita(inicio)}
              </strong>{" "}
              y{" "}
              <strong>
                {fechaBonita(fin)}
              </strong>
              . Puedes descargar el reporte
              utilizando el botón Exportar Excel.
            </p>
          </footer>
        </>
      )}
    </section>
  );
}

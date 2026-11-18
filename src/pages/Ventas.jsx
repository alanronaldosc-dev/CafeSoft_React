import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardVentas from "../components/DashboardVentas";
import ProductosMasVendidos from "../components/ProductosMasVendidos";
import { moneda } from "../utils/formato";

const PERIODOS = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "semana", etiqueta: "Esta semana" },
  { id: "mes", etiqueta: "Este mes" },
  { id: "mes_anterior", etiqueta: "Mes anterior" },
  { id: "anio", etiqueta: "Este año" },
  { id: "personalizado", etiqueta: "Personalizado" },
];

function Ventas({ usuario }) {
  const [ventas, setVentas] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(true);
  const [errorVentas, setErrorVentas] = useState(null);

  const [periodo, setPeriodo] = useState("hoy");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [filtroAplicado, setFiltroAplicado] = useState({ periodo: "hoy" });
  const [filtroPendiente, setFiltroPendiente] = useState(false);

  const [reporte, setReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(true);
  const [errorReporte, setErrorReporte] = useState(null);

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState(null);

  const errorFiltroPeriodo =
    periodo !== "personalizado"
      ? null
      : !fechaInicio || !fechaFin
        ? "Selecciona una fecha inicial y una fecha final."
        : fechaInicio > fechaFin
          ? "La fecha inicial no puede ser posterior a la fecha final."
          : null;

  // Carga el detalle de ventas de la sucursal del usuario.
  useEffect(() => {
    let cancelado = false;
    const sucursalId = usuario?.sucursalId;

    if (!sucursalId) {
      setErrorVentas(
        "Tu cuenta no tiene una sucursal asignada. Contacta al administrador."
      );
      setCargandoVentas(false);

      return () => {
        cancelado = true;
      };
    }

    api.get("/ventas")
      .then((res) => {
        if (cancelado) return;

        const todas = Array.isArray(res.data) ? res.data : [];
        const filtradas = todas.filter(
          (venta) => Number(venta.sucursalId) === Number(sucursalId)
        );

        setVentas(filtradas);
        setErrorVentas(null);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelado) {
          setErrorVentas("No se pudieron cargar las ventas.");
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoVentas(false);
      });

    return () => {
      cancelado = true;
    };
  }, [usuario?.sucursalId]);

  // Consulta el reporte y los productos usando exactamente el mismo filtro.
  useEffect(() => {
    let cancelado = false;

    const parametros = new URLSearchParams({
      periodo: filtroAplicado.periodo,
    });

    if (filtroAplicado.periodo === "personalizado") {
      parametros.set("desde", filtroAplicado.desde);
      parametros.set("hasta", filtroAplicado.hasta);
    }

    const consulta = parametros.toString();

    setCargandoReporte(true);
    setCargandoProductos(true);
    setErrorReporte(null);
    setErrorProductos(null);

    api.get(`/ventas/reporte?${consulta}`)
      .then((res) => {
        if (!cancelado) {
          setReporte(res.data);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelado) {
          setErrorReporte(
            err?.response?.data?.mensaje ||
            "No se pudo cargar el reporte."
          );
          setReporte(null);
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoReporte(false);
      });

    api.get(`/ventas/reporte/top-productos?${consulta}`)
      .then((res) => {
        if (!cancelado) {
          setProductos(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelado) {
          setErrorProductos(
            err?.response?.data?.mensaje ||
            "No se pudo cargar el ranking de productos."
          );
          setProductos([]);
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoProductos(false);
      });

    return () => {
      cancelado = true;
    };
  }, [filtroAplicado, usuario?.id, usuario?.sucursalId]);

  // Adapta la respuesta del reporte al formato del dashboard HU-041.
  const datosDashboard = reporte
    ? {
        ...reporte,
        numeroVentas: Number(reporte.numeroVentas) || 0,
        montoTotal: Number(reporte.montoTotal) || 0,
        ticketPromedio:
          Number(reporte.numeroVentas) > 0
            ? Number(reporte.montoTotal || 0) / Number(reporte.numeroVentas)
            : 0,
        diasConVentas: (reporte.desglosePorDia || []).filter(
          (dia) => Number(dia.numeroVentas) > 0
        ).length,
        desglosePorDia: reporte.desglosePorDia || [],
      }
    : null;

  const cambiarPeriodo = (nuevoPeriodo) => {
    if (nuevoPeriodo === periodo) return;

    setPeriodo(nuevoPeriodo);
    setReporte(null);
    setProductos([]);
    setErrorReporte(null);
    setErrorProductos(null);

    if (nuevoPeriodo === "personalizado") {
      setFiltroPendiente(true);
      setCargandoReporte(false);
      setCargandoProductos(false);
      return;
    }

    setFiltroPendiente(false);
    setCargandoReporte(true);
    setCargandoProductos(true);
    setFiltroAplicado({ periodo: nuevoPeriodo });
  };

  const aplicarPeriodoPersonalizado = () => {
    if (errorFiltroPeriodo) return;

    setFiltroPendiente(false);
    setReporte(null);
    setProductos([]);
    setCargandoReporte(true);
    setCargandoProductos(true);
    setErrorReporte(null);
    setErrorProductos(null);

    setFiltroAplicado({
      periodo: "personalizado",
      desde: fechaInicio,
      hasta: fechaFin,
    });
  };

  return (
    <section className="panel">
      <h1>🧾 Ventas</h1>

      {errorVentas && (
        <p className="aviso-error" role="alert">
          ⚠️ {errorVentas}
        </p>
      )}

      {/* HU-050: filtros y dashboard de ventas. */}
      <DashboardVentas
        datos={filtroPendiente ? null : datosDashboard}
        cargando={filtroPendiente ? false : cargandoReporte}
        error={filtroPendiente ? null : errorReporte}
        periodo={periodo}
        periodos={PERIODOS}
        onCambiarPeriodo={cambiarPeriodo}
      />

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
              aria-label="Fecha inicial del reporte"
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setFiltroPendiente(true);
                setReporte(null);
                setProductos([]);
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "6px", minWidth: "190px" }}>
            Fecha final
            <input
              type="date"
              value={fechaFin}
              aria-label="Fecha final del reporte"
              onChange={(e) => {
                setFechaFin(e.target.value);
                setFiltroPendiente(true);
                setReporte(null);
                setProductos([]);
              }}
            />
          </label>

          <button
            type="button"
            disabled={Boolean(errorFiltroPeriodo)}
            onClick={aplicarPeriodoPersonalizado}
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

      {filtroPendiente && !errorFiltroPeriodo && (
        <p>
          Selecciona las fechas y pulsa Aplicar período para actualizar el
          dashboard y los reportes.
        </p>
      )}

      {/* Desglose del reporte para el periodo aplicado. */}
      {!filtroPendiente && reporte && !errorReporte && (
        <div className="reporte-box">
          <h2>📊 Desglose del periodo</h2>

          <p className="reporte-nota">
            Periodo: <strong>{reporte.periodoEtiqueta}</strong> ·
            Sucursal: <strong>{reporte.sucursalNombre}</strong>
          </p>

          <h3 className="reporte-h3">📅 Ventas por día</h3>
          {reporte.desglosePorDia?.length ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Ventas</th>
                  <th scope="col">Monto total</th>
                </tr>
              </thead>
              <tbody>
                {reporte.desglosePorDia.map((dia) => (
                  <tr key={dia.fecha}>
                    <td>{dia.fecha}</td>
                    <td>{dia.numeroVentas}</td>
                    <td>{moneda(dia.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Sin ventas en el periodo.</p>
          )}

          <h3 className="reporte-h3">💳 Ventas por método de pago</h3>
          {reporte.desglosePorMetodoPago?.length ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">Método de pago</th>
                  <th scope="col">Ventas</th>
                  <th scope="col">Monto total</th>
                </tr>
              </thead>
              <tbody>
                {reporte.desglosePorMetodoPago.map((metodo) => (
                  <tr key={metodo.metodoPago}>
                    <td>{metodo.metodoPago}</td>
                    <td>{metodo.numeroVentas}</td>
                    <td>{moneda(metodo.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Sin ventas en el periodo.</p>
          )}

          <p className="reporte-nota">
            Los totales corresponden a las ventas registradas en el periodo y
            la sucursal seleccionados.
          </p>
        </div>
      )}

      {/* El ranking utiliza el mismo periodo que el dashboard. */}
      <div className="reporte-box">
        <h2>🏆 Productos más vendidos</h2>

        {filtroPendiente ? (
          <p>Aplica un periodo para consultar los productos más vendidos.</p>
        ) : (
          <ProductosMasVendidos
            productos={productos}
            cargando={cargandoProductos}
            error={errorProductos}
          />
        )}
      </div>

      {/* Detalle de ventas de la sucursal. */}
      <h2>🧾 Detalle de ventas</h2>

      {!usuario?.sucursalId ? (
        <p>No hay ventas registradas para esta sucursal.</p>
      ) : cargandoVentas ? (
        <p>Cargando...</p>
      ) : ventas.length === 0 ? (
        <p>No hay ventas registradas para esta sucursal.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Folio</th>
              <th scope="col">Puntos HU-025</th>
              <th scope="col">Fecha</th>
              <th scope="col">Subtotal</th>
              <th scope="col">IVA</th>
              <th scope="col">Total</th>
              <th scope="col">Pago</th>
              <th scope="col">Cambio</th>
              <th scope="col">Cajero</th>
              <th scope="col">Sucursal</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td>{venta.folio}</td>
                <td>
                  {venta.clienteFidelidadId
                    ? `+${venta.puntosGenerados ?? 0} (cliente #${venta.clienteFidelidadId})`
                    : "Sin cliente asociado"}
                </td>
                <td>{new Date(venta.fecha).toLocaleString()}</td>
                <td>{moneda(venta.subtotal)}</td>
                <td>{moneda(venta.impuestos)}</td>
                <td><strong>{moneda(venta.total)}</strong></td>
                <td>{venta.metodoPago}</td>
                <td>{venta.cambio != null ? moneda(venta.cambio) : "—"}</td>
                <td>{venta.usuarioNombre}</td>
                <td>{venta.sucursalNombre || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Ventas;
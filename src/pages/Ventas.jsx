import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardVentas from "../components/DashboardVentas";
import ProductosMasVendidos from "../components/ProductosMasVendidos";
import { moneda } from "../utils/formato";

const PERIODOS = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "mes", etiqueta: "Este mes" },
  { id: "mes_anterior", etiqueta: "Mes anterior" },
];

function Ventas({ usuario, onNavegar }) {
  // ── Detalle de ventas de la sucursal ──
  const [ventas, setVentas] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(true);
  const [errorVentas, setErrorVentas] = useState(null);

  // ── Dashboard del periodo (HU-041 / HU-042) ──
  const [periodo, setPeriodo] = useState("hoy");
  const [dashboard, setDashboard] = useState(null);
  const [cargandoDashboard, setCargandoDashboard] = useState(true);
  const [errorDashboard, setErrorDashboard] = useState(null);

  useEffect(() => {
    let cancelado = false;

    const cargarVentas = async () => {
      const sucursalId = usuario?.sucursalId;

      if (!sucursalId) {
        setErrorVentas(
          "Tu cuenta no tiene una sucursal asignada. Contacta al administrador.",
        );
        setCargandoVentas(false);
        return;
      }

      try {
        const res = await api.get("/ventas");
        if (cancelado) return;
        const todas = Array.isArray(res.data) ? res.data : [];
        setVentas(
          todas.filter((v) => Number(v.sucursalId) === Number(sucursalId)),
        );
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setErrorVentas("No se pudieron cargar las ventas.");
      } finally {
        if (!cancelado) setCargandoVentas(false);
      }
    };

    cargarVentas();
    return () => {
      cancelado = true;
    };
  }, [usuario]);

  // Un solo endpoint alimenta el dashboard, el desglose y el ranking,
  // de modo que las cifras siempre coinciden entre sí.
  const cambiarPeriodo = (nuevoPeriodo) => {
    if (nuevoPeriodo === periodo) return;
    setCargandoDashboard(true);
    setErrorDashboard(null);
    setPeriodo(nuevoPeriodo);
  };

  useEffect(() => {
    let cancelado = false;

    api
      .get(`/ventas/dashboard?periodo=${periodo}`)
      .then((res) => {
        if (!cancelado) setDashboard(res.data);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error(err);
        setErrorDashboard(
          err?.response?.data?.mensaje || "No se pudo cargar el dashboard.",
        );
        setDashboard(null);
      })
      .finally(() => {
        if (!cancelado) setCargandoDashboard(false);
      });

    return () => {
      cancelado = true;
    };
  }, [periodo, usuario]);

  const reporte = dashboard;
  const productos = dashboard?.topProductos || [];

  return (
    <section className="panel">
      <h1>🧾 Ventas</h1>
      {usuario?.userTipo === 0 && (
        <button
          type="button"
          className="btn-secondary"
          style={{ width: "auto", marginBottom: "1rem" }}
          onClick={() => onNavegar?.("desempenoRepartidores")}
        >
          🏆 Desempeño de repartidores
        </button>
      )}

      {errorVentas && (
        <p className="aviso-error" role="alert">
          ⚠️ {errorVentas}
        </p>
      )}

      {/* ==================================================
          HU-041: DASHBOARD DE VENTAS
          ================================================== */}
      <DashboardVentas
        datos={dashboard}
        cargando={cargandoDashboard}
        error={errorDashboard}
        periodo={periodo}
        periodos={PERIODOS}
        onCambiarPeriodo={cambiarPeriodo}
      />

      {/* ==================================================
          HU-016: DESGLOSE DEL REPORTE
          ================================================== */}
      {reporte && (
        <div className="reporte-box">
          <h2>📊 Desglose del periodo</h2>

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
                {reporte.desglosePorDia.map((d) => (
                  <tr key={d.fecha}>
                    <td>{d.fecha}</td>
                    <td>{d.numeroVentas}</td>
                    <td>{moneda(d.montoTotal)}</td>
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
                {reporte.desglosePorMetodoPago.map((m) => (
                  <tr key={m.metodoPago}>
                    <td>{m.metodoPago}</td>
                    <td>{m.numeroVentas}</td>
                    <td>{moneda(m.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Sin ventas en el periodo.</p>
          )}

          <p className="reporte-nota">
            Los totales corresponden a las ventas registradas en el
            periodo y la sucursal seleccionados.
          </p>
        </div>
      )}

      {/* ==================================================
          HU-042: PRODUCTOS MÁS VENDIDOS
          ================================================== */}
      <div className="reporte-box">
        <h2>🏆 Productos más vendidos</h2>
        <ProductosMasVendidos
          productos={productos}
          cargando={cargandoDashboard}
          error={errorDashboard}
        />
      </div>

      {/* ==================================================
          DETALLE DE VENTAS
          ================================================== */}
      <h2>🧾 Detalle de ventas</h2>

      {cargandoVentas ? (
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
            {ventas.map((v) => (
              <tr key={v.id}>
                <td>{v.folio}</td>
                <td>
                  {v.clienteFidelidadId
                    ? `+${v.puntosGenerados ?? 0} (cliente #${v.clienteFidelidadId})`
                    : "Sin cliente asociado"}
                </td>
                <td>{new Date(v.fecha).toLocaleString()}</td>
                <td>{moneda(v.subtotal)}</td>
                <td>{moneda(v.impuestos)}</td>
                <td>
                  <strong>{moneda(v.total)}</strong>
                </td>
                <td>{v.metodoPago}</td>
                <td>{v.cambio != null ? moneda(v.cambio) : "—"}</td>
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

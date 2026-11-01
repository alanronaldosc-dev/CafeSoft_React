import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Liquidaciones() {
  const [repartidores, setRepartidores] = useState([]);
  const [repartidorId, setRepartidorId] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [resumen, setResumen] = useState(null);
  const [efectivoEntregado, setEfectivoEntregado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [cargandoRepartidores, setCargandoRepartidores] = useState(false);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [paginaActual, setPaginaActual] = useState(0);

  // ============================================
  // CARGAR REPARTIDORES AL MONTAR
  // ============================================

  const cargarRepartidores = async () => {
    try {
      setCargandoRepartidores(true);
      setError("");
      const res = await api.get("/usuarios/tipo/4");
      const data = res.data;
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.usuarios)
          ? data.usuarios
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setRepartidores(lista.filter((u) => u.activo !== false));
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los repartidores.");
    } finally {
      setCargandoRepartidores(false);
    }
  };

  useEffect(() => {
    cargarRepartidores();
  }, []);

  // ============================================
  // CARGAR RESUMEN AL SELECCIONAR REPARTIDOR O FECHA
  // ============================================

  useEffect(() => {
    if (repartidorId) {
      cargarResumen();
      cargarLiquidaciones();
    } else {
      setResumen(null);
      setLiquidaciones([]);
      setResultado(null);
    }
  }, [repartidorId, fecha]);

  const cargarResumen = async () => {
    try {
      setCargandoResumen(true);
      setError("");
      setResultado(null);
      const res = await api.get(
        `/liquidaciones/repartidor/${repartidorId}/resumen`,
        { params: { fecha } }
      );
      setResumen(res.data);
      setEfectivoEntregado(
        String(res.data?.totalEfectivo ?? 0)
      );
    } catch (e) {
      console.error(e);
      setResumen(null);
      setError(
        e.response?.data?.error ||
          "No se pudo obtener el resumen del repartidor."
      );
    } finally {
      setCargandoResumen(false);
    }
  };

  const cargarLiquidaciones = async () => {
    if (!repartidorId) return;
    try {
      const res = await api.get(`/liquidaciones/repartidor/${repartidorId}`);
      setLiquidaciones(Array.isArray(res.data) ? res.data : []);
      setPaginaActual(0);
    } catch (e) {
      console.error(e);
      setLiquidaciones([]);
    }
  };

  // ============================================
  // DIFERENCIAS
  // ============================================

  const diferenciaGarrafones = useMemo(() => {
    if (!resumen) return 0;
    return (
      Number(resumen.cargaInicial || 0) -
      Number(resumen.garrafonesEntregados || 0) -
      Number(resumen.garrafonesPendientes || 0)
    );
  }, [resumen]);

  const diferenciaEfectivo = useMemo(() => {
    if (!resumen) return 0;
    return (
      Number(resumen.totalEfectivo || 0) -
      Number(efectivoEntregado || 0)
    );
  }, [resumen, efectivoEntregado]);

  // ============================================
  // REGISTRAR LIQUIDACIÓN
  // ============================================

  const registrarLiquidacion = async (e) => {
    e.preventDefault();
    if (!repartidorId || !resumen) {
      setError("Selecciona un repartidor.");
      return;
    }
    const efectivo = Number(efectivoEntregado || 0);
    if (efectivo < 0) {
      setError("Los valores no pueden ser negativos.");
      return;
    }
    try {
      setGuardando(true);
      setError("");
      const res = await api.post("/liquidaciones", {
        repartidorId: Number(repartidorId),
        fecha,
        garrafonesNoVendidosDevueltos: Number(resumen.garrafonesPendientes || 0),
        efectivoEntregado: efectivo,
        observaciones: observaciones.trim(),
      });
      setResultado(res.data);
      await cargarLiquidaciones();
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.error ||
          "No se pudo registrar el cierre de turno."
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // DESCARGAR PDF
  // ============================================

  const descargarPdf = async () => {
    if (!repartidorId) return;
    try {
      const res = await api.get(
        `/liquidaciones/repartidor/${repartidorId}/pdf`,
        { params: { fecha }, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `liquidacion_${repartidorId}_${fecha}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("No se pudo generar el PDF.");
    }
  };

  const descargarPdfLiquidacion = async (liq) => {
    if (!liq) return;
    try {
      const res = await api.get(
        `/liquidaciones/repartidor/${liq.repartidorId}/pdf`,
        { params: { fecha: liq.fechaOperacion }, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `liquidacion_${liq.repartidorId}_${liq.fechaOperacion}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("No se pudo generar el PDF.");
    }
  };

  // ============================================
  // FORMATOS
  // ============================================

  const moneda = (valor) => `$${Number(valor || 0).toFixed(2)}`;
  const numero = (valor) => Number(valor || 0).toFixed(0);

  // ============================================
  // RENDER
  // ============================================

  return (
    <section className="panel">

      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ marginBottom: 6 }}>💵 Liquidación de repartidor</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>
          HU-016 · Cierre de efectivo y garrafones al finalizar el turno.
        </p>
      </div>

      {/* SELECCIONAR REPARTIDOR Y FECHA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <label>
          <strong>Repartidor</strong>
          <select
            value={repartidorId}
            onChange={(e) => {
              setRepartidorId(e.target.value);
              setResultado(null);
              setError("");
            }}
            style={{ width: "100%", marginTop: 6 }}
            disabled={cargandoRepartidores}
          >
            <option value="">Selecciona un repartidor</option>
            {repartidores.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <strong>Fecha</strong>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setResultado(null);
              setError("");
            }}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>
      </div>

      {/* MENSAJE SIN REPARTIDORES */}
      {!cargandoRepartidores && repartidores.length === 0 && (
        <div
          style={{
            border: "1px solid var(--borde)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 18,
          }}
        >
          <strong>No hay repartidores activos registrados.</strong>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          style={{
            background: "#2B0D0D",
            border: "1px solid #E0525255",
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            color: "#E05252",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* CARGANDO */}
      {cargandoRepartidores && <p>Cargando repartidores...</p>}
      {cargandoResumen && <p>Cargando resumen del turno...</p>}

      {/* RESUMEN */}
      {resumen && !cargandoResumen && (
        <>
          <div
            style={{
              marginBottom: 18,
              padding: 14,
              border: "1px solid var(--borde)",
              borderRadius: 12,
              background: "var(--fondo-card)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              👤 {resumen.repartidorNombre}
            </h2>
            <p><strong>Fecha:</strong> {resumen.fecha ?? fecha}</p>
            <p style={{ marginBottom: 0 }}>
              <strong>Entregas realizadas:</strong> {resumen.entregasRealizadas}
            </p>
          </div>

          {/* RESUMEN FINANCIERO */}
          <h2>Resumen del turno</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              ["💵 Efectivo cobrado", moneda(resumen.totalEfectivo)],
              ["🏦 Transferencias", moneda(resumen.totalTransferencias)],
              ["💰 Total cobrado", moneda(resumen.totalCobrado)],
              ["🚰 Garrafones entregados", numero(resumen.garrafonesEntregados)],
              ["📦 Carga inicial", numero(resumen.cargaInicial)],
              ["↩️ Garrafones pendientes", numero(resumen.garrafonesPendientes)],
              ["♻️ Envases vacíos recibidos", numero(resumen.envasesVaciosRecibidos)],
            ].map(([titulo, valor]) => (
              <div
                key={titulo}
                style={{
                  border: "1px solid var(--borde)",
                  borderRadius: 12,
                  padding: 14,
                  background: "var(--fondo-card)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                  {titulo}
                </div>
                <strong style={{ fontSize: 24, color: "var(--texto)" }}>
                  {valor}
                </strong>
              </div>
            ))}
          </div>

          {/* CIERRE DE TURNO */}
          <form onSubmit={registrarLiquidacion}>
            <h2>Cierre de turno</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  border: "1px solid var(--borde)",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <strong>Retorno automático a inventario</strong>
                <div style={{ marginTop: 6 }}>
                  🚰 Llenos no vendidos: {numero(resumen.garrafonesPendientes)}
                </div>
                <div style={{ marginTop: 4 }}>
                  ♻️ Vacíos recogidos: {numero(resumen.envasesVaciosRecibidos)}
                </div>
                <small style={{ opacity: 0.75 }}>
                  Se sumarán automáticamente al inventario al registrar el cierre.
                </small>
              </div>

              <label>
                <strong>Efectivo entregado</strong>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={efectivoEntregado}
                  onChange={(e) => setEfectivoEntregado(e.target.value)}
                  style={{ width: "100%", marginTop: 6 }}
                  required
                />
              </label>
            </div>

            {/* DIFERENCIAS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                margin: "16px 0",
              }}
            >
              <div>
                <strong>Diferencia de garrafones:</strong>{" "}
                {diferenciaGarrafones.toFixed(0)}
              </div>
              <div>
                <strong>Diferencia de efectivo:</strong>{" "}
                {moneda(diferenciaEfectivo)}
              </div>
            </div>

            {/* OBSERVACIONES */}
            <label>
              <strong>Observaciones</strong>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Opcional. Ejemplo: faltó un garrafón o hubo diferencia de efectivo."
                style={{ width: "100%", marginTop: 6, resize: "vertical" }}
              />
            </label>

            <button type="submit" disabled={guardando} style={{ marginTop: 14 }}>
              {guardando ? "Registrando..." : "✅ Registrar cierre de turno"}
            </button>
          </form>
        </>
      )}

      {/* RESULTADO */}
      {resultado && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #3AC87A55",
            background: "#0D2B1A",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#3AC87A" }}>✅ Turno liquidado</h2>
          <p><strong>Repartidor:</strong> {resultado.repartidorNombre}</p>
          <p><strong>Estado:</strong> {resultado.estado}</p>
          <p>
            <strong>Garrafones devueltos:</strong>{" "}
            {numero(resultado.garrafonesNoVendidosDevueltos)}
          </p>
          <p>
            <strong>Diferencia de garrafones:</strong>{" "}
            {numero(resultado.diferenciaGarrafones)}
          </p>
          <p>
            <strong>Diferencia de efectivo:</strong>{" "}
            {moneda(resultado.diferenciaEfectivo)}
          </p>
          <button onClick={descargarPdf} style={{ marginTop: 10 }}>
            📄 Descargar PDF de liquidación
          </button>
        </div>
      )}

      {/* HISTORIAL */}
      {liquidaciones.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: "#f1f5f9" }}>Historial de liquidaciones</h3>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            Liquidaciones registradas para el repartidor seleccionado.
          </p>
          {(() => {
            const porFecha = {};
            liquidaciones.forEach((liq) => {
              const f = liq.fechaOperacion;
              if (!porFecha[f]) porFecha[f] = [];
              porFecha[f].push(liq);
            });
            const fechas = Object.keys(porFecha).sort().reverse();
            const fechaActual = fechas[paginaActual] || fechas[0];
            const listaDia = porFecha[fechaActual] || [];
            return (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(p + 1, fechas.length - 1))}
                    disabled={paginaActual >= fechas.length - 1}
                  >
                    Día anterior
                  </button>
                  <strong style={{ color: "#f1f5f9" }}>{fechaActual}</strong>
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(p - 1, 0))}
                    disabled={paginaActual <= 0}
                  >
                    Día siguiente
                  </button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Repartidor</th>
                      <th>Hora cierre</th>
                      <th>Total cobrado</th>
                      <th>Estado</th>
                      <th>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaDia.map((liq) => (
                      <tr key={liq.id}>
                        <td>{liq.repartidorNombre}</td>
                        <td>
                          {liq.fechaCierre
                            ? new Date(liq.fechaCierre).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td>
                          <strong>
                            ${Number(
                              (liq.totalEfectivo || 0) + (liq.totalTransferencias || 0)
                            ).toFixed(2)}
                          </strong>
                        </td>
                        <td>{liq.estado}</td>
                        <td>
                          <button type="button" onClick={() => descargarPdfLiquidacion(liq)}>
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}

export default Liquidaciones;

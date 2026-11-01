import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Liquidaciones() {
  const hoy = new Date().toISOString().slice(0, 10);

  const [repartidores, setRepartidores] = useState([]);
  const [repartidorId, setRepartidorId] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [resumen, setResumen] = useState(null);
  const [devueltos, setDevueltos] = useState("");
  const [efectivoEntregado, setEfectivoEntregado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [paginaActual, setPaginaActual] = useState(0);

  useEffect(() => {
    cargarRepartidores();
  }, []);

  useEffect(() => {
    if (repartidorId) {
      cargarResumen();
      cargarLiquidaciones();
    } else {
      setResumen(null);
      setLiquidaciones([]);
    }
  }, [repartidorId, fecha]);

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

  const cargarRepartidores = async () => {
    try {
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
    }
  };

  const cargarResumen = async () => {
    try {
      setCargando(true);
      setError("");
      setResultado(null);

      const res = await api.get(
        `/liquidaciones/repartidor/${repartidorId}/resumen`,
        { params: { fecha } }
      );

      setResumen(res.data);
      setDevueltos(String(res.data?.garrafonesPendientes ?? 0));
      setEfectivoEntregado(String(res.data?.totalEfectivo ?? 0));
    } catch (e) {
      console.error(e);
      setResumen(null);
      setError(
        e.response?.data?.error ||
          "No se pudo obtener el resumen de liquidación."
      );
    } finally {
      setCargando(false);
    }
  };

  const diferenciaGarrafones = useMemo(() => {
    if (!resumen) return 0;
    return (
      Number(resumen.cargaInicial || 0) -
      Number(resumen.garrafonesEntregados || 0) -
      Number(devueltos || 0)
    );
  }, [resumen, devueltos]);

  const diferenciaEfectivo = useMemo(() => {
    if (!resumen) return 0;
    return Number(resumen.totalEfectivo || 0) - Number(efectivoEntregado || 0);
  }, [resumen, efectivoEntregado]);

  const registrarLiquidacion = async (e) => {
    e.preventDefault();

    if (!repartidorId || !resumen) {
      setError("Selecciona un repartidor y carga su resumen.");
      return;
    }

    if (Number(devueltos) < 0 || Number(efectivoEntregado) < 0) {
      setError("Los valores no pueden ser negativos.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const res = await api.post("/liquidaciones", {
        repartidorId: Number(repartidorId),
        fecha,
        garrafonesNoVendidosDevueltos: Number(devueltos || 0),
        efectivoEntregado: Number(efectivoEntregado || 0),
        observaciones: observaciones.trim(),
      });

      setResultado(res.data);
      await cargarLiquidaciones();
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.error ||
          "No se pudo registrar la liquidación."
      );
    } finally {
      setGuardando(false);
    }
  };

  const moneda = (valor) => `$${Number(valor || 0).toFixed(2)}`;
  const numero = (valor) => Number(valor || 0).toFixed(0);

  const descargarPdfLiquidacion = async (liq) => {
    if (!liq) return;
    try {
      const fechaStr = liq.fechaOperacion;
      const res = await api.get(
        `/liquidaciones/repartidor/${liq.repartidorId}/pdf`,
        { params: { fecha: fechaStr }, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `liquidacion_${liq.repartidorId}_${fechaStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("No se pudo generar el PDF.");
    }
  };

  return (
    <section className="panel">
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ marginBottom: 6 }}>💵 Liquidación de repartidor</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>
          HU-016 · Cierre de efectivo y garrafones al finalizar el turno.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <label>
          <strong>Repartidor</strong>
          <select
            value={repartidorId}
            onChange={(e) => setRepartidorId(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
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
          <strong>Fecha del turno</strong>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>
      </div>

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

      {cargando && <p>Cargando resumen...</p>}

      {resumen && !cargando && (
        <>
          <h2>Resumen financiero</h2>

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
              ["🚰 Garrafones entregados", numero(resumen.garrafonesEntregados)],
              ["📦 Carga inicial", numero(resumen.cargaInicial)],
              ["↩️ Pendientes por devolver", numero(resumen.garrafonesPendientes)],
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
                <div style={{ fontSize: 13, color: "var(--texto-suave)" }}>{titulo}</div>
                <strong style={{ fontSize: 24, color: "var(--texto)" }}>{valor}</strong>
              </div>
            ))}
          </div>

          <form onSubmit={registrarLiquidacion}>
            <h2>Cierre de turno</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <label>
                <strong>Garrafones no vendidos devueltos</strong>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={devueltos}
                  onChange={(e) => setDevueltos(e.target.value)}
                  style={{ width: "100%", marginTop: 6 }}
                  required
                />
              </label>

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
          <h2 style={{ marginTop: 0, color: "#3AC87A" }}>Cierre registrado</h2>
          <p>
            <strong>Estado:</strong> {resultado.estado}
          </p>
          <p>
            Diferencia de garrafones: {numero(resultado.diferenciaGarrafones)}
          </p>
          <p>
            Diferencia de efectivo: {moneda(resultado.diferenciaEfectivo)}
          </p>
        </div>
      )}

      {/* ========================================
          LISTA DE LIQUIDACIONES (paginación por día)
      ======================================== */}
      {liquidaciones.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: "#f1f5f9" }}>Historial de liquidaciones</h3>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            Liquidaciones registradas para el repartidor seleccionado.
          </p>

          {(() => {
            const porFecha = {};
            liquidaciones.forEach((liq) => {
              const fecha = liq.fechaOperacion;
              if (!porFecha[fecha]) porFecha[fecha] = [];
              porFecha[fecha].push(liq);
            });
            const fechas = Object.keys(porFecha).sort().reverse();
            const fechaActual = fechas[paginaActual] || fechas[0];
            const listaDia = porFecha[fechaActual] || [];

            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(p + 1, fechas.length - 1))}
                    disabled={paginaActual >= fechas.length - 1}
                  >
                    Dia anterior
                  </button>
                  <strong style={{ color: "#f1f5f9" }}>{fechaActual}</strong>
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(p - 1, 0))}
                    disabled={paginaActual <= 0}
                  >
                    Dia siguiente
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Repartidor</th>
                      <th>Hora</th>
                      <th>Total ganancias</th>
                      <th>Estado</th>
                      <th>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaDia.map((liq) => (
                      <tr key={liq.id}>
                        <td>{liq.repartidorNombre}</td>
                        <td>{liq.fechaCierre ? new Date(liq.fechaCierre).toLocaleTimeString() : "-"}</td>
                        <td><strong>${Number(liq.totalEfectivo + liq.totalTransferencias).toFixed(2)}</strong></td>
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

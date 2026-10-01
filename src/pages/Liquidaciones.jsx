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

  useEffect(() => {
    cargarRepartidores();
  }, []);

  useEffect(() => {
    if (repartidorId) {
      cargarResumen();
    } else {
      setResumen(null);
    }
  }, [repartidorId, fecha]);

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
            background: "#fff1f1",
            border: "1px solid #e59b9b",
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
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
                  border: "1px solid #e4ddd8",
                  borderRadius: 12,
                  padding: 14,
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.72 }}>{titulo}</div>
                <strong style={{ fontSize: 24 }}>{valor}</strong>
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
            border: "1px solid #b8d7ba",
            background: "#f2fff3",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Cierre registrado</h2>
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
    </section>
  );
}

export default Liquidaciones;

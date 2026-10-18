import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Liquidaciones() {
  const [rutas, setRutas] = useState([]);
  const [rutaId, setRutaId] = useState("");

  const [resumen, setResumen] = useState(null);

  const [efectivoEntregado, setEfectivoEntregado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [cargandoRutas, setCargandoRutas] = useState(false);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  // ============================================
  // CARGAR RUTAS TERMINADAS
  // ============================================

  const cargarRutas = async () => {
    try {
      setCargandoRutas(true);
      setError("");

      const res = await api.get("/rutas");

      const lista = Array.isArray(res.data)
        ? res.data
        : [];

      /*
       * Solo mostramos rutas que ya fueron
       * terminadas desde la aplicación móvil.
       *
       * Las rutas LIQUIDADAS ya no deben
       * aparecer disponibles.
       */
      const terminadas = lista.filter(
        (ruta) =>
          String(ruta.estado || "").toUpperCase() ===
          "TERMINADA"
      );

      setRutas(terminadas);

    } catch (e) {
      console.error(e);

      setError(
        e.response?.data?.error ||
          "No se pudieron cargar las rutas terminadas."
      );
    } finally {
      setCargandoRutas(false);
    }
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  // ============================================
  // CARGAR RESUMEN AL SELECCIONAR RUTA
  // ============================================

  useEffect(() => {
    if (rutaId) {
      cargarResumen(rutaId);
    } else {
      setResumen(null);
      setEfectivoEntregado("");
      setObservaciones("");
      setResultado(null);
    }
  }, [rutaId]);

  const cargarResumen = async (id) => {
    try {
      setCargandoResumen(true);
      setError("");
      setResultado(null);

      const res = await api.get(
        `/liquidaciones/ruta/${id}/resumen`
      );

      setResumen(res.data);

      /*
       * Por defecto proponemos entregar
       * todo el efectivo cobrado.
       */
      setEfectivoEntregado(
        String(
          res.data?.totalEfectivo ?? 0
        )
      );

    } catch (e) {
      console.error(e);

      setResumen(null);

      setError(
        e.response?.data?.error ||
          "No se pudo obtener el resumen de la ruta."
      );
    } finally {
      setCargandoResumen(false);
    }
  };

  // ============================================
  // DIFERENCIA DE GARRAFONES
  // ============================================

  const diferenciaGarrafones =
    useMemo(() => {
      if (!resumen) {
        return 0;
      }

      return (
        Number(resumen.cargaInicial || 0) -
        Number(resumen.garrafonesEntregados || 0) -
        Number(resumen.garrafonesPendientes || 0)
      );
    }, [resumen]);

  // ============================================
  // DIFERENCIA DE EFECTIVO
  // ============================================

  const diferenciaEfectivo =
    useMemo(() => {
      if (!resumen) {
        return 0;
      }

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

    if (!rutaId || !resumen) {
      setError(
        "Selecciona una ruta terminada."
      );
      return;
    }

    const efectivo =
      Number(efectivoEntregado || 0);

    if (efectivo < 0) {
      setError(
        "Los valores no pueden ser negativos."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const res = await api.post(
        "/liquidaciones",
        {
          rutaId: Number(rutaId),

          repartidorId: Number(
            resumen.repartidorId
          ),

          fecha: resumen.fecha,

          // Compatibilidad con el DTO del backend.
          // El backend usa la cantidadDisponible real de las cargas.
          garrafonesNoVendidosDevueltos:
            Number(resumen.garrafonesPendientes || 0),

          efectivoEntregado:
            efectivo,

          observaciones:
            observaciones.trim(),
        }
      );

      setResultado(res.data);

      /*
       * La ruta ahora queda LIQUIDADA,
       * así que actualizamos la lista.
       */
      await cargarRutas();

    } catch (e) {
      console.error(e);

      setError(
        e.response?.data?.error ||
          "No se pudo registrar el cierre de ruta."
      );

    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // FORMATOS
  // ============================================

  const moneda = (valor) =>
    `$${Number(valor || 0).toFixed(2)}`;

  const numero = (valor) =>
    Number(valor || 0).toFixed(0);

  // ============================================
  // RENDER
  // ============================================

  return (
    <section className="panel">

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ marginBottom: 6 }}>
          💵 Liquidación de ruta
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.75,
          }}
        >
          HU-016 · Cierre de efectivo y
          garrafones al finalizar una ruta.
        </p>
      </div>

      {/* ========================================
          SELECCIONAR RUTA
      ======================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <label>
          <strong>
            Ruta terminada
          </strong>

          <select
            value={rutaId}
            onChange={(e) => {
              setRutaId(e.target.value);
              setResultado(null);
              setError("");
            }}
            style={{
              width: "100%",
              marginTop: 6,
            }}
            disabled={cargandoRutas}
          >
            <option value="">
              Selecciona una ruta
            </option>

            {rutas.map((ruta) => (
              <option
                key={ruta.id}
                value={ruta.id}
              >
                {ruta.nombre}
                {" — "}
                {ruta.repartidor?.nombre ||
                  "Sin repartidor"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ========================================
          MENSAJE SIN RUTAS
      ======================================== */}

      {!cargandoRutas &&
        rutas.length === 0 &&
        !resultado && (
          <div
            style={{
              border:
                "1px solid var(--borde)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
            }}
          >
            <strong>
              No hay rutas pendientes de
              liquidar.
            </strong>

            <p
              style={{
                marginBottom: 0,
                opacity: 0.75,
              }}
            >
              El repartidor debe terminar la
              ruta desde la aplicación móvil
              antes de realizar el cierre.
            </p>
          </div>
        )}

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div
          style={{
            background: "#2B0D0D",
            border:
              "1px solid #E0525255",
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            color: "#E05252",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ========================================
          CARGANDO
      ======================================== */}

      {cargandoRutas && (
        <p>
          Cargando rutas terminadas...
        </p>
      )}

      {cargandoResumen && (
        <p>
          Cargando resumen de ruta...
        </p>
      )}

      {/* ========================================
          RESUMEN
      ======================================== */}

      {resumen &&
        !cargandoResumen && (
          <>
            <div
              style={{
                marginBottom: 18,
                padding: 14,
                border:
                  "1px solid var(--borde)",
                borderRadius: 12,
                background:
                  "var(--fondo-card)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                🗺️ {resumen.rutaNombre}
              </h2>

              <p>
                <strong>
                  Repartidor:
                </strong>{" "}
                {resumen.repartidorNombre}
              </p>

              <p>
                <strong>
                  Fecha:
                </strong>{" "}
                {resumen.fecha}
              </p>

              <p
                style={{
                  marginBottom: 0,
                }}
              >
                <strong>
                  Entregas realizadas:
                </strong>{" "}
                {resumen.entregasRealizadas}
              </p>
            </div>

            {/* ==================================
                RESUMEN FINANCIERO
            ================================== */}

            <h2>
              Resumen de la ruta
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                [
                  "💵 Efectivo cobrado",
                  moneda(
                    resumen.totalEfectivo
                  ),
                ],
                [
                  "🏦 Transferencias",
                  moneda(
                    resumen.totalTransferencias
                  ),
                ],
                [
                  "💰 Total cobrado",
                  moneda(
                    resumen.totalCobrado
                  ),
                ],
                [
                  "🚰 Garrafones entregados",
                  numero(
                    resumen.garrafonesEntregados
                  ),
                ],
                [
                  "📦 Carga inicial",
                  numero(
                    resumen.cargaInicial
                  ),
                ],
                [
                  "↩️ Garrafones pendientes",
                  numero(
                    resumen.garrafonesPendientes
                  ),
                ],
                [
                  "♻️ Envases vacíos recibidos",
                  numero(
                    resumen.envasesVaciosRecibidos
                  ),
                ],
              ].map(
                ([titulo, valor]) => (
                  <div
                    key={titulo}
                    style={{
                      border:
                        "1px solid var(--borde)",
                      borderRadius: 12,
                      padding: 14,
                      background:
                        "var(--fondo-card)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color:
                          "var(--texto-suave)",
                      }}
                    >
                      {titulo}
                    </div>

                    <strong
                      style={{
                        fontSize: 24,
                        color:
                          "var(--texto)",
                      }}
                    >
                      {valor}
                    </strong>
                  </div>
                )
              )}
            </div>

            {/* ==================================
                CIERRE DE RUTA
            ================================== */}

            <form
              onSubmit={
                registrarLiquidacion
              }
            >
              <h2>
                Cierre de ruta
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
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
                  <strong>
                    Retorno automático a inventario
                  </strong>
                  <div style={{ marginTop: 6 }}>
                    🚰 Llenos no vendidos: {numero(
                      resumen.garrafonesPendientes
                    )}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    ♻️ Vacíos recogidos: {numero(
                      resumen.envasesVaciosRecibidos
                    )}
                  </div>
                  <small style={{ opacity: 0.75 }}>
                    Se sumarán automáticamente al inventario al registrar el cierre.
                  </small>
                </div>

                <label>
                  <strong>
                    Efectivo entregado
                  </strong>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      efectivoEntregado
                    }
                    onChange={(e) =>
                      setEfectivoEntregado(
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      marginTop: 6,
                    }}
                    required
                  />
                </label>
              </div>

              {/* ==================================
                  DIFERENCIAS
              ================================== */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  margin: "16px 0",
                }}
              >
                <div>
                  <strong>
                    Diferencia de garrafones:
                  </strong>{" "}
                  {diferenciaGarrafones.toFixed(
                    0
                  )}
                </div>

                <div>
                  <strong>
                    Diferencia de efectivo:
                  </strong>{" "}
                  {moneda(
                    diferenciaEfectivo
                  )}
                </div>
              </div>

              {/* ==================================
                  OBSERVACIONES
              ================================== */}

              <label>
                <strong>
                  Observaciones
                </strong>

                <textarea
                  value={
                    observaciones
                  }
                  onChange={(e) =>
                    setObservaciones(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Opcional. Ejemplo: faltó un garrafón o hubo diferencia de efectivo."
                  style={{
                    width: "100%",
                    marginTop: 6,
                    resize: "vertical",
                  }}
                />
              </label>

              {/* ==================================
                  BOTÓN
              ================================== */}

              <button
                type="submit"
                disabled={guardando}
                style={{
                  marginTop: 14,
                }}
              >
                {guardando
                  ? "Registrando..."
                  : "✅ Registrar cierre de ruta"}
              </button>
            </form>
          </>
        )}

      {/* ========================================
          RESULTADO
      ======================================== */}

      {resultado && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            border:
              "1px solid #3AC87A55",
            background: "#0D2B1A",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#3AC87A",
            }}
          >
            ✅ Ruta liquidada
          </h2>

          <p>
            <strong>
              Ruta:
            </strong>{" "}
            {resultado.rutaNombre}
          </p>

          <p>
            <strong>
              Repartidor:
            </strong>{" "}
            {resultado.repartidorNombre}
          </p>

          <p>
            <strong>
              Estado:
            </strong>{" "}
            {resultado.estado}
          </p>

          <p>
            <strong>
              Garrafones devueltos:
            </strong>{" "}
            {numero(
              resultado.garrafonesNoVendidosDevueltos
            )}
          </p>

          <p>
            <strong>
              Envases vacíos regresados:
            </strong>{" "}
            {numero(
              resumen?.envasesVaciosRecibidos
            )}
          </p>

          <p>
            <strong>
              Diferencia de garrafones:
            </strong>{" "}
            {numero(
              resultado.diferenciaGarrafones
            )}
          </p>

          <p>
            <strong>
              Diferencia de efectivo:
            </strong>{" "}
            {moneda(
              resultado.diferenciaEfectivo
            )}
          </p>
        </div>
      )}
    </section>
  );
}

export default Liquidaciones;
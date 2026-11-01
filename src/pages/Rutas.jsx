import { useEffect, useState } from "react";
import api from "../services/api";

// ============================================
// HELPERS DE FECHAS (HU-013)
// ============================================

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
const fechaDeHoy = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Suma o resta días a una fecha YYYY-MM-DD. */
const sumarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T12:00:00`);

  d.setDate(d.getDate() + dias);

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Fecha larga en español, ej. "miércoles, 7 de octubre de 2026". */
const fechaFormateadaLarga = (fecha) => {
  const d = new Date(`${fecha}T12:00:00`);

  if (isNaN(d.getTime())) {
    return fecha;
  }

  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/** Normaliza un texto (minúsculas, sin acentos). */
const normalizarTexto = (texto) =>
  String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Nombre del día de la semana, ej. "Miércoles". */
const nombreDiaSemana = (fecha) => {
  const d = new Date(`${fecha}T12:00:00`);

  if (isNaN(d.getTime())) {
    return "";
  }

  const nombre = d.toLocaleDateString("es-MX", {
    weekday: "long",
  });

  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

/**
 * Indica si la ruta reparte el día de
 * la semana indicado (según diasReparto,
 * ej. "Lunes,Jueves").
 */
const rutaEsDelDia = (ruta, diaSemana) => {
  if (!ruta.diasReparto || !String(ruta.diasReparto).trim()) {
    return false;
  }

  const dias = String(ruta.diasReparto)
    .split(",")
    .map((dia) => normalizarTexto(dia.trim()))
    .filter(Boolean);

  return dias.includes(normalizarTexto(diaSemana));
};

function Rutas({ onCrear, onEditar }) {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoRuta, setCargandoRuta] = useState(null);

  // ============================================
  // HU-013
  // Día seleccionado para paginar las
  // rutas (YYYY-MM-DD).
  // ============================================

  const [fechaFiltro, setFechaFiltro] = useState(fechaDeHoy());

  // ============================================
  // HU-015
  // Clientes de cada ruta y rutas con
  // el detalle de clientes desplegado.
  // ============================================

  const [clientesPorRuta, setClientesPorRuta] = useState({});
  const [rutasExpandidas, setRutasExpandidas] = useState({});
  const [repartidores, setRepartidores] = useState([]);
  const [progresoPorRuta, setProgresoPorRuta] = useState({});

  // ============================================
  // PAGINADO POR DÍA (HU-013)
  // ============================================

  /** Día de la semana de la fecha seleccionada, ej. "Miércoles". */
  const diaSemana = nombreDiaSemana(fechaFiltro);

  /** Rutas que reparten el día seleccionado. */
  const rutasDelDia = rutas.filter((ruta) =>
    rutaEsDelDia(ruta, diaSemana)
  );

  /** Rutas sin días de reparto asignados. */
  const rutasSinDia = rutas.filter(
    (ruta) =>
      !ruta.diasReparto || !String(ruta.diasReparto).trim()
  );

  /** Rutas del día que aún no han sido activadas. */
  const pendientesDelDia = rutasDelDia.filter(
    (ruta) => !ruta.activa
  );

  const irDiaAnterior = () =>
    setFechaFiltro((fecha) => sumarDias(fecha, -1));

  const irDiaSiguiente = () =>
    setFechaFiltro((fecha) => sumarDias(fecha, 1));

  const irAHoy = () => setFechaFiltro(fechaDeHoy());

  // ============================================
  // CARGAR CLIENTES DE LAS RUTAS
  // ============================================

  const cargarClientesDeRutas = async (listaRutas) => {
    const resultados = await Promise.all(
      listaRutas.map((ruta) =>
        api
          .get(`/rutas/${ruta.id}/clientes`)
          .then((res) => ({
            rutaId: ruta.id,
            clientes: Array.isArray(res.data) ? res.data : [],
          }))
          .catch(() => ({ rutaId: ruta.id, clientes: [] }))
      )
    );

    const mapa = {};

    resultados.forEach(({ rutaId, clientes }) => {
      mapa[rutaId] = clientes;
    });

    setClientesPorRuta(mapa);
  };

  // ============================================
  // OBTENER RUTAS
  // ============================================

  const obtenerDatos = async () => {
    try {
      setCargando(true);

      const rRes = await api.get("/rutas");
      const listaRutas = Array.isArray(rRes.data) ? rRes.data : [];
      setRutas(listaRutas);
      await cargarClientesDeRutas(listaRutas);

      // Repartidores
      let reps = [];
      try {
        const uRes = await api.get("/usuarios/tipo/4");
        reps = Array.isArray(uRes.data) ? uRes.data : uRes.data?.usuarios || [];
        reps = reps.filter((r) => r.userTipo === 4 && r.activo !== false);
      } catch (e) {
        console.error("Error cargando repartidores:", e);
      }
      setRepartidores(reps);

      // Progreso por ruta: clientes atendidos hoy / total
      const progreso = {};
      const entregasPorRep = {};
      await Promise.all(
        reps.map(async (rep) => {
          try {
            const eRes = await api.get(`/ventas/repartidor/${rep.id}/entregas-hoy`);
            const entregas = Array.isArray(eRes.data) ? eRes.data : [];
            const ids = new Set();
            entregas.forEach((ent) => {
              const cid = ent?.venta?.cliente?.id ?? ent?.clienteId;
              if (cid != null) ids.add(cid);
            });
            entregasPorRep[rep.id] = ids;
          } catch (e) {
            entregasPorRep[rep.id] = new Set();
          }
        })
      );

      listaRutas.forEach((ruta) => {
        const clientes = clientesPorRuta[ruta.id] || [];
        const total = clientes.length;
        const repId = ruta.repartidor?.id;
        const setIds = entregasPorRep[repId] || new Set();
        const atendidos = clientes.filter((c) => setIds.has(c.id)).length;
        progreso[ruta.id] = { atendidos, total };
      });
      setProgresoPorRuta(progreso);
    } catch (error) {
      console.error("Error al cargar rutas:", error);
      alert("No se pudieron cargar las rutas");
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // ACTIVAR RUTA
  // Ya no se vincula una carga: el
  // repartidor lleva varias cargas
  // (una por tipo de garrafón) y las
  // acepta en "Mis cargas".
  // ============================================

  const activarRuta = async (rutaId) => {
    try {
      setCargandoRuta(rutaId);

      await api.put(`/rutas/${rutaId}/activar`);

      alert("Ruta activada correctamente");

      await obtenerDatos();

      // Mostrar los clientes de la ruta recién asignada
      setRutasExpandidas((prev) => ({ ...prev, [rutaId]: true }));
    } catch (error) {
      console.error("Error al activar la ruta:", error);
      alert(error.response?.data?.error || "No se pudo activar la ruta");
    } finally {
      setCargandoRuta(null);
    }
  };

  const asignarRutaARepartidor = async (rutaId, repartidorId) => {
    try {
      setCargandoRuta(rutaId);
      await api.put(`/rutas/${rutaId}`, { repartidorId });
      await api.put(`/rutas/${rutaId}/activar`);
      alert("Ruta asignada y activada correctamente");
      await obtenerDatos();
    } catch (error) {
      console.error("Error al asignar ruta:", error);
      alert(error.response?.data?.error || "No se pudo asignar la ruta");
    } finally {
      setCargandoRuta(null);
    }
  };

  const toggleClientes = (rutaId) => {
    setRutasExpandidas((prev) => ({
      ...prev,
      [rutaId]: !prev[rutaId],
    }));
  };

  const eliminarRuta = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta ruta?")) return;
    try {
      await api.delete(`/rutas/${id}`);
      alert("Ruta eliminada correctamente");
      obtenerDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar la ruta");
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  if (cargando) {
    return (
      <section className="panel">
        <p>Cargando rutas...</p>
      </section>
    );
  }

  // ============================================
  // TARJETA DE RUTA
  // ============================================

  const renderCardRuta = (ruta) => {
    const clientes = clientesPorRuta[ruta.id] || [];
    const expandida = Boolean(rutasExpandidas[ruta.id]);

    return (
      <div
        key={ruta.id}
        style={{
          border: ruta.activa ? "2px solid #22c55e" : "1px solid #1e293b",
          borderRadius: "14px",
          padding: "18px",
          background: "#0f172a",
          marginBottom: "14px",
        }}
      >
        <h3 style={{ color: "#f1f5f9" }}>{ruta.nombre}</h3>

        <p style={{ color: "#94a3b8" }}>
          <strong>Repartidor:</strong>{" "}
          {ruta.repartidor?.nombre || "Sin asignar"} —{" "}
          <strong>Días:</strong> {ruta.diasReparto || "Sin especificar"}
        </p>

        <p style={{ color: "#94a3b8" }}>
          <strong>Estado:</strong> {ruta.estado}{" "}
          {ruta.activa ? "✅" : "⏳"}{" "}
          {ruta.estado === "EN_TRANSITO" && (
            <span style={{ color: "#22c55e", fontWeight: "bold" }}>
              (Aceptada por el repartidor)
            </span>
          )}
        </p>

        <p style={{ color: "#94a3b8" }}>
          <strong>Clientes:</strong> {clientes.length}{" "}
          {progresoPorRuta[ruta.id] && clientes.length > 0 && (
            <span>
              · Atendidos: {progresoPorRuta[ruta.id].atendidos}/
              {progresoPorRuta[ruta.id].total} (
              {Math.round(
                (progresoPorRuta[ruta.id].atendidos /
                  progresoPorRuta[ruta.id].total) *
                  100
              )}
              %)
            </span>
          )}
        </p>

        {!ruta.activa && (
          <button
            onClick={() => activarRuta(ruta.id)}
            disabled={cargandoRuta === ruta.id}
            style={{ marginTop: "6px" }}
          >
            {cargandoRuta === ruta.id
              ? "Activando..."
              : "Activar ruta"}
          </button>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "10px",
          }}
        >
          <button onClick={() => toggleClientes(ruta.id)}>
            {expandida
              ? "👥 Ocultar clientes"
              : `👥 Ver clientes (${clientes.length})`}
          </button>
          <button onClick={() => onEditar(ruta)}>Editar</button>
          <button onClick={() => eliminarRuta(ruta.id)}>Eliminar</button>
        </div>

        {/* ==================================
            CLIENTES DE LA RUTA (DESPLEGABLE)
        ================================== */}

        {expandida && (
          <div
            style={{
              marginTop: "12px",
              borderTop: "1px solid #1e293b",
              paddingTop: "12px",
            }}
          >
            <p style={{ color: "#94a3b8", marginBottom: "8px" }}>
              <strong>👥 Clientes de la ruta</strong>
            </p>

            {clientes.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>
                No hay clientes asignados a esta ruta.
              </p>
            ) : (
              clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  style={{
                    background: "#1e293b",
                    borderRadius: "8px",
                    padding: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      color: "#f1f5f9",
                      fontWeight: 600,
                    }}
                  >
                    {cliente.ordenEnRuta
                      ? `${cliente.ordenEnRuta}. `
                      : ""}
                    {cliente.nombre}
                  </div>

                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    📍 {cliente.domicilio || "Sin domicilio"}
                    {" · "}💰 $
                    {Number(cliente.precioPorGarrafon || 0).toFixed(2)}
                    {" / garrafón"}
                    {cliente.garrafonPreferencia?.nombre
                      ? ` · 🚰 ${cliente.garrafonPreferencia.nombre}`
                      : ""}
                    {cliente.diasReparto
                      ? ` · 📅 ${cliente.diasReparto}`
                      : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1>🗺️ Rutas</h1>
          <p>Rutas de reparto por repartidor.</p>
        </div>
        <button
          onClick={onCrear}
          style={{ padding: "10px 18px", cursor: "pointer" }}
        >
          + Nueva ruta
        </button>
      </div>

      {/* ========================================
          PAGINADO POR DÍA (CALENDARIO)
      ======================================== */}

      <div
        className="panel"
        style={{
          marginBottom: "20px",
          padding: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>📅 Rutas del día</h2>

            <small style={{ color: "#94a3b8" }}>
              {diaSemana} — {fechaFormateadaLarga(fechaFiltro)}
            </small>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button onClick={irDiaAnterior} style={{ padding: "8px 12px" }}>
              ◀ Día anterior
            </button>

            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) =>
                e.target.value && setFechaFiltro(e.target.value)
              }
              style={{ padding: "8px" }}
            />

            <button onClick={irDiaSiguiente} style={{ padding: "8px 12px" }}>
              Día siguiente ▶
            </button>

            <button onClick={irAHoy} style={{ padding: "8px 12px" }}>
              Hoy
            </button>
          </div>
        </div>

        <p
          style={{
            marginTop: "12px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          {rutasDelDia.length} ruta(s) programada(s) este día
          {pendientesDelDia.length > 0
            ? ` · ${pendientesDelDia.length} pendiente(s) de activar`
            : ""}
        </p>
      </div>

      {/* ========================================
          PANEL: RUTAS PENDIENTES DEL DÍA
      ======================================== */}

      <div
        className="panel"
        style={{
          marginBottom: "20px",
          padding: "18px",
          borderLeft: "4px solid #f59e0b",
        }}
      >
        <h2 style={{ margin: 0 }}>
          ⏳ Rutas pendientes del {diaSemana}
        </h2>

        <p style={{ color: "#94a3b8", margin: "6px 0 12px" }}>
          {fechaFormateadaLarga(fechaFiltro)} — rutas programadas
          este día que aún no se han activado.
        </p>

        {pendientesDelDia.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            No hay rutas pendientes este día. 🎉
          </p>
        ) : (
          pendientesDelDia.map((ruta) => {
            const clientes = clientesPorRuta[ruta.id] || [];

            return (
              <div
                key={`pendiente-${ruta.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  background: "#1e293b",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div style={{ color: "#f1f5f9", fontWeight: 600 }}>
                    {ruta.nombre}
                  </div>

                  <div
                    style={{ color: "#94a3b8", fontSize: "12px" }}
                  >
                    🚚 {ruta.repartidor?.nombre || "Sin asignar"}
                    {" · "}👥 {clientes.length} clientes
                    {" · "}📅 {ruta.diasReparto || "Sin días"}
                  </div>
                </div>

                <button
                  onClick={() => activarRuta(ruta.id)}
                  disabled={cargandoRuta === ruta.id}
                >
                  {cargandoRuta === ruta.id
                    ? "Activando..."
                    : "Activar"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================
          RUTAS DEL DÍA
      ======================================== */}

      {rutas.length === 0 ? (
        <p>No hay rutas registradas.</p>
      ) : rutasDelDia.length === 0 ? (
        <p>
          No hay rutas programadas para el {diaSemana}.
        </p>
      ) : (
        rutasDelDia.map(renderCardRuta)
      )}

      {/* ========================================
          RUTAS SIN DÍA ASIGNADO
      ======================================== */}

      {rutasSinDia.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ color: "#f1f5f9" }}>📌 Sin día asignado</h3>

          <p style={{ color: "#94a3b8" }}>
            Rutas sin días de reparto definidos.
          </p>

          {rutasSinDia.map(renderCardRuta)}
        </div>
      )}

      {/* ========================================
          REPARTIDORES Y SUS RUTAS
      ======================================== */}
      <div style={{ marginTop: "24px" }}>
        <h3 style={{ color: "#f1f5f9" }}>
          🚚 Repartidores y rutas del día
        </h3>

        <p style={{ color: "#94a3b8" }}>
          Ruta activa de cada repartidor, avance y
          rutas sin asignar para {diaSemana}.
        </p>

        {repartidores.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            No hay repartidores registrados.
          </p>
        ) : (
          repartidores.map((rep) => {
            const rutaActiva = rutasDelDia.find(
              (r) => r.repartidor?.id === rep.id && r.activa
            );
            const clientes = rutaActiva
              ? clientesPorRuta[rutaActiva.id] || []
              : [];
            const prog = rutaActiva
              ? progresoPorRuta[rutaActiva.id] || { atendidos: 0, total: clientes.length }
              : { atendidos: 0, total: 0 };
            const porcentaje =
              prog.total > 0
                ? Math.round((prog.atendidos / prog.total) * 100)
                : 0;

            return (
              <div
                key={rep.id}
                style={{
                  background: "#1e293b",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ color: "#f1f5f9", fontWeight: 600 }}>
                  {rep.nombre}{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    ({rep.email})
                  </span>
                </div>

                {rutaActiva ? (
                  <>
                    <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                      Ruta activa:{" "}
                      <strong style={{ color: "#f1f5f9" }}>
                        {rutaActiva.nombre}
                      </strong>{" "}
                      — {rutaActiva.estado}
                      {rutaActiva.estado === "EN_TRANSITO" && " (aceptada)"}
                    </div>

                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                      Progreso: {prog.atendidos}/{prog.total} clientes ({porcentaje}%)
                    </div>

                    <div
                      style={{
                        background: "#334155",
                        borderRadius: "4px",
                        height: "8px",
                        marginTop: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${porcentaje}%`,
                          background: "#22c55e",
                          height: "100%",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ color: "#f59e0b", fontSize: "13px", marginTop: "4px" }}>
                    Sin ruta asignada
                  </div>
                )}

                <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    id={`sel-${rep.id}`}
                    style={{ padding: "4px" }}
                    defaultValue=""
                  >
                    <option value="">Asignar ruta sin asignar...</option>
                    {pendientesDelDia.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} ({r.clientes?.length ?? "?"} clientes)
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const sel = document.getElementById(`sel-${rep.id}`);
                      const rutaId = sel?.value;
                      if (!rutaId) {
                        alert("Selecciona una ruta");
                        return;
                      }
                      asignarRutaARepartidor(Number(rutaId), rep.id);
                    }}
                    disabled={pendientesDelDia.length === 0}
                  >
                    Asignar y activar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default Rutas;

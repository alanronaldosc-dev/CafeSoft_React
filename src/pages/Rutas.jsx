import { useEffect, useState } from "react";
import api from "../services/api";

function Rutas({ onCrear, onEditar }) {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoRuta, setCargandoRuta] = useState(null);

  // ============================================
  // HU-015
  // Clientes de cada ruta y rutas con
  // el detalle de clientes desplegado.
  // ============================================

  const [clientesPorRuta, setClientesPorRuta] = useState({});
  const [rutasExpandidas, setRutasExpandidas] = useState({});

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

      {rutas.length === 0 ? (
        <p>No hay rutas registradas.</p>
      ) : (
        rutas.map((ruta) => {
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
                {ruta.activa ? "✅" : "⏳"}
              </p>

              <p style={{ color: "#94a3b8" }}>
                <strong>Clientes:</strong> {clientes.length}
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
                          {Number(
                            cliente.precioPorGarrafon || 0
                          ).toFixed(2)}
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
        })
      )}
    </section>
  );
}

export default Rutas;

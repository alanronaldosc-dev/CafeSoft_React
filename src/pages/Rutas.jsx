import { useEffect, useState } from "react";
import api from "../services/api";

function Rutas({ onCrear, onEditar }) {
  const [rutas, setRutas] = useState([]);
  const [cargasDisponibles, setCargasDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargaSeleccionada, setCargaSeleccionada] = useState({});
  const [cargandoRuta, setCargandoRuta] = useState(null);

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      setCargando(true);
      const [rRes, cRes] = await Promise.all([
        api.get("/rutas"),
        api.get("/rutas/cargas/disponibles"),
      ]);
      setRutas(Array.isArray(rRes.data) ? rRes.data : []);
      setCargasDisponibles(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (error) {
      console.error("Error al cargar rutas:", error);
      alert("No se pudieron cargar las rutas");
    } finally {
      setCargando(false);
    }
  };

  const activarRuta = async (rutaId) => {
    const cargaId = cargaSeleccionada[rutaId];
    if (!cargaId) {
      alert("Selecciona una carga para activar la ruta");
      return;
    }
    try {
      setCargandoRuta(rutaId);
      await api.put(`/rutas/${rutaId}/activar`, { cargaId: Number(cargaId) });
      alert("Ruta activada correctamente");
      obtenerDatos();
    } catch (error) {
      console.error("Error al activar la ruta:", error);
      alert(error.response?.data?.error || "No se pudo activar la ruta");
    } finally {
      setCargandoRuta(null);
    }
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

  if (cargando) {
    return (
      <section className="panel">
        <p>Cargando rutas...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>🗺️ Rutas</h1>
          <p>Rutas de reparto por repartidor.</p>
        </div>
        <button onClick={onCrear} style={{ padding: "10px 18px", cursor: "pointer" }}>
          + Nueva ruta
        </button>
      </div>

      {rutas.length === 0 ? (
        <p>No hay rutas registradas.</p>
      ) : (
        rutas.map((ruta) => (
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
              <strong>Repartidor:</strong> {ruta.repartidor?.nombre || "Sin asignar"} —{" "}
              <strong>Días:</strong> {ruta.diasReparto || "Sin especificar"}
            </p>
            <p style={{ color: "#94a3b8" }}>
              <strong>Estado:</strong> {ruta.estado} {ruta.activa ? "✅" : "⏳"}
            </p>
            <p style={{ color: "#94a3b8" }}>
              <strong>Carga:</strong>{" "}
              {ruta.carga
                ? `#${ruta.carga.id} — ${ruta.carga.cantidad} garrafones`
                : "Sin carga"}
            </p>

            {!ruta.activa && (
              <div style={{ marginBottom: "10px" }}>
                <select
                  value={cargaSeleccionada[ruta.id] || ""}
                  onChange={(e) =>
                    setCargaSeleccionada((prev) => ({ ...prev, [ruta.id]: e.target.value }))
                  }
                >
                  <option value="">Selecciona una carga...</option>
                  {cargasDisponibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} — {c.cantidad} garrafones ({c.estado})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => activarRuta(ruta.id)}
                  disabled={cargandoRuta === ruta.id}
                  style={{ marginLeft: "8px" }}
                >
                  {cargandoRuta === ruta.id ? "Activando..." : "Activar ruta"}
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button onClick={() => onEditar(ruta)}>Editar</button>
              <button onClick={() => eliminarRuta(ruta.id)}>Eliminar</button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export default Rutas;

import { useEffect, useState } from "react";
import api from "../services/api";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function EditarRuta({ ruta, onVolver }) {
  const [nombre, setNombre] = useState(ruta?.nombre || "");
  const [repartidorId, setRepartidorId] = useState(String(ruta?.repartidor?.id || ""));
  const [diasSeleccionados, setDiasSeleccionados] = useState(
    ruta?.diasReparto ? ruta.diasReparto.split(",") : []
  );
  const [repartidores, setRepartidores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
  const [filtroDia, setFiltroDia] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      const [rRes, cRes] = await Promise.all([
        api.get("/usuarios/tipo/4"),
        api.get("/clientes"),
      ]);
      const reps = Array.isArray(rRes.data) ? rRes.data : rRes.data?.usuarios || [];
      setRepartidores(reps.filter((r) => r.userTipo === 4 && r.activo !== false));
      setClientes(Array.isArray(cRes.data) ? cRes.data : []);

      // Preseleccionar los clientes que ya pertenecen a la ruta
      if (ruta?.id) {
        const rtaRes = await api.get(`/rutas/${ruta.id}`);
        // El backend no devuelve la lista de clientes embebidos si vienen por FK;
        // usamos el clienteRepository a través de los clientes que tienen rutaId = ruta.id
        const todos = Array.isArray(cRes.data) ? cRes.data : [];
        const propiosIds = todos
          .filter((c) => c.ruta?.id === ruta.id)
          .sort((a, b) => (a.ordenEnRuta ?? 0) - (b.ordenEnRuta ?? 0))
          .map((c) => c.id);
        setClientesSeleccionados(propiosIds);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("No se pudieron cargar los datos");
    }
  };

  const toggleDia = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const toggleCliente = (id) => {
    setClientesSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const moverCliente = (id, direccion) => {
    setClientesSeleccionados((prev) => {
      const idx = prev.indexOf(id);
      const nuevoIdx = idx + direccion;
      if (idx < 0 || nuevoIdx < 0 || nuevoIdx >= prev.length) return prev;
      const copia = [...prev];
      [copia[idx], copia[nuevoIdx]] = [copia[nuevoIdx], copia[idx]];
      return copia;
    });
  };

  const clientesFiltrados = clientes.filter((c) => {
    if (!filtroDia) return true;
    return c.diasReparto?.toLowerCase().includes(filtroDia.toLowerCase());
  });

  const guardarCambios = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert("El nombre de la ruta es obligatorio");
      return;
    }

    try {
      setGuardando(true);
      await api.put(`/rutas/${ruta.id}`, {
        nombre,
        repartidorId: repartidorId ? Number(repartidorId) : null,
        diasReparto: diasSeleccionados.join(","),
        clienteIds: clientesSeleccionados,
      });
      alert("Ruta actualizada correctamente");
      if (onVolver) onVolver();
    } catch (error) {
      console.error("Error al actualizar ruta:", error);
      alert("No se pudo actualizar la ruta");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="panel">
      <h1>✏️ Editar ruta</h1>

      <form onSubmit={guardarCambios} style={{ display: "grid", gap: "15px", maxWidth: "700px", marginTop: "20px" }}>
        <div>
          <label>Nombre de ruta</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div>
          <label>Repartidor asignado</label>
          <select value={repartidorId} onChange={(e) => setRepartidorId(e.target.value)}>
            <option value="">Selecciona...</option>
            {repartidores.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Días en que se hace la ruta</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
            {DIAS.map((d) => (
              <label key={d} style={{ display: "flex", gap: "4px" }}>
                <input type="checkbox" checked={diasSeleccionados.includes(d)} onChange={() => toggleDia(d)} />
                {d}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Clientes</label>
          <div style={{ display: "flex", gap: "10px", margin: "8px 0" }}>
            <select value={filtroDia} onChange={(e) => setFiltroDia(e.target.value)}>
              <option value="">Todos los días</option>
              {DIAS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid #334155", borderRadius: "8px", padding: "8px" }}>
            {clientesFiltrados.map((c) => (
              <label key={c.id} style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                <input type="checkbox" checked={clientesSeleccionados.includes(c.id)} onChange={() => toggleCliente(c.id)} />
                {c.nombre} — {c.diasReparto}
              </label>
            ))}
          </div>

          {/* Orden de entrega */}
          {clientesSeleccionados.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <label>Orden de entrega (primero → último):</label>
              <ol style={{ margin: 0, paddingLeft: "16px" }}>
                {clientesSeleccionados.map((id, index) => {
                  const cliente = clientes.find((c) => c.id === id);
                  return (
                    <li key={id} style={{ color: "#e2e8f0", marginBottom: "4px" }}>
                      {cliente?.nombre || `Cliente #${id}`}
                      <button type="button" onClick={() => moverCliente(id, -1)} style={{ marginLeft: "10px", padding: "2px 8px" }}>↑</button>
                      <button type="button" onClick={() => moverCliente(id, 1)} style={{ marginLeft: "5px", padding: "2px 8px" }}>↓</button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          {onVolver && <button type="button" onClick={onVolver}>Volver</button>}
        </div>
      </form>
    </section>
  );
}

export default EditarRuta;

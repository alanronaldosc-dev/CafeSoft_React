import { useEffect, useState } from "react";
import api from "../services/api";

// Recibe usuario como prop igual que Cargas, Clientes, etc.
function Promociones({ usuario }) {
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState("");
  const [mensaje, setMensaje]         = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando]       = useState(null);

  const formVacio = {
    nombre: "",
    descripcion: "",
    descuentoPorcentaje: "",
    fechaInicio: "",
    fechaFin: "",
    minGarrafones: "",
    acumulaPuntos: true,
  };
  const [form, setForm] = useState(formVacio);

  // Estilos reutilizables para inputs oscuros
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    marginTop: "6px",
    boxSizing: "border-box",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: "14px",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#94a3b8",
  };

  // ── Cargar al montar ──
  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    try {
      setCargando(true);
      setError("");
      const res = await api.get("/promociones");
      setPromociones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudieron cargar las promociones."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(formVacio);
    setMostrarForm(true);
    setMensaje("");
    setError("");
  };

  const abrirEditar = (promo) => {
    setEditando(promo.id);
    setForm({
      nombre:              promo.nombre,
      descripcion:         promo.descripcion || "",
      descuentoPorcentaje: promo.descuentoPorcentaje,
      fechaInicio:         promo.fechaInicio?.slice(0, 16) || "",
      fechaFin:            promo.fechaFin?.slice(0, 16)    || "",
      minGarrafones: form.minGarrafones !== "" ? Number(form.minGarrafones) : null,
    });
    setMostrarForm(true);
    setMensaje("");
    setError("");
  };

  const cancelarForm = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm(formVacio);
  };

  // ── Crear / Actualizar ──
  // La sucursal la toma el backend del JWT, no se envía desde el frontend
  const guardar = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    const payload = {
      nombre:              form.nombre,
      descripcion:         form.descripcion,
      descuentoPorcentaje: Number(form.descuentoPorcentaje),
      fechaInicio:         form.fechaInicio + ":00",
      fechaFin:            form.fechaFin    + ":00",
      minGarrafones:       form.minGarrafones ? Number(form.minGarrafones) : 0,
      acumulaPuntos:       form.acumulaPuntos,
    };

    try {
      if (editando) {
        await api.put(`/promociones/${editando}`, payload);
        setMensaje("✅ Promoción actualizada correctamente.");
      } else {
        await api.post("/promociones", payload);
        setMensaje("✅ Promoción creada correctamente.");
      }
      cancelarForm();
      cargarPromociones();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo guardar la promoción."
      );
    }
  };

  // ── Desactivar ──
  const desactivar = async (id) => {
    if (!window.confirm("¿Deseas desactivar esta promoción?")) return;
    try {
      await api.put(`/promociones/${id}/desactivar`);
      setMensaje("✅ Promoción desactivada.");
      cargarPromociones();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo desactivar."
      );
    }
  };

  // ── Eliminar ──
  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta promoción? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/promociones/${id}`);
      setMensaje("✅ Promoción eliminada.");
      cargarPromociones();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo eliminar."
      );
    }
  };

  // ── Badge de estado ──
  const Badge = ({ vigente, activa }) => {
    if (!activa)
      return <span style={mkBadge("#E05252", "#FEF0EE")}>Desactivada</span>;
    if (vigente)
      return <span style={mkBadge("#3AC87A", "#E8FEF0")}>Vigente</span>;
    return (
      <span style={mkBadge("#C8783A", "#FEF3E8")}>
        Fuera de periodo
      </span>
    );
  };

  const mkBadge = (color, bg) => ({
    background: bg,
    color,
    border: `1px solid ${color}44`,
    borderRadius: "999px",
    padding: "3px 12px",
    fontSize: "12px",
    fontWeight: 600,
  });

  const fmtFecha = (iso) =>
    iso
      ? new Date(iso).toLocaleString("es-MX", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";

  // ── Render ──
  return (
    <section className="panel">

      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1>🏷️ Promociones</h1>
          <p style={{ color: "var(--texto-suave)", margin: "4px 0 0" }}>
            Campañas con vigencia controlada por fecha.
          </p>
        </div>
        {!mostrarForm && (
          <button
            onClick={abrirCrear}
            style={{ padding: "10px 18px", cursor: "pointer" }}
          >
            + Nueva promoción
          </button>
        )}
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "14px",
            borderRadius: "8px",
            background: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
          }}
        >
          {mensaje}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "14px",
            borderRadius: "8px",
            background: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div
          style={{
            background: "var(--fondo-card)",
            border: "1px solid var(--borde)",
            borderRadius: "var(--r-md)",
            padding: "24px",
            marginBottom: "28px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editando ? "✏️ Editar promoción" : "➕ Nueva promoción"}
          </h2>

          <form
            onSubmit={guardar}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            {/* Nombre */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Nombre <span style={{ color: "#E05252" }}>*</span>
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Ej. Descuento de temporada"
                style={inputStyle}
              />
            </div>

            {/* Descripción */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Descripción</label>
              <input
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Ej. 20% en todos los garrafones"
                style={inputStyle}
              />
            </div>

            {/* Descuento */}
            <div>
            <label style={labelStyle}>
                Descuento (%) <span style={{ color: "#E05252" }}>*</span>
            </label>
            <input
                name="descuentoPorcentaje"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={form.descuentoPorcentaje}
                onChange={handleChange}
                required
                placeholder="Ej. 20"
                style={inputStyle}
            />
            </div>

            {/* Mínimo de garrafones */}
            <div>
            <label style={labelStyle}>
                Mínimo de garrafones
                <span style={{ color: "#8D9DB6", fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                (opcional — dejar vacío para sin condición)
                </span>
            </label>
            <input
                name="minGarrafones"
                type="number"
                min="1"
                step="1"
                value={form.minGarrafones}
                onChange={handleChange}
                placeholder="Ej. 5  →  aplica al comprar 5 o más"
                style={inputStyle}
            />
            </div>
            {/* Acumular puntos */}
            <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                    type="checkbox"
                    name="acumulaPuntos"
                    checked={form.acumulaPuntos}
                    onChange={(e) =>
                        setForm((prev) => ({ ...prev, acumulaPuntos: e.target.checked }))
                    }
                />
                Acumular puntos con esta promoción
                <span style={{ color: "#8D9DB6", fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                (si se desactiva, las ventas con esta promoción no generan puntos)
                </span>
            </label>
            </div>


            {/* Sucursal — solo muestra */}
            <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Sucursal</label>
            <input
                value={usuario?.sucursalNombre || `Sucursal #${usuario?.sucursalId}` || "Tu sucursal"}
                readOnly
                style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
            />
            </div>

            {/* Fecha inicio */}
            <div>
              <label style={labelStyle}>
                Fecha de inicio <span style={{ color: "#E05252" }}>*</span>
              </label>
              <input
                name="fechaInicio"
                type="datetime-local"
                value={form.fechaInicio}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label style={labelStyle}>
                Fecha de fin <span style={{ color: "#E05252" }}>*</span>
              </label>
              <input
                name="fechaFin"
                type="datetime-local"
                value={form.fechaFin}
                onChange={handleChange}
                required
                min={form.fechaInicio || undefined}
                style={inputStyle}
              />
            </div>

            {/* Botones */}
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              <button type="submit" className="btn-glow">
                {editando ? "💾 Guardar cambios" : "🏷️ Crear promoción"}
              </button>
              <button
                type="button"
                onClick={cancelarForm}
                style={{ padding: "10px 18px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      {cargando ? (
        <p style={{ color: "var(--texto-suave)" }}>Cargando...</p>
      ) : promociones.length === 0 ? (
        <p>No hay promociones registradas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descuento</th>
                <th>Fecha inicio</th>
                <th>Fecha fin</th>
                <th>Sucursal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {promociones.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nombre}</strong>
                    {p.descripcion && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--texto-suave)",
                        }}
                      >
                        {p.descripcion}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {p.descuentoPorcentaje}%
                  </td>
                  <td style={{ fontSize: "13px" }}>
                    {fmtFecha(p.fechaInicio)}
                  </td>
                  <td style={{ fontSize: "13px" }}>
                    {fmtFecha(p.fechaFin)}
                  </td>
                  <td
                    style={{
                      fontSize: "13px",
                      color: "var(--texto-suave)",
                    }}
                  >
                    {p.sucursalNombre || "—"}
                  </td>
                  <td>
                    <Badge vigente={p.vigente} activa={p.activa} />
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => abrirEditar(p)}
                        style={{
                          padding: "5px 10px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        ✏️ Editar
                      </button>
                      {p.activa && (
                        <button
                          onClick={() => desactivar(p.id)}
                          style={{
                            padding: "5px 10px",
                            cursor: "pointer",
                            fontSize: "13px",
                            background: "#2D2A1A",
                            color: "#C8783A",
                            border: "1px solid #C8783A33",
                            borderRadius: "6px",
                          }}
                        >
                          ⏸ Desactivar
                        </button>
                      )}
                      <button
                        onClick={() => eliminar(p.id)}
                        style={{
                          padding: "5px 10px",
                          cursor: "pointer",
                          fontSize: "13px",
                          background: "#2D1A1A",
                          color: "#E05252",
                          border: "1px solid #E0525233",
                          borderRadius: "6px",
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Promociones;

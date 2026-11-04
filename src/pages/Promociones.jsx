
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  descuentoPorcentaje: "",
  fechaInicio: "",
  fechaFin: "",
  minGarrafones: "",
  acumulaPuntos: true,
};

const ESTADOS = [
  { valor: "TODAS", nombre: "Todas", color: "#64748b" },
  { valor: "VIGENTE", nombre: "Vigentes", color: "#16a34a" },
  { valor: "PROGRAMADA", nombre: "Programadas", color: "#2563eb" },
  { valor: "VENCIDA", nombre: "Vencidas", color: "#d97706" },
  { valor: "DESACTIVADA", nombre: "Desactivadas", color: "#dc2626" },
];

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  marginTop: 6,
  boxSizing: "border-box",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1e293b",
  color: "#e2e8f0",
  fontSize: 14,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
};

const mensajeStyle = (tipo) => ({
  padding: "12px 16px",
  marginBottom: 14,
  borderRadius: 8,
  background: tipo === "error" ? "#f8d7da" : "#d4edda",
  color: tipo === "error" ? "#721c24" : "#155724",
  border: `1px solid ${
    tipo === "error" ? "#f5c6cb" : "#c3e6cb"
  }`,
});

const botonStyle = {
  padding: "7px 12px",
  cursor: "pointer",
  fontSize: 13,
  borderRadius: 6,
};

function obtenerEstado(promo) {
  if (promo.activa === false) {
    return "DESACTIVADA";
  }

  // Se calcula usando las fechas actuales para evitar
  // mostrar un estado desactualizado en pantalla.
  const ahora = new Date();
  const inicio = promo.fechaInicio
    ? new Date(promo.fechaInicio)
    : null;
  const fin = promo.fechaFin
    ? new Date(promo.fechaFin)
    : null;

  if (inicio && !Number.isNaN(inicio.getTime()) && ahora < inicio) {
    return "PROGRAMADA";
  }

  if (fin && !Number.isNaN(fin.getTime()) && ahora > fin) {
    return "VENCIDA";
  }

  if (
    inicio &&
    fin &&
    !Number.isNaN(inicio.getTime()) &&
    !Number.isNaN(fin.getTime())
  ) {
    return "VIGENTE";
  }

  return promo.estado || "DESCONOCIDA";
}

function formatearFecha(fecha) {
  if (!fecha) return "—";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "—";

  return valor.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obtenerError(error, mensajePredeterminado) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return (
    data?.mensaje ||
    data?.message ||
    data?.error ||
    mensajePredeterminado
  );
}

function BadgeEstado({ estado }) {
  const configuracion = {
    VIGENTE: {
      texto: "Vigente",
      color: "#166534",
      fondo: "#dcfce7",
    },
    PROGRAMADA: {
      texto: "Programada",
      color: "#1d4ed8",
      fondo: "#dbeafe",
    },
    VENCIDA: {
      texto: "Vencida",
      color: "#92400e",
      fondo: "#fef3c7",
    },
    DESACTIVADA: {
      texto: "Desactivada",
      color: "#991b1b",
      fondo: "#fee2e2",
    },
  };

  const actual = configuracion[estado] || {
    texto: "Sin determinar",
    color: "#475569",
    fondo: "#e2e8f0",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: actual.color,
        background: actual.fondo,
        whiteSpace: "nowrap",
      }}
    >
      {actual.texto}
    </span>
  );
}

function Promociones({ usuario }) {
  const [promociones, setPromociones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("TODAS");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [ahora, setAhora] = useState(Date.now());

  const esAdmin = Number(usuario?.userTipo) === 0;

  const cargarPromociones = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      // El backend HU-039 expone este endpoint.
      const respuesta = await api.get("/promociones/estado", {
        params: { estado: "TODAS" },
      });

      setPromociones(
        Array.isArray(respuesta.data) ? respuesta.data : []
      );
    } catch (err) {
      setError(
        obtenerError(
          err,
          "No se pudieron cargar las promociones. Verifica que la API esté funcionando."
        )
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPromociones();
  }, [cargarPromociones]);

  useEffect(() => {
    // Actualiza la clasificación cuando transcurre el tiempo,
    // aunque el usuario permanezca en esta pantalla.
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  const promocionesConEstado = promociones.map((promo) => ({
    ...promo,
    estadoCalculado: obtenerEstado(promo, ahora),
  }));

  const promocionesFiltradas =
    filtroEstado === "TODAS"
      ? promocionesConEstado
      : promocionesConEstado.filter(
          (promo) => promo.estadoCalculado === filtroEstado
        );

  const contarEstado = (estado) => {
    if (estado === "TODAS") return promocionesConEstado.length;

    return promocionesConEstado.filter(
      (promo) => promo.estadoCalculado === estado
    ).length;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...FORM_VACIO });
    setMostrarForm(true);
    setMensaje("");
    setError("");
  };

  const abrirEditar = (promo) => {
    setEditando(promo.id);

    setForm({
      nombre: promo.nombre || "",
      descripcion: promo.descripcion || "",
      descuentoPorcentaje:
        promo.descuentoPorcentaje ?? "",
      fechaInicio: promo.fechaInicio?.slice(0, 16) || "",
      fechaFin: promo.fechaFin?.slice(0, 16) || "",
      minGarrafones: promo.minGarrafones ?? "",
      acumulaPuntos: promo.acumulaPuntos ?? true,
    });

    setMostrarForm(true);
    setMensaje("");
    setError("");
  };

  const cancelarForm = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm({ ...FORM_VACIO });
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!esAdmin) {
      setError("Solo un administrador puede guardar promociones.");
      return;
    }

    setError("");
    setMensaje("");

    if (!form.nombre.trim()) {
      setError("El nombre de la promoción es obligatorio.");
      return;
    }

    const descuento = Number(form.descuentoPorcentaje);

    if (
      !Number.isFinite(descuento) ||
      descuento <= 0 ||
      descuento > 100
    ) {
      setError("El descuento debe ser mayor que 0 y máximo 100.");
      return;
    }

    if (!form.fechaInicio || !form.fechaFin) {
      setError("Debes indicar las fechas de inicio y fin.");
      return;
    }

    if (new Date(form.fechaFin) <= new Date(form.fechaInicio)) {
      setError(
        "La fecha de fin debe ser posterior a la fecha de inicio."
      );
      return;
    }

    const minimo =
      form.minGarrafones === ""
        ? 0
        : Number(form.minGarrafones);

    if (
      !Number.isInteger(minimo) ||
      minimo < 0
    ) {
      setError("El mínimo de garrafones debe ser un entero válido.");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      descuentoPorcentaje: descuento,
      fechaInicio: `${form.fechaInicio}:00`,
      fechaFin: `${form.fechaFin}:00`,
      minGarrafones: minimo,
      acumulaPuntos: Boolean(form.acumulaPuntos),
    };

    try {
      setGuardando(true);

      if (editando !== null) {
        await api.put(`/promociones/${editando}`, payload);
        setMensaje("Promoción actualizada correctamente.");
      } else {
        await api.post("/promociones", payload);
        setMensaje("Promoción creada correctamente.");
      }

      cancelarForm();
      await cargarPromociones();
    } catch (err) {
      setError(
        obtenerError(err, "No se pudo guardar la promoción.")
      );
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (promo) => {
    if (!esAdmin) {
      setError("Solo un administrador puede desactivar promociones.");
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas desactivar la promoción "${promo.nombre}"?\n\n` +
        "Dejará de estar disponible para nuevas aplicaciones."
    );

    if (!confirmar) return;

    try {
      setProcesandoId(promo.id);
      setError("");
      setMensaje("");

      await api.put(`/promociones/${promo.id}/desactivar`);

      setMensaje(
        `La promoción "${promo.nombre}" fue desactivada.`
      );

      await cargarPromociones();
    } catch (err) {
      setError(
        obtenerError(err, "No se pudo desactivar la promoción.")
      );
    } finally {
      setProcesandoId(null);
    }
  };

  const eliminar = async (promo) => {
    if (!esAdmin) {
      setError("Solo un administrador puede eliminar promociones.");
      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar definitivamente la promoción "${promo.nombre}"?\n\n` +
        "Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    try {
      setProcesandoId(promo.id);
      setError("");
      setMensaje("");

      await api.delete(`/promociones/${promo.id}`);

      setMensaje("Promoción eliminada correctamente.");

      await cargarPromociones();
    } catch (err) {
      setError(
        obtenerError(err, "No se pudo eliminar la promoción.")
      );
    } finally {
      setProcesandoId(null);
    }
  };

  const sucursalMostrada =
    usuario?.sucursalNombre ||
    (usuario?.sucursalId
      ? `Sucursal #${usuario.sucursalId}`
      : "Sucursal asignada al usuario");

  return (
    <section className="panel">
      {/* ENCABEZADO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 5 }}>
            🏷️ Administración de promociones
          </h1>
          <p
            style={{
              color: "var(--texto-suave)",
              margin: 0,
            }}
          >
            Consulta promociones, controla su vigencia y
            administra sus estados.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={cargarPromociones}
            disabled={cargando}
            style={botonStyle}
          >
            🔄 Actualizar
          </button>

          {esAdmin && !mostrarForm && (
            <button
              type="button"
              className="btn-glow"
              onClick={abrirCrear}
            >
              + Nueva promoción
            </button>
          )}
        </div>
      </div>

      {/* MENSAJES */}
      {mensaje && (
        <div style={mensajeStyle("exito")}>
          ✅ {mensaje}
        </div>
      )}

      {error && (
        <div style={mensajeStyle("error")}>
          ❌ {error}
        </div>
      )}

      {/* INDICADORES Y FILTROS HU-039 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          Estado de las promociones
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(145px, 1fr))",
            gap: 12,
          }}
        >
          {ESTADOS.map((estado) => {
            const seleccionado =
              filtroEstado === estado.valor;

            return (
              <button
                key={estado.valor}
                type="button"
                onClick={() => setFiltroEstado(estado.valor)}
                aria-pressed={seleccionado}
                style={{
                  padding: "16px 14px",
                  textAlign: "left",
                  borderRadius: 12,
                  cursor: "pointer",
                  background: seleccionado
                    ? "#1e293b"
                    : "var(--fondo-card, #0f172a)",
                  border: seleccionado
                    ? `2px solid ${estado.color}`
                    : "1px solid #475569",
                  color: "#e2e8f0",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: seleccionado
                      ? "#f8fafc"
                      : "#94a3b8",
                    marginBottom: 8,
                  }}
                >
                  {estado.nombre}
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: seleccionado
                      ? "#ffffff"
                      : "#cbd5e1",
                  }}
                >
                  {contarEstado(estado.valor)}
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 15,
          }}
        >
          <label
            htmlFor="filtro-promociones"
            style={labelStyle}
          >
            Filtrar por estado:
          </label>

          <select
            id="filtro-promociones"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto",
              minWidth: 190,
              marginTop: 0,
            }}
          >
            {ESTADOS.map((estado) => (
              <option
                key={estado.valor}
                value={estado.valor}
              >
                {estado.nombre}
              </option>
            ))}
          </select>

          <span
            style={{
              color: "var(--texto-suave)",
              fontSize: 13,
            }}
          >
            Mostrando {promocionesFiltradas.length} de{" "}
            {promocionesConEstado.length} promociones
          </span>
        </div>
      </div>

      {/* FORMULARIO DE CREACIÓN Y EDICIÓN */}
      {mostrarForm && esAdmin && (
        <div
          style={{
            background: "var(--fondo-card)",
            border: "1px solid var(--borde)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 28,
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editando !== null
              ? "✏️ Editar promoción"
              : "➕ Nueva promoción"}
          </h2>

          <form
            onSubmit={guardar}
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 16,
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="promo-nombre" style={labelStyle}>
                Nombre *
              </label>
              <input
                id="promo-nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Ej. Descuento de temporada"
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                htmlFor="promo-descripcion"
                style={labelStyle}
              >
                Descripción
              </label>
              <input
                id="promo-descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Ej. 20% en todos los garrafones"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="promo-descuento"
                style={labelStyle}
              >
                Descuento (%) *
              </label>
              <input
                id="promo-descuento"
                name="descuentoPorcentaje"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={form.descuentoPorcentaje}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="promo-minimo"
                style={labelStyle}
              >
                Mínimo de garrafones
              </label>
              <input
                id="promo-minimo"
                name="minGarrafones"
                type="number"
                min="0"
                step="1"
                value={form.minGarrafones}
                onChange={handleChange}
                placeholder="0 = Sin mínimo"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="promo-inicio"
                style={labelStyle}
              >
                Fecha de inicio *
              </label>
              <input
                id="promo-inicio"
                name="fechaInicio"
                type="datetime-local"
                value={form.fechaInicio}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="promo-fin"
                style={labelStyle}
              >
                Fecha de fin *
              </label>
              <input
                id="promo-fin"
                name="fechaFin"
                type="datetime-local"
                value={form.fechaFin}
                onChange={handleChange}
                min={form.fechaInicio || undefined}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                htmlFor="promo-sucursal"
                style={labelStyle}
              >
                Sucursal
              </label>
              <input
                id="promo-sucursal"
                value={sucursalMostrada}
                readOnly
                style={{
                  ...inputStyle,
                  opacity: 0.7,
                  cursor: "not-allowed",
                }}
              />
              <small style={{ color: "#94a3b8" }}>
                La sucursal se asigna desde el backend.
              </small>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  ...labelStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="acumulaPuntos"
                  checked={form.acumulaPuntos}
                  onChange={handleChange}
                />
                Acumular puntos con esta promoción
              </label>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 8,
              }}
            >
              <button
                type="submit"
                className="btn-glow"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editando !== null
                    ? "💾 Guardar cambios"
                    : "🏷️ Crear promoción"}
              </button>

              <button
                type="button"
                onClick={cancelarForm}
                disabled={guardando}
                style={botonStyle}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA DE PROMOCIONES */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: 18, margin: 0 }}>
          Listado de promociones
        </h2>

        <span
          style={{
            color: "var(--texto-suave)",
            fontSize: 13,
          }}
        >
          Filtro:{" "}
          {ESTADOS.find(
            (estado) => estado.valor === filtroEstado
          )?.nombre}
        </span>
      </div>

      {cargando ? (
        <p style={{ color: "var(--texto-suave)" }}>
          Cargando promociones...
        </p>
      ) : promocionesFiltradas.length === 0 ? (
        <div
          style={{
            padding: 24,
            border: "1px solid var(--borde)",
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: 12 }}>
            No hay promociones para el estado seleccionado.
          </p>

          {filtroEstado !== "TODAS" && (
            <button
              type="button"
              onClick={() => setFiltroEstado("TODAS")}
              style={botonStyle}
            >
              Ver todas las promociones
            </button>
          )}
        </div>
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
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {promocionesFiltradas.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <strong>{promo.nombre}</strong>

                    {promo.descripcion && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--texto-suave)",
                          marginTop: 4,
                        }}
                      >
                        {promo.descripcion}
                      </div>
                    )}
                  </td>

                  <td style={{ fontWeight: 700 }}>
                    {promo.descuentoPorcentaje}%
                  </td>

                  <td style={{ fontSize: 13 }}>
                    {formatearFecha(promo.fechaInicio)}
                  </td>

                  <td style={{ fontSize: 13 }}>
                    {formatearFecha(promo.fechaFin)}
                  </td>

                  <td
                    style={{
                      fontSize: 13,
                      color: "var(--texto-suave)",
                    }}
                  >
                    {promo.sucursalNombre || "—"}
                  </td>

                  <td>
                    <BadgeEstado
                      estado={promo.estadoCalculado}
                    />
                  </td>

                  {esAdmin && (
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => abrirEditar(promo)}
                          disabled={procesandoId === promo.id}
                          style={botonStyle}
                        >
                          ✏️ Editar
                        </button>

                        {promo.activa !== false && (
                          <button
                            type="button"
                            onClick={() => desactivar(promo)}
                            disabled={procesandoId === promo.id}
                            style={{
                              ...botonStyle,
                              background: "#2D2A1A",
                              color: "#fbbf24",
                              border: "1px solid #92400e",
                            }}
                          >
                            ⏸ Desactivar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => eliminar(promo)}
                          disabled={procesandoId === promo.id}
                          style={{
                            ...botonStyle,
                            background: "#2D1A1A",
                            color: "#f87171",
                            border: "1px solid #991b1b",
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  )}
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

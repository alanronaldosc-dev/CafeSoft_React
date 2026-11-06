
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

const botonStyle = {
  padding: "7px 12px",
  cursor: "pointer",
  fontSize: 13,
  borderRadius: 6,
};

function obtenerEstado(promo, instante = Date.now()) {
  if (promo.activa === false) return "DESACTIVADA";

  const inicio = promo.fechaInicio
    ? new Date(promo.fechaInicio).getTime()
    : NaN;

  const fin = promo.fechaFin
    ? new Date(promo.fechaFin).getTime()
    : NaN;

  if (Number.isFinite(inicio) && instante < inicio) {
    return "PROGRAMADA";
  }

  if (Number.isFinite(fin) && instante > fin) {
    return "VENCIDA";
  }

  if (Number.isFinite(inicio) && Number.isFinite(fin)) {
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

function obtenerError(error, predeterminado) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return (
    data?.mensaje ||
    data?.message ||
    data?.error ||
    predeterminado
  );
}

function BadgeEstado({ estado }) {
  const colores = {
    VIGENTE: ["Vigente", "#166534", "#dcfce7"],
    PROGRAMADA: ["Programada", "#1d4ed8", "#dbeafe"],
    VENCIDA: ["Vencida", "#92400e", "#fef3c7"],
    DESACTIVADA: ["Desactivada", "#991b1b", "#fee2e2"],
  };

  const [texto, color, fondo] = colores[estado] || [
    "Sin determinar",
    "#475569",
    "#e2e8f0",
  ];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: fondo,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </span>
  );
}

export default function Promociones({ usuario }) {
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
          "No se pudieron cargar las promociones."
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
    if (estado === "TODAS") {
      return promocionesConEstado.length;
    }

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
    if (!esAdmin) return;

    setEditando(null);
    setForm({ ...FORM_VACIO });
    setMostrarForm(true);
    setMensaje("");
    setError("");
  };

  const abrirEditar = (promo) => {
    if (!esAdmin || promo.activa === false) return;

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
      setError(
        "Solo un administrador puede guardar promociones."
      );
      return;
    }

    if (guardando) return;

    setError("");
    setMensaje("");

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const descuento = Number(form.descuentoPorcentaje);

    if (
      !Number.isFinite(descuento) ||
      descuento <= 0 ||
      descuento > 100
    ) {
      setError(
        "El descuento debe ser mayor que 0 y máximo 100."
      );
      return;
    }

    if (
      !form.fechaInicio ||
      !form.fechaFin ||
      new Date(form.fechaFin) <= new Date(form.fechaInicio)
    ) {
      setError(
        "Ingresa fechas válidas; la fecha final debe ser posterior a la inicial."
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
      setError(
        "El mínimo de garrafones debe ser un entero no negativo."
      );
      return;
    }

    if (
      editando !== null &&
      promociones.some(
        (p) => p.id === editando && p.activa === false
      )
    ) {
      setError(
        "No se puede editar una promoción desactivada."
      );
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
        await api.put(
          `/promociones/${editando}`,
          payload
        );

        setMensaje(
          "Promoción actualizada correctamente."
        );
      } else {
        await api.post(
          "/promociones",
          payload
        );

        setMensaje(
          "Promoción creada correctamente."
        );
      }

      cancelarForm();
      await cargarPromociones();
    } catch (err) {
      setError(
        obtenerError(
          err,
          "No se pudo guardar la promoción."
        )
      );
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (promo) => {
    if (
      !esAdmin ||
      promo.activa === false ||
      procesandoId !== null
    ) {
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

      await api.put(
        `/promociones/${promo.id}/desactivar`
      );

      setMensaje(
        `La promoción "${promo.nombre}" fue desactivada.`
      );

      await cargarPromociones();
    } catch (err) {
      setError(
        obtenerError(
          err,
          "No se pudo desactivar la promoción."
        )
      );

      await cargarPromociones();
    } finally {
      setProcesandoId(null);
    }
  };

  const eliminar = async (promo) => {
    if (
      !esAdmin ||
      promo.activa === false ||
      procesandoId !== null
    ) {
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

      await api.delete(
        `/promociones/${promo.id}`
      );

      setMensaje(
        "Promoción eliminada correctamente."
      );

      await cargarPromociones();
    } catch (err) {
      setError(
        obtenerError(
          err,
          "No se pudo eliminar la promoción."
        )
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
            Administración de promociones
          </h1>

          <p
            style={{
              color: "var(--texto-suave)",
              margin: 0,
            }}
          >
            Consulta promociones, controla su vigencia
            y revisa las desactivaciones.
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
            Actualizar
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
        <div
          role="status"
          style={{
            padding: 12,
            marginBottom: 14,
            borderRadius: 8,
            background: "#d4edda",
            color: "#155724",
          }}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            marginBottom: 14,
            borderRadius: 8,
            background: "#f8d7da",
            color: "#721c24",
          }}
        >
          {error}
        </div>
      )}

      {/* FILTROS HU-039 */}
      <div
        style={{
          display: "flex",
          gap: 9,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        {ESTADOS.map(({ valor, nombre, color }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltroEstado(valor)}
            aria-pressed={filtroEstado === valor}
            style={{
              ...botonStyle,
              border: `1px solid ${color}`,
              background:
                filtroEstado === valor
                  ? color
                  : "transparent",
              color:
                filtroEstado === valor
                  ? "white"
                  : "var(--texto)",
              fontWeight: 600,
            }}
          >
            {nombre} ({contarEstado(valor)})
          </button>
        ))}
      </div>

      {/* FORMULARIO */}
      {esAdmin && mostrarForm && (
        <div
          style={{
            border: "1px solid var(--borde)",
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              marginTop: 0,
            }}
          >
            {editando !== null
              ? "Editar promoción"
              : "Nueva promoción"}
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
              <label
                htmlFor="promo-nombre"
                style={labelStyle}
              >
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
                placeholder="Ej. 20% en garrafones"
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
                min={form.fechaInicio || undefined}
                value={form.fechaFin}
                onChange={handleChange}
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

              <small
                style={{
                  color: "#94a3b8",
                }}
              >
                La sucursal se asigna desde el backend.
              </small>
            </div>

            <label
              style={{
                ...labelStyle,
                gridColumn: "1 / -1",
                display: "flex",
                alignItems: "center",
                gap: 10,
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

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
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
                    ? "Guardar cambios"
                    : "Crear promoción"}
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

      {/* LISTADO DE PROMOCIONES */}
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
        <h2
          style={{
            fontSize: 18,
            margin: 0,
          }}
        >
          Listado de promociones
        </h2>

        <span
          style={{
            color: "var(--texto-suave)",
            fontSize: 13,
          }}
        >
          Filtro:{" "}
          {
            ESTADOS.find(
              (e) => e.valor === filtroEstado
            )?.nombre
          }
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
          <p>
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
                <th>Auditoría HU-040</th>

                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {promocionesFiltradas.map((promo) => {
                const desactivada =
                  promo.activa === false;

                return (
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

                    <td style={{ fontSize: 13 }}>
                      {promo.sucursalNombre || "—"}
                    </td>

                    <td>
                      <BadgeEstado
                        estado={promo.estadoCalculado}
                      />
                    </td>

                    {/* AUDITORÍA HU-040 */}
                    <td
                      style={{
                        fontSize: 12,
                        minWidth: 170,
                      }}
                    >
                      {desactivada ? (
                        <div
                          style={{
                            display: "grid",
                            gap: 4,
                          }}
                        >
                          <strong>
                            Fecha:{" "}
                            {formatearFecha(
                              promo.fechaDesactivacion
                            )}
                          </strong>

                          <span>
                            Por:{" "}
                            {promo.desactivadaPorNombre ||
                              (promo.desactivadaPorId != null
                                ? `Usuario #${promo.desactivadaPorId}`
                                : "No registrado")}
                          </span>

                          {promo.desactivadaPorEmail && (
                            <span
                              style={{
                                overflowWrap: "anywhere",
                              }}
                            >
                              {promo.desactivadaPorEmail}
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* ACCIONES ADMINISTRATIVAS */}
                    {esAdmin && (
                      <td>
                        {desactivada ? (
                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: 12,
                            }}
                          >
                            Sin acciones: promoción desactivada
                          </span>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                abrirEditar(promo)
                              }
                              disabled={
                                procesandoId !== null ||
                                guardando
                              }
                              style={botonStyle}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                desactivar(promo)
                              }
                              disabled={
                                procesandoId !== null ||
                                guardando
                              }
                              style={{
                                ...botonStyle,
                                background: "#2D2A1A",
                                color: "#fbbf24",
                                border: "1px solid #92400e",
                              }}
                            >
                              Desactivar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                eliminar(promo)
                              }
                              disabled={
                                procesandoId !== null ||
                                guardando
                              }
                              style={{
                                ...botonStyle,
                                background: "#2D1A1A",
                                color: "#f87171",
                                border: "1px solid #991b1b",
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

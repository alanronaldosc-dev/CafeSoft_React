import { Fragment, useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "./ClientesEnRiesgo.css";

const NIVELES = {
  ALTO: { texto: "Alto", color: "rojo" },
  MEDIO: { texto: "Medio", color: "naranja" },
  BAJO: { texto: "Bajo", color: "verde" },
};

const TIPOS = ["LLAMADA", "VISITA", "PROMOCION"];

function fechaValor(valor) {
  if (!valor) return null;
  if (Array.isArray(valor)) {
    const [anio, mes, dia, hora = 0, minuto = 0, segundo = 0] = valor;
    return new Date(anio, mes - 1, dia, hora, minuto, segundo);
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatoFecha(valor) {
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  const fecha = fechaValor(valor);
  return fecha ? fecha.toLocaleString("es-MX") : "—";
}

function fechaLocalActual() {
  const ahora = new Date();
  const dosDigitos = (n) => String(n).padStart(2, "0");
  return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}T${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`;
}

function EtiquetaNivel({ nivel }) {
  const info = NIVELES[nivel] || { texto: nivel || "—", color: "gris" };
  return (
    <span className={`cr-etiqueta cr-${info.color}`}>
      <span className="cr-punto" />
      {info.texto}
    </span>
  );
}

export default function ClientesEnRiesgo({ onNavegar, usuario }) {
  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState({});
  const [acciones, setAcciones] = useState({});
  const [filtroNivel, setFiltroNivel] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [telefonosVisibles, setTelefonosVisibles] = useState({});
  const [historialId, setHistorialId] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // HU-060: estado del submódulo de anomalías.
const [mostrarAnomalias, setMostrarAnomalias] = useState(false);
const [anomalias, setAnomalias] = useState([]);
const [cargandoAnomalias, setCargandoAnomalias] = useState(false);
const [errorAnomalias, setErrorAnomalias] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [respuestaClientes, respuestaResumen] = await Promise.all([
        api.get("/clientes/segmentos/riesgo"),
        api.get("/acciones-retencion/resumen"),
      ]);
      setClientes(Array.isArray(respuestaClientes.data) ? respuestaClientes.data : []);
      const mapa = {};
      (Array.isArray(respuestaResumen.data) ? respuestaResumen.data : []).forEach((item) => {
        mapa[item.clienteId] = item;
      });
      setResumen(mapa);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Solo los administradores pueden consultar los clientes en riesgo."
          : "No fue posible calcular el riesgo. Verifica la conexión con la API."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
  let cancelado = false;

  const consultarInicial = async () => {
    try {
      const [respuestaClientes, respuestaResumen] = await Promise.all([
        api.get("/clientes/segmentos/riesgo"),
        api.get("/acciones-retencion/resumen"),
      ]);

      if (cancelado) return;

      setClientes(
        Array.isArray(respuestaClientes.data)
          ? respuestaClientes.data
          : []
      );

      const mapa = {};
      (Array.isArray(respuestaResumen.data) ? respuestaResumen.data : [])
        .forEach((item) => {
          mapa[item.clienteId] = item;
        });

      setResumen(mapa);
    } catch (e) {
      if (cancelado) return;

      setError(
        e.response?.status === 403
          ? "Solo los administradores pueden consultar los clientes en riesgo."
          : "No fue posible calcular el riesgo. Verifica la conexión con la API."
      );
    } finally {
      if (!cancelado) {
        setCargando(false);
      }
    }
  };

  consultarInicial();

  return () => {
    cancelado = true;
  };
}, []);

  const cargarAcciones = async (clienteId) => {
    try {
      const respuesta = await api.get(`/acciones-retencion/cliente/${clienteId}`);
      setAcciones((prev) => ({
        ...prev,
        [clienteId]: Array.isArray(respuesta.data) ? respuesta.data : [],
      }));
    } catch {
      setError("No fue posible cargar el historial de acciones de retención.");
    }
  };

  // HU-060: consultar anomalías de clientes.
const cargarAnomalias = async () => {
  setMostrarAnomalias(true);
  setCargandoAnomalias(true);
  setErrorAnomalias("");

  try {
    const respuesta = await api.get("/clientes/segmentos/anomalias");

    setAnomalias(
      Array.isArray(respuesta.data) ? respuesta.data : []
    );
  } catch (e) {
    setAnomalias([]);
    setErrorAnomalias(
      e.response?.data?.message ||
      "No fue posible consultar las anomalías de clientes."
    );
  } finally {
    setCargandoAnomalias(false);
  }
};

  const alternarHistorial = (clienteId) => {
    if (historialId === clienteId) {
      setHistorialId(null);
      return;
    }
    setHistorialId(clienteId);
    cargarAcciones(clienteId);
  };

  const abrirFormulario = (cliente, tipo) => {
    setFormulario({
      clienteId: cliente.clienteId,
      nombre: cliente.nombre,
      tipo,
      responsable: usuario?.nombre || "",
      fecha: fechaLocalActual(),
      detalle: "",
    });
  };

  const guardarAccion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      await api.post(`/acciones-retencion/cliente/${formulario.clienteId}`, {
        tipo: formulario.tipo,
        responsable: formulario.responsable,
        fecha: formulario.fecha,
        detalle: formulario.detalle,
      });
      setFormulario(null);
      await cargar();
      await cargarAcciones(formulario.clienteId);
    } catch (e) {
      setError(
        e.response?.data?.message || e.response?.data?.mensaje ||
          "No fue posible registrar la acción de retención."
      );
    } finally {
      setGuardando(false);
    }
  };

  const atenderAccion = async (clienteId, accionId) => {
    setError("");
    try {
      await api.put(`/acciones-retencion/cliente/${clienteId}/${accionId}/atender`);
      await Promise.all([cargar(), cargarAcciones(clienteId)]);
    } catch (e) {
      setError(e.response?.data?.message || "No fue posible marcar la acción como atendida.");
    }
  };

  const clientesVisibles = clientes.filter((cliente) => {
    const coincideNivel = !filtroNivel || cliente.nivel === filtroNivel;
    const coincideBusqueda = (cliente.nombre || "")
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase());
    return coincideNivel && coincideBusqueda;
  });

  const conteo = (nivel) => clientes.filter((c) => c.nivel === nivel).length;
  const fechaCalculo = clientes[0]?.fechaCalculo;

  // HU-060: vista de anomalías de clientes.
if (mostrarAnomalias) {
  return (
    <main className="cr-contenedor">
      <header className="cr-encabezado">
        <div>
          <div className="cr-superior">
            <span className="cr-icono">⚠️</span>
            <span className="cr-modulo">CAFESOFT / ADMINISTRACIÓN</span>
          </div>

          <h1>Anomalías de clientes</h1>

          <p>
            Comportamientos de compra fuera de lo habitual
            identificados para revisión.
          </p>
        </div>

        <div className="cr-acciones-encabezado">
          <button
            type="button"
            className="cr-boton-secundario"
            onClick={() => setMostrarAnomalias(false)}
          >
            ← Volver a clientes en riesgo
          </button>

          <button
            type="button"
            className="cr-boton-principal"
            onClick={cargarAnomalias}
            disabled={cargandoAnomalias}
          >
            {cargandoAnomalias ? "Consultando..." : "Actualizar anomalías"}
          </button>
        </div>
      </header>

      {errorAnomalias && (
        <div className="cr-error" role="alert">
          {errorAnomalias}
        </div>
      )}

      <section className="cr-panel">
        <div className="cr-panel-encabezado">
          <div>
            <h3>Alertas detectadas</h3>
            <p>
              {anomalias.length} anomalía(s) identificada(s).
            </p>
          </div>
        </div>

        <p className="cr-referencia">
          Las alertas son señales para revisión y no representan
          diagnósticos definitivos.
        </p>

        <div className="cr-tabla-contenedor">
          <table className="cr-tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Anomalía</th>
                <th>Métrica</th>
                <th>Valor detectado</th>
                <th>Detalle</th>
              </tr>
            </thead>

            <tbody>
              {cargandoAnomalias ? (
                <tr>
                  <td colSpan="6" className="cr-vacio">
                    Consultando anomalías...
                  </td>
                </tr>
              ) : anomalias.length === 0 ? (
                <tr>
                  <td colSpan="6" className="cr-vacio">
                    No se detectaron anomalías de clientes.
                  </td>
                </tr>
              ) : (
                anomalias.map((anomalia, indice) => (
                  <tr key={`${anomalia.clienteId}-${anomalia.tipo}-${anomalia.fechaDeteccion}-${indice}`}>
                    <td>{anomalia.nombre}</td>
                    <td>{formatoFecha(anomalia.fechaDeteccion)}</td>
                    <td>{anomalia.tipo.replaceAll("_", " ")}</td>
                    <td>{anomalia.metrica.replaceAll("_", " ")}</td>
                    <td>
                      {anomalia.valorDetectado?.toLocaleString("es-MX") ?? "—"}
                    </td>
                    <td>{anomalia.detalle}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

  return (
    <main className="cr-contenedor">
      <header className="cr-encabezado">
        <div>
          <div className="cr-superior">
            <span className="cr-icono">🚨</span>
            <span className="cr-modulo">CAFESOFT / ADMINISTRACIÓN</span>
          </div>
          <h1>Clientes en riesgo de abandono</h1>
          <p>
            Identifica clientes con riesgo de abandono y registra acciones de
            retención antes de perderlos.
          </p>
          <span className="cr-estimacion">
            ⓘ Estimación · RNF-10 · calculada el {formatoFecha(fechaCalculo)}
          </span>
        </div>

        <div className="cr-acciones-encabezado">
          <button type="button" className="cr-boton-principal" onClick={cargar} disabled={cargando}>
            ↻ {cargando ? "Calculando..." : "Actualizar cálculo"}
          </button>
          <button
            type="button"
            className="cr-boton-secundario"
            onClick={() => onNavegar?.("segmentacion")}
          >
            ← Volver a segmentación
          </button>
          <button
            type="button"
            className="cr-boton-secundario"
            onClick={cargarAnomalias}
            disabled={cargandoAnomalias}
       >
           ⚠️ Anomalías de clientes
          </button>
        </div>
      </header>

      {error && <div className="cr-error" role="alert">⚠ {error}</div>}

      <section className="cr-tarjetas">
        {Object.entries(NIVELES).map(([clave, info]) => (
          <button
            key={clave}
            type="button"
            className={`cr-tarjeta cr-borde-${info.color} ${filtroNivel === clave ? "cr-tarjeta-activa" : ""}`}
            onClick={() => setFiltroNivel(filtroNivel === clave ? "" : clave)}
          >
            <span>Nivel {info.texto}</span>
            <strong>{conteo(clave)}</strong>
            <small>clientes</small>
          </button>
        ))}
      </section>

      {formulario && (
        <section className="cr-panel cr-formulario">
          <div className="cr-panel-encabezado">
            <div>
              <h3>Registrar acción de retención</h3>
              <p>Cliente: {formulario.nombre}</p>
            </div>
            <button type="button" className="cr-boton-secundario" onClick={() => setFormulario(null)}>
              Cerrar
            </button>
          </div>

          <form onSubmit={guardarAccion} className="cr-form-campos">
            <label>
              Tipo de acción
              <select
                value={formulario.tipo}
                onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </label>

            <label>
              Responsable
              <input
                type="text"
                required
                value={formulario.responsable}
                onChange={(e) => setFormulario({ ...formulario, responsable: e.target.value })}
              />
            </label>

            <label>
              Fecha
              <input
                type="datetime-local"
                required
                value={formulario.fecha}
                onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
              />
            </label>

            <label>
              Detalle u observaciones
              <textarea
                rows="2"
                maxLength="500"
                value={formulario.detalle}
                onChange={(e) => setFormulario({ ...formulario, detalle: e.target.value })}
              />
            </label>

            <button type="submit" className="cr-boton-principal" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar acción"}
            </button>
          </form>
        </section>
      )}

      <section className="cr-panel">
        <div className="cr-panel-encabezado">
          <div>
            <h3>Directorio de clientes en riesgo</h3>
            <p>Ordenado por nivel de riesgo, de mayor a menor.</p>
          </div>
          <span className="cr-contador">{clientesVisibles.length} resultados</span>
        </div>

        <div className="cr-filtros">
          <input
            type="search"
            placeholder="Buscar cliente por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar cliente"
          />
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
            aria-label="Filtrar por nivel de riesgo"
          >
            <option value="">Todos los niveles</option>
            {Object.entries(NIVELES).map(([clave, info]) => (
              <option key={clave} value={clave}>{info.texto}</option>
            ))}
          </select>
        </div>

        <div className="cr-tabla-contenedor">
          <table className="cr-tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Nivel</th>
                <th>Motivo</th>
                <th>Días</th>
                <th>Caída</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesVisibles.map((cliente) => {
                const resumenCliente = resumen[cliente.clienteId];
                const accionesCliente = acciones[cliente.clienteId] || [];
                const ubicacion = cliente.linkGoogleMaps;
                const telefonoVisible = telefonosVisibles[cliente.clienteId];
                const referencia = cliente.datosReferencia;

                return (
                  <Fragment key={cliente.clienteId}>
                    <tr>
                      <td>
                        <div className="cr-cliente">
                          <span className="cr-avatar">
                            {(cliente.nombre || "C").charAt(0).toUpperCase()}
                          </span>
                          <strong>{cliente.nombre}</strong>
                        </div>
                      </td>
                      <td><EtiquetaNivel nivel={cliente.nivel} /></td>
                      <td>{cliente.motivo}</td>
                      <td>{cliente.diasSinCompra ?? "N/A"}</td>
                      <td>{Math.round(cliente.caidaFrecuencia || 0)}%</td>
                      <td>
                        <div className="cr-botones-fila">
                          <button
                            type="button"
                            className="cr-boton-chico cr-boton-azul"
                            disabled={!cliente.telefono}
                            onClick={() =>
                              setTelefonosVisibles((prev) => ({
                                ...prev,
                                [cliente.clienteId]: !prev[cliente.clienteId],
                              }))
                            }
                          >
                            📞 Llamada
                          </button>

                          <button
                            type="button"
                            className="cr-boton-chico cr-boton-verde"
                            disabled={!ubicacion}
                            onClick={() => ubicacion && window.open(ubicacion, "_blank", "noopener,noreferrer")}
                          >
                            📍 Ver ubicación
                          </button>

                          <button
                            type="button"
                            className="cr-boton-chico cr-boton-morado"
                            onClick={() => onNavegar?.("promociones")}
                          >
                            🏷️ Promoción
                          </button>

                          <button
                            type="button"
                            className="cr-boton-chico cr-boton-gris"
                            onClick={() => abrirFormulario(cliente, "LLAMADA")}
                          >
                            ＋ Registrar
                          </button>

                          <button
                            type="button"
                            className="cr-boton-chico cr-boton-gris"
                            onClick={() => alternarHistorial(cliente.clienteId)}
                          >
                            📋 {resumenCliente?.pendientes
                              ? `${resumenCliente.pendientes} pendiente(s)`
                              : "Historial"}
                          </button>
                        </div>

                        {telefonoVisible && (
                          <div className="cr-contacto">
                            {cliente.telefono ? (
                              <a href={`tel:${cliente.telefono}`}>📱 {cliente.telefono}</a>
                            ) : (
                              <span>Sin teléfono registrado</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>

                    {historialId === cliente.clienteId && (
                      <tr className="cr-fila-detalle">
                        <td colSpan="6">
                          <strong>Acciones de retención</strong>
                          <p className="cr-referencia">
                            Referencia: {referencia?.compras ?? 0} compras
                            {referencia?.periodoDesde
                              ? ` entre ${formatoFecha(referencia.periodoDesde)} y ${formatoFecha(referencia.periodoHasta)}`
                              : ""}
                            {" · promedio "}
                            {Math.round(referencia?.promedioDiasEntreCompras || 0)} días/compra
                            {" · "}{referencia?.comprasUltimos30 ?? 0} compras en 30 días
                            (esperadas {Math.round(referencia?.comprasEsperadas30 || 0)})
                          </p>
                          {accionesCliente.length === 0 ? (
                            <p className="cr-vacio">Sin acciones registradas.</p>
                          ) : (
                            <ul className="cr-lista-acciones">
                              {accionesCliente.map((accion) => (
                                <li key={accion.id}>
                                  <span><b>{accion.tipo}</b> · {accion.responsable}</span>
                                  <span>{formatoFecha(accion.fecha)}</span>
                                  {accion.detalle && <span>{accion.detalle}</span>}
                                  {accion.atendida ? (
                                    <span className="cr-atendida">✓ Atendida</span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="cr-boton-chico cr-boton-atender"
                                      onClick={() => atenderAccion(cliente.clienteId, accion.id)}
                                    >
                                      Marcar atendida
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {!cargando && clientesVisibles.length === 0 && (
                <tr>
                  <td colSpan="6" className="cr-vacio">
                    No hay clientes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="cr-pie">
        Resultado estimado con fecha de cálculo {formatoFecha(fechaCalculo)}.
        Los umbrales se basan en la segmentación vigente (30 y 90 días) y en la
        caída de frecuencia respecto al promedio histórico del cliente.
      </p>
    </main>
  );
}

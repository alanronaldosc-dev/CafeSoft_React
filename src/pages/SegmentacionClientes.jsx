import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import "./SegmentacionClientes.css";

const SEGMENTOS = {
  ACTIVO: {
    nombre: "Activo",
    color: "verde",
    descripcion: "Clientes con actividad de compra frecuente",
  },
  POTENCIAL: {
    nombre: "Potencial",
    color: "azul",
    descripcion: "Clientes registrados sin compras",
  },
  DORMIDO: {
    nombre: "Dormido",
    color: "naranja",
    descripcion: "Clientes sin compras recientes",
  },
  POCO_FRECUENTE: {
    nombre: "Poco frecuente",
    color: "morado",
    descripcion: "Clientes con compras ocasionales",
  },
};

const REGLAS = [
  {
    segmento: "Potencial",
    descripcion: "Cliente registrado sin compras.",
  },
  {
    segmento: "Dormido",
    descripcion: "Más de 90 días desde su última compra.",
  },
  {
    segmento: "Activo",
    descripcion: "3 o más compras y una compra en los últimos 30 días.",
  },
  {
    segmento: "Poco frecuente",
    descripcion: "Tiene compras, pero no cumple las reglas anteriores.",
  },
];

function nombreSegmento(segmento) {
  return SEGMENTOS[segmento]?.nombre || segmento || "Sin clasificar";
}

function EtiquetaSegmento({ segmento }) {
  const info = SEGMENTOS[segmento];

  return (
    <span className={`sc-etiqueta sc-${info?.color || "gris"}`}>
      <span className="sc-punto" />
      {nombreSegmento(segmento)}
    </span>
  );
}

export default function SegmentacionClientes() {
  const [resumen, setResumen] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [segmento, setSegmento] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizado, setActualizado] = useState(null);
  const perfilRef = useRef(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const [respuestaResumen, respuestaClientes] = await Promise.all([
        api.get("/clientes/segmentos/resumen"),
        api.get("/clientes/segmentos"),
      ]);

      setResumen(respuestaResumen.data);
      setClientes(
        Array.isArray(respuestaClientes.data)
          ? respuestaClientes.data
          : []
      );
      setActualizado(new Date());
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Solo los administradores pueden consultar la segmentación."
          : "No fue posible cargar la segmentación. Verifica la conexión con la API."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const clienteSeleccionado = clientes.find(
    (cliente) => cliente.clienteId === seleccionadoId
  );

  const clientesVisibles = clientes.filter((cliente) => {
    const coincideSegmento =
      !segmento || cliente.segmento === segmento;

    const coincideBusqueda = (cliente.nombre || "")
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase());

    return coincideSegmento && coincideBusqueda;
  });

  const total = resumen?.total ?? clientes.length;

  return (
    <main className="sc-contenedor" aria-busy={cargando}>
      <header className="sc-encabezado">
        <div>
          <div className="sc-superior">
            <span className="sc-marca" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
              </svg>
            </span>
            <span className="sc-modulo">CAFESOFT / ADMINISTRACIÓN</span>
          </div>

          <h1>Segmentación de clientes</h1>

          <p>
            Analiza la actividad de compra, identifica oportunidades
            comerciales y consulta el comportamiento de cada cliente.
          </p>
        </div>

        <div className="sc-acciones">
          <span className="sc-sello-tiempo">
            {actualizado
              ? `Actualizado ${actualizado.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Sin actualizar"}
          </span>

          <button
            className="sc-boton-principal"
            onClick={cargar}
            disabled={cargando}
            type="button"
          >
            <span
              className={`sc-refresh ${cargando ? "sc-girando" : ""}`}
              aria-hidden="true"
            >
              ↻
            </span>
            {cargando ? "Actualizando..." : "Actualizar clasificación"}
          </button>
        </div>
      </header>

      {error && (
        <div className="sc-error" role="alert">
          <span className="sc-error-texto">⚠ {error}</span>
          <button
            type="button"
            className="sc-error-reintentar"
            onClick={cargar}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="sc-seccion" aria-labelledby="sc-clasificacion">
        <div className="sc-titulo-seccion">
          <div>
            <span className="sc-hu" title="Historia de usuario asociada">
              HU-035
            </span>
            <h2 id="sc-clasificacion">Clasificación general de clientes</h2>
            <p>
              Distribución automática de clientes según sus compras.
            </p>
          </div>

          <div className="sc-total">
            <span>Total de clientes</span>
            <strong>{total}</strong>
            <small>clientes clasificados</small>
          </div>
        </div>

        <div className="sc-tarjetas" aria-busy={cargando && !resumen}>
          {Object.entries(SEGMENTOS).map(([clave, info]) => {
            const cantidad = resumen?.segmentos?.[clave] ?? 0;
            const porcentaje = total > 0
              ? ((cantidad / total) * 100).toFixed(1)
              : "0.0";
            const activa = segmento === clave;

            return (
              <button
                key={clave}
                type="button"
                className={`sc-tarjeta sc-borde-${info.color} ${
                  activa ? "sc-tarjeta-activa" : ""
                }`}
                onClick={() =>
                  setSegmento(activa ? "" : clave)
                }
                aria-pressed={activa}
                aria-label={`${info.nombre}: ${cantidad} clientes, ${porcentaje}% del total`}
              >
                <span className="sc-tarjeta-superior">
                  <span
                    className={`sc-indicador sc-fondo-${info.color}`}
                    aria-hidden="true"
                  />
                  <span className="sc-tarjeta-porcentaje">
                    {porcentaje}%
                  </span>
                </span>

                <span className="sc-numero">{cantidad}</span>
                <span className="sc-tarjeta-nombre">{info.nombre}</span>
                <span className="sc-tarjeta-desc">{info.descripcion}</span>

                <span className="sc-barra" aria-hidden="true">
                  <span
                    className={`sc-barra-relleno sc-fondo-${info.color}`}
                    style={{
                      width: `${Math.max(Number(porcentaje), 1.5)}%`,
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <div className="sc-panel">
          <div className="sc-panel-encabezado">
            <div>
              <h3>Directorio de clientes segmentados</h3>
              <p>
                Consulta y filtra los clientes según su clasificación.
              </p>
            </div>

            <span className="sc-contador" aria-live="polite">
              {clientesVisibles.length} resultados
            </span>
          </div>

          <div className="sc-filtros">
            <input
              type="search"
              placeholder="Buscar cliente por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar cliente"
            />

            <select
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              aria-label="Filtrar por segmento"
            >
              <option value="">Todos los segmentos</option>
              {Object.entries(SEGMENTOS).map(([clave, info]) => (
                <option key={clave} value={clave}>
                  {info.nombre}
                </option>
              ))}
            </select>

            {(segmento || busqueda) && (
              <button
                type="button"
                className="sc-boton-secundario"
                onClick={() => {
                  setSegmento("");
                  setBusqueda("");
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="sc-tabla-contenedor">
            <table className="sc-tabla">
              <caption className="sc-sr-only">
                Clientes clasificados por segmento, con número de compras,
                última compra y acceso a su perfil.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Segmento</th>
                  <th scope="col">Compras</th>
                  <th scope="col">Última compra</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cargando && clientes.length === 0 &&
                  [0, 1, 2, 3, 4].map((fila) => (
                    <tr key={`esqueleto-${fila}`} className="sc-fila-esqueleto">
                      <td colSpan={5} aria-hidden="true">
                        <span className="sc-esqueleto" />
                      </td>
                    </tr>
                  ))}

                {clientesVisibles.map((cliente) => (
                  <tr
                    key={cliente.clienteId}
                    className={
                      seleccionadoId === cliente.clienteId
                        ? "sc-fila-activa"
                        : ""
                    }
                  >
                    <td data-label="Cliente">
                      <div className="sc-cliente">
                        <span className="sc-avatar" aria-hidden="true">
                          {(cliente.nombre || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <strong>{cliente.nombre}</strong>
                      </div>
                    </td>

                    <td data-label="Segmento">
                      <EtiquetaSegmento segmento={cliente.segmento} />
                    </td>

                    <td data-label="Compras">
                      <span className="sc-compras">
                        {cliente.compras ?? 0}
                      </span>
                    </td>

                    <td data-label="Última compra">
                      {cliente.ultimaCompra || "Sin compras"}
                    </td>

                    <td data-label="Acciones">
                      <button
                        type="button"
                        className="sc-boton-perfil"
                        onClick={() => {
                          setSeleccionadoId(cliente.clienteId);
                          setTimeout(() => {
                            perfilRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }, 50);
                        }}
                      >
                        Ver perfil →
                      </button>
                    </td>
                  </tr>
                ))}

                {!cargando && clientesVisibles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="sc-vacio">
                      No se encontraron clientes con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sc-panel sc-reglas">
          <div className="sc-panel-encabezado">
            <div>
              <h3>Reglas de segmentación</h3>
              <p>
                Criterios utilizados para interpretar la actividad.
              </p>
            </div>
            <span className="sc-hu">HU-035</span>
          </div>

          <div className="sc-lista-reglas">
            {REGLAS.map((regla) => (
              <div key={regla.segmento} className="sc-regla">
                <strong>{regla.segmento}</strong>
                <span>{regla.descripcion}</span>
              </div>
            ))}
          </div>

          <p className="sc-nota">
            Estas reglas son propuestas. Los umbrales deben validarse
            con el equipo y coincidir con los implementados en la API.
          </p>
        </div>
      </section>

      <section className="sc-seccion sc-seccion-perfil" ref={perfilRef}>
        <div className="sc-titulo-seccion">
          <div>
            <span className="sc-hu sc-hu-secundaria" title="Historia de usuario asociada">
              HU-036
            </span>
            <h2>Consulta individual del segmento</h2>
            <p>
              Visualiza la clasificación de un cliente y los
              indicadores que la justifican.
            </p>
          </div>
        </div>

        {clienteSeleccionado ? (
          <div className="sc-panel sc-perfil" aria-live="polite">
            <div className="sc-perfil-superior">
              <div className="sc-cliente">
                <span className="sc-avatar sc-avatar-grande" aria-hidden="true">
                  {(clienteSeleccionado.nombre || "C")
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div>
                  <h3>{clienteSeleccionado.nombre}</h3>
                  <p>
                    Cliente #{clienteSeleccionado.clienteId}
                  </p>
                </div>
              </div>

              <button
                className="sc-boton-secundario"
                type="button"
                onClick={() => setSeleccionadoId(null)}
                aria-label="Cerrar el perfil del cliente"
              >
                Cerrar perfil
              </button>
            </div>

            <div className="sc-perfil-segmento">
              <span>SEGMENTO ACTUAL</span>
              <EtiquetaSegmento
                segmento={clienteSeleccionado.segmento}
              />
            </div>

            <div className="sc-metricas">
              <div>
                <span>Compras registradas</span>
                <strong>{clienteSeleccionado.compras ?? 0}</strong>
              </div>

              <div>
                <span>Última compra</span>
                <strong>
                  {clienteSeleccionado.ultimaCompra || "Sin compras"}
                </strong>
              </div>

              <div>
                <span>Días sin comprar</span>
                <strong>
                  {clienteSeleccionado.diasSinCompra ?? "N/A"}
                </strong>
              </div>
            </div>

            <div className="sc-explicacion">
              <h4>¿Por qué pertenece a este segmento?</h4>
              <p>
                {clienteSeleccionado.regla ||
                  "No hay una regla disponible para este cliente."}
              </p>
            </div>

            <div className="sc-perfil-pie">
              <span>
                {actualizado
                  ? `Datos consultados: ${actualizado.toLocaleString("es-MX")}`
                  : "Pendiente de actualización"}
              </span>

              <button
                type="button"
                className="sc-boton-principal"
                onClick={cargar}
                disabled={cargando}
              >
                ↻ Actualizar datos
              </button>
            </div>
          </div>
        ) : (
          <div className="sc-panel sc-perfil-vacio">
            <div className="sc-icono-vacio">👤</div>
            <h3>Ningún cliente seleccionado</h3>
            <p>
              Selecciona «Ver perfil» en el directorio para consultar
              su segmento individual.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
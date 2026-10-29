
import { useCallback, useEffect, useState } from "react";
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
    <main className="sc-contenedor">
      <header className="sc-encabezado">
        <div>
          <div className="sc-superior">
            <span className="sc-icono-principal">📊</span>
            <span className="sc-modulo">CAFESOFT / ADMINISTRACIÓN</span>
          </div>

          <h1>Segmentación de clientes</h1>

          <p>
            Analiza la actividad de compra, identifica oportunidades
            comerciales y consulta el comportamiento de cada cliente.
          </p>
        </div>

        <button
          className="sc-boton-principal"
          onClick={cargar}
          disabled={cargando}
          type="button"
        >
          <span>↻</span>
          {cargando ? "Actualizando..." : "Actualizar clasificación"}
        </button>
      </header>

      {error && (
        <div className="sc-error" role="alert">
          ⚠ {error}
        </div>
      )}

      <section className="sc-seccion">
        <div className="sc-titulo-seccion">
          <div>
            <span className="sc-hu">HU-035</span>
            <h2>Clasificación general de clientes</h2>
            <p>
              Distribución automática de clientes según sus compras.
            </p>
          </div>

          <div className="sc-total">
            <span>Total de clientes</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="sc-tarjetas">
          {Object.entries(SEGMENTOS).map(([clave, info]) => {
            const cantidad = resumen?.segmentos?.[clave] ?? 0;
            const porcentaje = total > 0
              ? ((cantidad / total) * 100).toFixed(1)
              : "0.0";

            return (
              <button
                key={clave}
                type="button"
                className={`sc-tarjeta sc-borde-${info.color} ${
                  segmento === clave ? "sc-tarjeta-activa" : ""
                }`}
                onClick={() =>
                  setSegmento(segmento === clave ? "" : clave)
                }
                aria-pressed={segmento === clave}
              >
                <div className="sc-tarjeta-superior">
                  <span className={`sc-indicador sc-fondo-${info.color}`}>
                    ●
                  </span>
                  <span className="sc-tarjeta-porcentaje">
                    {porcentaje}%
                  </span>
                </div>

                <strong className="sc-numero">{cantidad}</strong>
                <h3>{info.nombre}</h3>
                <p>{info.descripcion}</p>
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

            <span className="sc-contador">
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
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Segmento</th>
                  <th>Compras</th>
                  <th>Última compra</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesVisibles.map((cliente) => (
                  <tr key={cliente.clienteId}>
                    <td>
                      <div className="sc-cliente">
                        <span className="sc-avatar">
                          {(cliente.nombre || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <strong>{cliente.nombre}</strong>
                      </div>
                    </td>

                    <td>
                      <EtiquetaSegmento segmento={cliente.segmento} />
                    </td>

                    <td>
                      <span className="sc-compras">
                        {cliente.compras ?? 0}
                      </span>
                    </td>

                    <td>{cliente.ultimaCompra || "Sin compras"}</td>

                    <td>
                      <button
                        type="button"
                        className="sc-boton-perfil"
                        onClick={() =>
                          setSeleccionadoId(cliente.clienteId)
                        }
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

      <section className="sc-seccion sc-seccion-perfil">
        <div className="sc-titulo-seccion">
          <div>
            <span className="sc-hu sc-hu-secundaria">HU-036</span>
            <h2>Consulta individual del segmento</h2>
            <p>
              Visualiza la clasificación de un cliente y los
              indicadores que la justifican.
            </p>
          </div>
        </div>

        {clienteSeleccionado ? (
          <div className="sc-panel sc-perfil">
            <div className="sc-perfil-superior">
              <div className="sc-cliente">
                <span className="sc-avatar sc-avatar-grande">
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
              Selecciona «Ver perfil» en la tabla de HU-035
              para consultar su segmento individual.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

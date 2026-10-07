import { useEffect, useState, useMemo } from "react";
import api from "../services/api";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const LETRAS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

function Clientes({ onCrear, onEditar }) {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [letraFiltro, setLetraFiltro] = useState("");
  const [diaFiltro, setDiaFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  // ============================================
  // HU-019 - HISTORIAL DE CLIENTE
  // ============================================
  const [clienteHistorial, setClienteHistorial] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const POR_PAGINA = 10;

  useEffect(() => {
    obtenerClientes();
  }, []);

  const obtenerClientes = async () => {
    try {
      setCargando(true);

      const res = await api.get("/clientes");

      setClientes(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Error al cargar clientes:",
        error
      );

      alert(
        "No se pudieron cargar los clientes"
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstado = async (cliente) => {
    const esDarDeBaja = cliente.activo;

    const confirmar = window.confirm(
      esDarDeBaja
        ? "¿Deseas dar de baja a este cliente?"
        : "¿Deseas dar de alta a este cliente?"
    );

    if (!confirmar) return;

    try {
      const url = esDarDeBaja
        ? `/clientes/${cliente.id}/baja`
        : `/clientes/${cliente.id}/alta`;

      await api.put(url);

      alert(
        esDarDeBaja
          ? "Cliente dado de baja correctamente"
          : "Cliente dado de alta correctamente"
      );

      obtenerClientes();
    } catch (error) {
      console.error(
        "Error al cambiar estado:",
        error
      );

      alert(
        "No se pudo cambiar el estado del cliente"
      );
    }
  };

  const eliminarCliente = async (id) => {
    if (
      !window.confirm(
        "¿Deseas eliminar definitivamente este cliente?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/clientes/${id}`);

      alert(
        "Cliente eliminado correctamente"
      );

      obtenerClientes();
    } catch (error) {
      console.error(
        "Error al eliminar:",
        error
      );

      alert(
        "No se pudo eliminar el cliente"
      );
    }
  };

  // ============================================
  // HU-019 - CONSULTAR HISTORIAL
  // ============================================

  const verHistorial = async (cliente) => {
    try {
      setCargandoHistorial(true);
      setClienteHistorial(cliente);
      setHistorial(null);

      const res = await api.get(
        `/clientes/${cliente.id}/historial`
      );

      setHistorial(res.data);
    } catch (error) {
      console.error(
        "Error al cargar historial:",
        error
      );

      alert(
        "No se pudo cargar el historial del cliente"
      );

      setClienteHistorial(null);
      setHistorial(null);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cerrarHistorial = () => {
    setClienteHistorial(null);
    setHistorial(null);
    setCargandoHistorial(false);
  };

  // ============================================
  // FILTROS
  // ============================================

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const coincideBusqueda =
        c.nombre
          ?.toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        c.domicilio
          ?.toLowerCase()
          .includes(busqueda.toLowerCase());

      const coincideLetra =
        !letraFiltro ||
        c.nombre
          ?.trim()
          .toUpperCase()
          .startsWith(letraFiltro);

      const coincideDia =
        !diaFiltro ||
        c.diasReparto
          ?.toLowerCase()
          .includes(diaFiltro.toLowerCase());

      return (
        coincideBusqueda &&
        coincideLetra &&
        coincideDia
      );
    });
  }, [
    clientes,
    busqueda,
    letraFiltro,
    diaFiltro,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      clientesFiltrados.length /
        POR_PAGINA
    )
  );

  const fichaPagina =
    clientesFiltrados.slice(
      (pagina - 1) * POR_PAGINA,
      pagina * POR_PAGINA
    );

  if (cargando) {
    return (
      <section className="panel">
        <p>Cargando clientes...</p>
      </section>
    );
  }

  return (
    <section className="panel">

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>🧑 Clientes</h1>

          <p>
            Catálogo de clientes registrados.
          </p>
        </div>

        <button
          onClick={onCrear}
          style={{
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          + Nuevo cliente
        </button>
      </div>

      {/* ========================================
          BÚSQUEDA
      ======================================== */}

      <input
        type="text"
        placeholder="🔍 Buscar por nombre o domicilio..."
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPagina(1);
        }}
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "10px 14px",
          borderRadius: "10px",
          border: "1px solid #334155",
          background: "#1e293b",
          color: "#e2e8f0",
          marginBottom: "14px",
        }}
      />

      {/* ========================================
          FILTROS
      ======================================== */}

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        {/* Filtro alfabético */}

        <div>
          <span
            style={{
              color: "#94a3b8",
              marginRight: "8px",
            }}
          >
            Letra:
          </span>

          <select
            value={letraFiltro}
            onChange={(e) => {
              setLetraFiltro(
                e.target.value
              );

              setPagina(1);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border:
                "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
            }}
          >
            <option value="">
              Todas
            </option>

            {LETRAS.map((l) => (
              <option
                key={l}
                value={l}
              >
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por día */}

        <div>
          <span
            style={{
              color: "#94a3b8",
              marginRight: "8px",
            }}
          >
            Día:
          </span>

          <select
            value={diaFiltro}
            onChange={(e) => {
              setDiaFiltro(
                e.target.value
              );

              setPagina(1);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border:
                "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
            }}
          >
            <option value="">
              Todos
            </option>

            {DIAS.map((d) => (
              <option
                key={d}
                value={d}
              >
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================
          CLIENTES
      ======================================== */}

      {fichaPagina.length === 0 ? (
        <p>
          No hay clientes que coincidan.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {fichaPagina.map(
            (cliente) => (
              <div
                key={cliente.id}
                style={{
                  border:
                    cliente.activo
                      ? "1px solid #1e293b"
                      : "2px solid #ef4444",

                  borderRadius:
                    "14px",

                  padding:
                    "18px",

                  background:
                    "#0f172a",

                  boxShadow:
                    "0 4px 14px rgba(0,0,0,.35)",
                }}
              >
                {cliente.activo ===
                  false && (
                  <span
                    style={{
                      display:
                        "inline-block",

                      marginBottom:
                        "8px",

                      padding:
                        "2px 10px",

                      borderRadius:
                        "999px",

                      background:
                        "#7f1d1d",

                      color:
                        "#fecaca",

                      fontSize:
                        "12px",

                      fontWeight:
                        600,
                    }}
                  >
                    ⛔ Dado de baja
                  </span>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                    marginBottom:
                      "10px",
                  }}
                >
                  <div
                    style={{
                      width:
                        "38px",

                      height:
                        "38px",

                      borderRadius:
                        "10px",

                      background:
                        "#14532d",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "18px",
                    }}
                  >
                    🧑
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize:
                          "11px",

                        color:
                          "#64748b",

                        letterSpacing:
                          "2px",
                      }}
                    >
                      MÓDULO
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        color:
                          "#f1f5f9",
                      }}
                    >
                      {
                        cliente.nombre
                      }
                    </h3>
                  </div>

                  <span
                    style={{
                      marginLeft:
                        "auto",

                      width:
                        "8px",

                      height:
                        "8px",

                      borderRadius:
                        "50%",

                      background:
                        cliente.activo
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  />
                </div>

                {cliente.fotografiaDomicilio && (
                  <img
                    src={`data:image/jpeg;base64,${cliente.fotografiaDomicilio}`}
                    alt="Fotografía del domicilio"
                    style={{
                      width:
                        "100%",

                      borderRadius:
                        "10px",

                      marginBottom:
                        "10px",

                      maxHeight:
                        "200px",

                      objectFit:
                        "cover",
                    }}
                  />
                )}

                <p
                  style={{
                    color:
                      "#94a3b8",

                    margin:
                      "4px 0",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Domicilio:
                  </strong>{" "}
                  {
                    cliente.domicilio
                  }
                </p>

                <p
                  style={{
                    color:
                      "#94a3b8",

                    margin:
                      "4px 0",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Google Maps:
                  </strong>{" "}
                  {cliente.linkGoogleMaps ? (
                    <a
                      href={
                        cliente.linkGoogleMaps
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color:
                          "#60a5fa",
                      }}
                    >
                      Ver en mapa
                    </a>
                  ) : (
                    "Sin especificar"
                  )}
                </p>

                <p
                  style={{
                    color:
                      "#94a3b8",

                    margin:
                      "4px 0",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Días:
                  </strong>{" "}
                  {cliente.diasReparto ||
                    "Sin especificar"}
                </p>

                <p
                  style={{
                    color:
                      "#94a3b8",

                    margin:
                      "4px 0",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Frecuencia:
                  </strong>{" "}
                  {cliente.frecuencia ||
                    "Sin especificar"}
                </p>

                <p
                  style={{
                    color:
                      "#94a3b8",

                    margin:
                      "4px 0",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Precio:
                  </strong>{" "}
                  $
                  {
                    cliente.precioPorGarrafon
                  }
                </p>

                <p
                  style={{
                    color:
                      "#94a3b8",

                    margin:
                      "4px 0",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Garrafón:
                  </strong>{" "}
                  {cliente
                    .garrafonPreferencia
                    ?.nombre ||
                    "Sin especificar"}
                </p>

                {/* =================================
                    BOTONES
                ================================= */}

                <div
                  style={{
                    display:
                      "flex",

                    gap: "8px",

                    marginTop:
                      "14px",

                    flexWrap:
                      "wrap",
                  }}
                >
                  {/* HU-019 */}

                  <button
                    onClick={() =>
                      verHistorial(
                        cliente
                      )
                    }
                  >
                    📋 Historial
                  </button>

                  <button
                    onClick={() =>
                      onEditar(
                        cliente
                      )
                    }
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      cambiarEstado(
                        cliente
                      )
                    }
                  >
                    {cliente.activo
                      ? "Dar de baja"
                      : "Dar de alta"}
                  </button>

                  <button
                    onClick={() =>
                      eliminarCliente(
                        cliente.id
                      )
                    }
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ========================================
          HU-019 - HISTORIAL DEL CLIENTE
      ======================================== */}

      {clienteHistorial && (
        <div
          style={{
            marginTop: "30px",
            padding: "22px",
            borderRadius:
              "14px",
            background:
              "#0f172a",
            border:
              "1px solid #334155",
            boxShadow:
              "0 4px 14px rgba(0,0,0,.35)",
          }}
        >
          {/* Encabezado historial */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "20px",
              gap: "15px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                📋 Historial de{" "}
                {
                  clienteHistorial.nombre
                }
              </h2>

              <p
                style={{
                  color:
                    "#94a3b8",
                  marginTop:
                    "5px",
                }}
              >
                Frecuencia y
                comportamiento de
                pedidos del cliente.
              </p>
            </div>

            <button
              onClick={
                cerrarHistorial
              }
            >
              ✕ Cerrar
            </button>
          </div>

          {cargandoHistorial ? (
            <p>
              Cargando historial...
            </p>
          ) : historial ? (
            <>
              {/* ===============================
                  INDICADORES HU-019
              =============================== */}

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",

                  gap: "14px",

                  marginBottom:
                    "25px",
                }}
              >
                {/* Total pedidos */}

                <div
                  style={{
                    padding:
                      "16px",

                    borderRadius:
                      "12px",

                    background:
                      "#1e293b",

                    border:
                      "1px solid #334155",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#94a3b8",

                      fontSize:
                        "13px",
                    }}
                  >
                    Total de pedidos
                  </div>

                  <div
                    style={{
                      fontSize:
                        "28px",

                      fontWeight:
                        "bold",

                      marginTop:
                        "8px",

                      color:
                        "#f8fafc",
                    }}
                  >
                    {
                      historial.totalPedidos
                    }
                  </div>
                </div>

                {/* Promedio garrafones */}

                <div
                  style={{
                    padding:
                      "16px",

                    borderRadius:
                      "12px",

                    background:
                      "#1e293b",

                    border:
                      "1px solid #334155",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#94a3b8",

                      fontSize:
                        "13px",
                    }}
                  >
                    Promedio de
                    garrafones
                  </div>

                  <div
                    style={{
                      fontSize:
                        "28px",

                      fontWeight:
                        "bold",

                      marginTop:
                        "8px",

                      color:
                        "#f8fafc",
                    }}
                  >
                    {historial.promedioGarrafones ??
                      0}
                  </div>
                </div>

                {/* Frecuencia */}

                <div
                  style={{
                    padding:
                      "16px",

                    borderRadius:
                      "12px",

                    background:
                      "#1e293b",

                    border:
                      "1px solid #334155",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#94a3b8",

                      fontSize:
                        "13px",
                    }}
                  >
                    Frecuencia
                    promedio
                  </div>

                  <div
                    style={{
                      fontSize:
                        "20px",

                      fontWeight:
                        "bold",

                      marginTop:
                        "8px",

                      color:
                        "#f8fafc",
                    }}
                  >
                    {historial.frecuenciaPromedioDias >
                    0
                      ? `Cada ${historial.frecuenciaPromedioDias} días`
                      : "Sin datos suficientes"}
                  </div>
                </div>

                {/* Días desde último pedido */}

                <div
                  style={{
                    padding:
                      "16px",

                    borderRadius:
                      "12px",

                    background:
                      "#1e293b",

                    border:
                      "1px solid #334155",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#94a3b8",

                      fontSize:
                        "13px",
                    }}
                  >
                    Días desde último
                    pedido
                  </div>

                  <div
                    style={{
                      fontSize:
                        "28px",

                      fontWeight:
                        "bold",

                      marginTop:
                        "8px",

                      color:
                        "#f8fafc",
                    }}
                  >
                    {historial.diasDesdeUltimoPedido !=
                    null
                      ? historial.diasDesdeUltimoPedido
                      : "Sin pedidos"}
                  </div>
                </div>
              </div>

              {/* ===============================
                  HISTORIAL DE PEDIDOS
              =============================== */}

              <h3>
                Pedidos anteriores
              </h3>

              {historial.pedidos
                ?.length > 0 ? (
                <div
                  style={{
                    overflowX:
                      "auto",
                  }}
                >
                  <table
                    style={{
                      width:
                        "100%",

                      borderCollapse:
                        "collapse",

                      marginTop:
                        "12px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding:
                              "12px",

                            textAlign:
                              "left",

                            borderBottom:
                              "1px solid #334155",

                            color:
                              "#cbd5e1",
                          }}
                        >
                          Fecha
                        </th>

                        <th
                          style={{
                            padding:
                              "12px",

                            textAlign:
                              "left",

                            borderBottom:
                              "1px solid #334155",

                            color:
                              "#cbd5e1",
                          }}
                        >
                          Garrafones
                        </th>

                        <th
                          style={{
                            padding:
                              "12px",

                            textAlign:
                              "left",

                            borderBottom:
                              "1px solid #334155",

                            color:
                              "#cbd5e1",
                          }}
                        >
                          Monto
                        </th>

                        <th
                          style={{
                            padding:
                              "12px",

                            textAlign:
                              "left",

                            borderBottom:
                              "1px solid #334155",

                            color:
                              "#cbd5e1",
                          }}
                        >
                          Método
                        </th>

                        <th
                          style={{
                            padding:
                              "12px",

                            textAlign:
                              "left",

                            borderBottom:
                              "1px solid #334155",

                            color:
                              "#cbd5e1",
                          }}
                        >
                          Estado
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {historial.pedidos.map(
                        (
                          pedido
                        ) => (
                          <tr
                            key={
                              pedido.entregaId
                            }
                          >
                            <td
                              style={{
                                padding:
                                  "12px",

                                borderBottom:
                                  "1px solid #1e293b",

                                color:
                                  "#94a3b8",
                              }}
                            >
                              {pedido.fecha
                                ? new Date(
                                    pedido.fecha
                                  ).toLocaleString(
                                    "es-MX"
                                  )
                                : "-"}
                            </td>

                            <td
                              style={{
                                padding:
                                  "12px",

                                borderBottom:
                                  "1px solid #1e293b",

                                color:
                                  "#94a3b8",
                              }}
                            >
                              {pedido.garrafones ??
                                0}
                            </td>

                            <td
                              style={{
                                padding:
                                  "12px",

                                borderBottom:
                                  "1px solid #1e293b",

                                color:
                                  "#94a3b8",
                              }}
                            >
                              $
                              {Number(
                                pedido.montoCobrado ??
                                  0
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "12px",

                                borderBottom:
                                  "1px solid #1e293b",

                                color:
                                  "#94a3b8",
                              }}
                            >
                              {pedido.metodoCobro ||
                                "-"}
                            </td>

                            <td
                              style={{
                                padding:
                                  "12px",

                                borderBottom:
                                  "1px solid #1e293b",
                              }}
                            >
                              <span
                                style={{
                                  padding:
                                    "4px 10px",

                                  borderRadius:
                                    "999px",

                                  fontSize:
                                    "12px",

                                  background:
                                    pedido.resultado ===
                                    "ENTREGADO"
                                      ? "#14532d"
                                      : "#334155",

                                  color:
                                    pedido.resultado ===
                                    "ENTREGADO"
                                      ? "#bbf7d0"
                                      : "#e2e8f0",
                                }}
                              >
                                {pedido.resultado ||
                                  "-"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    padding:
                      "18px",

                    borderRadius:
                      "10px",

                    background:
                      "#1e293b",

                    color:
                      "#94a3b8",

                    marginTop:
                      "10px",
                  }}
                >
                  Este cliente
                  todavía no tiene
                  pedidos entregados.
                </div>
              )}
            </>
          ) : (
            <p>
              No se encontró
              información del
              historial.
            </p>
          )}
        </div>
      )}

      {/* ========================================
          PAGINACIÓN
      ======================================== */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          disabled={pagina <= 1}
          onClick={() =>
            setPagina((p) =>
              Math.max(
                1,
                p - 1
              )
            )
          }
          style={{
            cursor:
              pagina <= 1
                ? "not-allowed"
                : "pointer",
          }}
        >
          ← Anterior
        </button>

        <span
          style={{
            color:
              "#94a3b8",
          }}
        >
          Página {pagina} de{" "}
          {totalPaginas}
        </span>

        <button
          disabled={
            pagina >= totalPaginas
          }
          onClick={() =>
            setPagina((p) =>
              Math.min(
                totalPaginas,
                p + 1
              )
            )
          }
          style={{
            cursor:
              pagina >=
              totalPaginas
                ? "not-allowed"
                : "pointer",
          }}
        >
          Siguiente →
        </button>
      </div>
    </section>
  );
}

export default Clientes;
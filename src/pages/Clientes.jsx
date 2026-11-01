
import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import ConsultaPuntos from "./ConsultaPuntos";

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

// HU-026: consulta el saldo real de puntos de cada cliente visible.
function SaldoPuntosCliente({ clienteId }) {
  const [saldo, setSaldo] = useState(null);
  const [cargandoSaldo, setCargandoSaldo] = useState(true);
  const [errorSaldo, setErrorSaldo] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargandoSaldo(true);
    setErrorSaldo(false);
    setSaldo(null);

    if (clienteId == null) {
      setCargandoSaldo(false);
      setErrorSaldo(true);
      return () => {
        activo = false;
      };
    }

    api
      .get(`/clientes/${clienteId}/puntos`)
      .then(({ data }) => {
        if (!activo) return;

        const valor = Number(data?.saldo);

        if (data?.saldo == null || !Number.isFinite(valor)) {
          setErrorSaldo(true);
        } else {
          setSaldo(valor);
        }
      })
      .catch((error) => {
        if (!activo) return;
        console.error(
          `Error al consultar puntos del cliente ${clienteId}:`,
          error
        );
        setErrorSaldo(true);
      })
      .finally(() => {
        if (activo) setCargandoSaldo(false);
      });

    return () => {
      activo = false;
    };
  }, [clienteId]);

  return (
    <div
      style={{
        marginTop: "14px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: "#123247",
        border: "1px solid #0e7490",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div>
        <div
          style={{
            color: "#67e8f9",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          ⭐ Saldo de puntos
        </div>

        <small style={{ color: "#94a3b8" }}>
           Programa de recompensas
        </small>
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: "bold",
          color: "#facc15",
          textAlign: "right",
        }}
      >
        {cargandoSaldo
          ? "Consultando..."
          : errorSaldo
          ? "No disponible"
          : `${saldo} pts`}
      </div>
    </div>
  );
}

function Clientes({ onCrear, onEditar }) {
  const [clientes, setClientes] = useState([]);
  const [segmentos, setSegmentos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [letraFiltro, setLetraFiltro] = useState("");
  const [diaFiltro, setDiaFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  const POR_PAGINA = 10;

  useEffect(() => {
    obtenerClientes();
  }, []);

  const obtenerClientes = async () => {
    try {
      setCargando(true);
      const res = await api.get("/clientes");
      setClientes(Array.isArray(res.data) ? res.data : []);
      // La API restringe la consulta de segmentos a ADMIN.
      try {
        const respuesta = await api.get("/clientes/segmentos");
        setSegmentos(Object.fromEntries((respuesta.data || []).map(x => [x.clienteId, x])));
      } catch { setSegmentos({}); }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      alert("No se pudieron cargar los clientes");
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
      console.error("Error al cambiar estado:", error);
      alert("No se pudo cambiar el estado del cliente");
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
      alert("Cliente eliminado correctamente");
      obtenerClientes();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el cliente");
    }
  };

  // Filtros por nombre, domicilio, letra y día.
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
  }, [clientes, busqueda, letraFiltro, diaFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(clientesFiltrados.length / POR_PAGINA)
  );

  const fichaPagina = clientesFiltrados.slice(
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
      {/* Consulta general de puntos */}
      <ConsultaPuntos clientes={clientes} />

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
          <h1>🧑 Clientes</h1>
          <p>Catálogo de clientes registrados.</p>
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

      {/* Buscador */}
      <input
        type="text"
        data-testid="buscar-clientes"
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

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
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
              setLetraFiltro(e.target.value);
              setPagina(1);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
            }}
          >
            <option value="">Todas</option>

            {LETRAS.map((letra) => (
              <option key={letra} value={letra}>
                {letra}
              </option>
            ))}
          </select>
        </div>

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
              setDiaFiltro(e.target.value);
              setPagina(1);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
            }}
          >
            <option value="">Todos</option>

            {DIAS.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de clientes */}
      {fichaPagina.length === 0 ? (
        <p>No hay clientes que coincidan.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {fichaPagina.map((cliente) => (
            <div
              key={cliente.id}
              data-testid="ficha-cliente"
              data-cliente-id={cliente.id}
              style={{
                border:
                  cliente.activo === false
                    ? "2px solid #ef4444"
                    : "1px solid #1e293b",
                borderRadius: "14px",
                padding: "18px",
                background: "#0f172a",
                boxShadow:
                  "0 4px 14px rgba(0,0,0,.35)",
              }}
            >
              {/* Estado del cliente */}
              {cliente.activo === false && (
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: "8px",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    background: "#7f1d1d",
                    color: "#fecaca",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  ⛔ Dado de baja
                </span>
              )}

              {/* Nombre */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "#14532d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  🧑
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      letterSpacing: "2px",
                    }}
                  >
                    MÓDULO
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      color: "#f1f5f9",
                    }}
                  >
                    {cliente.nombre}
                  </h3>
                </div>

                <span
                  style={{
                    marginLeft: "auto",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: cliente.activo === false
                      ? "#ef4444"
                      : "#22c55e",
                  }}
                />
              </div>

              {/* Fotografía */}
              {cliente.fotografiaDomicilio && (
                <img
                  src={`data:image/jpeg;base64,${cliente.fotografiaDomicilio}`}
                  alt="Fotografía del domicilio"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    marginBottom: "10px",
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                />
              )}

              {/* Datos */}
              <p
                style={{
                  color: "#94a3b8",
                  margin: "4px 0",
                }}
              >
                <strong style={{ color: "#cbd5e1" }}>
                  Domicilio:
                </strong>{" "}
                {cliente.domicilio}
              </p>

              <p
                style={{
                  color: "#94a3b8",
                  margin: "4px 0",
                }}
              >
                <strong style={{ color: "#cbd5e1" }}>
                  Google Maps:
                </strong>{" "}
                {cliente.linkGoogleMaps ? (
                  <a
                    href={cliente.linkGoogleMaps}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#60a5fa" }}
                  >
                    Ver en mapa
                  </a>
                ) : (
                  "Sin especificar"
                )}
              </p>

              <p
                style={{
                  color: "#94a3b8",
                  margin: "4px 0",
                }}
              >
                <strong style={{ color: "#cbd5e1" }}>
                  Días:
                </strong>{" "}
                {cliente.diasReparto || "Sin especificar"}
              </p>

              <p
                style={{
                  color: "#94a3b8",
                  margin: "4px 0",
                }}
              >
                <strong style={{ color: "#cbd5e1" }}>
                  Frecuencia:
                </strong>{" "}
                {cliente.frecuencia || "Sin especificar"}
              </p>

              <p
                style={{
                  color: "#94a3b8",
                  margin: "4px 0",
                }}
              >
                <strong style={{ color: "#cbd5e1" }}>
                  Precio:
                </strong>{" "}
                ${cliente.precioPorGarrafon}
              </p>
              {/* HU-023: mostrar el saldo vigente devuelto por la API. */}
              {cliente.saldoPuntos !== null &&
                cliente.saldoPuntos !== undefined &&
                Number.isFinite(Number(cliente.saldoPuntos)) && (
                <p
                  style={{ color: "#94a3b8", margin: "4px 0" }}
                  data-testid="saldo-puntos-ficha"
                >
                  <strong style={{ color: "#cbd5e1" }}>Puntos disponibles:</strong>{" "}
                  {cliente.saldoPuntos}
                </p>
              )}

              <p
                style={{
                  color: "#94a3b8",
                  margin: "4px 0",
                }}
              >
                <strong style={{ color: "#cbd5e1" }}>
                  Garrafón:
                </strong>{" "}
                {cliente.garrafonPreferencia?.nombre ||
                  "Sin especificar"}
              </p>

              {/* HU-036: indicador de segmentación en ficha administrativa */}
              {segmentos[cliente.id] && (
                <div style={{padding:"10px",borderRadius:8,background:"#164e63",color:"#cffafe",marginTop:10}}>
                  <strong>Segmento: {segmentos[cliente.id].segmento.replaceAll("_", " ")}</strong>
                  <div style={{fontSize:12}}>{segmentos[cliente.id].regla}</div>
                </div>
              )}
              {/* HU-026: saldo de puntos del cliente */}
              <SaldoPuntosCliente clienteId={cliente.id} />

              {/* Acciones */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "14px",
                }}
              >
                <button
                  onClick={() => onEditar(cliente)}
                >
                  Editar
                </button>

                <button
                  onClick={() => cambiarEstado(cliente)}
                >
                  {cliente.activo
                    ? "Dar de baja"
                    : "Dar de alta"}
                </button>

                <button
                  onClick={() => eliminarCliente(cliente.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginTop: "20px",
        }}
      >
        <button
          disabled={pagina <= 1}
          onClick={() =>
            setPagina((p) => Math.max(1, p - 1))
          }
          style={{ cursor: "pointer" }}
        >
          ← Anterior
        </button>

        <span style={{ color: "#94a3b8" }}>
          Página {pagina} de {totalPaginas}
        </span>

        <button
          disabled={pagina >= totalPaginas}
          onClick={() =>
            setPagina((p) =>
              Math.min(totalPaginas, p + 1)
            )
          }
          style={{ cursor: "pointer" }}
        >
          Siguiente →
        </button>
      </div>
    </section>
  );
}

export default Clientes;
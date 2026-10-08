import { useEffect, useState } from "react";
import api from "../services/api";

function Cargas({ usuario }) {
  // ============================================
  // ESTADOS
  // ============================================

  const [inventario, setInventario] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [repartidores, setRepartidores] = useState([]);

  const [repartidorId, setRepartidorId] = useState("");

  /**
   * HU-015
   * Filas de garrafones a asignar.
   * Cada fila es un tipo de garrafón con su cantidad.
   * Ejemplo: [{ inventarioId: "1", cantidad: "20" }, { inventarioId: "2", cantidad: "5" }]
   */
  const [filas, setFilas] = useState([
    { inventarioId: "", cantidad: "" },
  ]);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // ============================================
  // CARGAR DATOS AL ENTRAR
  // ============================================

  // (se ejecuta después de declarar cargarDatos)

  // ============================================
  // CARGAR REPARTIDORES, INVENTARIO Y CARGAS
  // ============================================

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const sucursalId = usuario?.sucursalId;

      const [
        inventarioResponse,
        inventarioProductosResponse,
        cargasResponse,
        repartidoresResponse,
      ] = await Promise.all([
        sucursalId
          ? api.get(`/inventario/sucursal/${sucursalId}`)
          : api.get("/inventario"),

        api.get("/inventario/productos"),

        api.get("/cargas"),

        api.get("/usuarios/tipo/4"),
      ]);

      // ========================================
      // INVENTARIO (insumos + productos llenos)
      // ========================================

      const datosInv = inventarioResponse.data;
      const datosProds = inventarioProductosResponse.data;

      let listaInsumos = [];
      if (Array.isArray(datosInv)) {
        listaInsumos = datosInv;
      } else if (Array.isArray(datosInv?.data)) {
        listaInsumos = datosInv.data;
      } else if (Array.isArray(datosInv?.inventario)) {
        listaInsumos = datosInv.inventario;
      }

      let listaProductos = [];
      if (Array.isArray(datosProds)) {
        listaProductos = datosProds;
      } else if (Array.isArray(datosProds?.data)) {
        listaProductos = datosProds.data;
      }

      const listaInventario = [
        ...listaInsumos.map((i) => ({ ...i, _origen: "insumo" })),
        ...listaProductos.map((p) => ({ ...p, _origen: "producto" })),
      ];

      setInventario(listaInventario);

      // ========================================
      // CARGAS
      // ========================================

      const datosCar = cargasResponse.data;

      let listaCargas = [];

      if (Array.isArray(datosCar)) {
        listaCargas = datosCar;
      } else if (Array.isArray(datosCar?.data)) {
        listaCargas = datosCar.data;
      } else if (Array.isArray(datosCar?.cargas)) {
        listaCargas = datosCar.cargas;
      }

      setCargas(listaCargas);

      // ========================================
      // REPARTIDORES
      // ========================================

      const datosRep = repartidoresResponse.data;

      let listaRepartidores = [];

      if (Array.isArray(datosRep)) {
        listaRepartidores = datosRep;
      } else if (Array.isArray(datosRep?.usuarios)) {
        listaRepartidores = datosRep.usuarios;
      } else if (Array.isArray(datosRep?.data)) {
        listaRepartidores = datosRep.data;
      }

      // Solo repartidores activos
      listaRepartidores = listaRepartidores.filter(
        (repartidor) =>
          Number(repartidor.userTipo) === 4 &&
          repartidor.activo !== false
      );

      setRepartidores(listaRepartidores);
    } catch (err) {
      console.error(
        "Error al cargar datos de cargas:",
        err
      );

      console.error(
        "Respuesta del servidor:",
        err.response?.data
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.response?.data?.mensaje ||
          "No se pudieron cargar los datos."
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // CARGAR DATOS AL ENTRAR
  // ============================================

  useEffect(() => {
    cargarDatos();
  }, []);

  // ============================================
  // FILAS DE GARRAFONES
  // ============================================

  const agregarFila = () => {
    setFilas((actual) => [
      ...actual,
      { inventarioId: "", cantidad: "" },
    ]);
  };

  const quitarFila = (index) => {
    setFilas((actual) =>
      actual.filter((_, posicion) => posicion !== index)
    );
  };

  const actualizarFila = (index, campo, valor) => {
    setFilas((actual) =>
      actual.map((fila, posicion) =>
        posicion === index
          ? { ...fila, [campo]: valor }
          : fila
      )
    );
  };

  // ============================================
  // STOCK DISPONIBLE DE UN INVENTARIO
  // ============================================

  const stockDeInventario = (inventarioId) => {
    const item = inventario.find(
      (inv) => String(inv.id) === String(inventarioId)
    );

    return Number(item?.cantidad || 0);
  };

  // ============================================
  // TOTAL DE GARRAFONES DEL FORMULARIO
  // ============================================

  const totalGarrafonesFormulario = filas.reduce(
    (total, fila) => total + (Number(fila.cantidad) || 0),
    0
  );

  // ============================================
  // REGISTRAR CARGAS (VARIOS GARRAFONES)
  // ============================================

  const registrarCarga = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    // ========================================
    // VALIDAR REPARTIDOR
    // ========================================

    if (!repartidorId) {
      setError(
        "Selecciona el repartidor que llevará la carga."
      );

      return;
    }

    // ========================================
    // VALIDAR FILAS
    // ========================================

    if (filas.length === 0) {
      setError(
        "Agrega al menos un garrafón para asignar."
      );

      return;
    }

    for (const fila of filas) {
      if (!fila.inventarioId) {
        setError(
          "Selecciona el tipo de garrafón en todas las filas."
        );

        return;
      }

      if (
        !fila.cantidad ||
        Number(fila.cantidad) <= 0
      ) {
        setError(
          "La cantidad debe ser mayor a cero en todas las filas."
        );

        return;
      }

      if (
        Number(fila.cantidad) >
        stockDeInventario(fila.inventarioId)
      ) {
        setError(
          `Stock insuficiente. Solo hay ${stockDeInventario(
            fila.inventarioId
          )} disponibles de ese garrafón.`
        );

        return;
      }
    }

    // ========================================
    // DATOS PARA LA API
    // ========================================

    const datos = {
      repartidorId: Number(repartidorId),

      items: filas.map((fila) => ({
        inventarioId: Number(fila.inventarioId),
        cantidad: Number(fila.cantidad),
      })),
    };

    console.log(
      "Datos enviados a /cargas/multiple:",
      datos
    );

    try {
      setCargando(true);

      const response = await api.post(
        "/cargas/multiple",
        datos
      );

      console.log(
        "Cargas registradas:",
        response.data
      );

      // ======================================
      // MENSAJE DE ÉXITO
      // ======================================

      const repartidorSeleccionado =
        repartidores.find(
          (repartidor) =>
            String(repartidor.id) ===
            String(repartidorId)
        );

      const tiposAsignados = [
        ...new Set(
          filas.map(
            (fila) =>
              inventario.find(
                (inv) =>
                  String(inv.id) ===
                  String(fila.inventarioId)
              )?.nombre || "garrafón"
          )
        ),
      ].join(", ");

      setMensaje(
        `✅ Se asignaron ${totalGarrafonesFormulario} garrafones (${tiposAsignados}) a ${
          repartidorSeleccionado?.nombre ||
          "el repartidor"
        } correctamente.`
      );

      // ======================================
      // LIMPIAR FORMULARIO
      // ======================================

      setRepartidorId("");
      setFilas([{ inventarioId: "", cantidad: "" }]);

      // ======================================
      // ACTUALIZAR INFORMACIÓN
      // ======================================

      await cargarDatos();
    } catch (err) {
      console.error(
        "Error al registrar cargas:",
        err
      );

      console.error(
        "Respuesta del servidor:",
        err.response?.data
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.response?.data?.mensaje ||
          "No se pudo registrar la carga."
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // FORMATEAR FECHA
  // ============================================

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    try {
      return new Date(
        fecha
      ).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return fecha;
    }
  };

  // ============================================
  // TEXTO DEL ESTADO
  // ============================================

  const obtenerTextoEstado = (
    estado
  ) => {
    if (
      estado ===
      "PENDIENTE"
    ) {
      return "Pendiente de aceptación";
    }

    if (
      estado ===
      "CARGA EN TRÁNSITO"
    ) {
      return "Carga en tránsito";
    }

    if (
      estado ===
      "SIN ASIGNAR"
    ) {
      return "Sin asignar";
    }

    return estado || "Sin estado";
  };

  // ============================================
  // CLASE DEL ESTADO
  // ============================================

  const obtenerClaseEstado = (
    estado
  ) => {
    if (
      estado ===
      "PENDIENTE"
    ) {
      return "estado-pendiente";
    }

    if (
      estado ===
      "CARGA EN TRÁNSITO"
    ) {
      return "estado-transito";
    }

    return "";
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <section className="panel">

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <h1>
          🚰 Cargas de Garrafones
        </h1>

        <p>
          Registra los garrafones que recibirá
          cada repartidor al inicio de su turno.
          Puedes asignar varios tipos de garrafón
          en una misma carga.
        </p>
      </div>

      {/* ========================================
          MENSAJE DE ÉXITO
      ======================================== */}

      {mensaje && (
        <div
          style={{
            padding: "14px",
            marginBottom: "15px",
            borderRadius: "8px",
            background: "#d4edda",
            color: "#155724",
            border:
              "1px solid #c3e6cb",
          }}
        >
          {mensaje}
        </div>
      )}

      {/* ========================================
          MENSAJE DE ERROR
      ======================================== */}

      {error && (
        <div
          style={{
            padding: "14px",
            marginBottom: "15px",
            borderRadius: "8px",
            background: "#f8d7da",
            color: "#721c24",
            border:
              "1px solid #f5c6cb",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* ========================================
          FORMULARIO DE CARGA
      ======================================== */}

      <div
        className="panel"
        style={{
          marginBottom: "30px",
          padding: "25px",
        }}
      >
        <h2>
          📋 Registrar carga inicial
        </h2>

        <p
          style={{
            color: "#666",
            marginBottom: "25px",
          }}
        >
          Selecciona el repartidor y agrega los
          tipos de garrafón con la cantidad que
          llevará al iniciar su ruta.
        </p>

        <form
          onSubmit={
            registrarCarga
          }
        >

          {/* ==================================
              REPARTIDOR
          ================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label>
              <strong>
                🚚 Repartidor
              </strong>
            </label>

            <select
              value={
                repartidorId
              }
              onChange={(e) =>
                setRepartidorId(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px",
              }}
              disabled={
                cargando
              }
              required
            >
              <option value="">
                Selecciona un
                repartidor
              </option>

              {repartidores.map(
                (repartidor) => (
                  <option
                    key={
                      repartidor.id
                    }
                    value={
                      repartidor.id
                    }
                  >
                    {
                      repartidor.nombre
                    }
                    {" - "}
                    {
                      repartidor.email
                    }
                  </option>
                )
              )}
            </select>

            {repartidores.length ===
              0 && (
              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#b02a37",
                }}
              >
                No hay repartidores
                activos disponibles.
              </small>
            )}
          </div>

          {/* ==================================
              GARRAFONES (FILAS)
          ================================== */}

          <label>
            <strong>
              🚰 Garrafones a asignar
            </strong>
          </label>

          <small
            style={{
              display: "block",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            Agrega una fila por cada tipo de
            garrafón (ej. 20 Bonafont y 5 Ciel).
          </small>

          {filas.map((fila, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-end",
                marginBottom: "12px",
                padding: "12px",
                background: "var(--humo)",
                border: "1px solid var(--borde)",
                borderRadius: "8px",
              }}
            >
              {/* TIPO DE GARRAFÓN */}

              <div
                style={{
                  flex: 2,
                }}
              >
                <label>
                  <small>
                    Garrafón {index + 1}
                  </small>
                </label>

                <select
                  value={
                    fila.inventarioId
                  }
                  onChange={(e) =>
                    actualizarFila(
                      index,
                      "inventarioId",
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                  }}
                  disabled={
                    cargando
                  }
                  required
                >
                  <option value="">
                    Selecciona el
                    garrafón
                  </option>

                  {inventario.map(
                    (item) => (
                      <option
                        key={`${item._origen ?? "inv"}-${item.id}`}
                        value={
                          item.id
                        }
                        disabled={
                          Number(
                            item.cantidad ||
                              0
                          ) <= 0
                        }
                      >
                        {
                          item.nombre
                        }
                        {" - "}
                        {
                          item.tipo
                        }
                        {" - Disponible: "}
                        {
                          item.cantidad
                        }
                        {" "}
                        {
                          item.unidadMedida ||
                          ""
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* CANTIDAD */}

              <div
                style={{
                  flex: 1,
                }}
              >
                <label>
                  <small>
                    Cantidad
                  </small>
                </label>

                <input
                  type="number"
                  min="1"
                  max={
                    fila.inventarioId
                      ? stockDeInventario(
                          fila.inventarioId
                        ) ||
                        undefined
                      : undefined
                  }
                  value={
                    fila.cantidad
                  }
                  onChange={(e) =>
                    actualizarFila(
                      index,
                      "cantidad",
                      e.target.value
                    )
                  }
                  placeholder="Ejemplo: 20"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                    boxSizing:
                      "border-box",
                  }}
                  disabled={
                    cargando ||
                    !fila.inventarioId
                  }
                  required
                />
              </div>

              {/* QUITAR FILA */}

              <button
                type="button"
                onClick={() =>
                  quitarFila(index)
                }
                disabled={
                  cargando ||
                  filas.length === 1
                }
                style={{
                  padding:
                    "10px 12px",
                  borderRadius: "6px",
                  border:
                    "1px solid #cbd5e1",
                  background:
                    filas.length === 1
                      ? "#f1f5f9"
                      : "#ffffff",
                  cursor:
                    filas.length === 1
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    filas.length === 1
                      ? 0.5
                      : 1,
                }}
                title="Quitar garrafón"
              >
                ❌
              </button>
            </div>
          ))}

          {/* AGREGAR FILA */}

          <button
            type="button"
            onClick={agregarFila}
            disabled={cargando}
            style={{
              padding: "10px 15px",
              borderRadius: "6px",
              border: "1px dashed #7a4e39",
              background: "transparent",
              color: "#7a4e39",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            ＋ Agregar otro garrafón
          </button>

          {/* TOTAL */}

          <p
            style={{
              marginTop: "12px",
              color: "#666",
              fontSize: "14px",
            }}
          >
            Total de garrafones a asignar:{" "}
            <strong>
              {totalGarrafonesFormulario}
            </strong>
          </p>

          {/* ==================================
              BOTÓN
          ================================== */}

          <button
            type="submit"
            className="btn-glow"
            disabled={
              cargando ||
              inventario.length ===
                0 ||
              repartidores.length ===
                0
            }
            style={{
              marginTop: "15px",
            }}
          >
            <span>
              {cargando
                ? "⏳ Registrando..."
                : "🚰 Asignar carga"}
            </span>
          </button>

        </form>
      </div>

      {/* ========================================
          CARGAS REGISTRADAS
      ======================================== */}

      <div className="panel">

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom:
              "20px",
            gap: "15px",
          }}
        >
          <div>
            <h2>
              📦 Cargas registradas
            </h2>

            <small>
              Historial de cargas
              asignadas a los
              repartidores.
            </small>
          </div>

          <button
            type="button"
            onClick={
              cargarDatos
            }
            disabled={
              cargando
            }
            style={{
              padding:
                "8px 15px",
              borderRadius: "6px",
              border: "none",
              cursor:
                cargando
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            🔄 Actualizar
          </button>
        </div>

        {/* ======================================
            SIN CARGAS
        ====================================== */}

        {cargas.length === 0 ? (
          <p>
            No hay cargas registradas
            todavía.
          </p>
        ) : (
          <div
            style={{
              overflowX:
                "auto",
            }}
          >
            <table>
              <thead>
                <tr>
                  <th>
                    ID
                  </th>

                  <th>
                    Repartidor
                  </th>

                  <th>
                    Garrafón
                  </th>

                  <th>
                    Cantidad
                  </th>

                  <th>
                    Disponible
                  </th>

                  <th>
                    Fecha y hora
                  </th>

                  <th>
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {cargas.map(
                  (carga) => (
                    <tr
                      key={
                        carga.id
                      }
                    >
                      <td>
                        {
                          carga.id
                        }
                      </td>

                      <td>
                        <strong>
                          {carga.repartidorNombre ||
                            carga.repartidor
                              ?.nombre ||
                            "Sin asignar"}
                        </strong>
                      </td>

                      <td>
                        {carga.inventarioNombre ||
                          carga.tipoGarrafon ||
                          carga.inventario
                            ?.nombre ||
                          "Sin especificar"}
                      </td>

                      <td>
                        <strong>
                          {
                            carga.cantidad
                          }
                        </strong>{" "}
                        {carga.unidadMedida ||
                          carga.inventario
                            ?.unidadMedida ||
                          ""}
                      </td>

                      <td>
                        <strong>
                          {carga.cantidadDisponible ??
                            carga.cantidad ??
                            0}
                        </strong>
                      </td>

                      <td>
                        {formatearFecha(
                          carga.fechaHora
                        )}
                      </td>

                      <td>
                        <span
                          className={obtenerClaseEstado(
                            carga.estado
                          )}
                        >
                          {obtenerTextoEstado(
                            carga.estado
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </section>
  );
}

export default Cargas;

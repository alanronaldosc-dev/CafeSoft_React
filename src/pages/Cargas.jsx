import { useEffect, useState } from "react";
import api from "../services/api";

function Cargas({ usuario }) {
  // ============================================
  // ESTADOS
  // ============================================

  const [repartidores, setRepartidores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [cargas, setCargas] = useState([]);

  const [repartidorId, setRepartidorId] = useState("");
  const [inventarioId, setInventarioId] = useState("");
  const [cantidad, setCantidad] = useState("");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // ============================================
  // CARGAR DATOS AL ENTRAR
  // ============================================

  useEffect(() => {
    cargarDatos();
  }, []);

  // ============================================
  // CARGAR REPARTIDORES, INVENTARIO Y CARGAS
  // ============================================

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        repartidoresResponse,
        inventarioResponse,
        cargasResponse,
      ] = await Promise.all([
        api.get("/usuarios/tipo/4"),
        api.get("/inventario"),
        api.get("/cargas"),
      ]);

      console.log(
        "Respuesta repartidores:",
        repartidoresResponse.data
      );

      console.log(
        "Respuesta inventario:",
        inventarioResponse.data
      );

      console.log(
        "Respuesta cargas:",
        cargasResponse.data
      );

      // ========================================
      // REPARTIDORES
      // ========================================
      //
      // La API devuelve:
      //
      // {
      //   mensaje: "...",
      //   cantidad: 1,
      //   usuarios: [...]
      // }
      //
      // Por eso necesitamos obtener .usuarios
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
          repartidor.userTipo === 4 &&
          repartidor.activo !== false
      );

      setRepartidores(listaRepartidores);

      // ========================================
      // INVENTARIO
      // ========================================

      const datosInv = inventarioResponse.data;

      let listaInventario = [];

      if (Array.isArray(datosInv)) {
        listaInventario = datosInv;
      } else if (Array.isArray(datosInv?.data)) {
        listaInventario = datosInv.data;
      } else if (Array.isArray(datosInv?.inventario)) {
        listaInventario = datosInv.inventario;
      }

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
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        "No se pudieron cargar los datos."
      );

    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // INVENTARIO SELECCIONADO
  // ============================================

  const inventarioSeleccionado =
    inventario.find(
      (item) =>
        String(item.id) ===
        String(inventarioId)
    );

  const cantidadDisponible =
    Number(inventarioSeleccionado?.cantidad || 0);

  // ============================================
  // REPARTIDOR SELECCIONADO
  // ============================================

  const repartidorSeleccionado =
    repartidores.find(
      (item) =>
        String(item.id) ===
        String(repartidorId)
    );

  // ============================================
  // REGISTRAR CARGA
  // ============================================

  const registrarCarga = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    // ========================================
    // VALIDACIONES
    // ========================================

    if (!repartidorId) {
      setError(
        "Selecciona un repartidor."
      );
      return;
    }

    if (!inventarioId) {
      setError(
        "Selecciona el tipo de garrafón o inventario."
      );
      return;
    }

    if (
      !cantidad ||
      Number(cantidad) <= 0
    ) {
      setError(
        "La cantidad debe ser mayor a cero."
      );
      return;
    }

    if (
      Number(cantidad) >
      cantidadDisponible
    ) {
      setError(
        `Stock insuficiente. Solo hay ${cantidadDisponible} disponibles.`
      );
      return;
    }

    // ========================================
    // DATOS PARA LA API
    // ========================================

    const datos = {
      repartidorId: Number(repartidorId),
      inventarioId: Number(inventarioId),
      cantidad: Number(cantidad),
    };

    console.log(
      "Datos enviados a /cargas:",
      datos
    );

    try {
      setCargando(true);

      const response =
        await api.post(
          "/cargas",
          datos
        );

      console.log(
        "Carga registrada:",
        response.data
      );

      // ======================================
      // MENSAJE DE ÉXITO
      // ======================================

      setMensaje(
        `✅ Se asignaron ${cantidad} unidades a ${repartidorSeleccionado?.nombre || "el repartidor"}.`
      );

      // ======================================
      // LIMPIAR FORMULARIO
      // ======================================

      setRepartidorId("");
      setInventarioId("");
      setCantidad("");

      // ======================================
      // ACTUALIZAR INFORMACIÓN
      // ======================================

      await cargarDatos();

    } catch (err) {
      console.error(
        "Error al registrar carga:",
        err
      );

      console.error(
        "Respuesta del servidor:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
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
      ).toLocaleString(
        "es-MX",
        {
          dateStyle: "short",
          timeStyle: "short",
        }
      );
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
          Registra la cantidad inicial
          de garrafones entregados a
          cada repartidor al inicio
          de su turno.
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
          FORMULARIO HU-005
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
          Selecciona el repartidor,
          el tipo de garrafón y la
          cantidad que llevará durante
          su ruta.
        </p>

        <form
          onSubmit={registrarCarga}
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
                👤 Repartidor
              </strong>
            </label>

            <select
              value={repartidorId}
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
              disabled={cargando}
            >

              <option value="">
                Selecciona un repartidor
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
                    {repartidor.nombre}
                    {" - "}
                    {repartidor.telefono ||
                      "Sin teléfono"}
                  </option>
                )
              )}

            </select>

            {repartidores.length === 0 && (
              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#b02a37",
                }}
              >
                No hay repartidores
                activos registrados.
              </small>
            )}

          </div>

          {/* ==================================
              INVENTARIO
          ================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >

            <label>
              <strong>
                🚰 Tipo de garrafón /
                inventario
              </strong>
            </label>

            <select
              value={inventarioId}
              onChange={(e) =>
                setInventarioId(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px",
              }}
              disabled={cargando}
            >

              <option value="">
                Selecciona el inventario
              </option>

              {inventario.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    disabled={
                      Number(
                        item.cantidad || 0
                      ) <= 0
                    }
                  >
                    {item.nombre}
                    {" - "}
                    {item.tipo}
                    {" - Disponible: "}
                    {item.cantidad}
                    {" "}
                    {item.unidadMedida || ""}
                  </option>
                )
              )}

            </select>

            {inventario.length === 0 && (
              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#b02a37",
                }}
              >
                No hay registros de
                inventario disponibles.
              </small>
            )}

          </div>

          {/* ==================================
              INFORMACIÓN DEL INVENTARIO
          ================================== */}

          {inventarioSeleccionado && (
            <div
              style={{
                padding: "16px",
                marginBottom: "20px",
                borderRadius: "8px",
                background: "#f5f1ea",
                border:
                  "1px solid #ddd",
              }}
            >

              <strong>
                📦 Inventario seleccionado
              </strong>

              <p
                style={{
                  marginBottom: "5px",
                }}
              >
                <strong>
                  Producto:
                </strong>{" "}
                {
                  inventarioSeleccionado.nombre
                }
              </p>

              <p
                style={{
                  marginBottom: "5px",
                }}
              >
                <strong>
                  Tipo:
                </strong>{" "}
                {
                  inventarioSeleccionado.tipo
                }
              </p>

              <p
                style={{
                  marginBottom: "5px",
                }}
              >
                <strong>
                  Disponible:
                </strong>{" "}
                {cantidadDisponible}{" "}
                {
                  inventarioSeleccionado.unidadMedida
                }
              </p>

              {cantidadDisponible <= 0 && (
                <p
                  style={{
                    color: "#b02a37",
                    marginBottom: 0,
                  }}
                >
                  ⚠️ Este inventario
                  no tiene existencias.
                </p>
              )}

            </div>
          )}

          {/* ==================================
              CANTIDAD
          ================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >

            <label>
              <strong>
                🔢 Cantidad a asignar
              </strong>
            </label>

            <input
              type="number"
              min="1"
              max={
                cantidadDisponible ||
                undefined
              }
              value={cantidad}
              onChange={(e) =>
                setCantidad(
                  e.target.value
                )
              }
              placeholder="Ejemplo: 20"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px",
                boxSizing:
                  "border-box",
              }}
              disabled={
                cargando ||
                !inventarioId
              }
            />

            {inventarioSeleccionado && (
              <small
                style={{
                  display: "block",
                  marginTop: "7px",
                  color: "#666",
                }}
              >
                Máximo disponible:
                {" "}
                <strong>
                  {cantidadDisponible}
                </strong>
              </small>
            )}

          </div>

          {/* ==================================
              BOTÓN
          ================================== */}

          <button
            type="submit"
            disabled={
              cargando ||
              repartidores.length === 0 ||
              inventario.length === 0
            }
            style={{
              padding:
                "12px 25px",
              border: "none",
              borderRadius: "8px",
              cursor:
                cargando
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {cargando
              ? "⏳ Registrando..."
              : "🚰 Asignar carga"}
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
            marginBottom: "20px",
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
            onClick={cargarDatos}
            disabled={cargando}
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
                        {carga.id}
                      </td>

                      <td>
                        <strong>
                          {
                            carga.repartidorNombre ||
                            carga.repartidor?.nombre ||
                            "Sin nombre"
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          carga.inventarioNombre ||
                          carga.tipoGarrafon ||
                          carga.inventario?.nombre ||
                          "Sin especificar"
                        }
                      </td>

                      <td>
                        <strong>
                          {carga.cantidad}
                        </strong>{" "}
                        {
                          carga.unidadMedida ||
                          carga.inventario?.unidadMedida ||
                          ""
                        }
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
import { useEffect, useState } from "react";
import api from "../services/api";

function InventarioAnalisis({ onCrear, usuario }) {
  const [productosInventario, setProductosInventario] = useState([]);
  const [inventarioVacios, setInventarioVacios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarPrediccion, setMostrarPrediccion] = useState(false);
const [prediccion, setPrediccion] = useState(null);
const [cargandoPrediccion, setCargandoPrediccion] = useState(false);
const [errorPrediccion, setErrorPrediccion] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [resProductos, resInventario] = await Promise.all([
          api.get("/inventario/productos"),
          api.get("/inventario"),
        ]);

        if (!activo) return;

        const todosProductos = Array.isArray(resProductos.data)
          ? resProductos.data
          : [];

        const todoInventario = Array.isArray(resInventario.data)
          ? resInventario.data
          : [];

        const productosFiltrados =
          usuario?.userTipo === 0
            ? todosProductos
            : todosProductos.filter(
                (p) =>
                  p.sucursalId == null ||
                  Number(p.sucursalId) === Number(usuario?.sucursalId)
              );

        const normalizar = (valor) =>
          String(valor || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const vacios = todoInventario.filter((item) => {
          const nombre = normalizar(item.nombre);
          const tipo = normalizar(item.tipo);

          const esVacio =
            nombre.includes("vac") ||
            tipo.includes("vac") ||
            nombre.includes("envase") ||
            tipo.includes("envase");

          const esSucursalCorrecta =
            usuario?.userTipo === 0 ||
            item.sucursalId == null ||
            Number(item.sucursalId) === Number(usuario?.sucursalId);

          return esVacio && esSucursalCorrecta;
        });

        setProductosInventario(productosFiltrados);
        setInventarioVacios(vacios);
      } catch (err) {
        console.error("Error al cargar inventario:", err);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [usuario]);

const cargarPrediccion = async () => {
  setMostrarPrediccion(true);
  setCargandoPrediccion(true);
  setErrorPrediccion("");
  setPrediccion(null);

  try {
    const params = {};

    // Los usuarios que no son administradores consultan
    // únicamente la información de su sucursal.
    if (usuario?.userTipo !== 0) {
      if (!usuario?.sucursalId) {
        throw new Error("Tu usuario no tiene una sucursal asociada.");
      }

      params.sucursalId = usuario.sucursalId;
    }

    const respuesta = await api.get(
      "/inventario/prediccion-demanda",
      { params }
    );

    setPrediccion(respuesta.data);
  } catch (error) {
    console.error("Error al obtener la predicción:", error);

    setErrorPrediccion(
      error.response?.data?.message ||
      error.message ||
      "No fue posible obtener la predicción de demanda."
    );
  } finally {
    setCargandoPrediccion(false);
  }
};

const formatearCantidad = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", {
    maximumFractionDigits: 3,
  });

const formatearFecha = (valor) =>
  valor ? String(valor).slice(0, 10) : "—";

  const encabezado = (
    <div style={{
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  justifyContent: "flex-end"
}}>
  <button
    onClick={cargarPrediccion}
    style={{
      padding: "10px 18px",
      cursor: "pointer",
      background: "#2563EB",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "6px",
      fontWeight: "600"
    }}
  >
    📈 Predecir demanda
  </button>

  {onCrear && (
    <button
      onClick={onCrear}
      style={{ padding: "10px 18px", cursor: "pointer" }}
    >
      + Nuevo Insumo
    </button>
  )}
</div>
  );

  if (cargando) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {encabezado}
        <p style={{ color: "var(--texto-suave)" }}>Cargando análisis...</p>
      </div>
    );
  }

  const totalGarrafones = productosInventario.reduce(
    (acc, p) => acc + (Number(p.cantidad) || 0),
    0
  );
  const garrafonesCriticos = productosInventario.filter(
    (p) => (Number(p.cantidad) || 0) === 0
  );
  const garrafonesBajos = productosInventario.filter(
    (p) => (Number(p.cantidad) || 0) > 0 && (Number(p.cantidad) || 0) <= (Number(p.cantidadMinima) || 5)
  );
  const garrafonesNormales = productosInventario.filter(
    (p) => (Number(p.cantidad) || 0) > (Number(p.cantidadMinima) || 5)
  );

  const totalVacios = inventarioVacios.reduce(
    (acc, item) => acc + (Number(item.cantidad) || 0),
    0
  );

  const vaciosCriticos = inventarioVacios.filter(
    (item) => (Number(item.cantidad) || 0) === 0
  );

  const vaciosBajos = inventarioVacios.filter((item) => {
    const cantidad = Number(item.cantidad) || 0;
    const minimo = Number(item.cantidadMinima) || 5;
    return cantidad > 0 && cantidad <= minimo;
  });

  const vaciosNormales = inventarioVacios.filter((item) => {
    const cantidad = Number(item.cantidad) || 0;
    const minimo = Number(item.cantidadMinima) || 5;
    return cantidad > minimo;
  });

  const tarjetaStyle = (color) => ({
    background: "#1A2332",
    border: `1px solid ${color}44`,
    borderRadius: "var(--r-md)",
    padding: "18px 22px",
  });

  const Badge = ({ color, bg, texto }) => (
    <span style={{
      background: bg,
      color,
      border: `1px solid ${color}33`,
      borderRadius: "999px",
      padding: "3px 12px",
      fontSize: "12px",
      fontWeight: "600",
    }}>
      {texto}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {encabezado}

      {mostrarPrediccion && (
        <div style={{
          background: "var(--fondo-card)",
          border: "1px solid var(--borde)",
          borderRadius: "var(--r-md)",
          padding: "20px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "16px"
          }}>
            <div>
              <h2 style={{ margin: 0, color: "var(--texto)" }}>
                📈 Predicción de demanda de insumos
              </h2>
              <p style={{
                color: "var(--texto-suave)",
                fontSize: "13px",
                margin: "6px 0 0"
              }}>
                Estimación basada en el consumo histórico de ventas.
              </p>
            </div>

            <button
              onClick={() => setMostrarPrediccion(false)}
              style={{ padding: "8px 14px", cursor: "pointer" }}
            >
              Cerrar
            </button>
          </div>

          {cargandoPrediccion && (
            <p style={{ color: "var(--texto-suave)" }}>
              Calculando demanda de insumos...
            </p>
          )}

          {!cargandoPrediccion && errorPrediccion && (
            <p style={{ color: "#E05252" }}>
              {errorPrediccion}
            </p>
          )}

          {!cargandoPrediccion && prediccion && (
            <>
              <div style={{
                background: "var(--fondo)",
                border: "1px solid var(--borde)",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "18px"
              }}>
                <p style={{ margin: "0 0 8px", color: "var(--texto)" }}>
                  <strong>Periodo de referencia:</strong>{" "}
                  {formatearFecha(prediccion.inicioPeriodoReferencia)}
                  {" al "}
                  {formatearFecha(prediccion.finPeriodoReferencia)}
                </p>

                <p style={{ margin: 0, color: "var(--texto)" }}>
                  <strong>Periodo de predicción:</strong>{" "}
                  {formatearFecha(prediccion.inicioPeriodoPrediccion)}
                  {" al "}
                  {formatearFecha(prediccion.finPeriodoPrediccion)}
                </p>
              </div>

              {prediccion.insumos?.length > 0 ? (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: "12px",
                    marginBottom: "18px"
                  }}>
                    <div style={tarjetaStyle("#2563EB")}>
                      <p style={{ color: "#8D9DB6", fontSize: "12px" }}>
                        Insumos analizados
                      </p>
                      <p style={{ color: "#2563EB", fontSize: "26px", fontWeight: "800" }}>
                        {prediccion.insumos.length}
                      </p>
                    </div>

                    <div style={tarjetaStyle("#E05252")}>
                      <p style={{ color: "#8D9DB6", fontSize: "12px" }}>
                        Con stock insuficiente
                      </p>
                      <p style={{ color: "#E05252", fontSize: "26px", fontWeight: "800" }}>
                        {prediccion.insumos.filter(
                          (item) => item.estadoStock === "Stock insuficiente"
                        ).length}
                      </p>
                    </div>

                    <div style={tarjetaStyle("#3AC87A")}>
                      <p style={{ color: "#8D9DB6", fontSize: "12px" }}>
                        Con stock suficiente
                      </p>
                      <p style={{ color: "#3AC87A", fontSize: "26px", fontWeight: "800" }}>
                        {prediccion.insumos.filter(
                          (item) => item.estadoStock === "Stock suficiente"
                        ).length}
                      </p>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Insumo</th>
                          <th>Consumo últimos 30 días</th>
                          <th>Promedio diario</th>
                          <th>Stock actual</th>
                          <th>Demanda próximos 30 días</th>
                          <th>Faltante</th>
                          <th>Estado</th>
                        </tr>
                      </thead>

                      <tbody>
                        {prediccion.insumos.map((item) => {
                          const insuficiente =
                            item.estadoStock === "Stock insuficiente";

                          return (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.nombre}</strong>
                                {item.sucursalNombre && (
                                  <div style={{
                                    fontSize: "12px",
                                    color: "var(--texto-suave)"
                                  }}>
                                    {item.sucursalNombre}
                                  </div>
                                )}
                              </td>

                              <td>
                                {formatearCantidad(item.consumoUltimos30Dias)}
                                {" "}{item.unidadMedida}
                              </td>

                              <td>
                                {formatearCantidad(item.promedioDiario)}
                                {" "}{item.unidadMedida}
                              </td>

                              <td>
                                {formatearCantidad(item.stockActual)}
                                {" "}{item.unidadMedida}
                              </td>

                              <td>
                                <strong>
                                  {formatearCantidad(item.demandaSiguiente30Dias)}
                                </strong>
                                {" "}{item.unidadMedida}
                              </td>

                              <td style={{
                                fontWeight: "700",
                                color: insuficiente ? "#E05252" : "#3AC87A"
                              }}>
                                {formatearCantidad(item.faltante)}
                                {" "}{item.unidadMedida}
                              </td>

                              <td>
                                <Badge
                                  color={insuficiente ? "#E05252" : "#3AC87A"}
                                  bg={insuficiente ? "#FEF0EE" : "#E8FEF0"}
                                  texto={item.estadoStock}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p style={{
                  color: "var(--texto-suave)",
                  textAlign: "center",
                  padding: "20px"
                }}>
                  No hay insumos asociados a recetas de productos para realizar la predicción.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── PANEL GARRAFONES VACÍOS (inventario real) ── */}
      <div style={{
        background: "var(--fondo-card)",
        border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)",
        padding: "18px 22px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: 0 }}>
            ♻️ Garrafones Vacíos — Inventario
          </h3>
          <span style={{
            background: "#3AC87A22",
            color: "#3AC87A",
            border: "1px solid #3AC87A44",
            borderRadius: "999px",
            padding: "4px 14px",
            fontSize: "13px",
            fontWeight: "700",
          }}>
            Total: {totalVacios} piezas
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
          <div style={tarjetaStyle("#E05252")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#E05252", marginBottom: "6px" }}>🔴 Sin stock</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#E05252" }}>{vaciosCriticos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>tipos de vacío agotados</p>
          </div>
          <div style={tarjetaStyle("#FF9900")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#FF9900", marginBottom: "6px" }}>🟠 Stock bajo</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#FF9900" }}>{vaciosBajos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bajo mínimo</p>
          </div>
          <div style={tarjetaStyle("#3AC87A")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#3AC87A", marginBottom: "6px" }}>🟢 Stock normal</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#3AC87A" }}>{vaciosNormales.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bien abastecidos</p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--borde)", paddingTop: "14px" }}>
          {inventarioVacios.length === 0 ? (
            <p style={{ color: "var(--texto-suave)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
              No hay inventarios de garrafones vacíos registrados.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Envase vacío</th>
                  <th>Unidad</th>
                  <th>Stock actual</th>
                  <th>Mínimo</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {inventarioVacios.map((item) => {
                  const cantidad = Number(item.cantidad) || 0;
                  const minimo = Number(item.cantidadMinima) || 5;
                  const estado =
                    cantidad === 0
                      ? { label: "Agotado", color: "#E05252", bg: "#FEF0EE" }
                      : cantidad <= minimo
                      ? { label: "Stock bajo", color: "#C8783A", bg: "#FEF3E8" }
                      : { label: "Normal", color: "#3AC87A", bg: "#E8FEF0" };

                  return (
                    <tr key={item.id}>
                      <td><strong>{item.nombre}</strong></td>
                      <td>{item.unidadMedida || "piezas"}</td>
                      <td style={{ fontWeight: "700", color: estado.color }}>{cantidad}</td>
                      <td style={{ color: "var(--texto-suave)" }}>{minimo}</td>
                      <td style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                        {item.sucursalNombre || "—"}
                      </td>
                      <td>
                        <Badge color={estado.color} bg={estado.bg} texto={estado.label} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── PANEL GARRAFONES LLENOS (productos en inventario) ── */}
      <div style={{
        background: "var(--fondo-card)",
        border: "1px solid #0073BB44",
        borderRadius: "var(--r-md)",
        padding: "18px 22px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: 0 }}>
            🚰 Garrafones Llenos — Stock de Productos
          </h3>
          <span style={{
            background: "#0073BB22",
            color: "#0073BB",
            border: "1px solid #0073BB44",
            borderRadius: "999px",
            padding: "4px 14px",
            fontSize: "13px",
            fontWeight: "700",
          }}>
            Total: {totalGarrafones} piezas
          </span>
        </div>

        {/* Tarjetas resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
          <div style={tarjetaStyle("#E05252")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#E05252", marginBottom: "6px" }}>🔴 Sin stock</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#E05252" }}>{garrafonesCriticos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>productos agotados</p>
          </div>
          <div style={tarjetaStyle("#FF9900")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#FF9900", marginBottom: "6px" }}>🟠 Stock bajo</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#FF9900" }}>{garrafonesBajos.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bajo mínimo</p>
          </div>
          <div style={tarjetaStyle("#3AC87A")}>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#3AC87A", marginBottom: "6px" }}>🟢 Stock normal</p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#3AC87A" }}>{garrafonesNormales.length}</p>
            <p style={{ fontSize: "12px", color: "#8D9DB6" }}>bien abastecidos</p>
          </div>
        </div>

        {/* Tabla garrafones llenos */}
        <div style={{ borderTop: "1px solid #0073BB22", paddingTop: "14px" }}>
          {productosInventario.length === 0 ? (
            <p style={{ color: "var(--texto-suave)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
              No hay productos registrados en inventario.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th>Stock actual</th>
                  <th>Mínimo</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productosInventario.map((prod) => {
                  const cant = Number(prod.cantidad) || 0;
                  const min  = Number(prod.cantidadMinima) || 5;
                  const estado =
                    cant === 0
                      ? { label: "Agotado",    color: "#E05252", bg: "#FEF0EE" }
                      : cant <= min
                      ? { label: "Stock bajo", color: "#C8783A", bg: "#FEF3E8" }
                      : { label: "Normal",     color: "#3AC87A", bg: "#E8FEF0" };

                  return (
                    <tr key={prod.id}>
                      <td><strong>{prod.nombre}</strong></td>
                      <td>{prod.unidadMedida || "piezas"}</td>
                      <td style={{ fontWeight: "700", color: estado.color }}>{cant}</td>
                      <td style={{ color: "var(--texto-suave)" }}>{min}</td>
                      <td style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                        {prod.sucursalNombre || "—"}
                      </td>
                      <td>
                        <Badge color={estado.color} bg={estado.bg} texto={estado.label} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}

export default InventarioAnalisis;

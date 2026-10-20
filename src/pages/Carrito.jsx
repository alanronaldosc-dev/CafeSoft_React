import { useEffect, useState } from "react";
import api from "../services/api";

function Carrito({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [puntosSolicitados, setPuntosSolicitados] = useState("");
  const [canjeAplicado, setCanjeAplicado] = useState(null);
  const [errorCanje, setErrorCanje] = useState("");
  const [cotizandoCanje, setCotizandoCanje] = useState(false);

  // NUEVO: nombre de la persona para quien es el pedido.
  const [nombreCliente, setNombreCliente] = useState("");

  // HU-023: cargar los clientes para mostrar el saldo y permitir cotizar canjes.
  // Categorías
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  useEffect(() => {
    api
      .get("/productos")
      .then((res) => setProductos(res.data))
      .catch((error) => {
        console.error("Error al cargar productos:", error);
      });

    api
      .get("/categorias/activas")
      .then((res) => setCategorias(res.data))
      .catch((error) => {
        console.error("Error al cargar categorías:", error);
      });

    api
      .get("/clientes")
      .then((res) => setClientes(Array.isArray(res.data) ? res.data : []))
      .catch((error) => {
        console.error("Error al cargar clientes:", error);
        setErrorCanje("No se pudieron cargar los clientes para el canje.");
      });
  }, []);

  const clienteSeleccionado = clientes.find(
    (cliente) => String(cliente.id) === clienteId
  );
  const saldoPuntos =
    clienteSeleccionado?.saldoPuntos === null ||
    clienteSeleccionado?.saldoPuntos === undefined
      ? Number.NaN
      : Number(clienteSeleccionado.saldoPuntos);
  const puntosDisponibles =
    Number.isFinite(saldoPuntos) && saldoPuntos >= 0 ? saldoPuntos : null;

  // Filtrar productos
  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoriaActiva === null || p.categoriaId === categoriaActiva;

    return coincideBusqueda && coincideCategoria;
  });

  // Agregar producto
  const agregarAlCarrito = (producto) => {
    setCanjeAplicado(null);
    const existe = carrito.find(
      (i) => i.productoId === producto.id
    );

    if (existe) {
      setCarrito(
        carrito.map((i) =>
          i.productoId === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
        },
      ]);
    }
  };

  // Quitar producto
  const quitarDelCarrito = (productoId) => {
    setCanjeAplicado(null);
    setCarrito(
      carrito.filter((i) => i.productoId !== productoId)
    );
  };

  // Cambiar cantidad
  const cambiarCantidad = (productoId, cantidad) => {
    setCanjeAplicado(null);
    if (cantidad <= 0 || isNaN(cantidad)) {
      quitarDelCarrito(productoId);
      return;
    }

    setCarrito(
      carrito.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad }
          : i
      )
    );
  };

  // Totales
  const subtotal = carrito.reduce(
    (sum, i) => sum + i.precio * i.cantidad,
    0
  );

  const impuestos = subtotal * 0.16;

  const totalSinDescuento = subtotal + impuestos;
  const total = Math.max(
    0,
    totalSinDescuento - (canjeAplicado?.descuento || 0)
  );

  // HU-023: pedir al backend la cotización para mantener centralizada la regla de conversión.
  const cotizarCanje = async () => {
    setErrorCanje("");
    setCanjeAplicado(null);

    const puntos = Number(puntosSolicitados);
    if (!clienteSeleccionado) {
      setErrorCanje("Selecciona un cliente para canjear puntos.");
      return;
    }
    if (puntosDisponibles === null) {
      setErrorCanje("La API aún no proporciona el saldo de puntos del cliente.");
      return;
    }
    if (!Number.isInteger(puntos) || puntos <= 0 || puntos > puntosDisponibles) {
      setErrorCanje("Ingresa una cantidad de puntos válida y disponible.");
      return;
    }
    if (carrito.length === 0) {
      setErrorCanje("Agrega productos antes de solicitar el canje.");
      return;
    }

    setCotizandoCanje(true);
    try {
      const res = await api.post(
        `/clientes/${clienteSeleccionado.id}/beneficios/cotizaciones`,
        {
          puntosSolicitados: puntos,
          totalCompra: totalSinDescuento,
        }
      );
      const puntosCanjeados = Number(res.data?.puntosCanjeados);
      const descuento = Number(res.data?.descuento);

      if (
        !Number.isInteger(puntosCanjeados) ||
        puntosCanjeados <= 0 ||
        puntosCanjeados > puntosDisponibles ||
        !Number.isFinite(descuento) ||
        descuento <= 0 ||
        descuento > totalSinDescuento
      ) {
        throw new Error("La API devolvió una cotización de canje inválida.");
      }

      setCanjeAplicado({ puntosCanjeados, descuento });
    } catch (error) {
      console.error("Error al cotizar el canje:", error);
      setErrorCanje(
        error.response?.data?.message ||
          error.message ||
          "No se pudo cotizar el canje de puntos."
      );
    } finally {
      setCotizandoCanje(false);
    }
  };

  const cambio =
    metodoPago === "efectivo" && montoEfectivo
      ? parseFloat(montoEfectivo) - total
      : 0;

  // Procesar venta
  const procesarVenta = async () => {
    // NUEVO: validar nombre
    if (!nombreCliente.trim()) {
      alert("Escribe el nombre de la persona para el pedido");
      return;
    }

    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (
      metodoPago === "efectivo" &&
      (!montoEfectivo ||
        parseFloat(montoEfectivo) < total)
    ) {
      alert("El monto en efectivo es insuficiente");
      return;
    }

    setCargando(true);

    const payload = {
      usuarioId: usuario.id || usuario.idUsuario,

      // NUEVO
      nombreCliente: nombreCliente.trim(),

      metodoPago,

      montoEfectivo:
        metodoPago === "efectivo"
          ? parseFloat(montoEfectivo)
          : null,

      // HU-023: los puntos solo se consumen cuando el backend confirma la venta.
      clienteId: clienteSeleccionado?.id || null,
      puntosCanjeados: canjeAplicado?.puntosCanjeados || 0,
      descuento: canjeAplicado?.descuento || 0,

      detalles: carrito.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precio,
      })),
    };

    console.log("Venta enviada:", payload);

    try {
      const res = await api.post("/ventas", payload);

      setVentaCompletada(res.data);
      if (canjeAplicado && Number.isFinite(Number(res.data?.saldoPuntosRestante))) {
        setClientes((clientesActuales) =>
          clientesActuales.map((cliente) =>
            cliente.id === clienteSeleccionado.id
              ? {
                  ...cliente,
                  saldoPuntos: Number(res.data.saldoPuntosRestante),
                }
              : cliente
          )
        );
      }
      setCanjeAplicado(null);
      setPuntosSolicitados("");

      // Limpiar carrito
      setCarrito([]);
      setMontoEfectivo("");

      // NUEVO: limpiar nombre
      setNombreCliente("");
    } catch (error) {
      console.error("Error al procesar venta:", error);

      if (error.response) {
        alert(
          "Error: " +
            (error.response.data?.message ||
              JSON.stringify(error.response.data))
        );
      } else {
        alert("No se pudo conectar con la API.");
      }
    } finally {
      setCargando(false);
    }
  };

  // Pantalla de venta completada
  if (ventaCompletada) {
    return (
      <section className="panel">
        <h1>✅ Venta Completada</h1>

        <p>
          <strong>Folio:</strong>{" "}
          {ventaCompletada.folio}
        </p>

        <p>
          <strong>Total:</strong> $
          {ventaCompletada.total?.toFixed(2)}
        </p>

        <p>
          <strong>Método de pago:</strong>{" "}
          {ventaCompletada.metodoPago}
        </p>

        {ventaCompletada.nombreCliente && (
          <p>
            <strong>Pedido para:</strong>{" "}
            {ventaCompletada.nombreCliente}
          </p>
        )}

        {ventaCompletada.saldoPuntosRestante !== undefined && (
          <p data-testid="saldo-puntos-restante">
            <strong>Saldo restante de puntos:</strong>{" "}
            {ventaCompletada.saldoPuntosRestante}
          </p>
        )}

        {ventaCompletada.estadoPedido && (
          <p>
            <strong>Estado:</strong>{" "}
            {ventaCompletada.estadoPedido}
          </p>
        )}

        {ventaCompletada.cambio > 0 && (
          <p>
            <strong>Cambio:</strong> $
            {ventaCompletada.cambio?.toFixed(2)}
          </p>
        )}

        <button
          onClick={() => setVentaCompletada(null)}
          style={{ marginTop: "1rem" }}
        >
          Nueva Venta
        </button>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>🛒 Carrito de Compras</h1>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        {/* PANEL IZQUIERDO */}
        <div
          style={{
            flex: 1,
            minWidth: "300px",
          }}
        >
          {/* Buscador */}
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            style={{
              width: "100%",
              marginBottom: "1rem",
            }}
          />

          {/* Categorías */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={() =>
                setCategoriaActiva(null)
              }
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "0.85rem",

                background:
                  categoriaActiva === null
                    ? "var(--cafe-medio)"
                    : "rgba(255,255,255,0.08)",

                color: "var(--beige-claro)",

                border:
                  categoriaActiva === null
                    ? "1px solid var(--beige)"
                    : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              🍽️ Todos
            </button>

            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setCategoriaActiva(cat.id)
                }
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "0.85rem",

                  background:
                    categoriaActiva === cat.id
                      ? "var(--cafe-medio)"
                      : "rgba(255,255,255,0.08)",

                  color:
                    "var(--beige-claro)",

                  border:
                    categoriaActiva === cat.id
                      ? "1px solid var(--beige)"
                      : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                🏷️ {cat.nombre}
              </button>
            ))}
          </div>

          {/* Productos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.5rem",
            }}
          >
            {productosFiltrados.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  agregarAlCarrito(p)
                }
                className="producto-card-carrito"
                data-testid="producto-card"
              >
                {p.imagen ? (
                  <img
                    src={`data:image/jpeg;base64,${p.imagen}`}
                    alt={p.nombre}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      marginBottom: "0.5rem",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      background:
                        "rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      margin: "0 auto 0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      fontSize: "28px",
                    }}
                  >
                    ☕
                  </div>
                )}

                <p
                  style={{
                    fontWeight: "bold",
                    margin: 0,
                    color:
                      "var(--beige-claro)",
                  }}
                >
                  {p.nombre}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: "var(--beige)",
                  }}
                >
                  ${p.precio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div style={{ width: "320px" }}>
          <h2>Orden</h2>

          {carrito.length === 0 ? (
            <p
              style={{
                color:
                  "rgba(245,241,234,0.45)",
              }}
            >
              Sin productos
            </p>
          ) : (
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {carrito.map((i) => (
                  <tr key={i.productoId}>
                    <td>{i.nombre}</td>

                    <td>
                      <input
                        type="number"
                        min="1"
                        value={i.cantidad}
                        onChange={(e) =>
                          cambiarCantidad(i.productoId, parseInt(e.target.value))
                        }
                        style={{
                          width: "50px",
                        }}
                      />
                    </td>

                    <td>
                      $
                      {(
                        i.precio *
                        i.cantidad
                      ).toFixed(2)}
                    </td>

                    <td>
                      <button
                        onClick={() =>
                          quitarDelCarrito(
                            i.productoId
                          )
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr />

          <p>
            Subtotal: $
            {subtotal.toFixed(2)}
          </p>

          <p>
            IVA (16%): $
            {impuestos.toFixed(2)}
          </p>

          <p>
            <strong>
              Total: $
              <span data-testid="total-venta">{total.toFixed(2)}</span>
            </strong>
          </p>

          <section aria-labelledby="canje-puntos-titulo">
            <h3 id="canje-puntos-titulo">Canje de puntos</h3>
            <label htmlFor="cliente-fidelizacion">Cliente</label>
            <select
              id="cliente-fidelizacion"
              data-testid="cliente-fidelizacion"
              value={clienteId}
              onChange={(event) => {
                setClienteId(event.target.value);
                setCanjeAplicado(null);
                setPuntosSolicitados("");
                setErrorCanje("");
              }}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            >
              <option value="">Selecciona un cliente</option>
              {clientes
                .filter((cliente) => cliente.activo !== false)
                .map((cliente) => (
                  <option
                    key={cliente.id}
                    value={cliente.id}
                    data-saldo-puntos={cliente.saldoPuntos}
                  >
                    {cliente.nombre} —{" "}
                    {cliente.saldoPuntos !== null &&
                    cliente.saldoPuntos !== undefined &&
                    Number.isFinite(Number(cliente.saldoPuntos))
                      ? `${cliente.saldoPuntos} puntos`
                      : "saldo no disponible"}
                  </option>
                ))}
            </select>

            {clienteSeleccionado && (
              <>
                <p data-testid="saldo-puntos">
                  Saldo disponible:{" "}
                  {puntosDisponibles === null
                    ? "No disponible"
                    : `${puntosDisponibles} puntos`}
                </p>
                {puntosDisponibles === null && (
                  <p role="alert">
                    La API debe incluir saldoPuntos para habilitar el canje.
                  </p>
                )}
                <label htmlFor="puntos-a-canjear">Puntos a canjear</label>
                <input
                  id="puntos-a-canjear"
                  data-testid="puntos-a-canjear"
                  type="number"
                  min="1"
                  max={puntosDisponibles ?? undefined}
                  step="1"
                  value={puntosSolicitados}
                  onChange={(event) => {
                    setPuntosSolicitados(event.target.value);
                    setCanjeAplicado(null);
                    setErrorCanje("");
                  }}
                  style={{ width: "100%", marginBottom: "0.5rem" }}
                />
                <button
                  type="button"
                  data-testid="aplicar-canje"
                  onClick={cotizarCanje}
                  disabled={
                    cotizandoCanje ||
                    puntosDisponibles === null ||
                    !puntosDisponibles ||
                    carrito.length === 0
                  }
                  style={{ width: "100%" }}
                >
                  {cotizandoCanje
                    ? "Cotizando canje..."
                    : "Aplicar Descuento / Canjear Beneficio"}
                </button>
              </>
            )}

            {canjeAplicado && (
              <p role="status" data-testid="canje-aplicado">
                Descuento aplicado: ${canjeAplicado.descuento.toFixed(2)} por{" "}
                {canjeAplicado.puntosCanjeados} puntos. El saldo se actualizará
                al completar el cobro.
              </p>
            )}
            {errorCanje && (
              <p role="alert" data-testid="error-canje">
                {errorCanje}
              </p>
            )}
          </section>

          {/* NUEVO CAMPO */}
          <label>
            Nombre para el pedido
          </label>

          <input
            type="text"
            placeholder="Ej. Uriel"
            value={nombreCliente}
            onChange={(e) =>
              setNombreCliente(
                e.target.value
              )
            }
            style={{
              width: "100%",
              marginBottom: "0.8rem",
            }}
          />

          {/* Método de pago */}
          <label>Método de pago</label>

          <select
            data-testid="metodo-pago"
            value={metodoPago}
            onChange={(e) =>
              setMetodoPago(e.target.value)
            }
            style={{
              width: "100%",
              marginBottom: "0.5rem",
            }}
          >
            <option value="efectivo">
              Efectivo
            </option>

            <option value="tarjeta">
              Tarjeta
            </option>
          </select>

          {/* Efectivo */}
          {metodoPago === "efectivo" && (
            <>
              <label>
                Monto recibido
              </label>

              <input
                type="number"
                step="0.01"
                value={montoEfectivo}
                onChange={(e) =>
                  setMontoEfectivo(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  marginBottom: "0.5rem",
                }}
              />

              {montoEfectivo &&
                parseFloat(
                  montoEfectivo
                ) >= total && (
                  <p
                    style={{
                      color:
                        "var(--beige)",
                    }}
                  >
                    Cambio: $
                    {cambio.toFixed(2)}
                  </p>
                )}
            </>
          )}

          {/* COBRAR */}
          <button
            onClick={procesarVenta}
            data-testid="cobrar-venta"
            disabled={
              cargando ||
              carrito.length === 0
            }
            style={{
              width: "100%",
              marginTop: "0.5rem",
            }}
          >
            {cargando
              ? "Procesando..."
              : "💳 Cobrar"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default Carrito;
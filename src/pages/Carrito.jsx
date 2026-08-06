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

  // Reemplazar el useEffect actual:
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null); // null = todos

  useEffect(() => {
    api.get("/productos").then((res) => setProductos(res.data));
    api.get("/categorias/activas").then((res) => setCategorias(res.data)).catch(() => {});
  }, []);

  // Reemplazar productosFiltrados:
  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === null || p.categoriaId === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });


  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((i) => i.productoId === producto.id);
    if (existe) {
      setCarrito(carrito.map((i) =>
        i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      setCarrito([...carrito, {
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
      }]);
    }
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito(carrito.filter((i) => i.productoId !== productoId));
  };

  const cambiarCantidad = (productoId, cantidad) => {
    if (cantidad <= 0) { quitarDelCarrito(productoId); return; }
    setCarrito(carrito.map((i) =>
      i.productoId === productoId ? { ...i, cantidad } : i
    ));
  };

  const subtotal = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const impuestos = subtotal * 0.16;
  const total = subtotal + impuestos;
  const cambio = metodoPago === "efectivo" && montoEfectivo
    ? parseFloat(montoEfectivo) - total : 0;

  const procesarVenta = async () => {
    if (carrito.length === 0) { alert("El carrito está vacío"); return; }
    if (metodoPago === "efectivo" && (!montoEfectivo || parseFloat(montoEfectivo) < total)) {
      alert("El monto en efectivo es insuficiente"); return;
    }

    setCargando(true);
    const payload = {
      usuarioId: usuario.id || usuario.idUsuario,
      metodoPago,
      montoEfectivo: metodoPago === "efectivo" ? parseFloat(montoEfectivo) : null,
      descuento: 0,
      detalles: carrito.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precio,
      })),
    };

    try {
      const res = await api.post("/ventas", payload);
      setVentaCompletada(res.data);
      setCarrito([]);
      setMontoEfectivo("");
    } catch (error) {
      if (error.response) {
        alert("Error: " + (error.response.data?.message || JSON.stringify(error.response.data)));
      } else {
        alert("No se pudo conectar con la API.");
      }
    } finally {
      setCargando(false);
    }
  };

  if (ventaCompletada) {
    return (
      <section className="panel">
        <h1>✅ Venta Completada</h1>
        <p><strong>Folio:</strong> {ventaCompletada.folio}</p>
        <p><strong>Total:</strong> ${ventaCompletada.total?.toFixed(2)}</p>
        <p><strong>Método de pago:</strong> {ventaCompletada.metodoPago}</p>
        {ventaCompletada.cambio > 0 && (
          <p><strong>Cambio:</strong> ${ventaCompletada.cambio?.toFixed(2)}</p>
        )}
        <button onClick={() => setVentaCompletada(null)} style={{ marginTop: "1rem" }}>
          Nueva Venta
        </button>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>🛒 Carrito de Compras</h1>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>

        {/* Panel izquierdo — productos */}
        <div style={{ flex: 1, minWidth: "300px" }}>
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          {/* Filtro de categorías */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <button
              onClick={() => setCategoriaActiva(null)}
              style={{
                padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem",
                background: categoriaActiva === null ? "var(--cafe-medio)" : "rgba(255,255,255,0.08)",
                color: "var(--beige-claro)",
                border: categoriaActiva === null ? "1px solid var(--beige)" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              🍽️ Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem",
                  background: categoriaActiva === cat.id ? "var(--cafe-medio)" : "rgba(255,255,255,0.08)",
                  color: "var(--beige-claro)",
                  border: categoriaActiva === cat.id ? "1px solid var(--beige)" : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                🏷️ {cat.nombre}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem" }}>
          {productosFiltrados.map((p) => (
            <div key={p.id}
              onClick={() => agregarAlCarrito(p)}
              className="producto-card-carrito">
              {p.imagen ? (
                <img
                  src={`data:image/jpeg;base64,${p.imagen}`}
                  alt={p.nombre}
                  style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", marginBottom: "0.5rem" }}
                />
              ) : (
                <div style={{ width: "80px", height: "80px",
                  background: "rgba(255,255,255,0.08)", borderRadius: "10px",
                  margin: "0 auto 0.5rem", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px" }}>
                  ☕
                </div>
              )}
              <p style={{ fontWeight: "bold", margin: 0, color: "var(--beige-claro)" }}>{p.nombre}</p>
              <p style={{ margin: 0, color: "var(--beige)" }}>${p.precio}</p>
            </div>
          ))}

          </div>
        </div>

        {/* Panel derecho — carrito */}
        <div style={{ width: "320px" }}>
          <h2>Orden</h2>
          {carrito.length === 0 ? (
            <p style={{ color: "rgba(245,241,234,0.45)" }}>Sin productos</p>
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
                      <input type="number" min="1" value={i.cantidad}
                        onChange={(e) => cambiarCantidad(i.productoId, parseInt(e.target.value))}
                        style={{ width: "50px" }} />
                    </td>
                    <td>${(i.precio * i.cantidad).toFixed(2)}</td>
                    <td><button onClick={() => quitarDelCarrito(i.productoId)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr />
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>IVA (16%): ${impuestos.toFixed(2)}</p>
          <p><strong>Total: ${total.toFixed(2)}</strong></p>

          <label>Método de pago</label>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
          </select>

          {metodoPago === "efectivo" && (
            <>
              <label>Monto recibido</label>
              <input type="number" step="0.01" value={montoEfectivo}
                onChange={(e) => setMontoEfectivo(e.target.value)}
                style={{ width: "100%", marginBottom: "0.5rem" }} />
              {montoEfectivo && parseFloat(montoEfectivo) >= total && (
                <p style={{ color: "var(--beige)" }}>Cambio: ${cambio.toFixed(2)}</p>
              )}
            </>
          )}

          <button onClick={procesarVenta} disabled={cargando || carrito.length === 0}
            style={{ width: "100%", marginTop: "0.5rem" }}>
            {cargando ? "Procesando..." : "💳 Cobrar"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default Carrito;

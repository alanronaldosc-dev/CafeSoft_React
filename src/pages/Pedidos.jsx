import { useEffect, useState } from "react";
import api from "../services/api";

function Pedidos() {

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = async () => {
    try {

      const res = await api.get(
        "/ventas/pedidos/pendientes"
      );

      setPedidos(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (error) {

      console.error(error);
      alert("No se pudieron cargar los pedidos");

    } finally {

      setCargando(false);

    }
  };

  useEffect(() => {

    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos();
    }, 5000);

    return () => clearInterval(intervalo);

  }, []);


  const entregarPedido = async (id) => {

    try {

      await api.put(
        `/ventas/${id}/entregar`
      );

      // Quitarlo inmediatamente
      setPedidos(
        pedidos.filter(
          (pedido) => pedido.id !== id
        )
      );

    } catch (error) {

      console.error(error);

      alert(
        "No se pudo marcar el pedido como entregado"
      );

    }

  };


  if (cargando) {
    return (
      <section className="panel">
        <h1>🍽️ Pedidos</h1>
        <p>Cargando pedidos...</p>
      </section>
    );
  }


  return (

    <section className="panel">

      <h1>🍽️ Pedidos pendientes</h1>

      {pedidos.length === 0 ? (

        <p>No hay pedidos pendientes.</p>

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem"
          }}
        >

          {pedidos.map((pedido) => (

            <div
              key={pedido.id}
              className="panel"
              style={{
                padding: "1.2rem"
              }}
            >

              <h2>
                🧾 {pedido.folio}
              </h2>

              <p>
                👤 <strong>Cliente:</strong>{" "}
                {pedido.nombreCliente}
              </p>

              <p>
                🕒{" "}
                {new Date(
                  pedido.fecha
                ).toLocaleString()}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                ⏳ {pedido.estadoPedido}
              </p>

              <hr />

              <h3>Productos</h3>

              {pedido.detalles?.map(
                (detalle) => (

                  <div
                    key={detalle.id}
                    style={{
                      marginBottom: "10px"
                    }}
                  >

                    <strong>
                      {detalle.cantidad} x{" "}
                      {detalle.productoNombre}
                    </strong>

                    <br />

                    <span>
                      ${detalle.precioUnitario?.toFixed(2)}
                      {" c/u"}
                    </span>

                    <br />

                    <span>
                      Subtotal: $
                      {detalle.subtotal?.toFixed(2)}
                    </span>

                  </div>

                )
              )}

              <hr />

              <p>
                Subtotal: $
                {pedido.subtotal?.toFixed(2)}
              </p>

              <p>
                IVA: $
                {pedido.impuestos?.toFixed(2)}
              </p>

              <h3>
                Total: $
                {pedido.total?.toFixed(2)}
              </h3>

              <p>
                Pago: {pedido.metodoPago}
              </p>

              <p>
                Cajero: {pedido.usuarioNombre}
              </p>

              <button
                onClick={() =>
                  entregarPedido(pedido.id)
                }
                style={{
                  width: "100%",
                  marginTop: "1rem"
                }}
              >

                ✅ Marcar como entregado

              </button>

            </div>

          ))}

        </div>

      )}

    </section>

  );
}

export default Pedidos;
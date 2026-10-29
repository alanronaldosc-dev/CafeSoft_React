
import { useState } from "react";
import api from "../services/api";

// HU-026: saldo calculado por servidor.
// No existe opción de edición manual.
export default function ConsultaPuntos({ clientes = [] }) {
  const [id, setId] = useState("");
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  const consultar = async () => {
    setError("");
    setDatos(null);

    if (!id) return;

    try {
      const respuesta = await api.get(`/clientes/${id}/puntos`);
      setDatos(respuesta.data);
    } catch (errorConsulta) {
      console.error("Error al consultar puntos:", errorConsulta);
      setError("No fue posible consultar los puntos.");
    }
  };

  return (
    <div
      style={{
        padding: 16,
        margin: "16px 0",
        border: "1px solid #ddd",
        borderRadius: 10,
      }}
    >
      <h3>HU-026 · Bonificaciones del cliente</h3>

      <select
        value={id}
        onChange={(e) => {
          setId(e.target.value);
          setDatos(null);
          setError("");
        }}
        aria-label="Cliente para consultar puntos"
      >
        <option value="">Selecciona un cliente</option>

        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nombre}
          </option>
        ))}
      </select>{" "}

      <button
        type="button"
        onClick={consultar}
        disabled={!id}
      >
        Consultar saldo
      </button>

      {error && <p role="alert">{error}</p>}

      {datos && (
        <div>
          <p>
            <strong>
              {datos.nombre}: {datos.saldo} puntos
            </strong>
          </p>

          <small>
            1 punto por garrafón comprado.
            Saldo de solo lectura.
          </small>

          <ul>
            {datos.movimientos?.map((movimiento) => (
              <li key={movimiento.ventaId}>
                Venta #{movimiento.ventaId}: +{movimiento.puntos} puntos
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

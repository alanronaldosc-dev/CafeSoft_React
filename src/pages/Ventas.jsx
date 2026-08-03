import { useEffect, useState } from "react";
import api from "../services/api";

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get("/ventas")
      .then((res) => setVentas(Array.isArray(res.data) ? res.data : []))
      .catch(() => alert("No se pudieron cargar las ventas"))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="panel">
      <h1>🧾 Ventas</h1>
      {cargando ? <p>Cargando...</p> : ventas.length === 0 ? <p>No hay ventas registradas.</p> : (
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>IVA</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Cambio</th>
              <th>Cajero</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id}>
                <td>{v.folio}</td>
                <td>{new Date(v.fecha).toLocaleString()}</td>
                <td>${v.subtotal?.toFixed(2)}</td>
                <td>${v.impuestos?.toFixed(2)}</td>
                <td><strong>${v.total?.toFixed(2)}</strong></td>
                <td>{v.metodoPago}</td>
                <td>{v.cambio != null ? `$${v.cambio.toFixed(2)}` : "—"}</td>
                <td>{v.usuarioNombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Ventas;

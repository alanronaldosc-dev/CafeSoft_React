import { useEffect, useState } from "react";
import api from "../services/api";

function Ventas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    obtenerVentas();
  }, []);

  const obtenerVentas = async () => {
    try {
      const res = await api.get("/ventas");
      setVentas(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="panel">
      <h1>🧾 Ventas</h1>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Total</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {ventas.map((venta) => (
            <tr key={venta.idVenta}>
              <td>{venta.idVenta}</td>
              <td>${venta.total}</td>
              <td>{venta.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Ventas;
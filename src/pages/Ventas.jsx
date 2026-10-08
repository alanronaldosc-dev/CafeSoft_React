import { useEffect, useState } from "react";
import api from "../services/api";

function Ventas({ usuario }) {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarVentas();
  }, [usuario]);

  const cargarVentas = async () => {
      console.log("usuario completo:", usuario);
  console.log("sucursalId:", usuario?.sucursalId);
  console.log("tipo:", typeof usuario?.sucursalId);
    try {
      const sucursalId = usuario?.sucursalId;

      if (!sucursalId) {
        setError("Tu cuenta no tiene una sucursal asignada. Contacta al administrador.");
        setCargando(false);
        return;
      }

      const res = await api.get("/ventas");
      const todas = Array.isArray(res.data) ? res.data : [];

      const filtradas = todas.filter((v) => Number(v.sucursalId) === Number(sucursalId));

      setVentas(filtradas);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las ventas.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="panel">
      <h1>🧾 Ventas</h1>

      {error && (
        <p style={{ color: "#E05252", marginBottom: "1rem" }}>⚠️ {error}</p>
      )}

      {cargando ? (
        <p>Cargando...</p>
      ) : ventas.length === 0 ? (
        <p>No hay ventas registradas para esta sucursal.</p>
      ) : (
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
              <th>Sucursal</th>
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
                <td>{v.sucursalNombre || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Ventas;

import { useEffect, useState } from "react";
import api from "../services/api";

const CAUSAS = [
  { value: "FUGA", label: "Fuga" },
  { value: "ROTURA", label: "Rotura" },
  { value: "DANO_EN_ROSCA", label: "Daño en rosca" },
  { value: "CONTAMINACION", label: "Contaminación" },
  { value: "OTRO", label: "Otro" },
];

function MermaGarrafon() {
  const [cargas, setCargas] = useState([]);
  const [mermas, setMermas] = useState([]);

  const [formulario, setFormulario] = useState({
    cargaId: "",
    cantidad: "",
    causa: "",
    observaciones: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [respuestaCargas, respuestaMermas] = await Promise.all([
        api.get("/cargas"),
        api.get("/mermas"),
      ]);

      const cargasEnTransito = respuestaCargas.data.filter(
        (carga) =>
          carga.estado === "CARGA EN TRÁNSITO" ||
          carga.estado === "CARGA EN TRANSITO"
      );

      setCargas(cargasEnTransito);
      setMermas(respuestaMermas.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const registrarMerma = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (
      !formulario.cargaId ||
      !formulario.cantidad ||
      !formulario.causa
    ) {
      setError("Completa los campos obligatorios.");
      return;
    }

    if (Number(formulario.cantidad) <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    try {
      setCargando(true);

      await api.post("/mermas", {
        cargaId: Number(formulario.cargaId),
        cantidad: Number(formulario.cantidad),
        causa: formulario.causa,
        observaciones: formulario.observaciones.trim(),
      });

      setMensaje("Merma registrada correctamente.");

      setFormulario({
        cargaId: "",
        cantidad: "",
        causa: "",
        observaciones: "",
      });

      await cargarDatos();
    } catch (err) {
      console.error(err);

      const mensajeServidor =
        err.response?.data?.message ||
        err.response?.data?.error;

      setError(
        mensajeServidor ||
          "No fue posible registrar la merma."
      );
    } finally {
      setCargando(false);
    }
  };

  const mostrarCausa = (causa) => {
    const encontrada = CAUSAS.find(
      (item) => item.value === causa
    );

    return encontrada ? encontrada.label : causa;
  };

  return (
    <div className="merma-container">
      <h2>Merma de Garrafón</h2>

      <p>
        Registra los garrafones que sufrieron daños o fugas durante
        la operación.
      </p>

      {mensaje && (
        <div className="mensaje-exito">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mensaje-error">
          {error}
        </div>
      )}

      <form onSubmit={registrarMerma}>
        <div>
          <label htmlFor="cargaId">Carga del repartidor *</label>

          <select
            id="cargaId"
            name="cargaId"
            value={formulario.cargaId}
            onChange={handleChange}
            required
          >
            <option value="">
              Selecciona una carga
            </option>

            {cargas.map((carga) => (
              <option key={carga.id} value={carga.id}>
                Carga #{carga.id} -{" "}
                {carga.repartidorNombre || "Repartidor"} -{" "}
                {carga.cantidad} garrafones
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cantidad">
            Cantidad dañada *
          </label>

          <input
            id="cantidad"
            type="number"
            name="cantidad"
            min="1"
            step="1"
            value={formulario.cantidad}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="causa">Causa *</label>

          <select
            id="causa"
            name="causa"
            value={formulario.causa}
            onChange={handleChange}
            required
          >
            <option value="">
              Selecciona una causa
            </option>

            {CAUSAS.map((causa) => (
              <option
                key={causa.value}
                value={causa.value}
              >
                {causa.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="observaciones">
            Observaciones
          </label>

          <textarea
            id="observaciones"
            name="observaciones"
            rows="3"
            maxLength="255"
            value={formulario.observaciones}
            onChange={handleChange}
            placeholder="Describe el daño si es necesario"
          />
        </div>

        <button type="submit" disabled={cargando}>
          {cargando
            ? "Registrando..."
            : "Registrar merma"}
        </button>
      </form>

      <hr />

      <h3>Historial de mermas</h3>

      {mermas.length === 0 ? (
        <p>No hay mermas registradas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Carga</th>
                <th>Repartidor</th>
                <th>Garrafón</th>
                <th>Cantidad</th>
                <th>Causa</th>
                <th>Observaciones</th>
              </tr>
            </thead>

            <tbody>
              {mermas.map((merma) => (
                <tr key={merma.id}>
                  <td>
                    {merma.fechaHora
                      ? new Date(
                          merma.fechaHora
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td>#{merma.cargaId}</td>

                  <td>
                    {merma.repartidorNombre || "-"}
                  </td>

                  <td>
                    {merma.tipoGarrafon ||
                      merma.inventarioNombre ||
                      "-"}
                  </td>

                  <td>{merma.cantidad}</td>

                  <td>
                    {mostrarCausa(merma.causa)}
                  </td>

                  <td>
                    {merma.observaciones || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MermaGarrafon;
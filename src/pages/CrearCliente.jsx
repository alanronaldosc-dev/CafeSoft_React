import { useEffect, useState } from "react";
import api from "../services/api";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function CrearCliente({ onVolver }) {
  const [form, setForm] = useState({
    nombre: "",
    domicilio: "",
    linkGoogleMaps: "",
    frecuencia: "",
    precioPorGarrafon: "",
    garrafonPreferenciaId: "",
    fotografiaDomicilioBase64: "",
  });
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const res = await api.get("/productos");
      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const cambiarCampo = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const cambiarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result || "").toString().split(",")[1] || "";
      setForm({ ...form, fotografiaDomicilioBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const toggleDia = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const guardarCliente = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.domicilio.trim()) {
      alert("Completa los campos obligatorios");
      return;
    }

    if (diasSeleccionados.length === 0) {
      alert("Selecciona al menos un día de reparto");
      return;
    }

    const payload = {
      nombre: form.nombre,
      domicilio: form.domicilio,
      linkGoogleMaps: form.linkGoogleMaps,
      diasReparto: diasSeleccionados.join(","),
      frecuencia: form.frecuencia,
      precioPorGarrafon: parseFloat(form.precioPorGarrafon) || 0,
      garrafonPreferencia: form.garrafonPreferenciaId
        ? { id: parseInt(form.garrafonPreferenciaId) }
        : null,
      fotografiaDomicilio: form.fotografiaDomicilioBase64 || null,
    };

    try {
      setGuardando(true);
      await api.post("/clientes", payload);
      alert("Cliente registrado correctamente");
      if (onVolver) onVolver();
    } catch (error) {
      console.error("Error al registrar cliente:", error);
      alert("No se pudo registrar el cliente");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="panel">
      <h1>🧑 Registrar cliente</h1>
      <p>Ingresa la información del cliente.</p>

      <form
        onSubmit={guardarCliente}
        style={{
          display: "grid",
          gap: "15px",
          maxWidth: "600px",
          marginTop: "20px",
        }}
      >
        <div>
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={cambiarCampo}
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div>
          <label>Domicilio</label>
          <textarea
            name="domicilio"
            value={form.domicilio}
            onChange={cambiarCampo}
            placeholder="Dirección del cliente"
            rows="3"
          />
        </div>

        <div>
          <label>Link de Google Maps</label>
          <input
            type="text"
            name="linkGoogleMaps"
            value={form.linkGoogleMaps}
            onChange={cambiarCampo}
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div>
          <label>Días de reparto</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
            {DIAS.map((dia) => (
              <label key={dia} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="checkbox"
                  checked={diasSeleccionados.includes(dia)}
                  onChange={() => toggleDia(dia)}
                />
                {dia}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Frecuencia</label>
          <select name="frecuencia" value={form.frecuencia} onChange={cambiarCampo}>
            <option value="">Selecciona...</option>
            <option value="Diaria">Diaria</option>
            <option value="Semanal">Semanal</option>
            <option value="Quincenal">Quincenal</option>
            <option value="Mensual">Mensual</option>
          </select>
        </div>

        <div>
          <label>Precio por garrafón</label>
          <input
            type="number"
            name="precioPorGarrafon"
            value={form.precioPorGarrafon}
            onChange={cambiarCampo}
            placeholder="Ej. 25"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label>Garrafón de preferencia</label>
          <select
            name="garrafonPreferenciaId"
            value={form.garrafonPreferenciaId}
            onChange={cambiarCampo}
          >
            <option value="">Selecciona...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Fotografía del domicilio</label>
          <input type="file" accept="image/*" onChange={cambiarFoto} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cliente"}
          </button>
          {onVolver && (
            <button type="button" onClick={onVolver}>
              Volver
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default CrearCliente;

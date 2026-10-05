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

function EditarCliente({ cliente, onVolver }) {
  const [form, setForm] = useState({
    nombre: cliente?.nombre || "",
    domicilio: cliente?.domicilio || "",
    linkGoogleMaps: cliente?.linkGoogleMaps || "",
    frecuencia: cliente?.frecuencia || "",
    precioPorGarrafon: cliente?.precioPorGarrafon || "",
    garrafonPreferenciaId: cliente?.garrafonPreferencia?.id || "",
    fotografiaDomicilioBase64: "",
  });
  const [diasSeleccionados, setDiasSeleccionados] = useState(
    cliente?.diasReparto ? cliente.diasReparto.split(",") : []
  );
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

  const guardarCambios = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.domicilio.trim()) {
      alert("Completa los campos obligatorios");
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
      await api.put(`/clientes/${cliente.id}`, payload);
      alert("Cliente actualizado correctamente");
      if (onVolver) onVolver();
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      alert("No se pudo actualizar el cliente");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="panel">
      <h1>✏️ Editar cliente</h1>

      <form
        onSubmit={guardarCambios}
        style={{
          display: "grid",
          gap: "15px",
          maxWidth: "600px",
          marginTop: "20px",
        }}
      >
        <div>
          <label>Nombre</label>
          <input type="text" name="nombre" value={form.nombre} onChange={cambiarCampo} />
        </div>

        <div>
          <label>Domicilio</label>
          <textarea name="domicilio" value={form.domicilio} onChange={cambiarCampo} rows="3" />
        </div>

        <div>
          <label>Link de Google Maps</label>
          <input type="text" name="linkGoogleMaps" value={form.linkGoogleMaps} onChange={cambiarCampo} />
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
            {guardando ? "Guardando..." : "Guardar cambios"}
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

export default EditarCliente;

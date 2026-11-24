import { useState } from "react";
import api from "../services/api";
import "./CombinacionesFrecuentes.css";

// Regla HU-055: porcentaje sugerido segun tickets de la combinacion.
function descuentoSugerido(tickets) {
  if (tickets >= 21) return 25;
  if (tickets >= 11) return 20;
  if (tickets >= 6) return 15;
  if (tickets >= 3) return 10;
  return 5;
}
function fechaLocal(fecha) {
  const d = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
function mensajeError(e) {
  return e?.response?.data?.mensaje || e?.response?.data?.message ||
    e?.response?.data?.error || "No se pudo guardar la promoción.";
}

export default function CombinacionesFrecuentes() {
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [minSupport, setMinSupport] = useState(2);
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [consultado, setConsultado] = useState(false);
  const [seleccion, setSeleccion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: "", descuento: 5, fechaInicio: "", fechaFin: "" });

  async function consultar(e) {
    e.preventDefault(); setError(""); setCargando(true);
    try {
      const { data } = await api.get("/analitica/combinaciones", { params: {
        ...(inicio ? { inicio } : {}), ...(fin ? { fin } : {}), minSupport: Number(minSupport), limite: 10
      }});
      setDatos(Array.isArray(data) ? data : []); setConsultado(true);
    } catch (e) { setError(mensajeError(e)); }
    finally { setCargando(false); }
  }
  function abrirPromocion(combo) {
    const nombres = combo.productos.map(p => p.nombre).join(" + ");
    const ahora = new Date();
    const finVigencia = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
    setSeleccion(combo);
    setForm({ nombre: `Combo: ${nombres}`.slice(0, 100),
      descuento: descuentoSugerido(combo.frecuencia),
      fechaInicio: fechaLocal(ahora), fechaFin: fechaLocal(finVigencia) });
    setError(""); setMensaje("");
  }
  async function guardarPromocion(e) {
    e.preventDefault();
    if (!seleccion || guardando) return;
    const descuento = Number(form.descuento);
    if (!Number.isFinite(descuento) || descuento <= 0 || descuento > 25) {
      setError("El descuento debe estar entre 0.01% y 25%."); return;
    }
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin ||
        new Date(form.fechaFin) <= new Date(form.fechaInicio)) {
      setError("Completa el nombre y las fechas de vigencia correctamente."); return;
    }
    const ids = seleccion.productos.map(p => Number(p.id));
    if (ids.length < 2 || ids.some(id => !Number.isInteger(id) || id <= 0)) {
      setError("La combinación no contiene IDs de productos válidos."); return;
    }
    setGuardando(true); setError("");
    try {
      await api.post("/promociones", {
        nombre: form.nombre.trim(),
        descripcion: `Combo HU-055: ${seleccion.productos.map(p => p.nombre).join(" + ")}. Frecuencia: ${seleccion.frecuencia} tickets.`,
        descuentoPorcentaje: descuento,
        fechaInicio: `${form.fechaInicio}:00`, fechaFin: `${form.fechaFin}:00`,
        productosComboIds: ids, minGarrafones: 0, acumulaPuntos: true
      });
      setSeleccion(null);
      setMensaje("Promoción de combo creada y activada. Consulta su vigencia en Administración de promociones.");
    } catch (e) { setError(mensajeError(e)); }
    finally { setGuardando(false); }
  }
  return <section className="combinaciones-panel">
    <h2>Combinaciones frecuentes de productos</h2>
    <p>Identifica qué productos se compran juntos y crea promociones con descuento sugerido según la cantidad de tickets.</p>
    <form onSubmit={consultar} className="combinaciones-filtros">
      <label>Desde<input aria-label="Fecha inicial" type="date" value={inicio} onChange={e=>setInicio(e.target.value)} /></label>
      <label>Hasta<input aria-label="Fecha final" type="date" value={fin} min={inicio||undefined} onChange={e=>setFin(e.target.value)} /></label>
      <label>Soporte mínimo (tickets)<input aria-label="Soporte mínimo" type="number" min="1" value={minSupport} onChange={e=>setMinSupport(e.target.value)} required /></label>
      <button type="submit" disabled={cargando}>{cargando?"Consultando...":"Consultar combinaciones"}</button>
    </form>
    {error && <p role="alert" className="combinaciones-error">{error}</p>}
    {mensaje && <p role="status" className="combinaciones-exito">{mensaje}</p>}
    {consultado && !cargando && (datos.length ? <div className="combinaciones-tabla"><table>
      <thead><tr><th>Posición</th><th>Productos comprados juntos</th><th>Frecuencia</th><th>Soporte</th><th>Descuento sugerido</th><th>Acciones</th></tr></thead>
      <tbody>{datos.map((c,i)=><tr key={c.productos.map(p=>p.id).join("-")}>
        <td>{i+1}</td><td>{c.productos.map(p=>p.nombre).join(" + ")}</td>
        <td>{c.frecuencia} tickets</td><td>{Number(c.soporte).toFixed(1)}%</td>
        <td><strong>{descuentoSugerido(c.frecuencia)}%</strong></td>
        <td><button type="button" className="combinaciones-accion" onClick={()=>abrirPromocion(c)}>Crear promoción</button></td>
      </tr>)}</tbody>
    </table></div> : <p>No hay combinaciones con los filtros seleccionados.</p>)}
    {seleccion && <div className="combinaciones-modal-fondo" role="presentation">
      <div className="combinaciones-modal" role="dialog" aria-modal="true" aria-label="Crear promoción de combo">
        <h3>Crear promoción del combo</h3>
        <p><strong>Productos:</strong> {seleccion.productos.map(p=>p.nombre).join(" + ")}</p>
        <p><strong>Frecuencia:</strong> {seleccion.frecuencia} tickets</p>
        <form onSubmit={guardarPromocion} className="combinaciones-form-promo">
          <label>Nombre de promoción<input maxLength="100" required value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label>
          <label>Descuento (%) — sugerido: {descuentoSugerido(seleccion.frecuencia)}%<input type="number" min="0.01" max="25" step="0.01" required value={form.descuento} onChange={e=>setForm({...form,descuento:e.target.value})}/></label>
          <label>Inicio<input type="datetime-local" required value={form.fechaInicio} onChange={e=>setForm({...form,fechaInicio:e.target.value})}/></label>
          <label>Fin<input type="datetime-local" required min={form.fechaInicio} value={form.fechaFin} onChange={e=>setForm({...form,fechaFin:e.target.value})}/></label>
          <div className="combinaciones-modal-acciones">
            <button type="button" className="combinaciones-cancelar" onClick={()=>{setSeleccion(null);setError("");}} disabled={guardando}>Cancelar</button>
            <button type="submit" className="combinaciones-accion" disabled={guardando}>{guardando?"Guardando...":"Activar promoción"}</button>
          </div>
        </form>
        {error && <p role="alert" className="combinaciones-error">{error}</p>}
      </div>
    </div>}
  </section>;
}

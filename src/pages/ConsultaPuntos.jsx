import { useState } from "react";
import api from "../services/api";
// HU-026: saldo calculado por servidor; no existe opción de edición manual.
export default function ConsultaPuntos({ clientes = [] }) {
 const [id,setId]=useState(""); const [datos,setDatos]=useState(null); const [error,setError]=useState("");
 const consultar=async()=>{setError("");setDatos(null);if(!id)return;try{const r=await api.get(`/clientes/${id}/puntos`);setDatos(r.data);}catch(e){setError("No fue posible consultar los puntos.");}};
 return <div style={{padding:16,margin:"16px 0",border:"1px solid #ddd",borderRadius:10}}>
 <h3>HU-026 · Bonificaciones del cliente</h3>
 <select value={id} onChange={e=>{setId(e.target.value);setDatos(null)}} aria-label="Cliente para consultar puntos"><option value="">Selecciona un cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>{" "}
 <button type="button" onClick={consultar} disabled={!id}>Consultar saldo</button>
 {error&&<p role="alert">{error}</p>}{datos&&<div><p><strong>{datos.nombre}: {datos.saldo} puntos</strong></p><small>1 punto por garrafón comprado. Saldo de solo lectura.</small><ul>{datos.movimientos?.map(m=><li key={m.ventaId}>Venta #{m.ventaId}: +{m.puntos} puntos</li>)}</ul></div>}
 </div>;
}
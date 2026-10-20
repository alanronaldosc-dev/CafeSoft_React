import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function esActivo(iso) {
  if (!iso) return false;
  try {
    return new Date(iso).getTime() > Date.now() - 5 * 60 * 1000;
  } catch { return false; }
}

function crearIcono(activo) {
  const color = activo ? "#22c55e" : "#ef4444";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;background:${color};
      border:3px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,.45);
      display:flex;align-items:center;justify-content:center;font-size:15px;
    ">🚐</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function formatearFecha(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  } catch { return iso; }
}

function ControlCentro({ centro }) {
  const map = useMap();
  useEffect(() => {
    if (centro) map.flyTo(centro, 15, { duration: 1.2 });
  }, [centro, map]);
  return null;
}

export default function MonitorVehiculos() {
  const [posiciones, setPosiciones] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [ruta, setRuta] = useState([]);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const intervaloRef = useRef(null);
  const abortRef = useRef(null);
  const abortRutaRef = useRef(null);

  const cargarPosiciones = async (silencioso = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    if (!silencioso) setCargando(true);
    try {
      const res = await api.get("/traccar/positions", { signal: abortRef.current.signal });
      setPosiciones(Array.isArray(res.data) ? res.data : []);
      setError(null);
      setUltimaActualizacion(new Date());
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      setError(err.response?.data?.error || "Sistema de rastreo no disponible");
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  const cargarRuta = async (traccarDeviceId) => {
    if (abortRutaRef.current) abortRutaRef.current.abort();
    abortRutaRef.current = new AbortController();
    setCargandoRuta(true);
    setRuta([]);
    try {
      const res = await api.get(`/traccar/route/${traccarDeviceId}`, {
        signal: abortRutaRef.current.signal,
      });
      const puntos = (Array.isArray(res.data) ? res.data : [])
        .filter((p) => p.latitude && p.longitude)
        .map((p) => [p.latitude, p.longitude]);
      setRuta(puntos);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      setRuta([]);
    } finally {
      setCargandoRuta(false);
    }
  };

  useEffect(() => {
    cargarPosiciones();
    intervaloRef.current = setInterval(() => cargarPosiciones(true), 10000);
    return () => {
      clearInterval(intervaloRef.current);
      if (abortRef.current) abortRef.current.abort();
      if (abortRutaRef.current) abortRutaRef.current.abort();
    };
  }, []);

  const seleccionarRepartidor = (deviceId) => {
    if (seleccionado === deviceId) {
      setSeleccionado(null);
      setMapaVisible(false);
      setRuta([]);
    } else {
      setSeleccionado(deviceId);
      setMapaVisible(true);
      cargarRuta(deviceId);
    }
  };

  const posSeleccionada = posiciones.find((p) => p.traccarDeviceId === seleccionado);
  const centroCamara = posSeleccionada
    ? [posSeleccionada.latitude, posSeleccionada.longitude]
    : null;

  return (
    <section className="panel">

      {/* ENCABEZADO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>📍 Monitor de Vehículos</h1>
          <p style={{ color: "var(--texto-suave)", margin: "4px 0 0", fontSize: "13px" }}>
            Actualización cada 10 s
            {ultimaActualizacion && ` · ${ultimaActualizacion.toLocaleTimeString("es-MX")}`}
          </p>
        </div>
        <button onClick={() => cargarPosiciones()} style={{ padding: "8px 16px", cursor: "pointer" }}>
          🔄 Actualizar
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{
          background: "#2D1A1A", border: "1px solid #ef4444",
          borderRadius: "10px", padding: "14px 18px", marginBottom: "16px", color: "#ef4444",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* LISTA DE REPARTIDORES */}
      {!cargando && !error && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          {posiciones.length === 0 && (
            <p style={{ color: "var(--texto-suave)" }}>No hay vehículos con posición activa.</p>
          )}
          {posiciones.map((pos) => {
            const activo = esActivo(pos.deviceTime);
            const sel = seleccionado === pos.traccarDeviceId;
            return (
              <div
                key={pos.traccarDeviceId ?? pos.id}
                onClick={() => seleccionarRepartidor(pos.traccarDeviceId)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 18px", borderRadius: "12px",
                  border: `2px solid ${sel ? (activo ? "#22c55e" : "#ef4444") : "var(--borde)"}`,
                  background: sel ? "rgba(34,197,94,.08)" : "var(--fondo-card)",
                  cursor: "pointer", transition: "all .2s", minWidth: "220px",
                }}
              >
                <div style={{
                  width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0,
                  background: activo ? "#22c55e" : "#ef4444",
                  boxShadow: activo ? "0 0 8px #22c55e" : "none",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "700", color: "var(--texto)", fontSize: "14px" }}>
                    {pos.repartidorNombre || "Repartidor"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--texto-suave)" }}>
                    {activo ? "🟢 En línea" : "🔴 Sin señal"} · {(pos.speed ?? 0).toFixed(1)} km/h
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--texto-suave)" }}>
                    {formatearFecha(pos.deviceTime)}
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "var(--texto-suave)" }}>
                  {sel ? "▲ ocultar" : "▼ ver mapa"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {cargando && <p style={{ color: "var(--texto-suave)", marginBottom: "16px" }}>Cargando posiciones...</p>}

      {/* MAPA DESPLEGABLE */}
      {mapaVisible && posSeleccionada && (
        <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid var(--borde)" }}>

          {/* Barra de info */}
          <div style={{
            padding: "10px 16px", background: "var(--fondo-card)",
            borderBottom: "1px solid var(--borde)",
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
          }}>
            <div style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: esActivo(posSeleccionada.deviceTime) ? "#22c55e" : "#ef4444",
            }} />
            <strong style={{ color: "var(--texto)" }}>{posSeleccionada.repartidorNombre}</strong>
            <span style={{ color: "var(--texto-suave)", fontSize: "13px" }}>
              💨 {(posSeleccionada.speed ?? 0).toFixed(1)} km/h
              &nbsp;·&nbsp;
              📍 {posSeleccionada.latitude.toFixed(5)}, {posSeleccionada.longitude.toFixed(5)}
              &nbsp;·&nbsp;
              🕐 {formatearFecha(posSeleccionada.deviceTime)}
            </span>
            {cargandoRuta && (
              <span style={{ fontSize: "12px", color: "var(--texto-suave)" }}>⏳ Cargando trayecto...</span>
            )}
            {!cargandoRuta && ruta.length > 0 && (
              <span style={{ fontSize: "12px", color: "#60a5fa" }}>
                🛣️ {ruta.length} puntos del trayecto de hoy
              </span>
            )}
          </div>

          <MapContainer
            center={[posSeleccionada.latitude, posSeleccionada.longitude]}
            zoom={15}
            style={{ height: "450px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Sigue al repartidor en tiempo real */}
            <ControlCentro centro={centroCamara} />

            {/* Línea del trayecto recorrido hoy */}
            {ruta.length > 1 && (
              <Polyline
                positions={ruta}
                pathOptions={{ color: "#3B82F6", weight: 3, opacity: 0.75, dashArray: "6 4" }}
              />
            )}

            {/* Punto de inicio del trayecto */}
            {ruta.length > 0 && (
              <Marker
                position={ruta[0]}
                icon={L.divIcon({
                  className: "",
                  html: `<div style="
                    width:20px;height:20px;background:#F59E0B;
                    border:2px solid white;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    font-size:10px;
                  ">🏁</div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              >
                <Popup>Inicio del trayecto</Popup>
              </Marker>
            )}

            {/* Posición actual */}
            <Marker
              position={[posSeleccionada.latitude, posSeleccionada.longitude]}
              icon={crearIcono(esActivo(posSeleccionada.deviceTime))}
            >
              <Popup>
                <strong>{posSeleccionada.repartidorNombre}</strong><br />
                {(posSeleccionada.speed ?? 0).toFixed(1)} km/h<br />
                {formatearFecha(posSeleccionada.deviceTime)}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </section>
  );
}

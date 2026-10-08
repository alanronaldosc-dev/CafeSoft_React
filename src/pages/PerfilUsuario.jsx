import api from "../services/api";
import { useEffect, useState } from "react";

const ROLES = {
  0: { label: "Administrador", color: "#FF9900", bg: "#1A1500", icon: "👑" },
  1: { label: "Empleado",      color: "#4A9FD4", bg: "#0D1E2B", icon: "🧑‍💼" },
  2: { label: "Cliente",       color: "#3AC87A", bg: "#0D2B1A", icon: "🙋" },
  3: { label: "Personalizado", color: "#9B7AC8", bg: "#1A0D2B", icon: "⚙️" },
};

function PerfilUsuario({ usuario, onVolver, esPropio = false, tema, toggleTema }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // El objeto del login usa "idUsuario", el DTO de la lista usa "id"
    const id = usuario?.idUsuario ?? usuario?.id ?? null;

    if (!id) {
      // No hay ID — usar directamente lo que llegó
      setDatos(usuario);
      setCargando(false);
      return;
    }

    api
      .get(`/usuarios/${id}`)
      .then((res) => {
        // El endpoint GET /usuarios/{id} devuelve { mensaje, usuario }
        const datosApi = res.data?.usuario ?? res.data;
        setDatos(datosApi);
      })
      .catch(() => {
        // Si falla la API, usar el objeto que ya tenemos
        setDatos(usuario);
      })
      .finally(() => setCargando(false));
  }, [usuario]);

  // El DTO usa "id", el modelo del login usa "idUsuario"
  const idMostrar = datos?.id ?? datos?.idUsuario;
  const rol = ROLES[datos?.userTipo] ?? ROLES[1];
  const iniciales = datos?.nombre
    ? datos.nombre.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  if (cargando) {
    return (
      <section className="panel" style={{ textAlign: "center", padding: "60px" }}>
        <p style={{ color: "var(--texto-suave)", fontSize: "15px" }}>Cargando perfil...</p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ maxWidth: "680px", margin: "0 auto" }}>

      <button
        onClick={onVolver}
        style={{
          width: "auto",
          background: "transparent",
          color: "var(--texto-suave)",
          border: "1px solid var(--borde)",
          borderRadius: "var(--r-sm)",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: "500",
          marginBottom: "28px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        ← Volver
      </button>

      {/* Cabecera */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          padding: "28px",
          background: "var(--fondo)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--borde)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, var(--cafe-medio), var(--caramelo))",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px",
            fontWeight: "800",
            flexShrink: 0,
            boxShadow: "0 6px 20px rgba(0,115,187,0.35)",
          }}
        >
          {iniciales}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--texto)", margin: "0 0 6px" }}>
            {datos?.nombre ?? "—"}
          </h2>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: rol.bg,
              color: rol.color,
              border: `1px solid ${rol.color}33`,
              borderRadius: "999px",
              padding: "4px 14px",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {rol.icon} {rol.label}
          </span>
          {esPropio && (
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--texto-suave)" }}>
              Este es tu perfil
            </p>
          )}
        </div>
      </div>

      {/* Tarjetas de datos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {[
          { icon: "✉️", label: "Correo electrónico", valor: datos?.email },
          { icon: "📱", label: "Teléfono",           valor: datos?.telefono },
          { icon: "📍", label: "Dirección",           valor: datos?.direccion },
          { icon: "🪪", label: "ID de usuario",       valor: idMostrar },
          {
            icon: "🔘",
            label: "Estado",
            valor: datos?.activo !== undefined && datos?.activo !== null
              ? (datos.activo ? "Activo" : "Inactivo")
              : "—",
            valorColor: datos?.activo ? "#3AC87A" : "#E05252",
          },
        ].map(({ icon, label, valor, valorColor }) => (
          <div
            key={label}
            style={{
              background: "var(--fondo-card)",
              border: "1px solid var(--borde)",
              borderRadius: "var(--r-md)",
              padding: "18px 20px",
            }}
          >
            <p style={{
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: "var(--texto-suave)",
              marginBottom: "6px",
            }}>
              {icon} {label}
            </p>
            <p style={{
              fontSize: "15px",
              fontWeight: "600",
              color: valorColor ?? "var(--texto)",
              wordBreak: "break-word",
            }}>
              {valor != null && valor !== "" ? String(valor) : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Permisos — solo tipo 3 */}
      {datos?.userTipo === 3 && datos?.permisos?.length > 0 && (
        <div style={{
          marginTop: "14px",
          background: "var(--fondo-card)",
          border: "1px solid var(--borde)",
          borderRadius: "var(--r-md)",
          padding: "18px 20px",
        }}>
          <p style={{
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: "var(--texto-suave)",
            marginBottom: "10px",
          }}>
            ⚙️ Permisos asignados
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {datos.permisos.map((p) => (
              <span
                key={p}
                style={{
                  background: "var(--fondo)",
                  border: "1px solid var(--borde)",
                  borderRadius: "999px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  color: "var(--texto-medio)",
                  fontWeight: "500",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Toggle de tema — solo visible en perfil propio ── */}
      {esPropio && toggleTema && (
        <div style={{
          marginTop: "14px",
          background: "var(--fondo-card)",
          border: "1px solid var(--borde)",
          borderRadius: "var(--r-md)",
          padding: "24px 20px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}>
          <p style={{
            margin: "0 0 16px",
            fontSize: "11px", fontWeight: "700",
            letterSpacing: "0.5px", textTransform: "uppercase",
            color: "var(--texto-suave)", alignSelf: "flex-start",
          }}>
            🎨 Apariencia
          </p>

          {/* Antorcha 3D */}
          <label className="torch-container" title={`Cambiar a tema ${tema === "oscuro" ? "claro" : "oscuro"}`}>
            <input
              type="checkbox"
              checked={tema === "claro"}
              onChange={toggleTema}
            />
            <div className="torch">
              <div className="torch-head">
                <div className="torch-face torch-top">
                  <div /><div /><div /><div />
                </div>
                <div className="torch-face torch-left">
                  <div /><div /><div /><div />
                </div>
                <div className="torch-face torch-right">
                  <div /><div /><div /><div />
                </div>
              </div>
              <div className="torch-stick">
                <div className="torch-side torch-side-left">
                  {Array.from({ length: 16 }).map((_, i) => <div key={i} />)}
                </div>
                <div className="torch-side torch-side-right">
                  {Array.from({ length: 16 }).map((_, i) => <div key={i} />)}
                </div>
              </div>
            </div>
            <span className="torch-label">
              {tema === "oscuro" ? "Tema oscuro" : "Tema claro"}
            </span>
          </label>
        </div>
      )}
    </section>
  );
}

export default PerfilUsuario;

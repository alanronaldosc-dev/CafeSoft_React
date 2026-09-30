import { useEffect, useState } from "react";
import api from "../services/api";
import PerfilUsuario from "./PerfilUsuario";

function Usuarios({ usuario }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioPerfil, setUsuarioPerfil] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    try {
      const sucursalId = usuario?.sucursalId;

      if (!sucursalId) {
        setError("Tu cuenta no tiene una sucursal asignada. Contacta al administrador.");
        setUsuarios([]);
        return;
      }

      // Todos ven solo su sucursal, sin excepción
      const res = await api.get(`/usuarios/sucursal/${sucursalId}`);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.usuarios ?? [];

      setUsuarios(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios.");
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/usuarios/${id}/estado`, { activo: nuevoEstado });
      obtenerUsuarios();
    } catch (err) {
      console.error(err);
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.telefono?.includes(search)
  );

  if (usuarioPerfil) {
    return (
      <PerfilUsuario
        usuario={usuarioPerfil}
        onVolver={() => setUsuarioPerfil(null)}
      />
    );
  }

  return (
    <section className="panel">
      <h1>👥 Usuarios</h1>

      {error && (
        <p style={{ color: "#E05252", marginBottom: "1rem" }}>⚠️ {error}</p>
      )}

      <input
        type="text"
        placeholder="Buscar usuario por nombre o teléfono"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Sucursal</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.telefono}</td>
              <td>
                {u.userTipo === 0 && "👑 Administrador"}
                {u.userTipo === 1 && "👔 Usuario"}
                {u.userTipo === 2 && "👤 Cliente"}
                {u.userTipo === 3 && "⚙️ Personalizado"}
                {u.userTipo === 4 && "🛵 Repartidor"}
              </td>
              <td>{u.sucursalNombre || "—"}</td>
              <td>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: u.activo ? "#E8FEF0" : "#FEE8E8",
                    color: u.activo ? "#3AC87A" : "#E05252",
                    border: `1px solid ${u.activo ? "#3AC87A33" : "#E0525233"}`,
                  }}
                >
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setUsuarioPerfil(u)}
                    style={{
                      width: "auto",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: "var(--fondo)",
                      color: "var(--texto-medio)",
                      border: "1px solid var(--borde)",
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    👤 Ver perfil
                  </button>
                  <button
                    onClick={() => cambiarEstado(u.id, !u.activo)}
                    style={{
                      width: "auto",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: u.activo ? "#FEE8E8" : "#E8FEF0",
                      color: u.activo ? "#E05252" : "#3AC87A",
                      border: `1px solid ${u.activo ? "#E0525233" : "#3AC87A33"}`,
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    {u.activo ? "Suspender" : "Reactivar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Usuarios;

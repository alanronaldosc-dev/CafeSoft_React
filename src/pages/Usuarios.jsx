// ============================================
// HU-004 - REGISTRO Y CONSULTA DE CLIENTES
// Permite registrar clientes y consultar su
// información con buscador en tiempo real
// por nombre o teléfono.
// ============================================

import { useEffect, useState } from "react";
import api from "../services/api";
import PerfilUsuario from "./PerfilUsuario";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioPerfil, setUsuarioPerfil] = useState(null);
  const [search, setSearch] = useState(""); // agregado HU-004

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/usuarios/${id}/estado`, { activo: nuevoEstado });
      obtenerUsuarios();
    } catch (error) {
      console.log(error);
    }
  };

  // Filtrado HU-004
  const usuariosFiltrados = usuarios.filter((usuario) =>
    usuario.nombre.toLowerCase().includes(search.toLowerCase()) ||
    usuario.telefono.includes(search)
  );

  // Si hay un usuario seleccionado, muestra su perfil
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

      {/* Buscador HU-004 */}
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
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {usuariosFiltrados.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.id}</td>
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{usuario.telefono}</td>
              <td>
                {usuario.userTipo === 0 && "👑 Administrador"}
                {usuario.userTipo === 1 && "👔 Usuario"}
                {usuario.userTipo === 2 && "👤 Cliente"}
                {usuario.userTipo === 3 && "⚙️ Personalizado"}
                {usuario.userTipo === 4 && "🛵 Repartidor"}
              </td>
              <td>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: usuario.activo ? "#E8FEF0" : "#FEE8E8",
                    color: usuario.activo ? "#3AC87A" : "#E05252",
                    border: `1px solid ${usuario.activo ? "#3AC87A33" : "#E0525233"}`,
                  }}
                >
                  {usuario.activo ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <div style={{ display: "flex", gap: "8px" }}>
                  {/* Ver perfil */}
                  <button
                    onClick={() => setUsuarioPerfil(usuario)}
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

                  {/* Suspender / Reactivar */}
                  <button
                    onClick={() => cambiarEstado(usuario.id, !usuario.activo)}
                    style={{
                      width: "auto",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: usuario.activo ? "#FEE8E8" : "#E8FEF0",
                      color: usuario.activo ? "#E05252" : "#3AC87A",
                      border: `1px solid ${usuario.activo ? "#E0525233" : "#3AC87A33"}`,
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    {usuario.activo ? "Suspender" : "Reactivar"}
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

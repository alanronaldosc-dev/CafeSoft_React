import { useEffect, useState } from "react";
import api from "../services/api";
import PerfilUsuario from "./PerfilUsuario";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioPerfil, setUsuarioPerfil] = useState(null);

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

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.idUsuario}>
              <td>{usuario.idUsuario}</td>
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{usuario.telefono}</td>
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
                    onClick={() => cambiarEstado(usuario.idUsuario, !usuario.activo)}
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

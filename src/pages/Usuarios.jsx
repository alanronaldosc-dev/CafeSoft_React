import { useEffect, useState } from "react";
import api from "../services/api";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

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

  // HU-012: función para cambiar estado (activo/inactivo)
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/usuarios/${id}/estado`, { activo: nuevoEstado });
      obtenerUsuarios(); // refresca la lista después del cambio
    } catch (error) {
      console.log(error);
    }
  };

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
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.idUsuario}>
              <td>{usuario.idUsuario}</td>
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{usuario.telefono}</td>
              <td>{usuario.activo ? "Activo" : "Inactivo"}</td>
              <td>
                <button
                  onClick={() => cambiarEstado(usuario.idUsuario, !usuario.activo)}
                  style={{
                    backgroundColor: usuario.activo ? "tomato" : "lightgreen",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer"
                  }}
                >
                  {usuario.activo ? "Suspender" : "Reactivar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Usuarios;

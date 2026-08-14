import { useEffect, useState } from "react";
import api from "../services/api";

function Usuarios() {
// HU-015: Gestión de roles personalizados y permisos específicos para puestos especiales.

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
          </tr>
        </thead>

        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.idUsuario}>
              <td>{usuario.idUsuario}</td>
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{usuario.telefono}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Usuarios;
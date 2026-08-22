import { useEffect, useState } from "react";
import api from "../services/api";

/**
 * HU-011 – Gestión de perfiles de usuarios
 * "Como administrador, quiero registrar, consultar y actualizar los perfiles
 * de los usuarios administrador, empleado y cliente para mantener la plantilla
 * del personal operativa y actualizada."
 *
 * Este componente cumple con los criterios de aceptación:
 *  ✅ Tabla visible para el administrador con la lista de empleados activos e inactivos.
 *  ✅ Acción para actualizar el estado (activo/inactivo) de cada usuario.
 */
function Usuarios() {
  // HU-011: estado local que almacena la lista completa de usuarios (activos e inactivos)
  const [usuarios, setUsuarios] = useState([]);

  // HU-011: al montar el componente se cargan los usuarios automáticamente
  useEffect(() => {
    obtenerUsuarios();
  }, []);

  /**
   * HU-011 – Consultar usuarios
   * Realiza una petición GET /usuarios para obtener todos los perfiles
   * (administradores, empleados y clientes) y los muestra en la tabla.
   */
  const obtenerUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * HU-011 – Actualizar estado del usuario (activo / inactivo)
   * Realiza una petición PUT /usuarios/:id/estado para cambiar
   * la visibilidad operativa del perfil sin eliminarlo del sistema.
   *
   * @param {string} id          - Identificador del usuario a actualizar
   * @param {boolean} nuevoEstado - true = activar, false = suspender
   */
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/usuarios/${id}/estado`, { activo: nuevoEstado });
      // HU-011: refrescar la tabla para reflejar el nuevo estado inmediatamente
      obtenerUsuarios();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    // HU-011: panel principal visible solo para el administrador
    <section className="panel">
      <h1>👥 Usuarios</h1>

      {/*
       * HU-011 – Tabla de empleados activos e inactivos
       * Criterio de aceptación: "Tabla visible para el administrador
       * con la lista de empleados activos e inactivos."
       */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            {/* HU-011: columna que muestra el estado operativo del perfil */}
            <th>Estado</th>
            {/* HU-011: columna de acciones para actualizar el perfil */}
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {/* HU-011: iteración sobre todos los perfiles (activos e inactivos) */}
          {usuarios.map((usuario) => (
            <tr key={usuario.idUsuario}>
              <td>{usuario.idUsuario}</td>
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{usuario.telefono}</td>
              {/* HU-011: indicador visual del estado actual del perfil */}
              <td>{usuario.activo ? "Activo" : "Inactivo"}</td>
              <td>
                {/*
                 * HU-011 – Botón de actualización de estado
                 * Permite al administrador suspender o reactivar un perfil
                 * sin necesidad de eliminarlo del sistema.
                 */}
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
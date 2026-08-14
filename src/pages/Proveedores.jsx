import { useEffect, useState } from "react";
import api from "../services/api";

function Proveedores({ onCrear }) {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerProveedores();
  }, []);

  const obtenerProveedores = async () => {
    try {
      setCargando(true);

      const res = await api.get("/proveedores");

      if (Array.isArray(res.data)) {
        setProveedores(res.data);
      } else {
        setProveedores([]);
      }

    } catch (error) {
      console.error(
        "Error al cargar proveedores:",
        error
      );

      alert(
        "No se pudieron cargar los proveedores"
      );

    } finally {
      setCargando(false);
    }
  };

  const darDeBaja = async (id) => {
    const confirmar = window.confirm(
      "¿Deseas dar de baja a este proveedor?"
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.put(
        `/proveedores/${id}/baja`
      );

      alert(
        "Proveedor dado de baja correctamente"
      );

      obtenerProveedores();

    } catch (error) {
      console.error(
        "Error al dar de baja:",
        error
      );

      alert(
        "No se pudo dar de baja al proveedor"
      );
    }
  };

  const eliminarProveedor = async (id) => {
    const confirmar = window.confirm(
      "¿Deseas eliminar definitivamente este proveedor?"
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(
        `/proveedores/${id}`
      );

      alert(
        "Proveedor eliminado correctamente"
      );

      obtenerProveedores();

    } catch (error) {
      console.error(
        "Error al eliminar:",
        error
      );

      alert(
        "No se pudo eliminar el proveedor"
      );
    }
  };

  if (cargando) {
    return (
      <section className="panel">
        <p>Cargando proveedores...</p>
      </section>
    );
  }

  return (
    <section className="panel">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1>🚚 Proveedores</h1>

          <p>
            Catálogo de proveedores registrados
            en CafeSoft.
          </p>
        </div>

        <button
          onClick={onCrear}
          style={{
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          + Nuevo proveedor
        </button>
      </div>

      {proveedores.length === 0 ? (

        <p>
          No hay proveedores registrados.
        </p>

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >

          {proveedores.map(
            (proveedor) => (

              <div
                key={proveedor.id}
                style={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "18px",
                  background: "#ffffff",
                }}
              >

                <h3>
                  🏢 {proveedor.nombreEmpresa}
                </h3>

                <p>
                  <strong>Contacto:</strong>{" "}
                  {proveedor.contacto}
                </p>

                <p>
                  <strong>Teléfono:</strong>{" "}
                  {proveedor.telefono}
                </p>

                <p>
                  <strong>Insumo:</strong>{" "}
                  {proveedor.insumoPrincipal ||
                    "Sin especificar"}
                </p>

                <p>
                  <strong>Dirección:</strong>{" "}
                  {proveedor.direccion}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "15px",
                  }}
                >

                  <button
                    onClick={() =>
                      darDeBaja(
                        proveedor.id
                      )
                    }
                  >
                    Dar de baja
                  </button>

                  <button
                    onClick={() =>
                      eliminarProveedor(
                        proveedor.id
                      )
                    }
                  >
                    Eliminar
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </section>
  );
}

export default Proveedores;
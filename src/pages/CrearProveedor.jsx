import { useState } from "react";
import api from "../services/api";

function CrearProveedor({ onVolver }) {

  const [form, setForm] = useState({
    nombreEmpresa: "",
    contacto: "",
    telefono: "",
    insumoPrincipal: "",
    direccion: "",
  });

  const [guardando, setGuardando] =
    useState(false);

  const cambiarCampo = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const guardarProveedor = async (e) => {

    e.preventDefault();

    if (
      !form.nombreEmpresa.trim() ||
      !form.contacto.trim() ||
      !form.telefono.trim() ||
      !form.direccion.trim()
    ) {

      alert(
        "Completa los campos obligatorios"
      );

      return;
    }

    try {

      setGuardando(true);

      await api.post(
        "/proveedores",
        form
      );

      alert(
        "Proveedor registrado correctamente"
      );

      setForm({
        nombreEmpresa: "",
        contacto: "",
        telefono: "",
        insumoPrincipal: "",
        direccion: "",
      });

      if (onVolver) {
        onVolver();
      }

    } catch (error) {

      console.error(
        "Error al registrar proveedor:",
        error
      );

      alert(
        "No se pudo registrar el proveedor"
      );

    } finally {

      setGuardando(false);
    }
  };

  return (
    <section className="panel">

      <h1>
        🚚 Registrar proveedor
      </h1>

      <p>
        Ingresa la información del proveedor.
      </p>

      <form
        onSubmit={guardarProveedor}
        style={{
          display: "grid",
          gap: "15px",
          maxWidth: "600px",
          marginTop: "20px",
        }}
      >

        <div>
          <label>
            Nombre de la empresa
          </label>

          <input
            type="text"
            name="nombreEmpresa"
            value={form.nombreEmpresa}
            onChange={cambiarCampo}
            placeholder="Ej. Distribuidora Toluca"
          />
        </div>

        <div>
          <label>
            Persona de contacto
          </label>

          <input
            type="text"
            name="contacto"
            value={form.contacto}
            onChange={cambiarCampo}
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div>
          <label>
            Teléfono
          </label>

          <input
            type="text"
            name="telefono"
            value={form.telefono}
            onChange={cambiarCampo}
            placeholder="7221234567"
            maxLength="10"
          />
        </div>

        <div>
          <label>
            Insumo principal
          </label>

          <input
            type="text"
            name="insumoPrincipal"
            value={form.insumoPrincipal}
            onChange={cambiarCampo}
            placeholder="Ej. Café en grano"
          />
        </div>

        <div>
          <label>
            Dirección
          </label>

          <textarea
            name="direccion"
            value={form.direccion}
            onChange={cambiarCampo}
            placeholder="Dirección del proveedor"
            rows="4"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            type="submit"
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : "Guardar proveedor"}
          </button>

          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
            >
              Volver
            </button>
          )}

        </div>

      </form>

    </section>
  );
}

export default CrearProveedor;
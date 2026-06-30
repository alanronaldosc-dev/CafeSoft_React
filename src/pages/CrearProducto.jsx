import { useState } from "react";
import api from "../services/api";

function CrearProducto() {
  const [form, setForm] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    imagen: "",
  });

  const [cargando, setCargando] = useState(false);

  const registrarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);

    const producto = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      descripcion: form.descripcion,
      imagen: form.imagen || "",
    };

    try {
      const res = await api.post("/productos", producto);

      console.log("Producto registrado:", res.data);

      alert("Producto registrado correctamente");

      setForm({
        nombre: "",
        precio: "",
        descripcion: "",
        imagen: "",
      });
    } catch (error) {
      console.error("Error completo:", error);

      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Respuesta:", error.response.data);

        alert(
          "Error " +
            error.response.status +
            "\n\n" +
            JSON.stringify(error.response.data)
        );
      } else {
        alert("No se pudo conectar con la API.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="panel">
      <h1>☕ Crear Producto</h1>

      <form onSubmit={registrarProducto} className="auth-form">
        <label>Nombre del producto</label>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) =>
            setForm({ ...form, nombre: e.target.value })
          }
          required
        />

        <label>Precio</label>
        <input
          type="number"
          step="0.01"
          value={form.precio}
          onChange={(e) =>
            setForm({ ...form, precio: e.target.value })
          }
          required
        />

        <label>Descripción</label>
        <input
          type="text"
          value={form.descripcion}
          onChange={(e) =>
            setForm({ ...form, descripcion: e.target.value })
          }
          required
        />

        <label>Imagen URL</label>
        <input
          type="text"
          value={form.imagen}
          onChange={(e) =>
            setForm({ ...form, imagen: e.target.value })
          }
        />

        <button type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Registrar Producto"}
        </button>
      </form>
    </section>
  );
}

export default CrearProducto;
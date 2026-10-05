import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import "./App.css";

function App() {

  const [vista, setVista] = useState("login");

  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem("usuario")) || null
  );

  // ── Tema oscuro/claro — persiste en localStorage ─────────
  const [tema, setTema] = useState(
    localStorage.getItem("tema") || "oscuro"
  );

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    if (tema === "claro") {
      root.classList.add("tema-claro");
    } else {
      root.classList.remove("tema-claro");
    }
    localStorage.setItem("tema", tema);
  }, [tema]);

  const toggleTema = () =>
    setTema((prev) => (prev === "oscuro" ? "claro" : "oscuro"));

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("jwt_token");
    setUsuario(null);
    setVista("login");
  };

  // ── Usuario autenticado ──────────────────────────────────
  if (usuario) {
    return (
      <>
        <div className="orbes">
          <div className="orbe orbe-1"></div>
          <div className="orbe orbe-2"></div>
          <div className="orbe orbe-3"></div>
          <div className="orbe orbe-4"></div>
        </div>

        <Home
          usuario={usuario}
          cerrarSesion={cerrarSesion}
          tema={tema}
          toggleTema={toggleTema}
        />
      </>
    );
  }

  // ── Login / Registro público ─────────────────────────────
  return (
    <>
      <div className="orbes">
        <div className="orbe orbe-1"></div>
        <div className="orbe orbe-2"></div>
        <div className="orbe orbe-3"></div>
        <div className="orbe orbe-4"></div>
      </div>

      {vista === "login" ? (
        <Login cambiarVista={setVista} setUsuario={setUsuario} />
      ) : (
        <Register cambiarVista={setVista} esAdministrador={false} />
      )}
    </>
  );
}

export default App;

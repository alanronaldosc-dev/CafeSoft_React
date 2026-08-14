import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import "./App.css";

function App() {
  const [vista, setVista] = useState("login");
  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem("usuario")) || null
  );

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
    setVista("login");
  };
//Validacion de usuarios
  if (usuario) {
    return (
      <>
        <div className="orbes">
          <div className="orbe orbe-1"></div>
          <div className="orbe orbe-2"></div>
          <div className="orbe orbe-3"></div>
          <div className="orbe orbe-4"></div>
        </div>
        <Home usuario={usuario} cerrarSesion={cerrarSesion} />
      </>
    );
  }

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
        <Register cambiarVista={setVista} />
      )}
    </>
  );
}

export default App;

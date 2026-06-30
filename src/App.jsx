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

  if (usuario) {
    return <Home usuario={usuario} cerrarSesion={cerrarSesion} />;
  }

  return (
    <>
      {vista === "login" ? (
        <Login cambiarVista={setVista} setUsuario={setUsuario} />
      ) : (
        <Register cambiarVista={setVista} />
      )}
    </>
  );
}

export default App;
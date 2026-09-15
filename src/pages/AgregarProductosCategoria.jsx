import { useState, useEffect, useRef } from "react";
import api from "../services/api";

const detectarColor = (nombre = "", descripcion = "") => {
  const texto = (nombre + " " + descripcion).toLowerCase();

  if (texto.match(/café|cafe|espresso|americano|cappuccino|latte|moca|mocha/))
    return { bg: "#3E1F00", accent: "#C8783A", text: "#FFF8F0", glow: "rgba(200,120,58,0.6)" };
  if (texto.match(/chocolate|cacao|brownie/))
    return { bg: "#2C1108", accent: "#8B3A1A", text: "#FFE4CC", glow: "rgba(139,58,26,0.6)" };
  if (texto.match(/matcha|té verde|te verde/))
    return { bg: "#1A3320", accent: "#4CAF50", text: "#E8FFE8", glow: "rgba(76,175,80,0.6)" };
  if (texto.match(/fresa|strawberry|frambuesa/))
    return { bg: "#3D0B1A", accent: "#E91E63", text: "#FFE4EE", glow: "rgba(233,30,99,0.6)" };
  if (texto.match(/naranja|orange|mandarina/))
    return { bg: "#3D1F00", accent: "#FF8C00", text: "#FFF3E0", glow: "rgba(255,140,0,0.6)" };
  if (texto.match(/manzana|apple|verde/))
    return { bg: "#1A2E0A", accent: "#76C442", text: "#F0FFE8", glow: "rgba(118,196,66,0.6)" };
  if (texto.match(/vainilla|vanilla|cajeta|caramelo/))
    return { bg: "#3D2E00", accent: "#D4A017", text: "#FFFBF0", glow: "rgba(212,160,23,0.6)" };
  if (texto.match(/mora|blueberry|arándano|arandano/))
    return { bg: "#1A0A2E", accent: "#7B1FA2", text: "#F3E5F5", glow: "rgba(123,31,162,0.6)" };
  if (texto.match(/coco|coconut|crema/))
    return { bg: "#2A2A1A", accent: "#C8B97A", text: "#FFFFF0", glow: "rgba(200,185,122,0.6)" };
  if (texto.match(/menta|mint|hierbabuena/))
    return { bg: "#0A2E1A", accent: "#00BCD4", text: "#E0FFFF", glow: "rgba(0,188,212,0.6)" };
  if (texto.match(/limon|limón|lemon|citrico/))
    return { bg: "#2E2A00", accent: "#CDDC39", text: "#FFFFF0", glow: "rgba(205,220,57,0.6)" };
  if (texto.match(/pastel|cake|torta|tarta|pay/))
    return { bg: "#2E0A1A", accent: "#FF80AB", text: "#FFF0F5", glow: "rgba(255,128,171,0.6)" };
  if (texto.match(/té|te|chai|infusion|infusión/))
    return { bg: "#1A0E05", accent: "#795548", text: "#FFF8E1", glow: "rgba(121,85,72,0.6)" };

  return { bg: "#1C2B1A", accent: "#8FAF6A", text: "#F5FFF0", glow: "rgba(143,175,106,0.5)" };
};

const Particulas = ({ color, activo }) => {
  const particulas = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particulas.map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${14 + (i % 4) * 12}px`,
            height: `${14 + (i % 4) * 12}px`,
            borderRadius: "50%",
            background: color.accent,
            opacity: activo ? 0.12 + (i % 3) * 0.07 : 0,
            top: `${8 + ((i * 31) % 75)}%`,
            left: `${4 + ((i * 23) % 88)}%`,
            transform: activo
              ? `translate(${Math.sin(i * 1.2) * 25}px, ${Math.cos(i * 0.9) * 25}px) scale(1)`
              : "scale(0)",
            transition: `all ${0.9 + i * 0.12}s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.05}s`,
            filter: `blur(${1 + (i % 3)}px)`,
            boxShadow: `0 0 ${10 + i * 4}px ${color.accent}`,
          }}
        />
      ))}
    </div>
  );
};

function ProductoShowcase() {
  const [productos, setProductos] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [saliendo, setSaliendo] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    api
      .get("/productos")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProductos(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const irA = (nuevoIndice) => {
    if (saliendo || productos.length === 0) return;
    clearInterval(timerRef.current);
    setSaliendo(true);
    setTimeout(() => {
      setIndiceActual(nuevoIndice);
      setSaliendo(false);
      setEntrando(true);
      setTimeout(() => setEntrando(false), 700);
    }, 500);
  };

  useEffect(() => {
    if (productos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setSaliendo(true);
      setTimeout(() => {
        setIndiceActual((prev) => (prev + 1) % productos.length);
        setSaliendo(false);
        setEntrando(true);
        setTimeout(() => setEntrando(false), 700);
      }, 500);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [productos.length]);

  if (cargando || productos.length === 0) return null;

  const producto = productos[indiceActual];
  const color = detectarColor(producto.nombre, producto.descripcion);
  const nombre = producto.nombre || "";
  const mitad = Math.ceil(nombre.length / 2);
  const nombreIzq = nombre.slice(0, mitad);
  const nombreDer = nombre.slice(mitad);

  return (
    <>
      <style>{`
        @keyframes pulsarFondo {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes barraProgreso {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes flotarImagen {
          0%, 100% { transform: translate(-50%, -50%) scale(1) translateY(0px); }
          50% { transform: translate(-50%, -50%) scale(1) translateY(-12px); }
        }
        .showcase-scroll-hint {
          animation: rebotarFlecha 1.8s ease-in-out infinite;
        }
        @keyframes rebotarFlecha {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(6px); opacity: 1; }
        }
      `}</style>

      {/* Contenedor principal: ocupa toda la altura de pantalla disponible */}
      <div
        style={{
          position: "relative",
          width: "100%",
          /* Resta el padding del .content (32px arriba + 32px abajo) */
          height: "100vh",
          borderRadius: "0",

          minHeight: "480px",
          borderRadius: "28px",
          overflow: "hidden",
          marginBottom: "26px",
          cursor: "pointer",
          transition: "background 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
          background: `linear-gradient(145deg, ${color.bg} 0%, ${color.bg}ee 55%, ${color.accent}44 100%)`,
          boxShadow: `0 24px 70px ${color.glow}, 0 0 0 1px rgba(255,255,255,0.07)`,
        }}
        onClick={() => irA((indiceActual + 1) % productos.length)}
      >
        {/* Fondo radial pulsante */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, ${color.accent}28 0%, transparent 68%)`,
            animation: "pulsarFondo 3.5s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Segundo orbe — esquina */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color.accent}33 0%, transparent 70%)`,
            pointerEvents: "none",
            filter: "blur(30px)",
          }}
        />

        {/* Partículas */}
        <Particulas color={color} activo={!saliendo} />

        {/* ── NOMBRE PARTIDO ── */}
        {/* Izquierda */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "40px",
            fontSize: "clamp(60px, 10vw, 120px)",
            fontWeight: "900",
            color: "rgba(255,255,255,0.12)",
            letterSpacing: "-3px",
            lineHeight: 1,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            userSelect: "none",
            pointerEvents: "none",
            transform: saliendo ? "translateX(-80px)" : entrando ? "translateX(-18px)" : "translateX(0)",
            opacity: saliendo ? 0 : 1,
            transition: "transform 0.65s ease, opacity 0.5s ease",
          }}
        >
          {nombreIzq}
        </div>

        {/* Derecha */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "40px",
            fontSize: "clamp(60px, 10vw, 120px)",
            fontWeight: "900",
            color: "rgba(255,255,255,0.12)",
            letterSpacing: "-3px",
            lineHeight: 1,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            userSelect: "none",
            pointerEvents: "none",
            transform: saliendo ? "translateX(80px)" : entrando ? "translateX(18px)" : "translateX(0)",
            opacity: saliendo ? 0 : 1,
            transition: "transform 0.65s ease, opacity 0.5s ease",
          }}
        >
          {nombreDer}
        </div>

        {/* ── IMAGEN CENTRAL FLOTANTE ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: saliendo
              ? "translate(-50%, -50%) scale(0.55) translateY(40px)"
              : entrando
              ? "translate(-50%, -50%) scale(1.06)"
              : "translate(-50%, -50%) scale(1)",
            opacity: saliendo ? 0 : 1,
            transition: saliendo || entrando
              ? "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease"
              : "none",
            animation: (!saliendo && !entrando) ? "flotarImagen 4s ease-in-out infinite" : "none",
            zIndex: 3,
            filter: `drop-shadow(0 0 50px ${color.glow})`,
          }}
        >
          {producto.imagen ? (
            <img
              src={`data:image/jpeg;base64,${producto.imagen}`}
              alt={producto.nombre}
              style={{
                width: "clamp(200px, 22vw, 280px)",
                height: "clamp(200px, 22vw, 280px)",
                objectFit: "cover",
                borderRadius: "50%",
                border: `5px solid ${color.accent}`,
                boxShadow: `0 0 60px ${color.glow}, 0 0 0 12px ${color.accent}22`,
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "clamp(200px, 22vw, 280px)",
                height: "clamp(200px, 22vw, 280px)",
                borderRadius: "50%",
                background: `radial-gradient(circle at 38% 32%, ${color.accent}cc, ${color.bg})`,
                border: `5px solid ${color.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "96px",
                boxShadow: `0 0 60px ${color.glow}`,
              }}
            >
              ☕
            </div>
          )}
        </div>

        {/* ── INFO — arriba izquierda ── */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "40px",
            zIndex: 4,
            transform: saliendo ? "translateY(-24px)" : entrando ? "translateY(-8px)" : "translateY(0)",
            opacity: saliendo ? 0 : 1,
            transition: "transform 0.55s ease, opacity 0.5s ease",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: color.accent,
              textShadow: `0 0 14px ${color.glow}`,
            }}
          >
            ✦ Nuestro Producto
          </p>
          <h2
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(22px, 3vw, 38px)",
              fontWeight: "900",
              color: color.text,
              textShadow: `0 2px 24px ${color.glow}`,
              maxWidth: "380px",
              lineHeight: 1.15,
            }}
          >
            {producto.nombre}
          </h2>
          {producto.descripcion && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "15px",
                color: `${color.text}bb`,
                maxWidth: "320px",
                lineHeight: "1.6",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {producto.descripcion}
            </p>
          )}
          {producto.precio && (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: "900",
                color: color.accent,
                textShadow: `0 0 20px ${color.glow}`,
              }}
            >
              ${producto.precio}
            </p>
          )}
        </div>

        {/* ── ETIQUETA TOP DERECHA ── */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            fontSize: "12px",
            color: `${color.text}55`,
            zIndex: 4,
          }}
        >
          Toca para ver más →
        </div>

        {/* ── CONTADOR DE PRODUCTOS ── */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            marginTop: "28px",
            fontSize: "13px",
            color: `${color.text}77`,
            zIndex: 4,
            textAlign: "right",
          }}
        >
          <span style={{ color: color.accent, fontWeight: "700", fontSize: "20px" }}>
            {String(indiceActual + 1).padStart(2, "0")}
          </span>
          <span style={{ fontSize: "12px", margin: "0 4px" }}>/</span>
          <span>{String(productos.length).padStart(2, "0")}</span>
        </div>

        {/* ── PUNTOS DE NAVEGACIÓN ── */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px",
            zIndex: 5,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {productos.map((_, i) => (
            <div
              key={i}
              onClick={() => irA(i)}
              style={{
                width: i === indiceActual ? "28px" : "9px",
                height: "9px",
                borderRadius: "5px",
                background: i === indiceActual ? color.accent : "rgba(255,255,255,0.28)",
                cursor: "pointer",
                transition: "all 0.4s ease",
                boxShadow: i === indiceActual ? `0 0 10px ${color.glow}` : "none",
              }}
            />
          ))}
        </div>

        {/* ── FLECHAS LATERALES ── */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            irA((indiceActual - 1 + productos.length) % productos.length);
          }}
          style={{
            position: "absolute",
            left: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: `1px solid rgba(255,255,255,0.2)`,
            color: color.text,
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            transition: "background 0.2s",
            padding: 0,
            margin: 0,
            lineHeight: 1,
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          ‹
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            irA((indiceActual + 1) % productos.length);
          }}
          style={{
            position: "absolute",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: `1px solid rgba(255,255,255,0.2)`,
            color: color.text,
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            transition: "background 0.2s",
            padding: 0,
            margin: 0,
            lineHeight: 1,
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          ›
        </button>

        {/* ── BARRA DE PROGRESO ── */}
        <div
          key={indiceActual}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "4px",
            background: `linear-gradient(90deg, ${color.accent}, ${color.accent}99)`,
            animation: "barraProgreso 4.5s linear forwards",
            boxShadow: `0 0 10px ${color.accent}`,
            borderRadius: "0 2px 0 0",
          }}
        />

        {/* ── HINT SCROLL ── */}
        <div
          className="showcase-scroll-hint"
          style={{
            position: "absolute",
            bottom: "18px",
            right: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            fontSize: "11px",
            color: `${color.text}55`,
            zIndex: 4,
            pointerEvents: "none",
          }}
        >
          <span>scroll</span>
          <span style={{ fontSize: "16px" }}>↓</span>
        </div>
      </div>
    </>
  );
}

export default ProductoShowcase;

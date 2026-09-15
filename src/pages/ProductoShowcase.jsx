import { useState, useEffect, useRef } from "react";
import api from "../services/api";

// Paleta de colores por nombre de producto (detecta palabras clave)
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

  // Default: café suave
  return { bg: "#1C2B1A", accent: "#8FAF6A", text: "#F5FFF0", glow: "rgba(143,175,106,0.5)" };
};

// Partículas flotantes decorativas
const Particulas = ({ color, activo }) => {
  const particulas = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particulas.map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${12 + (i % 3) * 10}px`,
            height: `${12 + (i % 3) * 10}px`,
            borderRadius: "50%",
            background: color.accent,
            opacity: activo ? 0.15 + (i % 3) * 0.08 : 0,
            top: `${10 + ((i * 37) % 70)}%`,
            left: `${5 + ((i * 29) % 85)}%`,
            transform: activo
              ? `translate(${Math.sin(i) * 20}px, ${Math.cos(i) * 20}px) scale(1)`
              : "scale(0)",
            transition: `all ${0.8 + i * 0.15}s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.06}s`,
            filter: `blur(${1 + (i % 2)}px)`,
            boxShadow: `0 0 ${8 + i * 3}px ${color.accent}`,
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
    setSaliendo(true);
    setTimeout(() => {
      setIndiceActual(nuevoIndice);
      setSaliendo(false);
      setEntrando(true);
      setTimeout(() => setEntrando(false), 700);
    }, 500);
  };

  // Auto-avance cada 4 segundos
  useEffect(() => {
    if (productos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndiceActual((prev) => {
        const siguiente = (prev + 1) % productos.length;
        setSaliendo(true);
        setTimeout(() => {
          setIndiceActual(siguiente);
          setSaliendo(false);
          setEntrando(true);
          setTimeout(() => setEntrando(false), 700);
        }, 500);
        return prev;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [productos.length]);

  if (cargando) return null;
  if (productos.length === 0) return null;

  const producto = productos[indiceActual];
  const color = detectarColor(producto.nombre, producto.descripcion);

  // Divide el nombre en dos mitades para el efecto "nombre partido"
  const nombre = producto.nombre || "";
  const mitad = Math.ceil(nombre.length / 2);
  const nombreIzq = nombre.slice(0, mitad);
  const nombreDer = nombre.slice(mitad);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "320px",
        borderRadius: "28px",
        overflow: "hidden",
        marginBottom: "26px",
        cursor: "pointer",
        transition: "background 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}cc 60%, ${color.accent}33 100%)`,
        boxShadow: `0 20px 60px ${color.glow}, 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
      onClick={() => irA((indiceActual + 1) % productos.length)}
    >
      {/* Fondo de color pulsante */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${color.accent}22 0%, transparent 70%)`,
          animation: "pulsarFondo 3s ease-in-out infinite",
        }}
      />

      {/* Partículas */}
      <Particulas color={color} activo={!saliendo} />

      {/* Nombre partido — izquierda */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "32px",
          fontSize: "clamp(52px, 8vw, 90px)",
          fontWeight: "900",
          color: "rgba(255,255,255,0.18)",
          letterSpacing: "-2px",
          lineHeight: 1,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          userSelect: "none",
          transform: saliendo ? "translateX(-60px)" : entrando ? "translateX(-20px)" : "translateX(0)",
          opacity: saliendo ? 0 : 1,
          transition: "transform 0.6s ease, opacity 0.5s ease",
        }}
      >
        {nombreIzq}
      </div>

      {/* Nombre partido — derecha */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "32px",
          fontSize: "clamp(52px, 8vw, 90px)",
          fontWeight: "900",
          color: "rgba(255,255,255,0.18)",
          letterSpacing: "-2px",
          lineHeight: 1,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          userSelect: "none",
          transform: saliendo ? "translateX(60px)" : entrando ? "translateX(20px)" : "translateX(0)",
          opacity: saliendo ? 0 : 1,
          transition: "transform 0.6s ease, opacity 0.5s ease",
        }}
      >
        {nombreDer}
      </div>

      {/* Imagen central */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) ${
            saliendo ? "scale(0.6) translateY(30px)" : entrando ? "scale(1.05)" : "scale(1)"
          }`,
          opacity: saliendo ? 0 : 1,
          transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease",
          zIndex: 3,
          filter: `drop-shadow(0 0 40px ${color.glow})`,
        }}
      >
        {producto.imagen ? (
          <img
            src={`data:image/jpeg;base64,${producto.imagen}`}
            alt={producto.nombre}
            style={{
              width: "180px",
              height: "180px",
              objectFit: "cover",
              borderRadius: "50%",
              border: `4px solid ${color.accent}`,
              boxShadow: `0 0 50px ${color.glow}, 0 0 0 8px ${color.accent}22`,
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 35%, ${color.accent}cc, ${color.bg})`,
              border: `4px solid ${color.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "72px",
              boxShadow: `0 0 50px ${color.glow}`,
            }}
          >
            ☕
          </div>
        )}
      </div>

      {/* Info — nombre y descripción */}
      <div
        style={{
          position: "absolute",
          top: "32px",
          left: "32px",
          zIndex: 4,
          transform: saliendo ? "translateY(-20px)" : entrando ? "translateY(-8px)" : "translateY(0)",
          opacity: saliendo ? 0 : 1,
          transition: "transform 0.55s ease, opacity 0.5s ease",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: color.accent,
            textShadow: `0 0 12px ${color.glow}`,
          }}
        >
          ✦ Nuestro Producto
        </p>
        <h2
          style={{
            margin: "6px 0 0",
            fontSize: "clamp(18px, 2.5vw, 26px)",
            fontWeight: "800",
            color: color.text,
            textShadow: `0 2px 20px ${color.glow}`,
            maxWidth: "280px",
          }}
        >
          {producto.nombre}
        </h2>
        {producto.descripcion && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              color: `${color.text}bb`,
              maxWidth: "260px",
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
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
              margin: "10px 0 0",
              fontSize: "20px",
              fontWeight: "800",
              color: color.accent,
              textShadow: `0 0 16px ${color.glow}`,
            }}
          >
            ${producto.precio}
          </p>
        )}
      </div>

      {/* Puntos de navegación */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          zIndex: 5,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {productos.map((_, i) => (
          <div
            key={i}
            onClick={() => irA(i)}
            style={{
              width: i === indiceActual ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: i === indiceActual ? color.accent : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              transition: "all 0.4s ease",
              boxShadow: i === indiceActual ? `0 0 8px ${color.glow}` : "none",
            }}
          />
        ))}
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${color.accent}, ${color.accent}aa)`,
          animation: "barraProgreso 4s linear infinite",
          boxShadow: `0 0 8px ${color.accent}`,
        }}
      />

      {/* Etiqueta de "Haz clic" */}
      <div
        style={{
          position: "absolute",
          top: "32px",
          right: "32px",
          fontSize: "11px",
          color: `${color.text}66`,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          zIndex: 4,
        }}
      >
        Toca para ver más →
      </div>

      <style>{`
        @keyframes pulsarFondo {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes barraProgreso {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default ProductoShowcase;

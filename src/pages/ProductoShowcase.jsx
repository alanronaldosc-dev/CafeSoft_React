import { useState, useEffect, useRef } from "react";
import api from "../services/api";

// ── Paleta AWS-compatible por categoría de producto ──────────
// Los backgrounds son oscuros (compatibles con tema AWS),
// los accents son brillantes para contraste.
const detectarColor = (nombre = "", descripcion = "") => {
  const texto = (nombre + " " + descripcion).toLowerCase();

  if (texto.match(/café|cafe|espresso|americano|cappuccino|latte|moca|mocha/))
    return { bg: "#0D1B2A", accent: "#FF9900", text: "#FFFFFF", glow: "rgba(255,153,0,0.45)", tag: "#FF9900" };
  if (texto.match(/chocolate|cacao|brownie/))
    return { bg: "#0D1420", accent: "#EC7211", text: "#FFFFFF", glow: "rgba(236,114,17,0.45)", tag: "#EC7211" };
  if (texto.match(/matcha|té verde|te verde/))
    return { bg: "#0A1A14", accent: "#3AC87A", text: "#FFFFFF", glow: "rgba(58,200,122,0.45)", tag: "#3AC87A" };
  if (texto.match(/fresa|strawberry|frambuesa/))
    return { bg: "#1A0A14", accent: "#E91E8C", text: "#FFFFFF", glow: "rgba(233,30,140,0.45)", tag: "#E91E8C" };
  if (texto.match(/naranja|orange|mandarina/))
    return { bg: "#1A1000", accent: "#FF9900", text: "#FFFFFF", glow: "rgba(255,153,0,0.45)", tag: "#FF9900" };
  if (texto.match(/manzana|apple|verde/))
    return { bg: "#0A1A10", accent: "#76C442", text: "#FFFFFF", glow: "rgba(118,196,66,0.45)", tag: "#76C442" };
  if (texto.match(/vainilla|vanilla|cajeta|caramelo/))
    return { bg: "#1A1400", accent: "#D4A017", text: "#FFFFFF", glow: "rgba(212,160,23,0.45)", tag: "#D4A017" };
  if (texto.match(/mora|blueberry|arándano|arandano/))
    return { bg: "#0F0A1E", accent: "#9B7AC8", text: "#FFFFFF", glow: "rgba(155,122,200,0.45)", tag: "#9B7AC8" };
  if (texto.match(/coco|coconut|crema/))
    return { bg: "#141410", accent: "#4A9FD4", text: "#FFFFFF", glow: "rgba(74,159,212,0.45)", tag: "#4A9FD4" };
  if (texto.match(/menta|mint|hierbabuena/))
    return { bg: "#001A1A", accent: "#00BCD4", text: "#FFFFFF", glow: "rgba(0,188,212,0.45)", tag: "#00BCD4" };
  if (texto.match(/limon|limón|lemon|citrico/))
    return { bg: "#141A00", accent: "#CDDC39", text: "#FFFFFF", glow: "rgba(205,220,57,0.45)", tag: "#CDDC39" };
  if (texto.match(/pastel|cake|torta|tarta|pay/))
    return { bg: "#1A0A14", accent: "#FF80AB", text: "#FFFFFF", glow: "rgba(255,128,171,0.45)", tag: "#FF80AB" };
  if (texto.match(/té|te|chai|infusion|infusión/))
    return { bg: "#0F1218", accent: "#4A9FD4", text: "#FFFFFF", glow: "rgba(74,159,212,0.45)", tag: "#4A9FD4" };

  // Default: azul AWS
  return { bg: "#0F1B2D", accent: "#0073BB", text: "#FFFFFF", glow: "rgba(0,115,187,0.45)", tag: "#0073BB" };
};

// ── Partículas flotantes (estilo grid/hexágonos AWS) ─────────
const Particulas = ({ color, activo }) => {
  const puntos = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {puntos.map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${4 + (i % 3) * 3}px`,
            height: `${4 + (i % 3) * 3}px`,
            borderRadius: i % 2 === 0 ? "2px" : "50%",
            background: "transparent",
            border: `1px solid ${color.accent}`,
            opacity: activo ? 0.12 + (i % 4) * 0.06 : 0,
            top: `${8 + ((i * 41) % 75)}%`,
            left: `${3 + ((i * 31) % 90)}%`,
            transform: activo
              ? `translate(${Math.sin(i * 0.8) * 14}px, ${Math.cos(i * 0.8) * 14}px) rotate(${i * 36}deg)`
              : "scale(0) rotate(0deg)",
            transition: `all ${0.7 + i * 0.12}s cubic-bezier(0.34, 1.4, 0.64, 1) ${i * 0.05}s`,
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
      setTimeout(() => setEntrando(false), 600);
    }, 400);
  };

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
          setTimeout(() => setEntrando(false), 600);
        }, 400);
        return prev;
      });
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [productos.length]);

  if (cargando) return null;
  if (productos.length === 0) return null;

  const producto = productos[indiceActual];
  const color = detectarColor(producto.nombre, producto.descripcion);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "280px",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${color.accent}33`,
        // Fondo oscuro base con gradiente sutil hacia el accent
        background: `linear-gradient(135deg, ${color.bg} 0%, #0F1B2D 55%, ${color.accent}14 100%)`,
        boxShadow: `0 0 0 1px ${color.accent}22, 0 8px 32px rgba(0,0,0,0.5)`,
        transition: "border-color 0.6s ease",
      }}
      onClick={() => irA((indiceActual + 1) % productos.length)}
    >
      {/* Grid de fondo estilo AWS — líneas sutiles */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(${color.accent}08 1px, transparent 1px),
          linear-gradient(90deg, ${color.accent}08 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Glow radial central */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 65% 50%, ${color.accent}18 0%, transparent 65%)`,
      }} />

      {/* Partículas geométricas */}
      <Particulas color={color} activo={!saliendo} />

      {/* ── Panel izquierdo: info del producto ── */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, bottom: 0,
          width: "55%",
          padding: "32px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "10px",
          zIndex: 4,
          transform: saliendo ? "translateX(-30px)" : entrando ? "translateX(-8px)" : "translateX(0)",
          opacity: saliendo ? 0 : 1,
          transition: "transform 0.45s ease, opacity 0.4s ease",
        }}
      >
        {/* Badge de categoría */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: color.accent,
            boxShadow: `0 0 8px ${color.accent}`,
          }} />
          <span style={{
            fontSize: "10px", fontWeight: "700",
            letterSpacing: "2.5px", textTransform: "uppercase",
            color: color.accent,
          }}>
            Producto del catálogo
          </span>
        </div>

        {/* Nombre */}
        <h2 style={{
          margin: 0,
          fontSize: "clamp(20px, 2.8vw, 30px)",
          fontWeight: "800",
          color: "#FFFFFF",
          lineHeight: 1.15,
          letterSpacing: "-0.3px",
        }}>
          {producto.nombre}
        </h2>

        {/* Descripción */}
        {producto.descripcion && (
          <p style={{
            margin: 0,
            fontSize: "13px",
            color: "rgba(255,255,255,0.55)",
            lineHeight: "1.6",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            maxWidth: "340px",
          }}>
            {producto.descripcion}
          </p>
        )}

        {/* Precio — estilo chip AWS */}
        {producto.precio && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: `${color.accent}18`,
            border: `1px solid ${color.accent}44`,
            borderRadius: "6px",
            padding: "6px 14px",
            width: "fit-content",
            marginTop: "4px",
          }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>PRECIO</span>
            <span style={{ fontSize: "18px", fontWeight: "800", color: color.accent }}>
              ${producto.precio}
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>MXN</span>
          </div>
        )}

        {/* Hint navegar */}
        <p style={{
          margin: 0, fontSize: "11px",
          color: "rgba(255,255,255,0.25)",
          marginTop: "4px",
        }}>
          Clic para ver siguiente →
        </p>
      </div>

      {/* ── Panel derecho: imagen del producto ── */}
      <div
        style={{
          position: "absolute",
          top: "50%", right: "40px",
          transform: `translateY(-50%) ${
            saliendo ? "scale(0.7) translateX(20px)" : entrando ? "scale(1.04)" : "scale(1)"
          }`,
          opacity: saliendo ? 0 : 1,
          transition: "transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.4s ease",
          zIndex: 3,
        }}
      >
        {producto.imagen ? (
          <div style={{ position: "relative", width: "180px", height: "180px" }}>

            {/* Fondo gradiente radial — color del producto, muy visible */}
            <div style={{
              position: "absolute",
              inset: "-30px",
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 50%, ${color.accent} 0%, ${color.accent}88 30%, ${color.accent}22 60%, transparent 75%)`,
              animation: "pulsarGlow 2.5s ease-in-out infinite",
              filter: "blur(8px)",
            }} />

            {/* Segundo anillo más grande y suave */}
            <div style={{
              position: "absolute",
              inset: "-50px",
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 50%, transparent 40%, ${color.accent}33 60%, ${color.accent}11 80%, transparent 100%)`,
              animation: "pulsarGlow 2.5s ease-in-out infinite 0.4s",
            }} />

            {/* Imagen encima, sin borde — el glow hace todo el trabajo */}
            <img
              src={`data:image/jpeg;base64,${producto.imagen}`}
              alt={producto.nombre}
              style={{
                width: "180px",
                height: "180px",
                objectFit: "cover",
                borderRadius: "18px",
                display: "block",
                position: "relative",
                zIndex: 2,
              }}
            />
          </div>
        ) : (
          <div style={{ position: "relative", width: "180px", height: "180px" }}>
            <div style={{
              position: "absolute",
              inset: "-30px",
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 50%, ${color.accent} 0%, ${color.accent}66 35%, transparent 70%)`,
              filter: "blur(10px)",
              animation: "pulsarGlow 2.5s ease-in-out infinite",
            }} />
            <div style={{
              width: "180px", height: "180px",
              borderRadius: "18px",
              background: `linear-gradient(135deg, ${color.accent}33, ${color.bg})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "72px",
              position: "relative",
              zIndex: 2,
            }}>
              ☕
            </div>
          </div>
        )}
      </div>

      {/* ── Número de slide (esquina superior derecha) ── */}
      <div style={{
        position: "absolute",
        top: "20px", right: "20px",
        fontSize: "11px", fontWeight: "600",
        color: "rgba(255,255,255,0.3)",
        zIndex: 5,
        fontVariantNumeric: "tabular-nums",
      }}>
        {String(indiceActual + 1).padStart(2, "0")} / {String(productos.length).padStart(2, "0")}
      </div>

      {/* ── Puntos de navegación ── */}
      <div
        style={{
          position: "absolute",
          bottom: "20px", left: "32px",
          display: "flex", gap: "6px",
          zIndex: 5,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {productos.map((_, i) => (
          <div
            key={i}
            onClick={() => irA(i)}
            style={{
              width: i === indiceActual ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: i === indiceActual ? color.accent : "rgba(255,255,255,0.2)",
              cursor: "pointer",
              transition: "all 0.35s ease",
              boxShadow: i === indiceActual ? `0 0 6px ${color.accent}` : "none",
            }}
          />
        ))}
      </div>

      {/* ── Barra de progreso inferior ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "2px",
        background: `${color.accent}18`,
      }}>
        <div style={{
          height: "100%",
          background: `linear-gradient(90deg, ${color.accent}, ${color.accent}88)`,
          animation: "barraProgreso 4.5s linear infinite",
          boxShadow: `0 0 6px ${color.accent}`,
        }} />
      </div>

      <style>{`
        @keyframes barraProgreso {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes pulsarGlow {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

export default ProductoShowcase;

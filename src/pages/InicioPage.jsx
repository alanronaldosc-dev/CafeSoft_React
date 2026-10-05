
import { useState } from "react";
import ProductoShowcase from "./ProductoShowcase";

const MODULOS_INFO = {
  crearProducto: {
    titulo: "Crear Producto", color: "#FF9900",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>),
    resumen: "Registra nuevos productos con receta de insumos.", detalle: "Productos activos", valor: "—",
  },
  ventas: {
    titulo: "Ver Ventas", color: "#3AC87A",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>),
    resumen: "Historial completo de ventas de la sucursal.", detalle: "Ventas registradas", valor: "—",
  },
  pedidos: {
    titulo: "Pedidos", color: "#4A9FD4",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>),
    resumen: "Pedidos pendientes de entrega en curso.", detalle: "Pedidos pendientes", valor: "—",
  },
  productos: {
    titulo: "Ver Productos", color: "#FF9900",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>),
    resumen: "Catálogo de productos disponibles en el menú.", detalle: "Productos en catálogo", valor: "—",
  },
  usuarios: {
    titulo: "Ver Usuarios", color: "#4A9FD4",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    resumen: "Gestión de usuarios activos e inactivos.", detalle: "Usuarios en sucursal", valor: "—",
  },
  reportes: {
    titulo: "Reportes", color: "#9B7AC8",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
    resumen: "Estadísticas y métricas del negocio.", detalle: "Módulo disponible", valor: "—",
  },
  carrito: {
    titulo: "Carrito de Compras", color: "#FF9900",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>),
    resumen: "Registro de ventas y generación de tickets.", detalle: "Punto de venta activo", valor: "—",
  },
  registro: {
    titulo: "Registrar Usuario", color: "#3AC87A",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="10" y1="19" x2="14" y2="19" /></svg>),
    resumen: "Alta de nuevos usuarios en el sistema.", detalle: "Registrar ahora", valor: "—",
  },
  insumos: {
    titulo: "Ver Insumos", color: "#FF9900",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>),
    resumen: "Catálogo de materias primas y análisis de stock.", detalle: "Insumos registrados", valor: "—",
  },
  lotes: {
    titulo: "Cargas de Insumos", color: "#4A9FD4",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 6v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>),
    resumen: "Registro de lotes de insumos por sucursal.", detalle: "Lotes en inventario", valor: "—",
  },
  categorias: {
    titulo: "Categorías", color: "#9B7AC8",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>),
    resumen: "Organización del menú por categorías.", detalle: "Categorías activas", valor: "—",
  },
  dashboard: {
    titulo: "Estado de Inventario", color: "#3AC87A",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" /></svg>),
    resumen: "Existencias en tiempo real de insumos y productos.", detalle: "Estado en tiempo real", valor: "—",
  },
  inventarioProductos: {
    titulo: "Cargas de Productos", color: "#4A9FD4",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>),
    resumen: "Producción y carga de unidades terminadas.", detalle: "Producción activa", valor: "—",
  },
  cargas: {
    titulo: "Cargas de Garrafones", color: "#FF9900",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6M8 6h8" /><rect x="6" y="8" width="12" height="13" rx="2" /><path d="M9 21v-5h6v5" /></svg>),
    resumen: "Control de cargas y niveles de garrafones.", detalle: "Control de agua", valor: "—",
  },
  proveedores: {
    titulo: "Proveedores", color: "#3AC87A",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 6v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>),
    resumen: "Directorio y gestión de proveedores activos.", detalle: "Proveedores registrados", valor: "—",
  },
  mermas: {
    titulo: "Merma de Garrafón", color: "#E05252",
    icono: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>),
    resumen: "Registro de mermas y pérdidas en garrafones.", detalle: "Control de mermas", valor: "—",
  },
};

const ORDEN_MODULOS = [
  "ventas","pedidos","carrito","productos","insumos",
  "lotes","inventarioProductos","cargas","categorias",
  "proveedores","mermas","dashboard","usuarios","registro",
  "crearProducto","reportes",
];

const PATRON_COLUMNAS = [2, 3, 2, 3, 2, 3];

=======
// ============================================================
// InicioPage.jsx
// Pantalla de inicio estilo AWS Console:
//  - Banner de bienvenida con nombre de usuario
//  - Carrusel de productos (ProductoShowcase)
//  - Grid de widgets por módulo (según permisos)
// ============================================================

import { useState } from "react";
import ProductoShowcase from "./ProductoShowcase";

// ── Datos estáticos de cada módulo ────────────────────────────
const MODULOS_INFO = {
  crearProducto: {
    titulo: "Crear Producto",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    color: "#FF9900",
    resumen: "Registra nuevos productos con receta de insumos.",
    detalle: "Productos activos",
    valor: "—",
  },
  ventas: {
    titulo: "Ver Ventas",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    color: "#3AC87A",
    resumen: "Historial completo de ventas de la sucursal.",
    detalle: "Ventas registradas",
    valor: "—",
  },
  pedidos: {
    titulo: "Pedidos",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
    color: "#4A9FD4",
    resumen: "Pedidos pendientes de entrega en curso.",
    detalle: "Pedidos pendientes",
    valor: "—",
  },
  productos: {
    titulo: "Ver Productos",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    color: "#FF9900",
    resumen: "Catálogo de productos disponibles en el menú.",
    detalle: "Productos en catálogo",
    valor: "—",
  },
  usuarios: {
    titulo: "Ver Usuarios",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "#4A9FD4",
    resumen: "Gestión de usuarios activos e inactivos.",
    detalle: "Usuarios en sucursal",
    valor: "—",
  },
  reportes: {
    titulo: "Reportes",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    color: "#9B7AC8",
    resumen: "Estadísticas y métricas del negocio.",
    detalle: "Módulo disponible",
    valor: "—",
  },
  carrito: {
    titulo: "Carrito de Compras",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    color: "#FF9900",
    resumen: "Registro de ventas y generación de tickets.",
    detalle: "Punto de venta activo",
    valor: "—",
  },
  registro: {
    titulo: "Registrar Usuario",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="10" y1="19" x2="14" y2="19" />
      </svg>
    ),
    color: "#3AC87A",
    resumen: "Alta de nuevos usuarios en el sistema.",
    detalle: "Registrar ahora",
    valor: "—",
  },
  insumos: {
    titulo: "Ver Insumos",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
      </svg>
    ),
    color: "#FF9900",
    resumen: "Catálogo de materias primas y análisis de stock.",
    detalle: "Insumos registrados",
    valor: "—",
  },
  lotes: {
    titulo: "Cargas de Insumos",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 6v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    color: "#4A9FD4",
    resumen: "Registro de lotes de insumos por sucursal.",
    detalle: "Lotes en inventario",
    valor: "—",
  },
  categorias: {
    titulo: "Categorías",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    color: "#9B7AC8",
    resumen: "Organización del menú por categorías.",
    detalle: "Categorías activas",
    valor: "—",
  },
  dashboard: {
    titulo: "Estado de Inventario",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" />
      </svg>
    ),
    color: "#3AC87A",
    resumen: "Existencias en tiempo real de insumos y productos.",
    detalle: "Estado en tiempo real",
    valor: "—",
  },
  inventarioProductos: {
    titulo: "Cargas de Productos",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    color: "#4A9FD4",
    resumen: "Producción y carga de unidades terminadas.",
    detalle: "Producción activa",
    valor: "—",
  },
  cargas: {
    titulo: "Cargas de Garrafones",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v6M8 6h8" /><rect x="6" y="8" width="12" height="13" rx="2" /><path d="M9 21v-5h6v5" />
      </svg>
    ),
    color: "#FF9900",
    resumen: "Control de cargas y niveles de garrafones.",
    detalle: "Control de agua",
    valor: "—",
  },
  proveedores: {
    titulo: "Proveedores",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 6v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    color: "#3AC87A",
    resumen: "Directorio y gestión de proveedores activos.",
    detalle: "Proveedores registrados",
    valor: "—",
  },
  mermas: {
    titulo: "Merma de Garrafón",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: "#E05252",
    resumen: "Registro de mermas y pérdidas en garrafones.",
    detalle: "Control de mermas",
    valor: "—",
  },
};

// ── Orden de módulos en el grid (excluye "inicio") ────────────
const ORDEN_MODULOS = [
  "ventas", "pedidos",
  "carrito", "productos", "insumos",
  "lotes", "inventarioProductos", "cargas",
  "categorias", "proveedores", "mermas",
  "dashboard", "usuarios", "registro",
  "crearProducto", "reportes",
];

// Patrón de columnas alternado: 2, 3, 2, 3...
const PATRON_COLUMNAS = [2, 3, 2, 3, 2, 3];

// ── Widget individual ────────────────────────────────────────

function ModuloWidget({ id, info, onNavegar }) {
  return (
    <div
      style={{

        background: "var(--fondo-card)", border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)", padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: "12px",
        transition: "border-color 0.2s, box-shadow 0.2s", cursor: "default",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = info.color; e.currentTarget.style.boxShadow = `0 4px 20px ${info.color}22`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--borde)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${info.color}18`, border: `1px solid ${info.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: info.color, flexShrink: 0 }}>
            {info.icono}
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--texto-suave)", margin: 0 }}>Módulo</p>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--texto)", margin: "3px 0 0" }}>{info.titulo}</h3>
          </div>
        </div>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: info.color, flexShrink: 0, marginTop: "4px", boxShadow: `0 0 6px ${info.color}` }} />
      </div>

      <div style={{ borderTop: "1px solid var(--borde)" }} />

      <p style={{ fontSize: "13px", color: "var(--texto-suave)", margin: 0, lineHeight: "1.5" }}>{info.resumen}</p>

      <div style={{ background: "var(--humo)", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
=======
        background: "var(--fondo-card)",
        border: "1px solid var(--borde)",
        borderRadius: "var(--r-md)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = info.color;
        e.currentTarget.style.boxShadow = `0 4px 20px ${info.color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--borde)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Icono estilo AWS */}
          <div style={{
            width: "48px", height: "48px",
            borderRadius: "12px",
            background: `${info.color}18`,
            border: `1px solid ${info.color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: info.color,
            flexShrink: 0,
          }}>
            {info.icono}
          </div>
          <div>
            <p style={{
              fontSize: "11px", fontWeight: "700",
              letterSpacing: "0.5px", textTransform: "uppercase",
              color: "var(--texto-suave)", margin: 0,
            }}>
              Módulo
            </p>
            <h3 style={{
              fontSize: "15px", fontWeight: "700",
              color: "var(--texto)", margin: "3px 0 0",
            }}>
              {info.titulo}
            </h3>
          </div>
        </div>
        {/* Indicador de estado activo */}
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: info.color,
          flexShrink: 0, marginTop: "4px",
          boxShadow: `0 0 6px ${info.color}`,
        }} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--borde)" }} />

      {/* Resumen */}
      <p style={{ fontSize: "13px", color: "var(--texto-suave)", margin: 0, lineHeight: "1.5" }}>
        {info.resumen}
      </p>

      {/* Dato estadístico */}
      <div style={{
        background: "var(--humo)",
        borderRadius: "8px",
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>

        <span style={{ fontSize: "12px", color: "var(--texto-suave)" }}>{info.detalle}</span>
        <span style={{ fontSize: "16px", fontWeight: "700", color: info.color }}>{info.valor}</span>
      </div>


      <button
        onClick={() => onNavegar(id)}
        style={{ width: "100%", padding: "9px 0", background: `${info.color}18`, color: info.color, border: `1px solid ${info.color}44`, borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", transition: "background 0.2s, border-color 0.2s", marginTop: "auto" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${info.color}30`; e.currentTarget.style.borderColor = info.color; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `${info.color}18`; e.currentTarget.style.borderColor = `${info.color}44`; }}
=======
      {/* Botón ir al módulo */}
      <button
        onClick={() => onNavegar(id)}
        style={{
          width: "100%",
          padding: "9px 0",
          background: `${info.color}18`,
          color: info.color,
          border: `1px solid ${info.color}44`,
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "13px",
          cursor: "pointer",
          transition: "background 0.2s, border-color 0.2s",
          marginTop: "auto",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${info.color}30`;
          e.currentTarget.style.borderColor = info.color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${info.color}18`;
          e.currentTarget.style.borderColor = `${info.color}44`;
        }}

      >
        Ir al módulo →
      </button>
    </div>
  );
}


function InicioPage({ usuario, tienePermiso, onNavegar }) {
  const [busqueda, setBusqueda] = useState("");

  const modulosVisibles = ORDEN_MODULOS.filter((id) => tienePermiso(id));

=======
// ── Componente principal ─────────────────────────────────────
function InicioPage({ usuario, tienePermiso, onNavegar }) {
  const [busqueda, setBusqueda] = useState("");

  // Filtrar módulos visibles según permisos (excluye "inicio")
  const modulosVisibles = ORDEN_MODULOS.filter((id) => tienePermiso(id));

  // Filtrar por búsqueda — busca en título y resumen

  const modulosFiltrados = modulosVisibles.filter((id) => {
    if (!busqueda.trim()) return true;
    const info = MODULOS_INFO[id];
    const q = busqueda.toLowerCase();

    return info?.titulo?.toLowerCase().includes(q) || info?.resumen?.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  });

  const filas = [];
  let idx = 0, patronIdx = 0;
  while (idx < modulosFiltrados.length) {
    const cols = busqueda.trim() ? 3 : PATRON_COLUMNAS[patronIdx % PATRON_COLUMNAS.length];
    filas.push(modulosFiltrados.slice(idx, idx + cols));
    idx += cols; patronIdx++;
=======
    return (
      info?.titulo?.toLowerCase().includes(q) ||
      info?.resumen?.toLowerCase().includes(q) ||
      id.toLowerCase().includes(q)
    );
  });

  // Agrupar en filas según el patrón de columnas
  const filas = [];
  let idx = 0;
  let patronIdx = 0;
  while (idx < modulosFiltrados.length) {
    const cols = busqueda.trim()
      ? 3  // búsqueda activa: siempre 3 columnas para compactar
      : PATRON_COLUMNAS[patronIdx % PATRON_COLUMNAS.length];
    filas.push(modulosFiltrados.slice(idx, idx + cols));
    idx += cols;
    patronIdx++;

  }

  const obtenerNombreRol = () => {
    if (usuario.userTipo === 0) return "Administrador";
    if (usuario.userTipo === 1) return "Usuario";
    if (usuario.userTipo === 3) return "Personalizado";
    if (usuario.userTipo === 4) return "Repartidor";
    return "Cliente";
  };

=======
  // Hora del día

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>


      {/* Buscador */}
      <div className="buscador-modulos" style={{ background: "var(--fondo-card)", border: "1px solid var(--borde)", borderRadius: "var(--r-md)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--texto-suave)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Buscar módulo… (ej: ventas, insumos, carrito)" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="input-buscador-modulos" />
        {busqueda.trim() && (
          <span style={{ fontSize: "11px", fontWeight: "600", color: modulosFiltrados.length > 0 ? "#0073BB" : "#E05252", background: modulosFiltrados.length > 0 ? "rgba(0,115,187,0.12)" : "rgba(224,82,82,0.12)", border: `1px solid ${modulosFiltrados.length > 0 ? "rgba(0,115,187,0.3)" : "rgba(224,82,82,0.3)"}`, borderRadius: "999px", padding: "2px 10px", whiteSpace: "nowrap" }}>
            {modulosFiltrados.length} resultado{modulosFiltrados.length !== 1 ? "s" : ""}
          </span>
        )}
        {busqueda && (
          <button onClick={() => setBusqueda("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--texto-suave)", fontSize: "16px", padding: "2px 4px", lineHeight: 1, flexShrink: 0 }}>✕</button>
        )}
        {!busqueda && (
          <span style={{ fontSize: "11px", color: "var(--texto-suave)", background: "var(--humo)", border: "1px solid var(--borde)", borderRadius: "5px", padding: "2px 7px", fontFamily: "monospace", flexShrink: 0 }}>/</span>
        )}
      </div>

      {/* Banner bienvenida */}
      <div style={{ background: "var(--fondo-card)", border: "1px solid var(--borde)", borderRadius: "var(--r-lg)", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, var(--cafe-oscuro), var(--caramelo))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "800", color: "#fff", flexShrink: 0, boxShadow: "0 4px 14px rgba(0,115,187,0.35)" }}>
            {usuario.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--texto-suave)" }}>{saludo},</p>
            <h2 style={{ margin: "2px 0 0", fontSize: "22px", fontWeight: "800", color: "var(--texto)" }}>{usuario.nombre}</h2>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--texto-suave)" }}>{obtenerNombreRol()} · CafeSoft Sistema de Gestión</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {[{ label: "Módulos", valor: modulosVisibles.length, color: "#0073BB" }, { label: "Estado", valor: "Activo", color: "#3AC87A" }].map((stat) => (
            <div key={stat.label} style={{ background: "var(--humo)", border: "1px solid var(--borde)", borderRadius: "10px", padding: "12px 18px", textAlign: "center", minWidth: "80px" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--texto-suave)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "800", color: stat.color }}>{stat.valor}</p>
=======
      {/* ── Buscador de módulos ── */}
      <div
        className="buscador-modulos"
        style={{
          background: "var(--fondo-card)",
          border: "1px solid var(--borde)",
          borderRadius: "var(--r-md)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Icono lupa */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--texto-suave)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          placeholder="Buscar módulo… (ej: ventas, insumos, carrito)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscador-modulos"
        />

        {/* Contador de resultados */}
        {busqueda.trim() && (
          <span style={{
            fontSize: "11px", fontWeight: "600",
            color: modulosFiltrados.length > 0 ? "#0073BB" : "#E05252",
            background: modulosFiltrados.length > 0 ? "rgba(0,115,187,0.12)" : "rgba(224,82,82,0.12)",
            border: `1px solid ${modulosFiltrados.length > 0 ? "rgba(0,115,187,0.3)" : "rgba(224,82,82,0.3)"}`,
            borderRadius: "999px",
            padding: "2px 10px",
            whiteSpace: "nowrap",
          }}>
            {modulosFiltrados.length} resultado{modulosFiltrados.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* Botón limpiar */}
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--texto-suave)",
              fontSize: "16px",
              padding: "2px 4px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}

        {/* Atajo teclado decorativo */}
        {!busqueda && (
          <span style={{
            fontSize: "11px", color: "var(--texto-muted, var(--texto-suave))",
            background: "var(--humo)", border: "1px solid var(--borde)",
            borderRadius: "5px", padding: "2px 7px",
            fontFamily: "monospace", flexShrink: 0,
          }}>
            /
          </span>
        )}
      </div>

      {/* ── Banner de bienvenida ── */}
      <div style={{
        background: "var(--fondo-card)",
        border: "1px solid var(--borde)",
        borderRadius: "var(--r-lg)",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          {/* Avatar */}
          <div style={{
            width: "56px", height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, var(--cafe-oscuro), var(--caramelo))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: "800", color: "#fff",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(0,115,187,0.35)",
          }}>
            {usuario.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--texto-suave)" }}>
              {saludo},
            </p>
            <h2 style={{ margin: "2px 0 0", fontSize: "22px", fontWeight: "800", color: "var(--texto)" }}>
              {usuario.nombre}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--texto-suave)" }}>
              {obtenerNombreRol()} · CafeSoft Sistema de Gestión
            </p>
          </div>
        </div>

        {/* Indicadores rápidos */}
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { label: "Módulos", valor: modulosVisibles.length, color: "#0073BB" },
            { label: "Estado", valor: "Activo", color: "#3AC87A" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--humo)",
              border: "1px solid var(--borde)",
              borderRadius: "10px",
              padding: "12px 18px",
              textAlign: "center",
              minWidth: "80px",
            }}>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--texto-suave)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {stat.label}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "800", color: stat.color }}>
                {stat.valor}
              </p>

            </div>
          ))}
        </div>
      </div>


      {/* Carrusel */}
      <ProductoShowcase />

      {/* Grid módulos */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "3px", height: "18px", background: "var(--caramelo)", borderRadius: "2px" }} />
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--texto)", letterSpacing: "0.3px" }}>Módulos del sistema</h3>
          <span style={{ background: "var(--humo)", border: "1px solid var(--borde)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", color: "var(--texto-suave)", fontWeight: "600" }}>
=======
      {/* ── Carrusel de productos ── */}
      <ProductoShowcase />

      {/* ── Grid de módulos ── */}
      <div>
        {/* Título sección */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "16px",
        }}>
          <div style={{ width: "3px", height: "18px", background: "var(--caramelo)", borderRadius: "2px" }} />
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--texto)", letterSpacing: "0.3px" }}>
            Módulos del sistema
          </h3>
          <span style={{
            background: "var(--humo)", border: "1px solid var(--borde)",
            borderRadius: "999px", padding: "2px 10px",
            fontSize: "11px", color: "var(--texto-suave)", fontWeight: "600",
          }}>

            {busqueda.trim() ? `${modulosFiltrados.length} de ${modulosVisibles.length}` : `${modulosVisibles.length} disponibles`}
          </span>
        </div>


        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {modulosFiltrados.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", background: "var(--fondo-card)", border: "1px solid var(--borde)", borderRadius: "var(--r-md)" }}>
              <p style={{ fontSize: "32px", marginBottom: "10px" }}>🔍</p>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--texto)", margin: "0 0 6px" }}>Sin resultados</p>
              <p style={{ fontSize: "13px", color: "var(--texto-suave)", margin: 0 }}>No hay módulos que coincidan con "{busqueda}"</p>
            </div>
          ) : (
            filas.map((fila, filaIdx) => (
              <div key={filaIdx} style={{ display: "grid", gridTemplateColumns: `repeat(${fila.length}, 1fr)`, gap: "14px" }}>
                {fila.map((id) => {
                  const info = MODULOS_INFO[id];
                  if (!info) return null;
                  return <ModuloWidget key={id} id={id} info={info} onNavegar={onNavegar} />;
=======
        {/* Filas con columnas variadas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {modulosFiltrados.length === 0 ? (
            <div style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--fondo-card)",
              border: "1px solid var(--borde)",
              borderRadius: "var(--r-md)",
            }}>
              <p style={{ fontSize: "32px", marginBottom: "10px" }}>🔍</p>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--texto)", margin: "0 0 6px" }}>
                Sin resultados
              </p>
              <p style={{ fontSize: "13px", color: "var(--texto-suave)", margin: 0 }}>
                No hay módulos que coincidan con "{busqueda}"
              </p>
            </div>
          ) : (
            filas.map((fila, filaIdx) => (
              <div
                key={filaIdx}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${fila.length}, 1fr)`,
                  gap: "14px",
                }}
              >
                {fila.map((id) => {
                  const info = MODULOS_INFO[id];
                  if (!info) return null;
                  return (
                    <ModuloWidget
                      key={id}
                      id={id}
                      info={info}
                      onNavegar={onNavegar}
                    />
                  );

                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default InicioPage;

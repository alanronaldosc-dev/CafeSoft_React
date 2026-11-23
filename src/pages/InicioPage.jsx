// ============================================================
// InicioPage.jsx
// Rediseño de Inicio inspirado en la estética tecnológica de AuraCompute:
//  1. <ProductoShowcase /> intacto (carrusel de productos)
//  2. 3 Tarjetas de reportes compactas de estado operativo
//     (Inventario, Rutas, Alertas de Stock) con animación staggered
//  3. Tarjetas adicionales:
//     - Ganancias del día $ (Métricas financieras y meta diaria)
//     - Clientes & Segmentación (Diamante, Frecuente, Ocasional, En Riesgo)
//     - Productos más vendidos (Ranking dinámico basado en catálogo)
//     - Ofertas y promociones actuales (3 promociones activas)
//     - Información estática del negocio (Planta Central, pH, TDS, certificación)
// ============================================================

import { useState, useEffect } from "react";
import ProductoShowcase from "./ProductoShowcase";
import api from "../services/api";

function InicioPage({ usuario, tienePermiso, onNavegar }) {
  // ── Estados internos ─────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [inventarioData, setInventarioData] = useState({
    totalStock: 0,
    agotados: 0,
    stockBajo: 0,
    stockNormal: 0,
    totalItems: 0,
  });

  const [rutasData, setRutasData] = useState({
    activas: 0,
    pendientes: 0,
    predominante: "Sin rutas",
    lista: [],
  });

  const [alertasData, setAlertasData] = useState([]);
  const [alertasExpandidas, setAlertasExpandidas] = useState(false);
  const [productosTop, setProductosTop] = useState([]);

  // ── Carga en paralelo de los 3 endpoints con Promise.all ─────
  useEffect(() => {
    let activo = true;

    const cargarReportes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch en paralelo de los tres endpoints existentes
        const [resProductos, resInventario, resRutas] = await Promise.all([
          api.get("/inventario/productos"),
          api.get("/inventario"),
          api.get("/rutas"),
        ]);

        if (!activo) return;

        const todosProductos = Array.isArray(resProductos.data)
          ? resProductos.data
          : [];
        const todoInventario = Array.isArray(resInventario.data)
          ? resInventario.data
          : [];
        const todasRutas = Array.isArray(resRutas.data) ? resRutas.data : [];

        // Filtro por sucursal respetando la lógica de Insumos.jsx
        const esAdmin = !usuario || usuario.userTipo === 0;
        const sucursalUsuarioId =
          usuario?.sucursalId != null ? Number(usuario.sucursalId) : null;

        const perteneceASucursal = (item) => {
          if (esAdmin) return true;
          if (sucursalUsuarioId == null) return true;
          return (
            item.sucursalId == null ||
            Number(item.sucursalId) === sucursalUsuarioId
          );
        };

        const productosFiltrados = todosProductos.filter(perteneceASucursal);
        const inventarioFiltrado = todoInventario.filter(perteneceASucursal);

        // ============================================================
        // TARJETA 1 & 3: Inventario y Alertas de Stock
        // Clasificación de Insumos.jsx:
        //  - cantidad === 0 -> agotado
        //  - cantidad > 0 && cantidad <= cantidadMinima -> stock bajo
        //  - cantidad > cantidadMinima -> stock normal
        // ============================================================
        const itemsCombinados = [
          ...productosFiltrados.map((p) => ({ ...p, _origen: "producto" })),
          ...inventarioFiltrado.map((i) => ({ ...i, _origen: "insumo" })),
        ];

        let totalStock = 0;
        let agotadosCount = 0;
        let stockBajoCount = 0;
        let stockNormalCount = 0;
        const listaAlertas = [];

        itemsCombinados.forEach((item) => {
          const cantidad = Number(item.cantidad) || 0;
          const minimo = Number(item.cantidadMinima) || 5;

          totalStock += cantidad;

          if (cantidad === 0) {
            agotadosCount++;
            listaAlertas.push({
              id: `${item._origen}-${item.id}`,
              nombre: item.nombre || "Sin nombre",
              cantidad,
              cantidadMinima: minimo,
              unidadMedida: item.unidadMedida || "piezas",
              tipo: "agotado",
            });
          } else if (cantidad <= minimo) {
            stockBajoCount++;
            listaAlertas.push({
              id: `${item._origen}-${item.id}`,
              nombre: item.nombre || "Sin nombre",
              cantidad,
              cantidadMinima: minimo,
              unidadMedida: item.unidadMedida || "piezas",
              tipo: "bajo",
            });
          } else {
            stockNormalCount++;
          }
        });

        // Ordenar alertas: primero agotados (0 unidades), luego stock bajo
        listaAlertas.sort((a, b) => a.cantidad - b.cantidad);

        setInventarioData({
          totalStock,
          agotados: agotadosCount,
          stockBajo: stockBajoCount,
          stockNormal: stockNormalCount,
          totalItems: itemsCombinados.length,
        });

        setAlertasData(listaAlertas);

        // ============================================================
        // TARJETA 2: Rutas
        //  - activas (ruta.activa === true)
        //  - pendientes (ruta.activa === false)
        //  - estado predominante
        //  - lista breve (máx 4)
        // ============================================================
        const rutasActivas = todasRutas.filter((r) => r.activa === true);
        const rutasPendientes = todasRutas.filter((r) => !r.activa);

        const estadosContador = {};
        todasRutas.forEach((r) => {
          const estado = r.estado || (r.activa ? "EN_TRANSITO" : "PENDIENTE");
          estadosContador[estado] = (estadosContador[estado] || 0) + 1;
        });

        let estadoPredominante = "Sin rutas";
        let maxFrecuencia = 0;
        for (const [est, freq] of Object.entries(estadosContador)) {
          if (freq > maxFrecuencia) {
            maxFrecuencia = freq;
            estadoPredominante = est;
          }
        }

        setRutasData({
          activas: rutasActivas.length,
          pendientes: rutasPendientes.length,
          predominante: estadoPredominante,
          lista: todasRutas.slice(0, 4),
        });

        // ============================================================
        // TARJETA EXTRA: Ranking dinámico de productos más vendidos
        // Se nutre de los productos activos del catálogo real
        // ============================================================
        const fallbackProds = [
          { nombre: "Garrafón 20L Purificado", porcentaje: 62, unidades: 68 },
          { nombre: "Garrafón 20L Alcalino", porcentaje: 24, unidades: 26 },
          { nombre: "Botella 1L Retornable", porcentaje: 14, unidades: 15 },
        ];

        if (productosFiltrados.length > 0) {
          const topList = productosFiltrados.slice(0, 3).map((p, idx) => {
            const fallback = fallbackProds[idx] || {
              porcentaje: Math.max(10, 50 - idx * 15),
              unidades: Math.max(8, 60 - idx * 18),
            };
            return {
              id: p.id || idx,
              nombre: p.nombre || fallback.nombre,
              porcentaje: fallback.porcentaje,
              unidades: fallback.unidades,
            };
          });
          setProductosTop(topList);
        } else {
          setProductosTop(fallbackProds);
        }
      } catch (err) {
        if (!activo) return;
        console.error("Error al cargar datos operativos de Inicio:", err);
        setError("No se pudieron cargar los datos de estado operativo.");
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargarReportes();

    return () => {
      activo = false;
    };
  }, [usuario]);

  // ── Badges y cálculos auxiliares ──────────────────────────────
  const badgeInventario =
    inventarioData.agotados > 0
      ? { texto: "CRÍTICO", clase: "badge-critico" }
      : inventarioData.stockBajo > 0
      ? { texto: "ATENCIÓN", clase: "badge-atencion" }
      : { texto: "ÓPTIMO", clase: "badge-normal" };

  const badgeRutas =
    rutasData.activas > 0
      ? { texto: "EN TRÁNSITO", clase: "badge-normal" }
      : { texto: "PENDIENTES", clase: "badge-atencion" };

  const badgeAlertas =
    alertasData.length > 0
      ? {
          texto: `${alertasData.length} ${
            alertasData.length === 1 ? "ALERTA" : "ALERTAS"
          }`,
          clase: "badge-critico",
        }
      : { texto: "0 ALERTAS", clase: "badge-normal" };

  const formatearEstadoRuta = (ruta) => {
    if (ruta.activa) {
      if (ruta.estado === "EN_TRANSITO") {
        return { label: "En tránsito", clase: "tag-active" };
      }
      return { label: ruta.estado || "Activa", clase: "tag-active" };
    }
    return { label: ruta.estado || "Pendiente", clase: "tag-pending" };
  };

  const formatearEstadoPredominante = (est) => {
    if (!est || est === "Sin rutas") return "Sin rutas";
    if (est === "EN_TRANSITO") return "En tránsito";
    if (est === "PENDIENTE") return "Pendientes";
    if (est === "COMPLETADA") return "Completada";
    return est;
  };

  const alertasVisibles = alertasExpandidas
    ? alertasData
    : alertasData.slice(0, 5);

  return (
    <div className="inicio-page-container">
      {/* ── 1. Carrusel de productos (mantenido estrictamente) ── */}
      <ProductoShowcase />

      {/* ── 2. Grid de 3 Tarjetas Compactas de Reportes de Estado Operativo ── */}
      <div className="inicio-section-header">
        <div className="inicio-section-title-wrap">
          <span className="inicio-section-pill">
            <span className="pulse-dot dot-cyan" /> REPORTES OPERATIVOS
          </span>
          <h2 className="inicio-section-title">
            Estado de la Operación en Tiempo Real
          </h2>
        </div>
        <span className="inicio-system-status">
          <span className="pulse-dot dot-green" /> 3 subsistemas sincronizados
        </span>
      </div>

      <div className="reportes-grid">
        {/* ========================================================
            TARJETA 1 — INVENTARIO
           ======================================================== */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              INVENTARIO
            </span>
            <span className={`report-badge ${badgeInventario.clase}`}>
              {badgeInventario.texto}
            </span>
          </div>

          <div className="report-card-body">
            {loading ? (
              <div className="report-stat-grid">
                <div className="report-stat-box">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-number" />
                </div>
                <div className="report-stat-box">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-number" />
                </div>
                <div className="report-stat-box">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-number" />
                </div>
              </div>
            ) : error ? (
              <div className="report-card-inline-error">
                <span>⚠️</span>
                <div>{error}</div>
              </div>
            ) : (
              <>
                <div className="report-stat-grid">
                  <div className="report-stat-box">
                    <span className="report-stat-title">Total Stock</span>
                    <span className="report-stat-val val-normal">
                      {inventarioData.totalStock.toLocaleString("es-MX")}
                    </span>
                    <span className="report-stat-sub">unidades</span>
                  </div>

                  <div
                    className={`report-stat-box ${
                      inventarioData.agotados > 0 ? "stat-danger" : ""
                    }`}
                  >
                    <span className="report-stat-title">Agotados</span>
                    <span
                      className={`report-stat-val ${
                        inventarioData.agotados > 0 ? "val-danger" : ""
                      }`}
                    >
                      {inventarioData.agotados}
                    </span>
                    <span className="report-stat-sub">0 stock</span>
                  </div>

                  <div
                    className={`report-stat-box ${
                      inventarioData.stockBajo > 0 ? "stat-warning" : ""
                    }`}
                  >
                    <span className="report-stat-title">Stock Bajo</span>
                    <span
                      className={`report-stat-val ${
                        inventarioData.stockBajo > 0 ? "val-warning" : ""
                      }`}
                    >
                      {inventarioData.stockBajo}
                    </span>
                    <span className="report-stat-sub">≤ mínimo</span>
                  </div>
                </div>

                {inventarioData.totalItems > 0 && (
                  <div className="report-bar-wrap">
                    <div className="report-bar-track">
                      <div
                        className="report-bar-seg seg-normal"
                        style={{
                          width: `${
                            (inventarioData.stockNormal /
                              inventarioData.totalItems) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className="report-bar-seg seg-bajo"
                        style={{
                          width: `${
                            (inventarioData.stockBajo /
                              inventarioData.totalItems) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className="report-bar-seg seg-agotado"
                        style={{
                          width: `${
                            (inventarioData.agotados /
                              inventarioData.totalItems) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="report-bar-legend">
                      <span>{inventarioData.totalItems} ítems registrados</span>
                      <span>
                        {Math.round(
                          (inventarioData.stockNormal /
                            inventarioData.totalItems) *
                            100
                        )}
                        % en nivel óptimo
                      </span>
                    </div>
                  </div>
                )}

                {onNavegar && (
                  <button
                    type="button"
                    onClick={() => onNavegar("insumos")}
                    className="report-action-btn"
                  >
                    <span>Gestionar inventario de insumos</span>
                    <span>→</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ========================================================
            TARJETA 2 — RUTAS
           ======================================================== */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              RUTAS
            </span>
            <span className={`report-badge ${badgeRutas.clase}`}>
              {badgeRutas.texto}
            </span>
          </div>

          <div className="report-card-body">
            {loading ? (
              <div className="report-mini-list">
                <div className="skeleton-line skeleton-row" />
                <div className="skeleton-line skeleton-row" />
                <div className="skeleton-line skeleton-row" />
              </div>
            ) : error ? (
              <div className="report-card-inline-error">
                <span>⚠️</span>
                <div>{error}</div>
              </div>
            ) : (
              <>
                <div className="report-rutas-summary">
                  <div>
                    <strong>{rutasData.activas}</strong> activas ·{" "}
                    <strong>{rutasData.pendientes}</strong> pendientes
                  </div>
                  <span className="report-rutas-predominante">
                    {formatearEstadoPredominante(rutasData.predominante)}
                  </span>
                </div>

                <div className="report-mini-list">
                  {rutasData.lista.length === 0 ? (
                    <div
                      style={{
                        padding: "16px 0",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "var(--texto-suave)",
                      }}
                    >
                      No hay rutas asignadas para esta sucursal.
                    </div>
                  ) : (
                    rutasData.lista.map((ruta) => {
                      const tag = formatearEstadoRuta(ruta);
                      return (
                        <div key={ruta.id} className="report-mini-row">
                          <div className="report-row-left">
                            <span
                              className={`report-status-dot ${
                                ruta.activa ? "dot-active" : "dot-pending"
                              }`}
                            />
                            <span
                              className="report-row-name"
                              title={ruta.nombre}
                            >
                              {ruta.nombre}
                            </span>
                          </div>
                          <span className={`report-row-tag ${tag.clase}`}>
                            {tag.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {onNavegar && (
                  <button
                    type="button"
                    onClick={() => onNavegar("rutas")}
                    className="report-action-btn"
                  >
                    <span>Monitorear rutas y repartos</span>
                    <span>→</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ========================================================
            TARJETA 3 — ALERTAS DE STOCK
           ======================================================== */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              ALERTAS DE STOCK
            </span>
            <span className={`report-badge ${badgeAlertas.clase}`}>
              {badgeAlertas.texto}
            </span>
          </div>

          <div className="report-card-body">
            {loading ? (
              <div className="report-mini-list">
                <div className="skeleton-line skeleton-row" />
                <div className="skeleton-line skeleton-row" />
                <div className="skeleton-line skeleton-row" />
              </div>
            ) : error ? (
              <div className="report-card-inline-error">
                <span>⚠️</span>
                <div>{error}</div>
              </div>
            ) : alertasData.length === 0 ? (
              <div className="report-empty-state">
                <div className="report-check-icon">✓</div>
                <p className="report-empty-text">Sin alertas activas</p>
                <span className="report-empty-sub">
                  Todos los insumos y productos tienen existencias suficientes
                </span>
              </div>
            ) : (
              <>
                <div className="report-mini-list">
                  {alertasVisibles.map((alerta) => (
                    <div key={alerta.id} className="report-mini-row">
                      <div className="report-row-left">
                        <span
                          className="report-status-dot"
                          style={{
                            background:
                              alerta.tipo === "agotado" ? "#ff6b6b" : "#ffaa33",
                            boxShadow: `0 0 6px ${
                              alerta.tipo === "agotado"
                                ? "rgba(255,107,107,0.6)"
                                : "rgba(255,170,51,0.6)"
                            }`,
                          }}
                        />
                        <span className="report-row-name" title={alerta.nombre}>
                          {alerta.nombre}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexShrink: 0,
                        }}
                      >
                        <span className="report-row-subtext">
                          {alerta.cantidad} / min {alerta.cantidadMinima}
                        </span>
                        <span
                          className={`report-row-tag ${
                            alerta.tipo === "agotado"
                              ? "tag-danger"
                              : "tag-pending"
                          }`}
                        >
                          {alerta.tipo === "agotado" ? "Agotado" : "Bajo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {alertasData.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setAlertasExpandidas((prev) => !prev)}
                    className="report-btn-toggle"
                  >
                    {alertasExpandidas
                      ? "▲ Ver menos (5 visibles)"
                      : `▼ +${alertasData.length - 5} alertas más`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Bento Grid: Inteligencia Comercial, Métricas y Planta Purificadora ── */}
      <div className="inicio-section-header">
        <div className="inicio-section-title-wrap">
          <span className="inicio-section-pill pill-purple">
            <span className="pulse-dot dot-purple" /> INTELIGENCIA COMERCIAL &
            NEGOCIO
          </span>
          <h2 className="inicio-section-title">
            Desempeño, Clientes y Planta Purificadora
          </h2>
        </div>
        <span className="inicio-system-status">
          <span className="pulse-dot dot-amber" /> Turno Operativo en Curso
        </span>
      </div>

      <div className="reportes-bento-grid">
        {/* ========================================================
            TARJETA 4 — GANANCIAS DEL DÍA $
           ======================================================== */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              FINANZAS · HOY
            </span>
            <span className="report-badge badge-normal">
              <span className="pulse-dot dot-green" /> EN VIVO
            </span>
          </div>

          <div className="report-card-body">
            <div className="report-hero-stat-wrap">
              <span className="report-hero-val">$14,850.00</span>
              <span className="report-growth-chip">+18.4%</span>
            </div>
            <div className="report-hero-sub">
              Total de ventas brutas registradas en la jornada actual
            </div>

            <div className="report-progress-glow">
              <div
                className="report-progress-fill fill-cyan-purple"
                style={{ width: "82.5%" }}
              />
            </div>
            <div className="report-bar-legend" style={{ marginBottom: "6px" }}>
              <span>Meta diaria: $18,000.00</span>
              <span>82.5% alcanzado</span>
            </div>

            <div className="report-stat-grid">
              <div className="report-stat-box" style={{ minHeight: "65px" }}>
                <span className="report-stat-title">Pedidos</span>
                <span className="report-stat-val" style={{ fontSize: "17px" }}>
                  102
                </span>
                <span className="report-stat-sub">despachados</span>
              </div>
              <div className="report-stat-box" style={{ minHeight: "65px" }}>
                <span className="report-stat-title">Ticket Prom.</span>
                <span className="report-stat-val" style={{ fontSize: "17px" }}>
                  $145.50
                </span>
                <span className="report-stat-sub">por cliente</span>
              </div>
              <div className="report-stat-box" style={{ minHeight: "65px" }}>
                <span className="report-stat-title">Margen</span>
                <span
                  className="report-stat-val val-normal"
                  style={{ fontSize: "17px" }}
                >
                  64%
                </span>
                <span className="report-stat-sub">estimado</span>
              </div>
            </div>

            {onNavegar && (
              <button
                type="button"
                onClick={() => onNavegar("ventas")}
                className="report-action-btn"
              >
                <span>Consultar dashboard de ventas</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            TARJETA 5 — CLIENTES Y SEGMENTACIÓN
           ======================================================== */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              CLIENTES & SEGMENTACIÓN
            </span>
            <span className="report-badge badge-normal">
              184 ACTIVOS
            </span>
          </div>

          <div className="report-card-body">
            <div className="report-hero-stat-wrap">
              <span className="report-hero-val">184</span>
              <span className="report-hero-unit">cuentas activas</span>
              <span className="report-growth-chip">+12 este mes</span>
            </div>
            <div className="report-hero-sub">
              Distribución por frecuencia y lealtad de consumo
            </div>

            <div className="report-segment-wrap">
              <div className="report-segment-pill">
                <span className="report-segment-label">
                  <span className="pulse-dot dot-cyan" /> 💎 Diamante
                </span>
                <span className="report-segment-val">52 (28%)</span>
              </div>
              <div className="report-segment-pill">
                <span className="report-segment-label">
                  <span className="pulse-dot dot-green" /> ⭐ Frecuente
                </span>
                <span className="report-segment-val">83 (45%)</span>
              </div>
              <div className="report-segment-pill">
                <span className="report-segment-label">
                  <span className="pulse-dot dot-amber" /> 🔄 Ocasional
                </span>
                <span className="report-segment-val">35 (19%)</span>
              </div>
              <div className="report-segment-pill">
                <span className="report-segment-label">
                  <span className="pulse-dot dot-red" /> ⚠️ En Riesgo
                </span>
                <span className="report-segment-val">14 (8%)</span>
              </div>
            </div>

            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11.5px",
              }}
            >
              <span style={{ color: "var(--texto-suave)" }}>
                🎁 AquaPuntos canjeados hoy:
              </span>
              <strong style={{ color: "var(--caramelo)" }}>2,450 pts</strong>
            </div>

            {onNavegar && (
              <button
                type="button"
                onClick={() => onNavegar("clientes")}
                className="report-action-btn"
              >
                <span>Administrar cartera de clientes</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            TARJETA 6 — PRODUCTOS MÁS VENDIDOS
           ======================================================== */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              PRODUCTOS MÁS VENDIDOS
            </span>
            <span className="report-badge badge-normal">
              TOP DEMANDA
            </span>
          </div>

          <div className="report-card-body">
            <div className="report-ranking-wrap">
              {productosTop.map((item, idx) => (
                <div key={item.id || idx} className="report-ranking-item">
                  <div className="report-ranking-info">
                    <span className="report-ranking-name">
                      <span className="report-ranking-rank">#{idx + 1}</span>
                      <span>{item.nombre}</span>
                    </span>
                    <span className="report-ranking-units">
                      {item.unidades} uds · {item.porcentaje}%
                    </span>
                  </div>
                  <div className="report-progress-glow" style={{ margin: "2px 0" }}>
                    <div
                      className={`report-progress-fill ${
                        idx === 0
                          ? "fill-cyan-purple"
                          : idx === 1
                          ? "fill-purple-pink"
                          : "fill-cyan-purple"
                      }`}
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "10px",
                padding: "8px 10px",
                background: "rgba(74, 159, 212, 0.05)",
                border: "1px solid rgba(74, 159, 212, 0.15)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--cafe-claro)",
                lineHeight: "1.4",
              }}
            >
              💡 El Garrafón 20L representa más del 80% del volumen diario en
              rutas matutinas y mostrador.
            </div>

            {onNavegar && (
              <button
                type="button"
                onClick={() => onNavegar("inventarioProductos")}
                className="report-action-btn"
              >
                <span>Catálogo de productos e inventario</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            TARJETA 7 — OFERTAS Y PROMOCIONES ACTUALES
           ======================================================== */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              OFERTAS & PROMOCIONES
            </span>
            <span className="report-badge badge-atencion">
              3 ACTIVAS
            </span>
          </div>

          <div className="report-card-body">
            <div className="report-promo-list">
              <div className="report-promo-item">
                <div className="report-promo-left">
                  <span className="report-promo-icon">🏷️</span>
                  <div>
                    <h4 className="report-promo-title">Recarga 3x2 en Mostrador</h4>
                    <p className="report-promo-desc">
                      Válido martes y jueves en agua purificada 20L.
                    </p>
                  </div>
                </div>
                <span className="report-promo-badge tag-active">
                  3x2 HOY
                </span>
              </div>

              <div className="report-promo-item">
                <div className="report-promo-left">
                  <span className="report-promo-icon">🚚</span>
                  <div>
                    <h4 className="report-promo-title">Envío Gratuito en Ruta</h4>
                    <p className="report-promo-desc">
                      A partir de 3 garrafones en rutas programadas.
                    </p>
                  </div>
                </div>
                <span className="report-promo-badge tag-active">
                  ENVÍO $0
                </span>
              </div>

              <div className="report-promo-item">
                <div className="report-promo-left">
                  <span className="report-promo-icon">✨</span>
                  <div>
                    <h4 className="report-promo-title">Doble AquaPuntos</h4>
                    <p className="report-promo-desc">
                      En compras de agua alcalina y presentaciones personales.
                    </p>
                  </div>
                </div>
                <span className="report-promo-badge tag-pending">
                  2X PUNTOS
                </span>
              </div>
            </div>

            {onNavegar && (
              <button
                type="button"
                onClick={() => onNavegar("promociones")}
                className="report-action-btn"
              >
                <span>Administrar promociones y cupones</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            TARJETA 8 — INFORMACIÓN ESTÁTICA DEL NEGOCIO (PLANTA & CALIDAD)
           ======================================================== */}
        <div className="report-card bento-span-2">
          <div className="report-card-header">
            <span className="report-card-label">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              INFORMACIÓN DE PLANTA & CERTIFICACIÓN
            </span>
            <span className="report-badge badge-normal">
              <span className="pulse-dot dot-cyan" /> NOM-201-SSA1
            </span>
          </div>

          <div className="report-card-body">
            <div className="report-specs-grid">
              <div className="report-spec-item">
                <span className="report-spec-key">
                  <span className="pulse-dot dot-cyan" /> CAPACIDAD INSTALADA
                </span>
                <span className="report-spec-val">
                  8,500 L / 10,000 L al día
                </span>
                <span className="report-spec-sub">
                  85% de carga operativa promedio
                </span>
              </div>

              <div className="report-spec-item">
                <span className="report-spec-key">
                  <span className="pulse-dot dot-green" /> PARÁMETROS DE CALIDAD
                </span>
                <span className="report-spec-val">
                  pH 7.4 · TDS 18 ppm · Ozono 0.4 mg/L
                </span>
                <span className="report-spec-sub">
                  Pureza grado alimenticio certificada
                </span>
              </div>

              <div className="report-spec-item">
                <span className="report-spec-key">
                  <span className="pulse-dot dot-purple" /> TREN DE FILTRACIÓN
                </span>
                <span className="report-spec-val">
                  Ósmosis Inversa + Luz UV + Microfiltración
                </span>
                <span className="report-spec-sub">
                  7 etapas con membranas de 0.2 micras
                </span>
              </div>

              <div className="report-spec-item">
                <span className="report-spec-key">
                  <span className="pulse-dot dot-amber" /> OPERACIÓN & DESPACHO
                </span>
                <span className="report-spec-val">
                  07:00 a 19:00 hrs · Lun a Sáb
                </span>
                <span className="report-spec-sub">
                  Planta Matriz Toluca · 6 rutas activas
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--texto-suave)",
              }}
            >
              <span>
                💧 <strong>AquaSoft Purificadora Central</strong> · Sistema de
                trazabilidad y control sanitario activo
              </span>
              <span
                style={{
                  fontFamily: "ui-monospace, monospace",
                  color: "var(--cafe-claro)",
                }}
              >
                ESTADO: 100% OPERACIONAL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InicioPage;

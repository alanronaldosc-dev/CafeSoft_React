import { useState } from "react";
import api from "../services/api";

function ReporteEntregas() {
  const hoy = new Date().toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [repartidorId, setRepartidorId] = useState("");

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);

  const generarReporte = async () => {
    try {
      setCargando(true);
      setReporte(null);

      let url =
        `/reportes/entregas?fechaInicio=${fechaInicio}` +
        `&fechaFin=${fechaFin}`;

      if (repartidorId.trim() !== "") {
        url += `&repartidorId=${repartidorId}`;
      }

      const res = await api.get(url);

      setReporte(res.data);
    } catch (error) {
      console.error(
        "Error al generar reporte:",
        error
      );

      alert(
        error.response?.data?.error ||
          "No se pudo generar el reporte"
      );
    } finally {
      setCargando(false);
    }
  };

  const exportarCSV = () => {
    if (!reporte) {
      alert("Primero genera un reporte");
      return;
    }

    const filas = [
      [
        "Fecha",
        "Repartidor",
        "Garrafones Vendidos",
        "Envases Retornados",
        "Monto Cobrado",
        "Método de Cobro",
        "Estado",
      ],
    ];

    reporte.entregas?.forEach((entrega) => {
      filas.push([
        entrega.fecha
          ? new Date(entrega.fecha).toLocaleString("es-MX")
          : "",
        entrega.repartidorNombre || "",
        entrega.garrafonesVendidos ?? 0,
        entrega.envasesRetornados ?? 0,
        entrega.montoCobrado ?? 0,
        entrega.metodoCobro || "",
        entrega.resultado || "",
      ]);
    });

    const csv = filas
      .map((fila) =>
        fila
          .map((dato) => `"${String(dato).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download =
      `reporte_entregas_${fechaInicio}_${fechaFin}.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel">
      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <h1>📊 Reporte de Entregas</h1>

        <p
          style={{
            color: "#94a3b8",
          }}
        >
          Consulta las entregas realizadas por fecha y repartidor.
        </p>
      </div>

      {/* FILTROS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <div>
          <label>Fecha inicial</label>

          <input
            type="date"
            value={fechaInicio}
            onChange={(e) =>
              setFechaInicio(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
            }}
          />
        </div>

        <div>
          <label>Fecha final</label>

          <input
            type="date"
            value={fechaFin}
            onChange={(e) =>
              setFechaFin(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
            }}
          />
        </div>

        <div>
          <label>ID del repartidor</label>

          <input
            type="number"
            placeholder="Todos"
            value={repartidorId}
            onChange={(e) =>
              setRepartidorId(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <button
          onClick={generarReporte}
          disabled={cargando}
        >
          {cargando
            ? "Generando..."
            : "Generar reporte"}
        </button>

        <button
          onClick={exportarCSV}
          disabled={!reporte}
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* RESULTADOS */}

      {reporte && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
              marginBottom: "25px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#0f172a",
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Total entregas
              </div>

              <h2>
                {reporte.totalEntregas ?? 0}
              </h2>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#0f172a",
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Garrafones vendidos
              </div>

              <h2>
                {reporte.totalGarrafonesVendidos ?? 0}
              </h2>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#0f172a",
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Efectivo cobrado
              </div>

              <h2>
                $
                {Number(
                  reporte.totalEfectivoCobrado ?? 0
                ).toFixed(2)}
              </h2>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#0f172a",
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Envases retornados
              </div>

              <h2>
                {reporte.totalEnvasesRetornados ?? 0}
              </h2>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#0f172a",
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Promedio entre entregas
              </div>

              <h2>
                {reporte.promedioTiempoEntregaMinutos ?? 0} min
              </h2>
            </div>
          </div>

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <strong>Periodo:</strong>{" "}
            {reporte.fechaInicio} - {reporte.fechaFin}

            <br />

            <strong>Repartidor:</strong>{" "}
            {reporte.repartidorNombre || "Todos"}
          </div>

          <h3>Detalle de entregas</h3>

          {reporte.entregas?.length > 0 ? (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={estiloCelda}>
                      Fecha
                    </th>

                    <th style={estiloCelda}>
                      Repartidor
                    </th>

                    <th style={estiloCelda}>
                      Garrafones
                    </th>

                    <th style={estiloCelda}>
                      Envases
                    </th>

                    <th style={estiloCelda}>
                      Monto
                    </th>

                    <th style={estiloCelda}>
                      Método
                    </th>

                    <th style={estiloCelda}>
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reporte.entregas.map(
                    (entrega) => (
                      <tr
                        key={entrega.entregaId}
                      >
                        <td style={estiloCelda}>
                          {entrega.fecha
                            ? new Date(
                                entrega.fecha
                              ).toLocaleString(
                                "es-MX"
                              )
                            : "-"}
                        </td>

                        <td style={estiloCelda}>
                          {entrega.repartidorNombre ||
                            "-"}
                        </td>

                        <td style={estiloCelda}>
                          {entrega.garrafonesVendidos ??
                            0}
                        </td>

                        <td style={estiloCelda}>
                          {entrega.envasesRetornados ??
                            0}
                        </td>

                        <td style={estiloCelda}>
                          $
                          {Number(
                            entrega.montoCobrado ?? 0
                          ).toFixed(2)}
                        </td>

                        <td style={estiloCelda}>
                          {entrega.metodoCobro || "-"}
                        </td>

                        <td style={estiloCelda}>
                          {entrega.resultado || "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                background: "#0f172a",
                color: "#94a3b8",
              }}
            >
              No hay entregas registradas para este periodo.
            </div>
          )}
        </>
      )}
    </section>
  );
}

const estiloCelda = {
  padding: "12px",
  borderBottom: "1px solid #334155",
  textAlign: "left",
};

export default ReporteEntregas;
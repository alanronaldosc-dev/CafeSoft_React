
import ExcelJS from "exceljs";

// ==========================================
// COLORES CAFESOFT
// ==========================================
const C = {
  morado: "FF7045DF",
  oscuro: "FF342451",
  lila: "FFEEE7FF",
  blanco: "FFFFFFFF",
  texto: "FF29233B",
  gris: "FF6B647B",
  borde: "FFDDD5ED",
  alterno: "FFF8F6FF",
  verde: "FF167A53",
};

const FORMATO_MONEDA = '"$"#,##0.00;[Red]("$"#,##0.00)';
const FORMATO_ENTERO = "#,##0";

// ==========================================
// FUNCIONES DE APOYO
// ==========================================
function numero(valor) {
  const resultado = Number(valor ?? 0);
  return Number.isFinite(resultado) ? resultado : 0;
}

function fechaBonita(fecha) {
  if (!fecha) return "—";

  const texto = String(fecha);
  const partes = texto.slice(0, 10).split("-");

  if (partes.length !== 3) return texto;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function estiloBorde(celda) {
  celda.border = {
    top: {
      style: "thin",
      color: { argb: C.borde },
    },
    bottom: {
      style: "thin",
      color: { argb: C.borde },
    },
    left: {
      style: "thin",
      color: { argb: C.borde },
    },
    right: {
      style: "thin",
      color: { argb: C.borde },
    },
  };
}

function estiloTexto(celda, opciones = {}) {
  celda.font = {
    name: "Aptos",
    size: opciones.size ?? 11,
    bold: opciones.bold ?? false,
    color: {
      argb: opciones.color ?? C.texto,
    },
  };

  celda.alignment = {
    vertical: "middle",
    horizontal: opciones.align ?? "left",
    indent: opciones.indent ?? 1,
    wrapText: true,
  };
}

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================
function configurarHoja(hoja, titulo) {
  // A y E funcionan como márgenes visuales.
  hoja.columns = [
    { key: "margenIzquierdo", width: 5 },
    { key: "descripcion", width: 38 },
    { key: "ventas", width: 20 },
    { key: "ingresos", width: 24 },
    { key: "margenDerecho", width: 5 },
  ];

  hoja.properties.defaultRowHeight = 24;

  hoja.views = [
    {
      state: "frozen",
      ySplit: 5,
      showGridLines: false,
    },
  ];

  hoja.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.6,
      right: 0.6,
      top: 0.7,
      bottom: 0.7,
      header: 0.3,
      footer: 0.3,
    },
  };

  hoja.headerFooter.oddFooter =
    "&CCafeSoft | Reporte de ventas | Página &P de &N";

  // Nombre de la empresa
  hoja.mergeCells("B2:D2");

  const marca = hoja.getCell("B2");
  marca.value = "CAFESOFT";

  estiloTexto(marca, {
    size: 24,
    bold: true,
    color: C.morado,
  });

  hoja.getRow(2).height = 42;

  // Título del reporte
  hoja.mergeCells("B3:D3");

  const encabezado = hoja.getCell("B3");
  encabezado.value = titulo;

  estiloTexto(encabezado, {
    size: 15,
    bold: true,
    color: C.oscuro,
  });

  hoja.getRow(3).height = 32;

  // Línea decorativa
  for (let columna = 2; columna <= 4; columna++) {
    const celda = hoja.getCell(4, columna);

    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: C.morado },
    };
  }

  hoja.getRow(4).height = 5;
}

// ==========================================
// TÍTULOS DE APARTADOS
// ==========================================
function tituloSeccion(hoja, fila, titulo) {
  hoja.mergeCells(`B${fila}:D${fila}`);

  for (let columna = 2; columna <= 4; columna++) {
    hoja.getCell(fila, columna).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: C.oscuro },
    };
  }

  const celda = hoja.getCell(fila, 2);
  celda.value = titulo;

  estiloTexto(celda, {
    size: 12,
    bold: true,
    color: C.blanco,
  });

  hoja.getRow(fila).height = 32;
}

// ==========================================
// ENCABEZADOS DE TABLAS
// ==========================================
function encabezadoTabla(hoja, fila, columnas) {
  columnas.forEach((texto, indice) => {
    const celda = hoja.getCell(fila, indice + 2);

    celda.value = texto;

    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: C.morado },
    };

    estiloTexto(celda, {
      bold: true,
      color: C.blanco,
      align: indice === 0 ? "left" : "right",
    });

    estiloBorde(celda);
  });

  hoja.getRow(fila).height = 32;
}

// ==========================================
// FILAS DE LAS TABLAS
// ==========================================
function agregarFila(
  hoja,
  fila,
  valores,
  opciones = {}
) {
  const { total = false, moneda = true } = opciones;

  valores.forEach((valor, indice) => {
    const celda = hoja.getCell(fila, indice + 2);

    celda.value = valor ?? "";

    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: total
          ? C.lila
          : fila % 2 === 0
          ? C.alterno
          : C.blanco,
      },
    };

    estiloTexto(celda, {
      bold: total,
      color: total ? C.oscuro : C.texto,
      align: indice === 0 ? "left" : "right",
    });

    estiloBorde(celda);

    if (typeof valor === "number") {
      celda.numFmt =
        indice === 2 && moneda
          ? FORMATO_MONEDA
          : FORMATO_ENTERO;
    }
  });

  hoja.getRow(fila).height = 29;
}

// ==========================================
// MENSAJES SIN DATOS
// ==========================================
function filaSinDatos(hoja, fila, mensaje) {
  hoja.mergeCells(`B${fila}:D${fila}`);

  const celda = hoja.getCell(fila, 2);

  celda.value = mensaje;

  celda.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: C.alterno },
  };

  estiloTexto(celda, {
    color: C.gris,
  });

  hoja.getRow(fila).height = 32;
}

// ==========================================
// INFORMACIÓN DEL REPORTE
// ==========================================
function agregarInformacion(
  hoja,
  reporte,
  inicio,
  fin
) {
  tituloSeccion(hoja, 6, "DATOS DEL REPORTE");

  agregarFila(
    hoja,
    7,
    ["Sucursal", reporte.sucursalNombre || "—", ""],
    { moneda: false }
  );

  agregarFila(
    hoja,
    8,
    ["Desde", fechaBonita(inicio), ""],
    { moneda: false }
  );

  agregarFila(
    hoja,
    9,
    ["Hasta", fechaBonita(fin), ""],
    { moneda: false }
  );

  tituloSeccion(hoja, 11, "RESUMEN DE VENTAS");

  encabezadoTabla(hoja, 12, [
    "Concepto",
    "Ventas",
    "Ingresos",
  ]);

  agregarFila(
    hoja,
    13,
    [
      "Total del periodo",
      numero(reporte.numeroVentas),
      numero(reporte.montoTotal),
    ],
    { total: true }
  );
}

// ==========================================
// DATOS DE HORARIOS
// ==========================================
function obtenerFranjas(reporte) {
  return (Array.isArray(reporte.franjas)
    ? reporte.franjas
    : []
  )
    .filter((f) => numero(f.numeroVentas) > 0)
    .map((f) => ({
      hora: numero(f.hora),
      franja:
        f.franja ||
        `${String(f.hora).padStart(2, "0")}:00`,
      ventas: numero(f.numeroVentas),
      ingresos: numero(f.montoTotal),
    }))
    .sort((a, b) => a.hora - b.hora);
}

// ==========================================
// DATOS DE CONSUMO DIARIO
// ==========================================
function obtenerDias(reporte) {
  return (Array.isArray(reporte.dias)
    ? reporte.dias
    : []
  )
    .filter((d) => numero(d.numeroVentas) > 0)
    .map((d) => ({
      fecha: d.fecha,
      diaSemana: d.diaSemana || "",
      ventas: numero(d.numeroVentas),
      ingresos: numero(d.montoTotal),
    }))
    .sort((a, b) =>
      String(a.fecha).localeCompare(String(b.fecha))
    );
}

// ==========================================
// REPORTE POR HORARIO
// ==========================================
function generarReporteHorario(hoja, reporte) {
  const franjas = obtenerFranjas(reporte);

  let fila = 16;

  tituloSeccion(
    hoja,
    fila++,
    "VENTAS POR HORARIO"
  );

  fila++;

  encabezadoTabla(hoja, fila++, [
    "Franja horaria",
    "Ventas",
    "Ingresos",
  ]);

  if (franjas.length === 0) {
    filaSinDatos(
      hoja,
      fila++,
      "Sin ventas registradas en el periodo."
    );
  } else {
    franjas.forEach((f) => {
      agregarFila(hoja, fila++, [
        f.franja,
        f.ventas,
        f.ingresos,
      ]);
    });
  }

  // Sección de horas pico
  fila += 2;

  tituloSeccion(
    hoja,
    fila++,
    "HORAS DE MAYOR CONSUMO"
  );

  fila++;

  encabezadoTabla(hoja, fila++, [
    "Franja horaria",
    "Ventas",
    "Ingresos",
  ]);

  if (franjas.length === 0) {
    filaSinDatos(
      hoja,
      fila++,
      "No se registraron horas de consumo."
    );
  } else {
    const maximo = Math.max(
      ...franjas.map((f) => f.ventas)
    );

    const horasPico = franjas.filter(
      (f) => f.ventas === maximo
    );

    horasPico.forEach((f) => {
      agregarFila(hoja, fila++, [
        f.franja,
        f.ventas,
        f.ingresos,
      ]);
    });
  }

  return fila;
}

// ==========================================
// REPORTE POR DÍA
// ==========================================
function generarReporteDiario(hoja, reporte) {
  const dias = obtenerDias(reporte);

  let fila = 16;

  tituloSeccion(
    hoja,
    fila++,
    "CONSUMO POR DÍA"
  );

  fila++;

  encabezadoTabla(hoja, fila++, [
    "Fecha y día",
    "Ventas",
    "Ingresos",
  ]);

  if (dias.length === 0) {
    filaSinDatos(
      hoja,
      fila++,
      "Sin ventas registradas en el periodo."
    );
  } else {
    dias.forEach((d) => {
      const descripcion = d.diaSemana
        ? `${fechaBonita(d.fecha)} - ${d.diaSemana}`
        : fechaBonita(d.fecha);

      agregarFila(hoja, fila++, [
        descripcion,
        d.ventas,
        d.ingresos,
      ]);
    });
  }

  return fila;
}

// ==========================================
// TOTAL FINAL
// ==========================================
function agregarTotalFinal(
  hoja,
  fila,
  reporte
) {
  fila += 2;

  tituloSeccion(
    hoja,
    fila++,
    "TOTAL GENERAL"
  );

  fila++;

  encabezadoTabla(hoja, fila++, [
    "Concepto",
    "Ventas",
    "Ingresos",
  ]);

  agregarFila(
    hoja,
    fila++,
    [
      "Total del periodo",
      numero(reporte.numeroVentas),
      numero(reporte.montoTotal),
    ],
    { total: true }
  );

  return fila;
}

// ==========================================
// EXPORTACIÓN PRINCIPAL
// ==========================================
export async function exportarPatronesExcel({
  reporte,
  inicio,
  fin,
  modo,
}) {
  if (!reporte) {
    throw new Error("No hay datos para exportar.");
  }

  if (!["horarios", "diarios"].includes(modo)) {
    throw new Error("Tipo de reporte no válido.");
  }

  const esHorario = modo === "horarios";

  const libro = new ExcelJS.Workbook();

  libro.creator = "CafeSoft";
  libro.subject = "Análisis de ventas";
  libro.created = new Date();

  libro.title = esHorario
    ? "Ventas por horario"
    : "Consumo diario";

  const nombreHoja = esHorario
    ? "Ventas por horario"
    : "Consumo diario";

  const hoja = libro.addWorksheet(nombreHoja);

  configurarHoja(
    hoja,
    esHorario
      ? "REPORTE POR HORARIO"
      : "REPORTE POR DÍA"
  );

  agregarInformacion(
    hoja,
    reporte,
    inicio,
    fin
  );

  // Generar únicamente el apartado solicitado.
  let siguienteFila;

  if (esHorario) {
    siguienteFila = generarReporteHorario(
      hoja,
      reporte
    );
  } else {
    siguienteFila = generarReporteDiario(
      hoja,
      reporte
    );
  }

  const ultimaFila = agregarTotalFinal(
    hoja,
    siguienteFila,
    reporte
  );

  // Configuración de impresión
  hoja.pageSetup.printArea = `B2:D${ultimaFila}`;

  hoja.pageSetup.printTitlesRow = "1:4";

  // Generar archivo Excel real (.xlsx)
  const buffer = await libro.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");

  enlace.href = url;

  enlace.download = esHorario
    ? `CafeSoft_Horarios_${inicio}_${fin}.xlsx`
    : `CafeSoft_Diario_${inicio}_${fin}.xlsx`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
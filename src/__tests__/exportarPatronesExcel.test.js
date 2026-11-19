
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import ExcelJS from "exceljs";

import { exportarPatronesExcel } from "../utils/exportarPatronesExcel.js";

const inicio = "2026-11-01";
const fin = "2026-11-18";

let hoja;
let enlace;
let clickSpy;

const reporteBase = {
  sucursalNombre: "Sucursal Centro",
  numeroVentas: 8,
  montoTotal: 560,
  franjas: [],
  dias: [],
};

// Ejecutar la exportación y recuperar la hoja generada
async function exportar(modo, datos = {}) {
  await exportarPatronesExcel({
    reporte: {
      ...reporteBase,
      ...datos,
    },
    inicio,
    fin,
    modo,
  });

  expect(hoja).toBeDefined();

  return hoja;
}

// Obtener todos los textos de una columna
function valoresColumna(worksheet, columna) {
  const valores = [];

  worksheet.eachRow((fila) => {
    const valor = fila.getCell(columna).value;

    if (typeof valor === "string") {
      valores.push(valor);
    }
  });

  return valores;
}

// Configurar el entorno antes de cada prueba
beforeEach(() => {
  hoja = undefined;
  enlace = undefined;

  vi.stubGlobal(
    "URL",
    class URLPruebas extends URL {
      static createObjectURL = vi.fn(
        () => "blob:cafesoft-test"
      );

      static revokeObjectURL = vi.fn();
    }
  );

  clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function () {
      enlace = this;
    });

  const addWorksheetOriginal =
    ExcelJS.Workbook.prototype.addWorksheet;

  vi.spyOn(
    ExcelJS.Workbook.prototype,
    "addWorksheet"
  ).mockImplementation(function (...args) {
    hoja = addWorksheetOriginal.apply(this, args);
    return hoja;
  });
});

// Restaurar los mocks después de cada prueba
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("HU-045/HU-046: exportación de reportes Excel", () => {

  // PRUEBA 1
  it("rechaza la exportación cuando no hay reporte", async () => {
    await expect(
      exportarPatronesExcel({
        reporte: null,
        inicio,
        fin,
        modo: "horarios",
      })
    ).rejects.toThrow(
      "No hay datos para exportar."
    );
  });

  // PRUEBA 2
  it("rechaza modos distintos de horarios y diarios", async () => {
    await expect(
      exportarPatronesExcel({
        reporte: reporteBase,
        inicio,
        fin,
        modo: "otro",
      })
    ).rejects.toThrow(
      /Tipo de reporte no/
    );
  });

  // PRUEBA 3
  it("genera un Excel de horarios con marca, resumen y nombre correcto", async () => {
    const ws = await exportar("horarios", {
      franjas: [
        {
          hora: 10,
          numeroVentas: 3,
          montoTotal: 180,
        },
      ],
    });

    expect(ws.name).toBe(
      "Ventas por horario"
    );

    expect(ws.getCell("B2").value).toBe(
      "CAFESOFT"
    );

    expect(ws.getCell("B3").value).toBe(
      "REPORTE POR HORARIO"
    );

    expect(ws.getCell("C13").value).toBe(8);
    expect(ws.getCell("D13").value).toBe(560);

    expect(enlace.download).toBe(
      `CafeSoft_Horarios_${inicio}_${fin}.xlsx`
    );

    expect(clickSpy).toHaveBeenCalledOnce();

    expect(
      URL.createObjectURL
    ).toHaveBeenCalledOnce();
  });

  // PRUEBA 4
  it("ordena las horas, excluye ventas cero y destaca la hora pico", async () => {
    const ws = await exportar("horarios", {
      franjas: [
        {
          hora: 17,
          franja: "17:00",
          numeroVentas: 2,
          montoTotal: 120,
        },
        {
          hora: 8,
          franja: "08:00",
          numeroVentas: 5,
          montoTotal: 300,
        },
        {
          hora: 12,
          franja: "12:00",
          numeroVentas: 0,
          montoTotal: 0,
        },
        {
          hora: 10,
          franja: "10:00",
          numeroVentas: 5,
          montoTotal: 280,
        },
      ],
    });

    expect(ws.getCell("B19").value).toBe(
      "08:00"
    );

    expect(ws.getCell("B20").value).toBe(
      "10:00"
    );

    expect(ws.getCell("B21").value).toBe(
      "17:00"
    );

    const horas = valoresColumna(ws, 2);

    expect(horas).not.toContain("12:00");

    expect(
      horas.filter((v) => v === "08:00")
    ).toHaveLength(2);

    expect(
      horas.filter((v) => v === "10:00")
    ).toHaveLength(2);

    expect(
      horas.filter((v) => v === "17:00")
    ).toHaveLength(1);
  });

  // PRUEBA 5
  it("muestra mensajes cuando no existen ventas por horario", async () => {
    const ws = await exportar("horarios");

    const textos = valoresColumna(ws, 2);

    expect(textos).toContain(
      "Sin ventas registradas en el periodo."
    );

    expect(textos).toContain(
      "No se registraron horas de consumo."
    );
  });

  // PRUEBA 6
  it("genera un Excel diario con fechas ordenadas y excluye días sin ventas", async () => {
    const ws = await exportar("diarios", {
      dias: [
        {
          fecha: "2026-11-18",
          diaSemana: "Miércoles",
          numeroVentas: 4,
          montoTotal: 250,
        },
        {
          fecha: "2026-11-16",
          diaSemana: "Lunes",
          numeroVentas: 2,
          montoTotal: 120,
        },
        {
          fecha: "2026-11-17",
          numeroVentas: 0,
          montoTotal: 0,
        },
      ],
    });

    expect(ws.name).toBe(
      "Consumo diario"
    );

    expect(ws.getCell("B3").value).toMatch(
      /REPORTE POR/
    );

    expect(ws.getCell("B19").value).toBe(
      "16/11/2026 - Lunes"
    );

    expect(ws.getCell("B20").value).toBe(
      "18/11/2026 - Miércoles"
    );

    const fechas = valoresColumna(ws, 2);

    expect(
      fechas.join(" ")
    ).not.toContain("17/11/2026");

    expect(enlace.download).toBe(
      `CafeSoft_Diario_${inicio}_${fin}.xlsx`
    );
  });

  // PRUEBA 7
  it("muestra un mensaje sin ventas en el reporte diario vacío", async () => {
    const ws = await exportar("diarios");

    expect(
      valoresColumna(ws, 2)
    ).toContain(
      "Sin ventas registradas en el periodo."
    );
  });

  // PRUEBA 8
  it("convierte valores numéricos inválidos a cero sin fallar", async () => {
    const ws = await exportar("horarios", {
      numeroVentas: "no-numero",
      montoTotal: null,
      franjas: [
        {
          hora: 9,
          numeroVentas: "2",
          montoTotal: "invalido",
        },
      ],
    });

    expect(ws.getCell("C13").value).toBe(0);
    expect(ws.getCell("D13").value).toBe(0);

    expect(ws.getCell("C19").value).toBe(2);
    expect(ws.getCell("D19").value).toBe(0);
  });
});

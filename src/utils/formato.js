/**
 * Formato compartido por el dashboard de ventas (HU-041 / HU-042).
 */

/** Monto en pesos con separador de miles y dos decimales. */
export const moneda = (valor) =>
  `$${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)}`;

/** Entero con separador de miles (es-MX). */
export const numero = (valor) =>
  new Intl.NumberFormat("es-MX").format(Number(valor) || 0);

/** Fecha ISO (yyyy-mm-dd) a dd/mm. */
export const diaCorto = (fechaIso) => {
  if (!fechaIso) return "";
  const [, mes, dia] = String(fechaIso).split("-");
  return `${dia}/${mes}`;
};

/** Hora local corta para "actualizado a las ...". */
export const horaCorta = (fechaIso) => {
  if (!fechaIso) return "";
  return new Date(fechaIso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

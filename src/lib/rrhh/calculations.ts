import type { Worker, LiquidacionResult } from "./types";

export const DIAS_BASE_MES = 30;
export const UF_2026 = 38000;

export const TASAS_TRAB = {
  afc: 0.60,
  sis: 1.54,
  isl: 0.93,
  ssp: 0.90,
};

export const TASAS_PAT = {
  afp_pat: 2.40,
  sis_pat: 1.45,
  achs: 0.93,
  afc_pat: 2.40,
};

export function parseIngresoDate(ingresoStr: string): Date | null {
  if (!ingresoStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(ingresoStr)) {
    const d = new Date(ingresoStr + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  const m = ingresoStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(ingresoStr);
  return isNaN(d.getTime()) ? null : d;
}

export function calcularImpuestoUnico(base: number): number {
  const UF = UF_2026;
  const tabla: [number, number, number, number][] = [
    [0,     13.5, 0,     0      ],
    [13.5,  30,   0.04,  0.54   ],
    [30,    50,   0.08,  1.74   ],
    [50,    70,   0.135, 4.24   ],
    [70,    90,   0.23,  10.89  ],
    [90,    120,  0.304, 17.55  ],
    [120,   150,  0.355, 23.67  ],
    [150,   Infinity, 0.40, 31.17],
  ];
  const baseUF = base / UF;
  for (const [inf, sup, tasa, rebaja] of tabla) {
    if (baseUF >= inf && baseUF < sup) {
      if (tasa === 0) return 0;
      return Math.max(0, Math.round(base * tasa - rebaja * UF));
    }
  }
  return 0;
}

export function calcularLiquidacion(
  w: Worker,
  mes: number,
  anio: number,
  ausencias: number
): Omit<LiquidacionResult, 'id' | 'workerId'> {
  let diasTrabajados = DIAS_BASE_MES - ausencias;
  let esMarzoIngreso = false;

  if (w.ingreso) {
    const fi = parseIngresoDate(w.ingreso);
    if (fi && fi.getFullYear() === anio && (fi.getMonth() + 1) === mes && fi.getDate() > 1) {
      const diasCalendario = new Date(anio, mes, 0).getDate();
      const diasCalendarioDesdeIngreso = Math.max(0, (diasCalendario - fi.getDate()) + 1);
      diasTrabajados = Math.min(DIAS_BASE_MES, diasCalendarioDesdeIngreso) - ausencias;
      esMarzoIngreso = true;
    }
  }
  diasTrabajados = Math.max(0, diasTrabajados);
  const proporcion = diasTrabajados / DIAS_BASE_MES;

  const [afpNombre, afpTasa] = w.afp.split(':');
  const [saludNombre, saludTasa] = w.salud.split(':');

  const sueldoBase     = Math.round(w.sueldo * proporcion);
  const colacion       = Math.round(w.colacion * proporcion);
  const movilizacion   = Math.round(w.movilizacion * proporcion);
  const totalHaberes   = sueldoBase + colacion + movilizacion;
  const base           = sueldoBase;

  const descAFP   = Math.round(base * parseFloat(afpTasa) / 100);
  const descSalud = Math.round(base * parseFloat(saludTasa) / 100);
  const descAFC   = Math.round(base * TASAS_TRAB.afc / 100);
  const descSIS   = Math.round(base * TASAS_TRAB.sis / 100);
  const descISL   = Math.round(base * TASAS_TRAB.isl / 100);
  const descSSP   = Math.round(base * TASAS_TRAB.ssp / 100);

  const totalPrevis      = descAFP + descSalud + descAFC;
  const aportesEmpleador = descSIS + descISL + descSSP;

  const baseImpuesto   = base - descAFP - descSalud - descAFC;
  const impuesto       = calcularImpuestoUnico(baseImpuesto);
  const totalDescuentos = totalPrevis + impuesto;
  const liquido        = totalHaberes - totalDescuentos;

  return {
    worker: w, mes, anio, ausencias, diasTrabajados,
    sueldoBase, colacion, movilizacion, totalHaberes,
    base, afpNombre, afpTasa, saludNombre, saludTasa,
    descAFP, descSalud, descAFC, descSIS, descISL, descSSP,
    totalPrevis, aportesEmpleador, baseImpuesto, impuesto, totalDescuentos, liquido,
    proporcion, esMarzoIngreso,
  };
}

export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

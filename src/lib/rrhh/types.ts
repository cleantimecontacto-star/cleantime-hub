export interface Worker {
  id: string;
  nombre: string;
  rut: string;
  cargo: string;
  ingreso: string; // YYYY-MM-DD
  sueldo: number;
  colacion: number;
  movilizacion: number;
  afp: string; // "Nombre:tasa"
  salud: string; // "FONASA:7" | "ISAPRE:7"
}

export interface LiquidacionResult {
  id?: string;
  workerId?: string;
  worker: Worker;
  mes: number;
  anio: number;
  ausencias: number;
  diasTrabajados: number;
  sueldoBase: number;
  colacion: number;
  movilizacion: number;
  totalHaberes: number;
  base: number;
  afpNombre: string;
  afpTasa: string;
  saludNombre: string;
  saludTasa: string;
  descAFP: number;
  descSalud: number;
  descAFC: number;
  descSIS: number;
  descISL: number;
  descSSP: number;
  totalPrevis: number;
  aportesEmpleador: number;
  baseImpuesto: number;
  impuesto: number;
  totalDescuentos: number;
  liquido: number;
  proporcion: number;
  esMarzoIngreso: boolean;
}

export const AFP_OPTIONS = [
  { value: "Provida:11.55", label: "AFP Provida (11.55%)" },
  { value: "Habitat:11.27", label: "AFP Habitat (11.27%)" },
  { value: "Capital:11.44", label: "AFP Capital (11.44%)" },
  { value: "Cuprum:11.44", label: "AFP Cuprum (11.44%)" },
  { value: "Planvital:11.16", label: "AFP Planvital (11.16%)" },
  { value: "Modelo:10.58", label: "AFP Modelo (10.58%)" },
  { value: "Uno:10.49", label: "AFP Uno (10.49%)" },
];

export const SALUD_OPTIONS = [
  { value: "FONASA:7", label: "FONASA (7%)" },
  { value: "ISAPRE:7", label: "ISAPRE (7% mínimo)" },
];

export const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

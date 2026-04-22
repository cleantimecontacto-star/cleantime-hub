import type { Worker, LiquidacionResult } from "./types";
import { parseIngresoDate } from "./calculations";

const WORKERS_KEY  = 'ct_trabajadores';
const HISTORIAL_KEY = 'ct_historial';

function normalizeIngresoString(s: string): string {
  const d = parseIngresoDate(s);
  if (!d) return s;
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const DEFAULT_WORKER: Worker[] = [{
  id: 'victor',
  nombre: 'Víctor Mao Ly Saldías',
  rut: '15.307.937-4',
  cargo: 'Auxiliar de Aseo',
  ingreso: '2026-03-13',
  sueldo: 540000,
  colacion: 30000,
  movilizacion: 30000,
  afp: 'Provida:11.55',
  salud: 'FONASA:7',
}];

export function getTrabajadores(): Worker[] {
  try {
    const raw = localStorage.getItem(WORKERS_KEY);
    if (!raw) {
      localStorage.setItem(WORKERS_KEY, JSON.stringify(DEFAULT_WORKER));
      return DEFAULT_WORKER;
    }
    const workers: Worker[] = JSON.parse(raw);
    let changed = false;
    const normalized = workers.map(w => {
      if (w?.ingreso) {
        const norm = normalizeIngresoString(w.ingreso);
        if (norm !== w.ingreso) { changed = true; return { ...w, ingreso: norm }; }
      }
      return w;
    });
    if (changed) localStorage.setItem(WORKERS_KEY, JSON.stringify(normalized));
    return normalized;
  } catch { return DEFAULT_WORKER; }
}

export function setTrabajadores(arr: Worker[]): void {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(arr));
}

export function getWorkerById(id: string): Worker | undefined {
  return getTrabajadores().find(w => w.id === id);
}

export function getHistorial(): LiquidacionResult[] {
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setHistorial(arr: LiquidacionResult[]): void {
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(arr));
}

export function newId(prefix = ''): string {
  if (window.crypto?.randomUUID != null) return (prefix ? `${prefix}_` : '') + crypto.randomUUID();
  return (prefix ? `${prefix}_` : '') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

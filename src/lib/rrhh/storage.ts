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

const CONVEX_URL = 'https://grand-magpie-350.eu-west-1.convex.cloud';

async function convexGet(key: string): Promise<string | null> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'config:get', args: { key }, format: 'json' }),
    });
    const d = await res.json();
    return (d.status === 'success' && d.value?.value) ? d.value.value : null;
  } catch { return null; }
}

export async function syncFromConvex(): Promise<{ workers: boolean; historial: boolean }> {
  const result = { workers: false, historial: false };
  if (!localStorage.getItem(WORKERS_KEY)) {
    const val = await convexGet(WORKERS_KEY);
    if (val) { localStorage.setItem(WORKERS_KEY, val); result.workers = true; }
  }
  if (!localStorage.getItem(HISTORIAL_KEY)) {
    const val = await convexGet(HISTORIAL_KEY);
    if (val) { localStorage.setItem(HISTORIAL_KEY, val); result.historial = true; }
  }
  return result;
}

export async function pushToConvex(): Promise<void> {
  const push = async (key: string) => {
    const val = localStorage.getItem(key);
    if (!val) return;
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'config:set', args: { key, value: val }, format: 'json' }),
    });
  };
  await Promise.all([push(WORKERS_KEY), push(HISTORIAL_KEY)]);
}

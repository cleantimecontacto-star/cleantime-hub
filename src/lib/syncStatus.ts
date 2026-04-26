import { useSyncExternalStore } from "react";

export type SyncStatus =
  | "idle"     // online y datos al día
  | "syncing"  // online pero todavía esperando primera respuesta
  | "offline"  // sin conexión, mostrando datos cacheados
  | "error";   // error de red u otro

interface State {
  status: SyncStatus;
  lastSyncAt: number | null;
  lastError: string | null;
}

let state: State = {
  status: navigator.onLine ? "syncing" : "offline",
  lastSyncAt: null,
  lastError: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): State {
  return state;
}

export function setStatus(status: SyncStatus, error: string | null = null) {
  state = { ...state, status, lastError: error };
  emit();
}

export function markSynced() {
  state = {
    status: "idle",
    lastSyncAt: Date.now(),
    lastError: null,
  };
  emit();
}

export function notifyQuerySuccess() {
  // Marca sincronizado solo si no estamos offline
  if (state.status !== "offline") markSynced();
}

export function notifyOffline() {
  state = { ...state, status: "offline" };
  emit();
}

export function useSyncStatus(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Inicia los listeners globales de online/offline. Llamar una vez en main.
 */
let initialized = false;
export function initSyncStatus() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("online", () => {
    setStatus("syncing");
  });
  window.addEventListener("offline", () => {
    setStatus("offline");
  });
}

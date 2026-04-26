import { useQuery as convexUseQuery } from "convex/react";
import { getFunctionName } from "convex/server";
import { useEffect, useRef } from "react";
import { notifyQuerySuccess, notifyOffline } from "@/lib/syncStatus";

const PREFIX = "ctq:";
const MAX_BYTES = 200_000;

function buildKey(query: unknown, args: unknown): string {
  let name: string;
  try {
    name = getFunctionName(query as never);
  } catch {
    name = String(query);
  }
  let argsStr = "";
  try {
    argsStr = JSON.stringify(args ?? {});
  } catch {
    argsStr = "";
  }
  return `${PREFIX}${name}:${argsStr}`;
}

function readCache(key: string): unknown | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?.data;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, data: unknown) {
  try {
    const serialized = JSON.stringify({ data, ts: Date.now() });
    if (serialized.length > MAX_BYTES) return;
    localStorage.setItem(key, serialized);
  } catch {
    // QuotaExceeded u otro: ignorar silenciosamente.
  }
}

/**
 * useQuery con caché en localStorage.
 *
 * - Mientras haya conexión a Convex, devuelve el dato fresco y lo guarda en cache.
 * - Sin conexión (o mientras se reconecta), devuelve el último valor conocido
 *   en lugar de mostrar `undefined` para siempre.
 * - El segundo argumento puede ser "skip" como en convex/react.
 *
 * Uso idéntico a `useQuery` de `convex/react`:
 *   const data = useQuery(api.foo.bar, { x: 1 });
 */
export function useQuery(query: unknown, args?: unknown): unknown {
  // Tipado relajado: convexUseQuery acepta una FunctionReference,
  // pero queremos exportar la misma firma flexible que el original.
  const live = (convexUseQuery as unknown as (q: unknown, a: unknown) => unknown)(
    query,
    args,
  );

  const key = buildKey(query, args);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (live === undefined || args === "skip") return;
    notifyQuerySuccess();
    try {
      const serialized = JSON.stringify(live);
      if (serialized === lastSavedRef.current) return;
      lastSavedRef.current = serialized;
      writeCache(key, live);
    } catch {
      // ignorar
    }
  }, [live, key, args]);

  if (live !== undefined) return live;
  if (args === "skip") return undefined;
  if (typeof navigator !== "undefined" && !navigator.onLine) notifyOffline();
  return readCache(key);
}

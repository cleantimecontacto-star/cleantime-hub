import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";
import { useSyncStatus } from "@/lib/syncStatus";

interface Props {
  /** Si true, usa tamaños/textos compactos para el header móvil */
  compact?: boolean;
}

function formatHora(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SyncIndicator({ compact = false }: Props) {
  const { status, lastSyncAt, lastError } = useSyncStatus();

  let icon, label, color, title;

  switch (status) {
    case "syncing":
      icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      label = "Sincronizando…";
      color = "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950 dark:border-blue-900";
      title = "Conectando con la nube";
      break;
    case "idle":
      icon = <Cloud className="h-3.5 w-3.5" />;
      label = compact ? "Sync" : "Sincronizado";
      color = "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-900";
      title = lastSyncAt
        ? `Sincronizado a las ${formatHora(lastSyncAt)} — datos en vivo desde la nube`
        : "Datos en vivo desde la nube";
      break;
    case "error":
      icon = <AlertCircle className="h-3.5 w-3.5" />;
      label = compact ? "Error" : "Sin sincronizar";
      color = "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-900";
      title = lastError
        ? `Error al sincronizar: ${lastError}. Mostrando última información conocida.`
        : "Error al sincronizar. Mostrando última información conocida.";
      break;
    case "offline":
    default:
      icon = <CloudOff className="h-3.5 w-3.5" />;
      label = compact ? "Offline" : "Sin conexión";
      color = "text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700";
      title = "Sin internet — mostrando última información conocida. Los cambios se enviarán al volver la conexión.";
      break;
  }

  return (
    <div
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none ${color}`}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout.tsx";
import { STATUS_BADGE_COLORS, QUOTE_STATUSES, type QuoteStatus } from "@/lib/cleantime.ts";
import { cn } from "@/lib/utils.ts";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function ChangeStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quote = useQuery(api.quotes.get, id ? { id: id as Id<"quotes"> } : "skip");
  const updateStatus = useMutation(api.quotes.updateStatus);
  const [pendingStatus, setPendingStatus] = useState<QuoteStatus | null>(null);

  const handleChange = async (status: QuoteStatus) => {
    if (quote?.status && quote.status !== status) {
      setPendingStatus(status);
      return;
    }
    if (!id) return;
    await updateStatus({ id: id as Id<"quotes">, status });
    toast.success(`Estado cambiado a ${status}`);
    navigate(-1);
  };

  const confirmChange = async () => {
    if (!pendingStatus || !id) return;
    await updateStatus({ id: id as Id<"quotes">, status: pendingStatus });
    toast.success(`Estado cambiado a ${pendingStatus}`);
    setPendingStatus(null);
    navigate(-1);
  };

  return (
    <AppLayout title="Cambiar Estado">
      <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-2">
        {quote && (
          <div className="bg-card rounded-lg border border-border p-3">
            <p className="text-xs font-bold">{quote.number}</p>
            <p className="text-xs text-muted-foreground">{quote.clientName}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Selecciona el nuevo estado:</p>
        <div className="space-y-2">
          {QUOTE_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => handleChange(status)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-colors",
                quote?.status === status
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className={cn("px-2 py-0.5 rounded-full text-xs", STATUS_BADGE_COLORS[status])}>
                {status}
              </span>
              {quote?.status === status && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      </div>
      </div>
      {pendingStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl border border-border p-5 max-w-xs w-full space-y-3 shadow-xl">
            <p className="font-semibold text-sm">¿Cambiar estado?</p>
            <p className="text-xs text-muted-foreground">
              Cambiarás el estado de <b>{quote?.number}</b> a <b>{pendingStatus}</b>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPendingStatus(null)} className="flex-1 py-2 rounded border border-border text-sm">Cancelar</button>
              <button onClick={confirmChange} className="flex-1 py-2 rounded bg-primary text-primary-foreground text-sm font-medium">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

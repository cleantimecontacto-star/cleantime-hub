import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout.tsx";
import { formatCLP, formatDate, STATUS_COLORS, STATUS_BADGE_COLORS, QUOTE_STATUSES, type QuoteStatus } from "@/lib/cleantime.ts";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { MoreVertical, Plus, Download, Pencil, Trash2, Copy, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { generateQuotePDF } from "@/lib/pdf.ts";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog.tsx";
import { EditConfirmDialog } from "@/components/ui/edit-confirm-dialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const PAYMENT_STATUS_LEGACY: Record<string, string> = {
  "pendiente": "Sin pagar",
  "sin_pagar": "Sin pagar",
  "pagado": "Pagado",
  "parcial": "Parcial",
};

function normalizePaymentStatus(v: string): string {
  return PAYMENT_STATUS_LEGACY[v] ?? v;
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  "Sin pagar": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Pagado": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Parcial": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function QuotesList() {
  const quotes = useQuery(api.quotes.list);
  const clients = useQuery(api.clients.list);
  const config = useQuery(api.config.getAll);
  const duplicateQuote = useMutation(api.quotes.duplicate);
  const removeQuote = useMutation(api.quotes.remove);

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todas");
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"quotes">; number: string; status: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: Id<"quotes">; number: string; status: string } | null>(null);

  const WARN_ON_EDIT_STATUSES = ["Aprobada", "Facturada"];

  const handleEditClick = (quote: { _id: Id<"quotes">; number: string; status: string }) => {
    if (WARN_ON_EDIT_STATUSES.includes(quote.status)) {
      setEditTarget({ id: quote._id, number: quote.number, status: quote.status });
    } else {
      navigate(`/cotizacion/${quote._id}/editar`);
    }
  };

  const filtered = useMemo(() => {
    let list = quotes ?? [];
    if (filterStatus !== "Todas") list = list.filter(q => q.status === filterStatus);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(q =>
        q.number.toLowerCase().includes(s) ||
        q.clientName.toLowerCase().includes(s) ||
        q.serviceType.toLowerCase().includes(s)
      );
    }
    return list;
  }, [quotes, filterStatus, search]);

  const handleDeleteClick = (quote: { _id: Id<"quotes">; number: string; status: string }) => {
    setDeleteTarget({ id: quote._id, number: quote.number, status: quote.status });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await removeQuote({ id: deleteTarget.id });
    toast.success("Cotización eliminada");
  };

  const updateStatus = useMutation(api.quotes.updateStatus);

  const handleDuplicate = async (id: Id<"quotes">) => {
    await duplicateQuote({ id });
    toast.success("Cotización duplicada");
  };

  const handleWhatsApp = (quote: typeof filtered[0]) => {
    const total = (quote.total ?? quote.subtotal * 1.19).toLocaleString("es-CL");
    const subtotal = quote.subtotal.toLocaleString("es-CL");
    const iva = (quote.iva ?? quote.subtotal * 0.19).toLocaleString("es-CL");
    const cfg = config ?? {};
    const lines = [
      `*${cfg["company_name"] ?? "Cleantime Spa"}*`,
      cfg["company_rut"] ? `RUT: ${cfg["company_rut"]}` : "",
      cfg["company_phone"] ? `Tel: ${cfg["company_phone"]}` : "",
      cfg["company_email"] ? `Email: ${cfg["company_email"]}` : "",
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Cotización ${quote.number}*`,
      `Fecha: ${quote.date.split("-").reverse().join("/")}`,
      ``,
      `👤 *Cliente:* ${quote.clientName}`,
      quote.projectName ? `📁 *Proyecto:* ${quote.projectName}` : "",
      quote.otNumber ? `🔢 *N° OT:* ${quote.otNumber}` : "",
      ``,
      `🧹 *Servicio:* ${quote.serviceType}`,
      quote.description ? `📝 ${quote.description}` : "",
      `📐 *Cantidad:* ${quote.squareMeters} ${quote.unit ?? "M2"}`,
      `💲 *Precio:* $${quote.pricePerM2.toLocaleString("es-CL")} x ${quote.unit ?? "M2"}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Subtotal:   $${subtotal}`,
      `IVA (19%): $${iva}`,
      `*TOTAL:      $${total}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      quote.terms ? `📋 *Términos:* ${quote.terms}` : "",
    ].filter(l => l !== "").join("\n").trim();
    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank");
  };

  const handleDownloadPDF = async (quote: typeof filtered[0]) => {
    const client = (clients ?? []).find(c => c._id === quote.clientId);
    await generateQuotePDF(quote, client ?? null, config ?? {});
  };

  return (
    <AppLayout title="Cotizaciones" headerRight={
      <button onClick={() => navigate("/cotizacion/nueva")} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
        <Plus size={13} /> Nueva
      </button>
    }>
      <div className="flex flex-col h-full">
        {/* Fixed: search + filter */}
        <div className="shrink-0 p-3 pb-2 flex gap-2">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {QUOTE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {quotes === undefined && [0,1,2].map(i => <Skeleton key={i} className="h-16" />)}
        {quotes !== undefined && filtered.length === 0 && quotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-3">Aún no hay cotizaciones</p>
            <button onClick={() => navigate("/cotizacion/nueva")} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium mx-auto">
              <Plus size={15} /> Crear primera cotización
            </button>
          </div>
        )}
        {quotes !== undefined && filtered.length === 0 && quotes.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No coincide ninguna cotización</p>
        )}
        {filtered.map(quote => (
          <div key={quote._id} className="bg-card rounded-lg border border-border overflow-hidden">
            <div className={cn("h-1", STATUS_COLORS[quote.status as QuoteStatus])} />
            <div className="p-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold">{quote.number}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", STATUS_BADGE_COLORS[quote.status as QuoteStatus])}>
                    {quote.status}
                  </span>
                </div>
                <p className="text-[11px] truncate">{quote.clientName}{quote.projectName ? ` · 📁 ${quote.projectName}` : ""} · {formatDate(quote.date)}</p>
                <p className="text-[10px] text-muted-foreground truncate">{quote.serviceType} · {quote.squareMeters} {quote.unit ?? "m²"}{quote.otNumber ? ` · OT: ${quote.otNumber}` : ""}</p>
                {(quote.invoiceNumber || quote.paymentStatus) && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {quote.invoiceNumber && (
                      <span className="text-[9px] text-muted-foreground">FAC: {quote.invoiceNumber}</span>
                    )}
                    {quote.paymentStatus && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[normalizePaymentStatus(quote.paymentStatus)] ?? ""}`}>
                        {normalizePaymentStatus(quote.paymentStatus)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatCLP(quote.total ?? quote.subtotal * 1.19)}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-7 h-7 rounded border border-border bg-muted shrink-0">
                    <MoreVertical size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(quote)}>
                    <Pencil size={12} className="mr-1" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                    <Download size={12} className="mr-1" /> Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(quote._id)}>
                    <Copy size={12} className="mr-1" /> Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleWhatsApp(quote)}>
                    <MessageCircle size={12} className="mr-1" /> Enviar por WhatsApp
                  </DropdownMenuItem>
                  {QUOTE_STATUSES.map(s => (
                    <DropdownMenuItem key={s} onClick={() => updateStatus({ id: quote._id, status: s })}>
                      Marcar {s}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => handleDeleteClick(quote)} className="text-destructive">
                    <Trash2 size={12} className="mr-1" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
        </div>
      </div>

      <EditConfirmDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onConfirm={() => navigate(`/cotizacion/${editTarget!.id}/editar`)}
        title={`¿Editar cotización ${editTarget?.number ?? ""}?`}
        description={`Esta cotización ya fue ${editTarget?.status === "Facturada" ? "facturada" : editTarget?.status === "Aprobada" ? "aprobada" : "enviada al cliente"}. Editar puede afectar el historial. ¿Deseas continuar de todas formas?`}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar cotización?"
        description={`Estás a punto de eliminar la cotización ${deleteTarget?.number ?? ""}. Esta acción borrará también todos los trabajos y gastos asociados. No se puede deshacer.`}
        requireWord="ELIMINAR"
      />
    </AppLayout>
  );
}

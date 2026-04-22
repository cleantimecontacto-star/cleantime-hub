import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import { useState, useMemo } from "react";
import { FilePlus } from "lucide-react";
import AppLayout from "@/components/AppLayout.tsx";
import { formatCLP, type QuoteStatus } from "@/lib/cleantime.ts";
import { cn } from "@/lib/utils.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

type Period = "mes_actual" | "mes_anterior" | "anio_actual" | "todo";

const PERIOD_LABELS: Record<Period, string> = {
  mes_actual: "Este mes",
  mes_anterior: "Mes anterior",
  anio_actual: "Este año",
  todo: "Todo el tiempo",
};

function getPeriodPrefix(period: Period): { start: string; end: string } | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based

  if (period === "mes_actual") {
    const ms = String(m + 1).padStart(2, "0");
    return { start: `${y}-${ms}`, end: `${y}-${ms}` };
  }
  if (period === "mes_anterior") {
    const py = m === 0 ? y - 1 : y;
    const pm = m === 0 ? 12 : m; // m es 0-based: enero(0) → prev es diciembre(12)
    const pms = String(pm).padStart(2, "0");
    return { start: `${py}-${pms}`, end: `${py}-${pms}` };
  }
  if (period === "anio_actual") {
    return { start: `${y}-01`, end: `${y}-12` };
  }
  return null; // todo = sin filtro
}

function inPeriod(date: string, prefix: { start: string; end: string } | null): boolean {
  if (!prefix) return true;
  const month = date.slice(0, 7); // "YYYY-MM"
  return month >= prefix.start && month <= prefix.end;
}

export default function Dashboard() {
  const quotes = useQuery(api.quotes.list);
  const workers = useQuery(api.workers.allJobs);
  const expenses = useQuery(api.expenses.list);
  const config = useQuery(api.config.getAll);

  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("mes_actual");

  const companyName = config?.["company_name"] ?? "Cleantime";
  const now = new Date();

  const prefix = useMemo(() => getPeriodPrefix(period), [period]);

  const periodLabel = useMemo(() => {
    if (period === "mes_actual") return now.toLocaleString("es-CL", { month: "long", year: "numeric" });
    if (period === "mes_anterior") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return prev.toLocaleString("es-CL", { month: "long", year: "numeric" });
    }
    if (period === "anio_actual") return `año ${now.getFullYear()}`;
    return "todo el tiempo";
  }, [period, now]);

  // Cotizaciones del período
  const periodQuotes = useMemo(() =>
    (quotes ?? []).filter(q => inPeriod(q.date, prefix)), [quotes, prefix]);

  // Solo Aprobadas (sin Facturadas)
  const periodOnlyApproved = useMemo(() =>
    periodQuotes.filter(q => q.status === "Aprobada"), [periodQuotes]);

  // Solo Facturadas
  const periodFacturadas = useMemo(() =>
    periodQuotes.filter(q => q.status === "Facturada"), [periodQuotes]);

  // Aprobadas + Facturadas (para cálculo de ingresos)
  const periodApproved = useMemo(() =>
    periodQuotes.filter(q => q.status === "Aprobada" || q.status === "Facturada"), [periodQuotes]);

  // Ingresos del período (suma de subtotal + iva de cotizaciones aprobadas/facturadas)
  const subtotalPeriod = useMemo(() =>
    periodApproved.reduce((s, q) => s + q.subtotal, 0), [periodApproved]);
  const ivaPeriod = useMemo(() =>
    periodApproved.reduce((s, q) => s + q.iva, 0), [periodApproved]);
  const totalConIvaPeriod = subtotalPeriod + ivaPeriod;

  // Gastos del período
  const expensesPeriod = useMemo(() =>
    (expenses ?? []).filter(e => inPeriod(e.date, prefix))
      .reduce((s, e) => s + e.amount, 0), [expenses, prefix]);
  const workerCostsPeriod = useMemo(() =>
    (workers ?? []).filter(j => inPeriod(j.date, prefix))
      .reduce((s, j) => s + j.amount, 0), [workers, prefix]);
  const gastosPeriod = expensesPeriod + workerCostsPeriod;

  // Ganancia neta = ingresos sin IVA - gastos (el IVA no es ganancia, va al SII)
  const gananciaPeriod = subtotalPeriod - gastosPeriod;

  // Por cobrar: cotizaciones Aprobadas (no facturadas) en TODO el tiempo
  const allApprovedPending = useMemo(() =>
    (quotes ?? []).filter(q => q.status === "Aprobada"), [quotes]);
  const pendingSubtotal = useMemo(() =>
    allApprovedPending.reduce((s, q) => s + q.subtotal, 0), [allApprovedPending]);
  const pendingTotal = useMemo(() =>
    allApprovedPending.reduce((s, q) => s + q.subtotal + q.iva, 0), [allApprovedPending]);

  // Acumulado histórico (siempre todo el tiempo)
  const workerCostsTotal = useMemo(() =>
    (workers ?? []).reduce((s, j) => s + j.amount, 0), [workers]);
  const expenseCostsTotal = useMemo(() =>
    (expenses ?? []).reduce((s, e) => s + e.amount, 0), [expenses]);
  const gastosTotales = workerCostsTotal + expenseCostsTotal;
  const subtotalHistorico = useMemo(() =>
    (quotes ?? [])
      .filter(q => q.status === "Aprobada" || q.status === "Facturada")
      .reduce((s, q) => s + q.subtotal, 0), [quotes]);
  const gananciaHistorica = subtotalHistorico - gastosTotales;

  const loading = quotes === undefined || expenses === undefined || workers === undefined;

  return (
    <AppLayout title="Panel" headerRight={
      <button onClick={() => navigate("/cotizacion/nueva")} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
        <FilePlus size={13} /> Nueva
      </button>
    }>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex flex-col flex-1 p-3 gap-3">

          {/* Selector de período */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{companyName} · {periodLabel}</p>
            <Select value={period} onValueChange={v => setPeriod(v as Period)}>
              <SelectTrigger className="w-36 h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                  <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cotizaciones del período */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cotizaciones</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card rounded-lg border border-border p-2 text-center">
                <p className="text-2xl font-bold text-blue-600">{loading ? "—" : periodQuotes.length}</p>
                <p className="text-[10px] text-muted-foreground">Emitidas</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-2 text-center">
                <p className="text-2xl font-bold text-green-600">{loading ? "—" : periodOnlyApproved.length}</p>
                <p className="text-[10px] text-muted-foreground">Aprobadas</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-2 text-center">
                <p className="text-2xl font-bold text-purple-600">{loading ? "—" : periodFacturadas.length}</p>
                <p className="text-[10px] text-muted-foreground">Facturadas</p>
              </div>
            </div>
          </div>

          {/* Ingresos del período */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Ingresos</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card rounded-lg border border-border p-2">
                <p className="text-[9px] text-muted-foreground">Subtotal</p>
                <p className="text-xs font-bold">{loading ? "—" : formatCLP(subtotalPeriod)}</p>
                <p className="text-[9px] text-muted-foreground">sin IVA</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-2">
                <p className="text-[9px] text-muted-foreground">IVA</p>
                <p className="text-xs font-bold text-orange-500">{loading ? "—" : formatCLP(ivaPeriod)}</p>
                <p className="text-[9px] text-muted-foreground">al SII</p>
              </div>
              <div className="bg-green-600/10 rounded-lg border border-green-600/30 p-2">
                <p className="text-[9px] text-muted-foreground">Total c/IVA</p>
                <p className="text-xs font-bold text-green-600">{loading ? "—" : formatCLP(totalConIvaPeriod)}</p>
                <p className="text-[9px] text-muted-foreground">cobrado</p>
              </div>
            </div>
          </div>

          {/* Resultado del período */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Resultado</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card rounded-lg border border-border p-2">
                <p className="text-[9px] text-muted-foreground">Gastos</p>
                <p className="text-xs font-bold text-red-500">{loading ? "—" : formatCLP(gastosPeriod)}</p>
                <p className="text-[9px] text-muted-foreground">trab. + gastos</p>
              </div>
              <div className={cn("rounded-lg border p-2", (!loading && gananciaPeriod < 0) ? "bg-red-500/10 border-red-500/30" : "bg-green-600/10 border-green-600/30")}>
                <p className="text-[9px] text-muted-foreground">Ganancia neta</p>
                <p className={cn("text-xs font-bold", (!loading && gananciaPeriod < 0) ? "text-red-500" : "text-green-600")}>{loading ? "—" : formatCLP(gananciaPeriod)}</p>
                <p className="text-[9px] text-muted-foreground">ingresos − gastos</p>
              </div>
            </div>
          </div>

          {/* Por cobrar — cotizaciones aprobadas pendientes de facturar (siempre visible) */}
          {!loading && allApprovedPending.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Por cobrar
                <span className="ml-1.5 text-amber-500 normal-case font-normal">(aprobadas, sin facturar)</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300/60 p-2 text-center">
                  <p className="text-2xl font-bold text-amber-600">{allApprovedPending.length}</p>
                  <p className="text-[10px] text-muted-foreground">cotizaciones</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300/60 p-2">
                  <p className="text-[9px] text-muted-foreground">Subtotal</p>
                  <p className="text-xs font-bold text-amber-600">{formatCLP(pendingSubtotal)}</p>
                  <p className="text-[9px] text-muted-foreground">sin IVA</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300/60 p-2">
                  <p className="text-[9px] text-muted-foreground">Total c/IVA</p>
                  <p className="text-xs font-bold text-amber-600">{formatCLP(pendingTotal)}</p>
                  <p className="text-[9px] text-muted-foreground">a facturar</p>
                </div>
              </div>
            </div>
          )}

          {/* Acumulado histórico — solo cuando el período no es "todo" */}
          {period !== "todo" && !loading && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Acumulado histórico</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/40 rounded-lg border border-border p-2">
                  <p className="text-[9px] text-muted-foreground">Total cobrado</p>
                  <p className="text-xs font-semibold">{formatCLP(subtotalHistorico)}</p>
                  <p className="text-[9px] text-muted-foreground">sin IVA</p>
                </div>
                <div className="bg-muted/40 rounded-lg border border-border p-2">
                  <p className="text-[9px] text-muted-foreground">Ganancia total</p>
                  <p className={cn("text-xs font-semibold", gananciaHistorica >= 0 ? "text-green-600" : "text-red-500")}>{formatCLP(gananciaHistorica)}</p>
                  <p className="text-[9px] text-muted-foreground">desde el inicio</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}

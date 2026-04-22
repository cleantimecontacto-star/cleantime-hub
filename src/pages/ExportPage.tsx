import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { formatCLP } from "@/lib/cleantime.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type Period = "mes_actual" | "mes_anterior" | "anio_actual" | "todo";
type StatusFilter = "todos" | "Pendiente" | "Aprobada" | "Facturada" | "Rechazada";

const PERIOD_LABELS: Record<Period, string> = {
  mes_actual: "Este mes",
  mes_anterior: "Mes anterior",
  anio_actual: "Este año",
  todo: "Todo el tiempo",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  todos: "Todos los estados",
  Pendiente: "Pendientes",
  Aprobada: "Aprobadas",
  Facturada: "Facturadas",
  Rechazada: "Rechazadas",
};

function getPeriodRange(period: Period): { start: string; end: string } | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === "mes_actual") {
    const ms = String(m + 1).padStart(2, "0");
    return { start: `${y}-${ms}`, end: `${y}-${ms}` };
  }
  if (period === "mes_anterior") {
    const py = m === 0 ? y - 1 : y;
    const pm = m === 0 ? 12 : m;
    const pms = String(pm).padStart(2, "0");
    return { start: `${py}-${pms}`, end: `${py}-${pms}` };
  }
  if (period === "anio_actual") {
    return { start: `${y}-01`, end: `${y}-12` };
  }
  return null;
}

function inPeriod(date: string, range: { start: string; end: string } | null): boolean {
  if (!range) return true;
  const month = date.slice(0, 7);
  return month >= range.start && month <= range.end;
}

export default function ExportPage() {
  const quotes = useQuery(api.quotes.list);
  const expenses = useQuery(api.expenses.list);
  const allJobs = useQuery(api.workers.allJobs);
  const workers = useQuery(api.workers.list);

  const [period, setPeriod] = useState<Period>("todo");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  // Hojas a exportar
  const [exportCotizaciones, setExportCotizaciones] = useState(true);
  const [exportGastos, setExportGastos] = useState(true);
  const [exportResumen, setExportResumen] = useState(true);

  const range = useMemo(() => getPeriodRange(period), [period]);

  const filteredQuotes = useMemo(() => {
    return (quotes ?? []).filter(q => {
      const inP = inPeriod(q.date, range);
      const inS = statusFilter === "todos" || q.status === statusFilter;
      return inP && inS;
    });
  }, [quotes, range, statusFilter]);

  const filteredExpenses = useMemo(() =>
    (expenses ?? []).filter(e => inPeriod(e.date, range)), [expenses, range]);

  const filteredJobs = useMemo(() =>
    (allJobs ?? []).filter(j => inPeriod(j.date, range)), [allJobs, range]);

  // Resumen financiero del período filtrado (siempre sobre aprobadas+facturadas)
  const aprobadas = filteredQuotes.filter(q => q.status === "Aprobada" || q.status === "Facturada");
  const montoAprobado = aprobadas.reduce((s, q) => s + q.subtotal, 0);
  const pagosTrab = filteredJobs.reduce((s, j) => s + j.amount, 0);
  const gastosTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const ganancia = montoAprobado - pagosTrab - gastosTotal;
  const totalCotizado = filteredQuotes.reduce((s, q) => s + (q.total ?? 0), 0);

  const handleExport = () => {
    if (!quotes || !expenses || !allJobs) { toast.error("Cargando datos..."); return; }
    if (!exportCotizaciones && !exportGastos && !exportResumen) {
      toast.error("Selecciona al menos una hoja para exportar");
      return;
    }

    const wb = XLSX.utils.book_new();

    if (exportCotizaciones) {
      const quotesData = filteredQuotes.map(q => ({
        "N° Cotización": q.number,
        "N° OT": q.otNumber ?? "",
        "N° Factura": q.invoiceNumber ?? "",
        "Cliente": q.clientName,
        "Proyecto": q.projectName ?? "",
        "Servicio": q.serviceType,
        "Descripción": q.description ?? "",
        [`Cantidad (${q.unit ?? "M2"})`]: q.squareMeters,
        "Precio unitario": q.pricePerM2,
        "Insumos incluidos": q.includesSupplies ? "Sí" : "No",
        "% Insumos": q.includesSupplies && q.suppliesPct ? `${Math.round(q.suppliesPct)}%` : "",
        "Suciedad excesiva": q.excessiveDirt ? "Sí" : "No",
        "% Suciedad": q.excessiveDirt && q.excessiveDirtPct ? `${Math.round(q.excessiveDirtPct)}%` : "",
        "Subtotal (sin IVA)": q.subtotal,
        "IVA": q.iva,
        "Total": q.total,
        "Estado": q.status,
        "Estado Pago": q.paymentStatus ?? "Sin pagar",
        "Fecha": q.date,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quotesData), "Cotizaciones");
    }

    if (exportGastos) {
      const expensesData = filteredExpenses.map(e => ({
        "Categoría": e.category,
        "Descripción": e.description,
        "Monto": e.amount,
        "Fecha": e.date,
        "Cotización": e.quoteName ?? "",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), "Gastos");
    }

    if (exportResumen) {
      const summaryData = [
        { "Concepto": "Total cotizado (con IVA)", "Monto": totalCotizado },
        { "Concepto": "Ingreso neto aprobado + facturado (sin IVA)", "Monto": montoAprobado },
        { "Concepto": "Pagos a trabajadores", "Monto": pagosTrab },
        { "Concepto": "Gastos varios", "Monto": gastosTotal },
        { "Concepto": "Total costos", "Monto": pagosTrab + gastosTotal },
        { "Concepto": "Ganancia neta", "Monto": ganancia },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Resumen");
    }

    if (exportGastos) {
      const workersData = filteredJobs.map(j => ({
        "Nombre": workers?.find(w => w._id === j.workerId)?.name ?? "",
        "Descripción": j.description ?? "",
        "Monto": j.amount,
        "Fecha": j.date,
        "Pagado": j.paid ? "Sí" : "No",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(workersData), "Trabajadores");
    }

    const periodSuffix = period === "todo" ? "todo" : period;
    const statusSuffix = statusFilter === "todos" ? "" : `_${statusFilter.toLowerCase()}`;
    XLSX.writeFile(wb, `cleantime_${periodSuffix}${statusSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Exportado exitosamente");
  };

  const loading = !quotes || !expenses || !allJobs;

  return (
    <AppLayout title="Exportar">
      <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-3">

        {/* Filtros */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold">Filtros de exportación</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Período</label>
              <Select value={period} onValueChange={v => setPeriod(v as Period)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                    <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Estado cotización</label>
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {filteredQuotes.length} cotización(es) en el rango seleccionado
          </p>
        </div>

        {/* Hojas a exportar */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold">Hojas a incluir</p>
          <div className="space-y-1.5">
            {[
              { label: "Cotizaciones", value: exportCotizaciones, set: setExportCotizaciones },
              { label: "Gastos", value: exportGastos, set: setExportGastos },
              { label: "Resumen financiero", value: exportResumen, set: setExportResumen },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={e => set(e.target.checked)}
                  className="w-3.5 h-3.5 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Resumen del período */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold">Resumen del período</p>
          {[
            { label: "Total cotizado (con IVA)", value: totalCotizado, color: "" },
            { label: "Ingreso neto aprobado + facturado (sin IVA)", value: montoAprobado, color: "text-green-600" },
            { label: "Pagos trabajadores", value: pagosTrab, color: "text-orange-500" },
            { label: "Gastos varios", value: gastosTotal, color: "text-red-500" },
            { label: "Ganancia neta", value: ganancia, color: ganancia >= 0 ? "text-green-600" : "text-red-500" },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={`font-bold ${row.color}`}>{formatCLP(row.value)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full h-10 gap-2"
          >
            <FileSpreadsheet size={16} />
            Exportar a Excel (.xlsx)
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Exporta solo los datos del período y estado seleccionados
          </p>
        </div>

        <div className="bg-muted rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium flex items-center gap-1"><Download size={12} /> PDFs individuales</p>
          <p className="text-[10px] text-muted-foreground">
            Para descargar el PDF de una cotización específica, ve a Cotiz. y usa el menú de opciones de cada cotización.
          </p>
        </div>

      </div>
      </div>
    </AppLayout>
  );
}

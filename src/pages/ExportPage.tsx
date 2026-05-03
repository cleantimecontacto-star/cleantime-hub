import { useQuery } from "@/hooks/use-cached-query";
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

  const aprobadas = filteredQuotes.filter(q => q.status === "Aprobada" || q.status === "Facturada");
  const montoAprobado = aprobadas.reduce((s, q) => s + q.subtotal, 0);
  const pagosTrab = filteredJobs.reduce((s, j) => s + j.amount, 0);
  const gastosTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const ganancia = montoAprobado - pagosTrab - gastosTotal;
  const totalCotizado = filteredQuotes.reduce((s, q) => s + (q.total ?? 0), 0);

  const handleExport = () => {
    if (!quotes || !expenses || !allJobs || !workers) {
      toast.error("Cargando datos...");
      return;
    }

    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [];

    const periodLabel = PERIOD_LABELS[period];
    const statusLabel = STATUS_LABELS[statusFilter];
    const today = new Date().toLocaleDateString("es-CL");

    // ── ENCABEZADO ──────────────────────────────────────────────
    rows.push(["RESUMEN CLEANTIME"]);
    rows.push([`Período: ${periodLabel}   |   Estado: ${statusLabel}   |   Generado: ${today}`]);
    rows.push([]);

    // ── 1. RESUMEN FINANCIERO ────────────────────────────────────
    rows.push(["RESUMEN FINANCIERO"]);
    rows.push(["Concepto", "Monto (CLP)"]);
    rows.push(["Total cotizado (con IVA)", totalCotizado]);
    rows.push(["Ingreso neto aprobado + facturado (sin IVA)", montoAprobado]);
    rows.push(["Pagos a trabajadores", pagosTrab]);
    rows.push(["Gastos varios", gastosTotal]);
    rows.push(["Total costos", pagosTrab + gastosTotal]);
    rows.push(["GANANCIA NETA", ganancia]);
    rows.push([]);

    // ── 2. COTIZACIONES POR ESTADO ───────────────────────────────
    const statusList: StatusFilter[] = ["Pendiente", "Aprobada", "Facturada", "Rechazada"];
    const statusGroups = statusList.map(s => {
      const group = filteredQuotes.filter(q => q.status === s);
      return {
        estado: s,
        cantidad: group.length,
        subtotal: group.reduce((sum, q) => sum + q.subtotal, 0),
        total: group.reduce((sum, q) => sum + (q.total ?? 0), 0),
      };
    });

    rows.push(["COTIZACIONES POR ESTADO"]);
    rows.push(["Estado", "Cantidad", "Subtotal s/IVA", "Total c/IVA"]);
    statusGroups.forEach(g => rows.push([g.estado, g.cantidad, g.subtotal, g.total]));
    rows.push([
      "TOTAL",
      filteredQuotes.length,
      filteredQuotes.reduce((s, q) => s + q.subtotal, 0),
      filteredQuotes.reduce((s, q) => s + (q.total ?? 0), 0),
    ]);
    rows.push([]);

    // ── 3. DETALLE DE COTIZACIONES ───────────────────────────────
    rows.push(["DETALLE DE COTIZACIONES"]);
    rows.push(["N° Cotiz.", "N° OT/OC", "Cliente", "Servicio", `Cantidad`, "Subtotal s/IVA", "Total c/IVA", "Estado", "Pago", "Fecha"]);
    filteredQuotes
      .slice()
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .forEach(q =>
        rows.push([
          q.number,
          q.otNumber ?? "",
          q.clientName,
          q.serviceType,
          q.squareMeters,
          q.subtotal,
          q.total ?? 0,
          q.status,
          q.paymentStatus ?? "Sin pagar",
          q.date,
        ])
      );
    rows.push([]);

    // ── 4. GASTOS POR CATEGORÍA ──────────────────────────────────
    const expByCategory = filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    rows.push(["GASTOS POR CATEGORÍA"]);
    rows.push(["Categoría", "Total (CLP)"]);
    Object.entries(expByCategory)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .forEach(([cat, amt]) => rows.push([cat, amt as number]));
    rows.push(["TOTAL GASTOS", gastosTotal]);
    rows.push([]);

    // ── 5. PAGOS A TRABAJADORES ──────────────────────────────────
    rows.push(["PAGOS A TRABAJADORES"]);
    rows.push(["Trabajador", "Descripción", "Monto", "Fecha", "Pagado"]);
    filteredJobs
      .slice()
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .forEach(j => {
        const nombre = workers?.find(w => w._id === j.workerId)?.name ?? "";
        rows.push([nombre, j.description ?? "", j.amount, j.date, j.paid ? "Sí" : "No"]);
      });
    rows.push(["TOTAL PAGOS", "", pagosTrab]);

    // ── ARMAR HOJA ───────────────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws["!cols"] = [
      { wch: 46 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Resumen CleanTime");

    const periodSuffix = period === "todo" ? "todo" : period;
    XLSX.writeFile(wb, `cleantime_resumen_${periodSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("¡Excel exportado exitosamente!");
  };

  const loading = !quotes || !expenses || !allJobs || !workers;

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

          {/* Vista previa del resumen */}
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-bold">Lo que incluirá el Excel</p>
            <ul className="space-y-1">
              {[
                "Resumen financiero (KPIs clave)",
                "Cotizaciones por estado (conteo + montos)",
                "Detalle de cotizaciones (tabla completa)",
                "Gastos por categoría (agrupados)",
                "Pagos a trabajadores",
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-green-500 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground pt-1">
              Todo en <span className="font-semibold text-foreground">1 sola hoja</span>, ordenado y listo para revisar.
            </p>
          </div>

          {/* Resumen financiero */}
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
              Exportar resumen a Excel
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Genera 1 archivo .xlsx con todo el resumen del período seleccionado
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

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { getHistorial, setHistorial, syncFromConvex, pushToConvex } from "@/lib/rrhh/storage";
import { fmt, DIAS_BASE_MES } from "@/lib/rrhh/calculations";
import type { LiquidacionResult } from "@/lib/rrhh/types";
import { MESES } from "@/lib/rrhh/types";
import { Trash2, Eye, FileText, History } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function HistorialPage() {
  const [historial, setH] = useState<LiquidacionResult[]>([]);
  const [selected, setSelected] = useState<LiquidacionResult | null>(null);

  useEffect(() => {
    syncFromConvex().then(r => {
      setH(getHistorial().reverse());
      if (r.historial) toast.success('Historial restaurado desde la nube ☁️');
    });
  }, []);

  function eliminar(id: string) {
    if (!confirm("¿Eliminar esta liquidación del historial?")) return;
    const updated = getHistorial().filter(h => h.id !== id);
    setHistorial(updated);
    pushToConvex();
    setH(updated.reverse());
    toast.success("Liquidación eliminada");
  }

  function generarPDF(d: LiquidacionResult) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const azul: [number, number, number] = [30, 58, 95];
    const turquesa: [number, number, number] = [23, 162, 184];
    const grisClaro: [number, number, number] = [245, 247, 250];
    const negro: [number, number, number] = [45, 55, 72];
    doc.setFillColor(...azul);
    doc.rect(0, 0, 216, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Cleantime SpA', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('RUT: 78.375.621-8 | García Hurtado de Mendoza 8111, La Florida', 14, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Liquidación de Sueldo — ${MESES[d.mes]} ${d.anio}`, 14, 26);
    doc.setTextColor(...negro);
    doc.setFillColor(...grisClaro);
    doc.rect(14, 32, 188, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(d.worker.nombre, 18, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`RUT: ${d.worker.rut}  |  Cargo: ${d.worker.cargo}  |  Días: ${d.diasTrabajados}/${DIAS_BASE_MES}`, 18, 47);
    let y = 58;
    function sh(label: string) {
      doc.setFillColor(...turquesa);
      doc.rect(14, y, 188, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(label, 18, y + 5);
      doc.setTextColor(...negro);
      y += 10;
    }
    function row(label: string, value: string, bold = false) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.text(label, 18, y);
      doc.text(value, 155, y, { align: 'right' });
      y += 6;
    }
    function divider() { doc.setDrawColor(220, 220, 220); doc.line(14, y - 1, 202, y - 1); }
    sh('HABERES');
    row(`Sueldo Base (${d.diasTrabajados}/${DIAS_BASE_MES} días)`, fmt(d.sueldoBase));
    row('Colación (no imponible)', fmt(d.colacion));
    row('Movilización (no imponible)', fmt(d.movilizacion));
    divider();
    row('Total Haberes', fmt(d.totalHaberes), true);
    y += 4;
    sh('DESCUENTOS PREVISIONALES');
    row(`AFP ${d.afpNombre} (${d.afpTasa}%)`, `- ${fmt(d.descAFP)}`);
    row(`${d.saludNombre} (${d.saludTasa}%)`, `- ${fmt(d.descSalud)}`);
    row('AFC Cesantía Trabajador (0.60%)', `- ${fmt(d.descAFC)}`);
    divider();
    row('Total Previsional', `- ${fmt(d.totalPrevis)}`, true);
    y += 4;
    sh('IMPUESTO');
    row(`Base Imponible (${fmt(d.base)} - prev.)`, fmt(d.baseImpuesto));
    row('Impuesto Único 2ª Categoría', d.impuesto > 0 ? `- ${fmt(d.impuesto)}` : 'Exento');
    y += 4;
    doc.setFillColor(...azul);
    doc.rect(14, y, 188, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('LÍQUIDO A PAGAR', 18, y + 9);
    doc.setFontSize(14);
    doc.text(fmt(d.liquido), 196, y + 9, { align: 'right' });
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')}`, 14, y + 4);
    const firstName = (d.worker.nombre || 'Trabajador').split(' ')[0];
    doc.save(`Liquidacion_${firstName}_${MESES[d.mes]}${d.anio}.pdf`);
  }

  return (
    <AppLayout title="Historial" module="rrhh">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {historial.length === 0 ? (
            <div className="text-center py-12">
              <History size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="font-medium text-sm mb-1">Aún no hay liquidaciones</p>
              <p className="text-xs text-muted-foreground">Las liquidaciones que guardes aparecerán aquí</p>
            </div>
          ) : (
            historial.map(h => (
              <div key={h.id} className="bg-card rounded-lg border border-border p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-bold truncate">{h.worker?.nombre}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                        {MESES[h.mes]} {h.anio}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {h.diasTrabajados}/{DIAS_BASE_MES} días · {h.worker?.cargo}
                    </p>
                    <p className="text-xs font-bold text-primary mt-0.5">{fmt(h.liquido)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setSelected(h)} className="p-1 rounded hover:bg-muted" title="Ver detalle">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => generarPDF(h)} className="p-1 rounded hover:bg-muted" title="PDF">
                      <FileText size={13} />
                    </button>
                    <button onClick={() => eliminar(h.id!)} className="p-1 rounded hover:bg-muted text-destructive" title="Eliminar">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal detalle */}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                {selected.worker?.nombre}
                <span className="block font-normal text-sm text-muted-foreground">{MESES[selected.mes]} {selected.anio}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              {[
                [`Sueldo Base (${selected.diasTrabajados}d)`, fmt(selected.sueldoBase)],
                ['Colación', fmt(selected.colacion)],
                ['Movilización', fmt(selected.movilizacion)],
                ['Total Haberes', fmt(selected.totalHaberes)],
                [`AFP ${selected.afpNombre}`, `- ${fmt(selected.descAFP)}`],
                [selected.saludNombre, `- ${fmt(selected.descSalud)}`],
                ['AFC Trab.', `- ${fmt(selected.descAFC)}`],
                ['Impuesto', selected.impuesto > 0 ? `- ${fmt(selected.impuesto)}` : 'Exento'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="bg-primary text-primary-foreground rounded-xl p-3 flex justify-between items-center mt-2">
                <span className="font-semibold">LÍQUIDO</span>
                <span className="font-bold text-lg">{fmt(selected.liquido)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => generarPDF(selected)}>
                <FileText />
                PDF
              </Button>
              <Button onClick={() => setSelected(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AppLayout>
  );
}

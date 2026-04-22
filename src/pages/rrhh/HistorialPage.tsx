
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { getHistorial, setHistorial } from "@/lib/rrhh/storage";
import { fmt, DIAS_BASE_MES } from "@/lib/rrhh/calculations";
import type { LiquidacionResult } from "@/lib/rrhh/types";
import { MESES } from "@/lib/rrhh/types";
import { Trash2, Eye } from "lucide-react";
import { jsPDF } from "jspdf";

export default function HistorialPage() {
  const [historial, setH] = useState<LiquidacionResult[]>([]);
  const [selected, setSelected] = useState<LiquidacionResult | null>(null);

  useEffect(() => {
    setH(getHistorial().reverse());
  }, []);

  function eliminar(id: string) {
    if (!confirm("¿Eliminar esta liquidación del historial?")) return;
    const updated = getHistorial().filter(h => h.id !== id);
    setHistorial(updated);
    setH(updated.reverse());
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

    sh('📋 HABERES');
    row(`Sueldo Base (${d.diasTrabajados}/${DIAS_BASE_MES} días)`, fmt(d.sueldoBase));
    row('Colación (no imponible)', fmt(d.colacion));
    row('Movilización (no imponible)', fmt(d.movilizacion));
    divider();
    row('Total Haberes', fmt(d.totalHaberes), true);
    y += 4;
    sh('📤 DESCUENTOS PREVISIONALES');
    row(`AFP ${d.afpNombre} (${d.afpTasa}%)`, `- ${fmt(d.descAFP)}`);
    row(`${d.saludNombre} (${d.saludTasa}%)`, `- ${fmt(d.descSalud)}`);
    row('AFC Cesantía Trabajador (0.60%)', `- ${fmt(d.descAFC)}`);
    divider();
    row('Total Previsional', `- ${fmt(d.totalPrevis)}`, true);
    y += 4;
    sh('💰 IMPUESTO');
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
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {historial.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            No hay liquidaciones guardadas aún.
          </div>
        ) : (
          historial.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{h.worker?.nombre}</p>
                <p className="text-xs text-muted-foreground">{MESES[h.mes]} {h.anio} · {h.diasTrabajados}/{DIAS_BASE_MES} días</p>
                <p className="text-sm font-semibold text-blue-600">{fmt(h.liquido)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSelected(h)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Ver detalle"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => generarPDF(h)}
                  className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors text-xs font-medium"
                  title="Generar PDF"
                >
                  PDF
                </button>
                <button
                  onClick={() => eliminar(h.id!)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base text-center">
              {selected.worker?.nombre}<br />
              <span className="font-normal text-sm text-muted-foreground">{MESES[selected.mes]} {selected.anio}</span>
            </h3>
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
            <div className="bg-blue-600 text-white rounded-xl p-3 flex justify-between items-center mt-2">
              <span className="font-semibold">LÍQUIDO</span>
              <span className="font-bold text-lg">{fmt(selected.liquido)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => generarPDF(selected)} className="flex-1 bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700">PDF</button>
              <button onClick={() => setSelected(null)} className="flex-1 border border-border rounded-lg py-2 text-sm font-medium hover:bg-muted">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

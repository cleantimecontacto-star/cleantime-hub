import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { getTrabajadores, getHistorial, setHistorial, newId } from "@/lib/rrhh/storage";
import { calcularLiquidacion, fmt, DIAS_BASE_MES, parseIngresoDate } from "@/lib/rrhh/calculations";
import type { Worker, LiquidacionResult } from "@/lib/rrhh/types";
import { MESES } from "@/lib/rrhh/types";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Save, Calculator } from "lucide-react";

const now = new Date();

export default function LiquidacionPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [ausencias, setAusencias] = useState(0);
  const [result, setResult] = useState<Omit<LiquidacionResult, "id" | "workerId"> | null>(null);
  const [saved, setSaved] = useState(false);
  const [notaMarzo, setNotaMarzo] = useState("");

  useEffect(() => {
    const ws = getTrabajadores();
    setWorkers(ws);
    if (ws.length > 0) setWorkerId(ws[0].id);
  }, []);

  useEffect(() => {
    checkNotaMarzo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, mes, anio]);

  function checkNotaMarzo() {
    const w = workers.find(w => w.id === workerId);
    if (!w?.ingreso) { setNotaMarzo(""); return; }
    const fi = parseIngresoDate(w.ingreso);
    if (!fi) { setNotaMarzo(""); return; }
    if (fi.getFullYear() === anio && (fi.getMonth() + 1) === mes && fi.getDate() > 1) {
      const diasCalendario = new Date(anio, mes, 0).getDate();
      const diasDesdeIngreso = Math.max(0, (diasCalendario - fi.getDate()) + 1);
      const diasBase = Math.min(DIAS_BASE_MES, diasDesdeIngreso);
      setNotaMarzo(`⚠️ Primer mes — ${MESES[mes]} ${anio}: ${w.nombre} ingresó el ${fi.toLocaleDateString('es-CL')} → se calculan ${diasBase} días de ${DIAS_BASE_MES} (base 30).`);
    } else {
      setNotaMarzo("");
    }
  }

  function calcular() {
    const w = workers.find(w => w.id === workerId);
    if (!w) return;
    const r = calcularLiquidacion(w, mes, anio, ausencias);
    setResult(r);
    setSaved(false);
  }

  function guardar() {
    if (!result) return;
    const hist = getHistorial();
    const entry: LiquidacionResult = {
      ...result,
      id: newId('liq'),
      workerId: result.worker.id,
    };
    const filtered = hist.filter(h => !(
      (h.workerId === entry.workerId || h.worker?.id === entry.workerId) &&
      h.mes === entry.mes && h.anio === entry.anio
    ));
    setHistorial([...filtered, entry]);
    setSaved(true);
  }

  function generarPDF() {
    if (!result) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const azul: [number, number, number] = [30, 58, 95];
    const turquesa: [number, number, number] = [23, 162, 184];
    const grisClaro: [number, number, number] = [245, 247, 250];
    const negro: [number, number, number] = [45, 55, 72];
    const d = result;
    const titulo = `Liquidación de Sueldo — ${MESES[d.mes]} ${d.anio}`;
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
    doc.text(titulo, 14, 26);
    doc.setTextColor(...negro);
    doc.setFillColor(...grisClaro);
    doc.rect(14, 32, 188, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(d.worker.nombre, 18, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`RUT: ${d.worker.rut}  |  Cargo: ${d.worker.cargo}  |  Días trabajados: ${d.diasTrabajados}/${DIAS_BASE_MES}`, 18, 47);
    let y = 58;
    function sectionHeader(label: string) {
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
    sectionHeader('HABERES');
    row(`Sueldo Base (${d.diasTrabajados}/${DIAS_BASE_MES} días)`, fmt(d.sueldoBase));
    row('Colación (no imponible)', fmt(d.colacion));
    row('Movilización (no imponible)', fmt(d.movilizacion));
    divider();
    row('Total Haberes', fmt(d.totalHaberes), true);
    y += 4;
    sectionHeader('DESCUENTOS PREVISIONALES');
    row(`AFP ${d.afpNombre} (${d.afpTasa}%)`, `- ${fmt(d.descAFP)}`);
    row(`${d.saludNombre} (${d.saludTasa}%)`, `- ${fmt(d.descSalud)}`);
    row('AFC Cesantía Trabajador (0.60%)', `- ${fmt(d.descAFC)}`);
    divider();
    row('Total Previsional', `- ${fmt(d.totalPrevis)}`, true);
    y += 4;
    sectionHeader('IMPUESTO');
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
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')} | Sujeto a verificación`, 14, y + 4);
    const firstName = (d.worker.nombre || 'Trabajador').split(' ')[0];
    doc.save(`Liquidacion_${firstName}_${MESES[d.mes]}${d.anio}.pdf`);
  }

  const worker = workers.find(w => w.id === workerId);

  return (
    <AppLayout title="Liquidación de Sueldo" module="rrhh">
      <div className="p-4 max-w-2xl mx-auto space-y-4">

        {workers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground text-sm py-10">
              No hay trabajadores registrados. Ve a <strong>Trabajadores</strong> para agregar uno.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Formulario */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Datos del período</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Mes</Label>
                    <Select value={String(mes)} onValueChange={v => { setMes(+v); setResult(null); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.slice(1).map((m, i) => (
                          <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Año</Label>
                    <Input
                      type="number" value={anio} min={2020} max={2030}
                      onChange={e => { setAnio(+e.target.value); setResult(null); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Días Ausente</Label>
                    <Input
                      type="number" value={ausencias} min={0} max={30}
                      onChange={e => { setAusencias(+e.target.value); setResult(null); }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Trabajador</Label>
                  <Select value={workerId} onValueChange={v => { setWorkerId(v); setResult(null); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {notaMarzo && (
                  <div className="text-xs bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg p-3">
                    {notaMarzo}
                  </div>
                )}

                {worker && (
                  <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 grid grid-cols-2 gap-1.5">
                    <span>Sueldo base: <strong>${worker.sueldo.toLocaleString('es-CL')}</strong></span>
                    <span>AFP: <strong>{worker.afp.split(':')[0]}</strong></span>
                    <span>Colación: <strong>${worker.colacion.toLocaleString('es-CL')}</strong></span>
                    <span>Salud: <strong>{worker.salud.split(':')[0]}</strong></span>
                  </div>
                )}

                <Button onClick={calcular} disabled={!workerId} className="w-full" size="lg">
                  <Calculator />
                  Calcular Liquidación
                </Button>
              </CardContent>
            </Card>

            {/* Resultado */}
            {result && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="text-center mb-2">
                    <h2 className="font-bold text-base">Liquidación {MESES[result.mes]} {result.anio}</h2>
                    <p className="text-sm text-muted-foreground">{result.worker.nombre} — {result.worker.cargo}</p>
                  </div>

                  <Section title="Haberes">
                    <Row label={`Sueldo Base (${result.diasTrabajados}/${DIAS_BASE_MES} días)`} value={fmt(result.sueldoBase)} />
                    <Row label="Colación (no imponible)" value={fmt(result.colacion)} />
                    <Row label="Movilización (no imponible)" value={fmt(result.movilizacion)} />
                    <Row label="Total Haberes" value={fmt(result.totalHaberes)} bold />
                  </Section>

                  <Section title="Descuentos Previsionales">
                    <Row label={`AFP ${result.afpNombre} (${result.afpTasa}%)`} value={`- ${fmt(result.descAFP)}`} red />
                    <Row label={`${result.saludNombre} (${result.saludTasa}%)`} value={`- ${fmt(result.descSalud)}`} red />
                    <Row label="AFC Cesantía Trab. (0.60%)" value={`- ${fmt(result.descAFC)}`} red />
                    <Row label="Total Previsional" value={`- ${fmt(result.totalPrevis)}`} bold red />
                  </Section>

                  <Section title="Impuesto">
                    <Row label={`Base imponible (${fmt(result.base)} - prev.)`} value={fmt(result.baseImpuesto)} />
                    <Row label="Impuesto Único 2ª Categoría" value={result.impuesto > 0 ? `- ${fmt(result.impuesto)}` : 'Exento'} red={result.impuesto > 0} />
                  </Section>

                  <div className="bg-primary text-primary-foreground rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs opacity-80 font-medium">LÍQUIDO A PAGAR</div>
                      {ausencias > 0 && <div className="text-xs opacity-70">{result.diasTrabajados} días ({ausencias} ausencias)</div>}
                    </div>
                    <div className="text-2xl font-bold">{fmt(result.liquido)}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={generarPDF} variant="outline" className="flex-1">
                      <FileText />
                      Generar PDF
                    </Button>
                    <Button
                      onClick={guardar}
                      variant={saved ? "secondary" : "outline"}
                      className={`flex-1 ${saved ? 'text-green-700 dark:text-green-400' : ''}`}
                    >
                      <Save />
                      {saved ? 'Guardado ✓' : 'Guardar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 rounded-md px-2 py-1.5 mb-1">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) {
  return (
    <div className={`flex justify-between text-sm px-1 py-0.5 ${bold ? 'font-semibold' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={red ? 'text-destructive' : ''}>{value}</span>
    </div>
  );
}

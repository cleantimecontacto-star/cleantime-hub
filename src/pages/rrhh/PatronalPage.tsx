import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import AppLayout from "@/components/AppLayout";
import { getTrabajadores, getHistorial } from "@/lib/rrhh/storage";
import { fmt, DIAS_BASE_MES, TASAS_TRAB, TASAS_PAT } from "@/lib/rrhh/calculations";
import type { Worker } from "@/lib/rrhh/types";
import { MESES } from "@/lib/rrhh/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

const now = new Date();

export default function PatronalPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());

  useEffect(() => {
    const ws = getTrabajadores();
    setWorkers(ws);
    if (ws.length > 0) setWorkerId(ws[0].id);
  }, []);

  const hist = getHistorial();
  const entrada = hist.find(h =>
    (h.workerId === workerId || h.worker?.id === workerId) &&
    h.mes === mes && h.anio === anio
  );

  let contenido: ReactNode = null;
  if (entrada) {
    const { base, afpNombre, afpTasa, saludNombre, saludTasa, diasTrabajados, colacion, movilizacion } = entrada;
    const afpOblig   = Math.round(base * parseFloat(afpTasa) / 100);
    const saludCot   = Math.round(base * parseFloat(saludTasa) / 100);
    const afcTotal   = Math.round(base * ((TASAS_TRAB.afc + TASAS_PAT.afc_pat) / 100));
    const sis        = Math.round(base * TASAS_TRAB.sis / 100);
    const isl        = Math.round(base * TASAS_TRAB.isl / 100);
    const ssp        = Math.round(base * TASAS_TRAB.ssp / 100);
    const totalPrevired = afpOblig + saludCot + afcTotal + sis + isl + ssp;
    const costoEmpresa  = base + (colacion||0) + (movilizacion||0) + sis + isl + ssp +
      Math.round(base * (TASAS_PAT.afp_pat / 100)) + Math.round(base * (TASAS_PAT.afc_pat / 100));

    contenido = (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{MESES[mes]} {anio}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">{diasTrabajados}/{DIAS_BASE_MES} días</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">Imponible: {fmt(base)}</span>
        </div>
        <div className="space-y-0.5">
          {[
            [`${afpNombre} (Cotización obligatoria ${afpTasa}%)`, afpOblig],
            [`${saludNombre} (Cotización salud ${saludTasa}%)`, saludCot],
            [`AFC (Total ${(TASAS_TRAB.afc + TASAS_PAT.afc_pat).toFixed(2)}% = Trab. + Empl.)`, afcTotal],
            [`SIS ${afpNombre} (${TASAS_TRAB.sis}%)`, sis],
            [`ISL (${TASAS_TRAB.isl}%)`, isl],
            [`Seguro Social Previsional (${TASAS_TRAB.ssp}%)`, ssp],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between text-xs px-1 py-1 border-b border-border/50 last:border-b-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{fmt(Number(value))}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary text-primary-foreground rounded-lg p-3 flex justify-between items-center mt-2">
          <div>
            <div className="text-[10px] opacity-80 font-semibold uppercase tracking-wide">Total pagado (Previred)</div>
            <div className="text-[10px] opacity-70">Suma de cotizaciones sobre imponible</div>
          </div>
          <div className="text-lg font-bold">{fmt(totalPrevired)}</div>
        </div>
        <div className="text-right text-[10px] text-muted-foreground">
          Costo empresa aprox. (incl. no imponibles y aportes): <strong className="text-foreground">{fmt(costoEmpresa)}</strong>
        </div>
      </div>
    );
  } else {
    const mesLabel = `${MESES[mes]}/${anio}`;
    contenido = (
      <div className="text-center py-12">
        <AlertCircle size={32} className="mx-auto text-muted-foreground mb-2" />
        <p className="font-medium text-sm mb-1">Sin liquidación para {mesLabel}</p>
        <p className="text-xs text-muted-foreground">Genera y guarda la liquidación primero</p>
      </div>
    );
  }

  return (
    <AppLayout title="Resumen Patronal" module="rrhh">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Selector de período */}
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Seleccionar período
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground">Mes</Label>
                <Select value={String(mes)} onValueChange={v => setMes(+v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESES.slice(1).map((m, i) => (
                      <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground">Año</Label>
                <Input
                  type="number" value={anio} min={2020} max={2030}
                  onChange={e => setAnio(+e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground">Trabajador</Label>
                <Select value={workerId} onValueChange={setWorkerId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.nombre.split(' ')[0]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-card rounded-lg border border-border p-3">
            {contenido}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

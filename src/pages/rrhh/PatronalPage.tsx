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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="secondary">{MESES[mes]} {anio}</Badge>
          <Badge variant="outline">{diasTrabajados}/{DIAS_BASE_MES} días</Badge>
          <Badge variant="outline">Imponible: {fmt(base)}</Badge>
        </div>
        {[
          [`${afpNombre} (Cotización obligatoria ${afpTasa}%)`, afpOblig],
          [`${saludNombre} (Cotización salud ${saludTasa}%)`, saludCot],
          [`AFC (Total ${(TASAS_TRAB.afc + TASAS_PAT.afc_pat).toFixed(2)}% = Trab. + Empl.)`, afcTotal],
          [`SIS ${afpNombre} (${TASAS_TRAB.sis}%)`, sis],
          [`ISL (${TASAS_TRAB.isl}%)`, isl],
          [`Seguro Social Previsional (${TASAS_TRAB.ssp}%)`, ssp],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between text-sm border-b border-border/50 pb-1.5">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{fmt(Number(value))}</span>
          </div>
        ))}
        <div className="bg-primary text-primary-foreground rounded-xl p-4 flex justify-between items-center mt-3">
          <div>
            <div className="font-bold text-sm">TOTAL PAGADO (Previred)</div>
            <div className="text-xs opacity-70">Suma de cotizaciones sobre imponible</div>
          </div>
          <div className="text-xl font-bold">{fmt(totalPrevired)}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground mt-1">
          Costo empresa aprox. (incl. no imponibles y aportes): <strong>{fmt(costoEmpresa)}</strong>
        </div>
      </div>
    );
  } else {
    const mesLabel = `${MESES[mes]}/${anio}`;
    contenido = (
      <div className="text-center py-8 text-sm">
        <p className="text-destructive font-medium">⚠️ No existe liquidación guardada para {mesLabel}.</p>
        <p className="text-muted-foreground text-xs mt-1">Genera y guarda la liquidación primero.</p>
      </div>
    );
  }

  return (
    <AppLayout title="Resumen Patronal" module="rrhh">
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Seleccionar período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Mes</Label>
                <Select value={String(mes)} onValueChange={v => setMes(+v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  onChange={e => setAnio(+e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trabajador</Label>
                <Select value={workerId} onValueChange={setWorkerId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.nombre.split(' ')[0]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {contenido}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

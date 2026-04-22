
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { getTrabajadores, getHistorial } from "@/lib/rrhh/storage";
import { fmt, DIAS_BASE_MES, TASAS_TRAB, TASAS_PAT } from "@/lib/rrhh/calculations";
import type { Worker } from "@/lib/rrhh/types";
import { MESES } from "@/lib/rrhh/types";

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

  let contenido = null;
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
        <p className="text-xs text-muted-foreground">
          Período: <strong>{MESES[mes]}/{anio}</strong> · Días: {diasTrabajados}/{DIAS_BASE_MES} · Imponible: {fmt(base)}
        </p>
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
        <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center mt-3">
          <div>
            <div className="font-bold text-sm">TOTAL PAGADO (Previred)</div>
            <div className="text-xs opacity-70">Suma de cotizaciones sobre imponible</div>
          </div>
          <div className="text-xl font-bold">{fmt(totalPrevired)}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground mt-1">
          Costo empresa aprox. (incl. no imponibles y aportes): {fmt(costoEmpresa)}
        </div>
      </div>
    );
  } else {
    const mesLabel = `${MESES[mes]}/${anio}`;
    contenido = (
      <div className="text-center py-8 text-sm">
        <p className="text-red-400 font-medium">⚠️ No existe liquidación guardada para {mesLabel}.</p>
        <p className="text-muted-foreground text-xs mt-1">Genera y guarda la liquidación primero.</p>
      </div>
    );
  }

  return (
    <AppLayout title="Gastos Patronales" module="rrhh">
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Mes</label>
              <select value={mes} onChange={e => setMes(+e.target.value)} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background">
                {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Año</label>
              <input type="number" value={anio} min={2020} max={2030} onChange={e => setAnio(+e.target.value)} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background" />
            </div>
            <div className="col-span-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Trabajador</label>
            <select value={workerId} onChange={e => setWorkerId(e.target.value)} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background">
              {workers.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 rounded-md px-2 py-1 mb-3">🏢 Desglose Patronal</div>
          {contenido}
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
          Estos costos son pagados por la empresa y <strong>NO se descuentan del trabajador</strong>.
        </div>
      </div>
    </AppLayout>
  );
}

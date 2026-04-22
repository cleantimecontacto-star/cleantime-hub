import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { getTrabajadores, setTrabajadores, getHistorial, setHistorial, newId } from "@/lib/rrhh/storage";
import type { Worker } from "@/lib/rrhh/types";
import { AFP_OPTIONS, SALUD_OPTIONS } from "@/lib/rrhh/types";
import { Pencil, Trash2, UserPlus, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const EMPTY: Omit<Worker, 'id'> = {
  nombre: '', rut: '', cargo: '', ingreso: '', sueldo: 540000,
  colacion: 30000, movilizacion: 30000, afp: 'Provida:11.55', salud: 'FONASA:7',
};

export default function TrabajadoresPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modal, setModal] = useState<Worker | null>(null);
  const [form, setForm] = useState<Omit<Worker, 'id'>>(EMPTY);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => { setWorkers(getTrabajadores()); }, []);

  function abrirNuevo() {
    setModal({ id: '', ...EMPTY });
    setForm(EMPTY);
  }

  function abrirEditar(w: Worker) {
    setModal(w);
    setForm({ nombre: w.nombre, rut: w.rut, cargo: w.cargo, ingreso: w.ingreso,
      sueldo: w.sueldo, colacion: w.colacion, movilizacion: w.movilizacion,
      afp: w.afp, salud: w.salud });
  }

  function guardar() {
    if (!form.nombre.trim()) { toast.error('Ingresa el nombre del trabajador'); return; }
    let updated: Worker[];
    if (modal?.id) {
      updated = workers.map(w => w.id === modal.id ? { ...form, id: modal.id } : w);
    } else {
      updated = [...workers, { ...form, id: newId('w') }];
    }
    setWorkers(updated);
    setTrabajadores(updated);
    setModal(null);
    toast.success(modal?.id ? 'Trabajador actualizado' : 'Trabajador agregado');
  }

  function eliminar(id: string) {
    if (!confirm('¿Eliminar este trabajador?')) return;
    const updated = workers.filter(w => w.id !== id);
    setWorkers(updated);
    setTrabajadores(updated);
    toast.success('Trabajador eliminado');
  }

  function exportarDatos() {
    const data = {
      trabajadores: getTrabajadores(),
      historial: getHistorial(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleantime-rrhh-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados como JSON');
  }

  function importarDatos() {
    try {
      const data = JSON.parse(importText);
      if (!data.trabajadores || !Array.isArray(data.trabajadores)) {
        toast.error('Formato inválido: falta "trabajadores"');
        return;
      }
      setTrabajadores(data.trabajadores);
      setWorkers(data.trabajadores);
      if (data.historial && Array.isArray(data.historial)) {
        setHistorial(data.historial);
      }
      setShowImport(false);
      setImportText("");
      toast.success(`Importados ${data.trabajadores.length} trabajadores${data.historial ? ` y ${data.historial.length} liquidaciones` : ''}`);
    } catch {
      toast.error('JSON inválido. Verifica el formato.');
    }
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  return (
    <AppLayout title="Trabajadores" module="rrhh">
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={abrirNuevo} size="sm">
            <UserPlus />
            Agregar Trabajador
          </Button>
          <Button onClick={exportarDatos} variant="outline" size="sm">
            <Download />
            Exportar
          </Button>
          <Button onClick={() => setShowImport(true)} variant="outline" size="sm">
            <Upload />
            Importar
          </Button>
        </div>

        {workers.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 text-sm">
            No hay trabajadores registrados.
          </div>
        ) : (
          workers.map(w => (
            <div key={w.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{w.nombre}</p>
                <p className="text-xs text-muted-foreground">{w.cargo} · RUT: {w.rut}</p>
                <p className="text-xs text-muted-foreground">
                  Sueldo: ${w.sueldo.toLocaleString('es-CL')} · {w.afp.split(':')[0]} · {w.salud.split(':')[0]}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button onClick={() => abrirEditar(w)} variant="ghost" size="icon-sm">
                  <Pencil size={16} />
                </Button>
                <Button onClick={() => eliminar(w.id)} variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal editar/nuevo trabajador */}
      <Dialog open={modal !== null} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal?.id ? 'Editar Trabajador' : 'Nuevo Trabajador'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {([
              ['nombre', 'Nombre completo', 'text', 'Juan Pérez'],
              ['rut', 'RUT', 'text', '12.345.678-9'],
              ['cargo', 'Cargo', 'text', 'Auxiliar de Aseo'],
            ] as [keyof typeof EMPTY, string, string, string][]).map(([key, label, type, ph]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type={type}
                  placeholder={ph}
                  value={String(form[key])}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>Fecha Ingreso</Label>
              <Input
                type="date"
                value={String(form.ingreso)}
                onChange={e => setForm(f => ({ ...f, ingreso: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {([
                ['sueldo', 'Sueldo Base'],
                ['colacion', 'Colación'],
                ['movilizacion', 'Movilización'],
              ] as [keyof typeof EMPTY, string][]).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    value={Number(form[key])}
                    onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>AFP</Label>
                <Select value={form.afp} onValueChange={v => setForm(f => ({ ...f, afp: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AFP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Salud</Label>
                <Select value={form.salud} onValueChange={v => setForm(f => ({ ...f, salud: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SALUD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal importar datos */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar datos de RRHH</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground text-xs">
              Para recuperar datos del sitio anterior (<strong>liquidaciones-cleantime.vercel.app</strong>):
              visita ese sitio, ve a <em>Trabajadores → Exportar</em>, descarga el JSON y súbelo aquí.
              O pega el contenido JSON directamente.
            </p>
            <div className="space-y-1.5">
              <Label>Archivo JSON</Label>
              <Input type="file" accept=".json" onChange={handleImportFile} />
            </div>
            <div className="space-y-1.5">
              <Label>O pega el JSON aquí</Label>
              <textarea
                className="w-full min-h-[100px] border border-border rounded-md p-2 text-xs bg-background font-mono resize-y"
                placeholder='{"trabajadores": [...], "historial": [...]}'
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImport(false); setImportText(""); }}>Cancelar</Button>
            <Button onClick={importarDatos} disabled={!importText.trim()}>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

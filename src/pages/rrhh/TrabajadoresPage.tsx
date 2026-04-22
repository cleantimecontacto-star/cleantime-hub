
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { getTrabajadores, setTrabajadores, newId } from "@/lib/rrhh/storage";
import type { Worker } from "@/lib/rrhh/types";
import { AFP_OPTIONS, SALUD_OPTIONS } from "@/lib/rrhh/types";
import { Pencil, Trash2, UserPlus } from "lucide-react";

const EMPTY: Omit<Worker, 'id'> = {
  nombre: '', rut: '', cargo: '', ingreso: '', sueldo: 540000,
  colacion: 30000, movilizacion: 30000, afp: 'Provida:11.55', salud: 'FONASA:7',
};

export default function TrabajadoresPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modal, setModal] = useState<Worker | null>(null);
  const [form, setForm] = useState<Omit<Worker, 'id'>>(EMPTY);

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
    if (!form.nombre.trim()) return alert('Ingresa el nombre del trabajador');
    let updated: Worker[];
    if (modal?.id) {
      updated = workers.map(w => w.id === modal.id ? { ...form, id: modal.id } : w);
    } else {
      updated = [...workers, { ...form, id: newId('w') }];
    }
    setWorkers(updated);
    setTrabajadores(updated);
    setModal(null);
  }

  function eliminar(id: string) {
    if (!confirm('¿Eliminar este trabajador?')) return;
    const updated = workers.filter(w => w.id !== id);
    setWorkers(updated);
    setTrabajadores(updated);
  }

  return (
    <AppLayout title="Trabajadores" module="rrhh">
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          <UserPlus size={16} /> Agregar Trabajador
        </button>

        {workers.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 text-sm">No hay trabajadores registrados.</div>
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
                <button onClick={() => abrirEditar(w)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => eliminar(w.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base">{modal.id ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h3>

            {([
              ['nombre', 'Nombre completo', 'text', 'Juan Pérez'],
              ['rut', 'RUT', 'text', '12.345.678-9'],
              ['cargo', 'Cargo', 'text', 'Auxiliar de Aseo'],
              ['ingreso', 'Fecha Ingreso', 'date', ''],
            ] as [keyof typeof EMPTY, string, string, string][]).map(([key, label, type, ph]) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                <input
                  type={type}
                  placeholder={ph}
                  value={String(form[key])}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background"
                />
              </div>
            ))}

            <div className="grid grid-cols-3 gap-2">
              {([
                ['sueldo', 'Sueldo Base'],
                ['colacion', 'Colación'],
                ['movilizacion', 'Movilización'],
              ] as [keyof typeof EMPTY, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                  <input
                    type="number"
                    value={Number(form[key])}
                    onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))}
                    className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">AFP</label>
                <select value={form.afp} onChange={e => setForm(f => ({ ...f, afp: e.target.value }))} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background">
                  {AFP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Salud</label>
                <select value={form.salud} onChange={e => setForm(f => ({ ...f, salud: e.target.value }))} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background">
                  {SALUD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={guardar} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
                💾 Guardar
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border border-border rounded-lg py-2 text-sm font-medium hover:bg-muted transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

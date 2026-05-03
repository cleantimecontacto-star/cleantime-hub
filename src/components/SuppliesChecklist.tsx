import { useState } from 'react';
import { Package, RotateCcw, Check, Plus, Trash2, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { Input } from '@/components/ui/input.tsx';

type Supply = {
  id: string;
  nombre: string;
  emoji: string;
  porTrabajador: number;
};

const DEFAULT_SUPPLIES: Supply[] = [
  { id: 'escoba',       nombre: 'Escoba',              emoji: '🧹', porTrabajador: 1 },
  { id: 'pala',         nombre: 'Pala',                emoji: '🪣', porTrabajador: 1 },
  { id: 'mopa',         nombre: 'Mopa',                emoji: '🫧', porTrabajador: 1 },
  { id: 'balde',        nombre: 'Balde',               emoji: '🪣', porTrabajador: 1 },
  { id: 'espatula',     nombre: 'Espátula',            emoji: '🔧', porTrabajador: 1 },
  { id: 'diluyente',    nombre: 'Botella diluyente',   emoji: '🧴', porTrabajador: 1 },
  { id: 'bolsa-mopa',   nombre: 'Bolsa de mopa',       emoji: '🛍️', porTrabajador: 1 },
  { id: 'bolsa-basura', nombre: 'Bolsa de basura',     emoji: '🗑️', porTrabajador: 2 },
  { id: 'guantes',      nombre: 'Guantes',             emoji: '🧤', porTrabajador: 1 },
  { id: 'cepillo',      nombre: 'Cepillo',             emoji: '🪥', porTrabajador: 1 },
];

type EditState = { id: string; nombre: string; emoji: string; qty: number } | null;

export function SuppliesChecklist({ defaultCount = 1 }: { defaultCount?: number }) {
  const [workerCount, setWorkerCount] = useState(Math.max(1, defaultCount));
  const [supplies, setSupplies] = useState<Supply[]>(DEFAULT_SUPPLIES);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editState, setEditState] = useState<EditState>(null);

  const toggle = (id: string) =>
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const reset = () => setChecked(new Set());

  const addItem = () => {
    const name = newItem.trim();
    if (!name) return;
    const id = 'custom-' + Date.now();
    setSupplies(s => [...s, { id, nombre: name, emoji: '📦', porTrabajador: 1 }]);
    setNewItem('');
    setShowAdd(false);
  };

  const removeItem = (id: string) => {
    if (!confirm('¿Eliminar este ítem del checklist?')) return;
    setSupplies(s => s.filter(x => x.id !== id));
    setChecked(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (editState?.id === id) setEditState(null);
  };

  const startEdit = (s: Supply) => {
    setEditState({ id: s.id, nombre: s.nombre, emoji: s.emoji, qty: s.porTrabajador });
  };

  const saveEdit = () => {
    if (!editState) return;
    const nombre = editState.nombre.trim();
    if (!nombre) return;
    setSupplies(ss =>
      ss.map(x =>
        x.id === editState.id
          ? { ...x, nombre, emoji: editState.emoji, porTrabajador: Math.max(1, editState.qty) }
          : x
      )
    );
    setEditState(null);
  };

  const checkedCount = supplies.filter(s => checked.has(s.id)).length;
  const total = supplies.length;
  const allDone = total > 0 && checkedCount === total;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Package size={13} className="text-primary" />
          <span className="text-xs font-bold">Checklist de insumos</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {checkedCount}/{total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Trabajadores:</span>
          <Input
            type="number"
            min={1}
            max={99}
            value={workerCount}
            onChange={e => setWorkerCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-6 w-12 text-xs text-center px-1"
          />
          <button
            onClick={reset}
            title="Reiniciar checks"
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-500',
            allDone ? 'bg-green-500' : 'bg-primary'
          )}
          style={{ width: `${total > 0 ? (checkedCount / total) * 100 : 0}%` }}
        />
      </div>

      {/* Items */}
      <div className="p-2 space-y-0.5">
        {supplies.map(s => {
          const qty = s.porTrabajador * workerCount;
          const done = checked.has(s.id);
          const isEditing = editState?.id === s.id;

          if (isEditing) {
            return (
              <div key={s.id} className="flex flex-col gap-1.5 bg-muted/40 rounded-lg px-2 py-2 border border-border my-0.5">
                <div className="flex items-center gap-1.5">
                  <Input
                    value={editState!.emoji}
                    onChange={e => setEditState(es => es ? { ...es, emoji: e.target.value } : es)}
                    className="h-7 w-12 text-center text-sm px-1"
                    maxLength={2}
                    placeholder="📦"
                  />
                  <Input
                    autoFocus
                    value={editState!.nombre}
                    onChange={e => setEditState(es => es ? { ...es, nombre: e.target.value } : es)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditState(null); }}
                    placeholder="Nombre del insumo"
                    className="h-7 text-xs flex-1"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Por trabajador:</span>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={editState!.qty}
                    onChange={e => setEditState(es => es ? { ...es, qty: parseInt(e.target.value) || 1 } : es)}
                    className="h-6 w-14 text-xs text-center px-1"
                  />
                  <div className="flex-1" />
                  <button
                    onClick={() => setEditState(null)}
                    className="h-7 px-2 rounded hover:bg-muted text-xs text-muted-foreground flex items-center gap-1"
                  >
                    <X size={11} /> Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    className="h-7 px-2 rounded bg-primary text-primary-foreground text-xs font-medium"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={s.id} className="flex items-center gap-0.5">
              <button
                onClick={() => toggle(s.id)}
                className={cn(
                  'flex items-center gap-2 flex-1 px-2 py-1.5 rounded-md text-left transition-colors',
                  done ? 'bg-primary/8' : 'hover:bg-muted active:bg-muted'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                    done
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border'
                  )}
                >
                  {done && <Check size={10} strokeWidth={3} />}
                </div>
                <span className="text-sm leading-none">{s.emoji}</span>
                <span className={cn('flex-1 text-xs', done && 'line-through text-muted-foreground')}>
                  {s.nombre}
                </span>
                <span className={cn('text-xs font-bold tabular-nums min-w-[36px] text-right', done ? 'text-green-600' : 'text-foreground')}>
                  x{qty}
                </span>
              </button>

              {/* Editar — siempre visible en móvil */}
              <button
                onClick={() => startEdit(s)}
                className="p-1.5 rounded text-muted-foreground hover:text-primary active:text-primary shrink-0"
                title="Editar"
              >
                <Pencil size={11} />
              </button>

              {/* Eliminar — siempre visible en móvil */}
              <button
                onClick={() => removeItem(s.id)}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive active:text-destructive shrink-0"
                title="Eliminar"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}

        {/* Agregar ítem */}
        {showAdd ? (
          <div className="flex items-center gap-1 pt-1">
            <Input
              autoFocus
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addItem();
                if (e.key === 'Escape') setShowAdd(false);
              }}
              placeholder="Nombre del insumo..."
              className="h-7 text-xs flex-1"
            />
            <button
              onClick={addItem}
              className="h-7 px-2 rounded bg-primary text-primary-foreground text-xs font-medium"
            >
              OK
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewItem(''); }}
              className="h-7 px-2 rounded hover:bg-muted text-xs text-muted-foreground"
            >
              X
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-[11px] text-primary font-medium mt-1 px-2 py-1 rounded hover:bg-muted active:bg-muted w-full"
          >
            <Plus size={11} /> Agregar ítem
          </button>
        )}
      </div>

      {allDone && (
        <div className="px-3 pb-2.5 text-center text-[11px] text-green-600 font-semibold">
          Todo listo para salir al proyecto
        </div>
      )}
    </div>
  );
}

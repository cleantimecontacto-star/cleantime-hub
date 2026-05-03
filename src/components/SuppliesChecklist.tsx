import { useState } from "react";
import { Package, RotateCcw, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";

type Supply = {
  id: string;
  nombre: string;
  emoji: string;
  porTrabajador: number;
};

const DEFAULT_SUPPLIES: Supply[] = [
  { id: "escoba",       nombre: "Escoba",              emoji: "🧹", porTrabajador: 1 },
  { id: "pala",         nombre: "Pala",                emoji: "🪣", porTrabajador: 1 },
  { id: "mopa",         nombre: "Mopa",                emoji: "🫧", porTrabajador: 1 },
  { id: "balde",        nombre: "Balde",               emoji: "🪣", porTrabajador: 1 },
  { id: "espatula",     nombre: "Espátula",            emoji: "🔧", porTrabajador: 1 },
  { id: "diluyente",    nombre: "Botella diluyente",   emoji: "🧴", porTrabajador: 1 },
  { id: "bolsa-mopa",   nombre: "Bolsa de mopa",       emoji: "🛍️", porTrabajador: 1 },
  { id: "bolsa-basura", nombre: "Bolsa de basura",     emoji: "🗑️", porTrabajador: 2 },
  { id: "guantes",      nombre: "Guantes",             emoji: "🧤", porTrabajador: 1 },
  { id: "cepillo",      nombre: "Cepillo",             emoji: "🪥", porTrabajador: 1 },
];

export function SuppliesChecklist({ defaultCount = 1 }: { defaultCount?: number }) {
  const [workerCount, setWorkerCount] = useState(Math.max(1, defaultCount));
  const [supplies, setSupplies] = useState<Supply[]>(DEFAULT_SUPPLIES);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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
    const id = `custom-${Date.now()}`;
    setSupplies(s => [...s, { id, nombre: name, emoji: "📦", porTrabajador: 1 }]);
    setNewItem("");
    setShowAdd(false);
  };

  const removeItem = (id: string) => {
    setSupplies(s => s.filter(x => x.id !== id));
    setChecked(prev => { const n = new Set(prev); n.delete(id); return n; });
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
            "h-full transition-all duration-500",
            allDone ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${total > 0 ? (checkedCount / total) * 100 : 0}%` }}
        />
      </div>

      {/* Items */}
      <div className="p-2 space-y-0.5">
        {supplies.map(s => {
          const qty = s.porTrabajador * workerCount;
          const done = checked.has(s.id);
          return (
            <div key={s.id} className="flex items-center gap-1 group">
              <button
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex items-center gap-2 flex-1 px-2 py-1.5 rounded-md text-left transition-colors",
                  done ? "bg-primary/8" : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  {done && <Check size={10} strokeWidth={3} />}
                </div>
                <span className="text-sm leading-none">{s.emoji}</span>
                <span
                  className={cn(
                    "flex-1 text-xs",
                    done && "line-through text-muted-foreground"
                  )}
                >
                  {s.nombre}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums min-w-[36px] text-right",
                    done ? "text-green-600" : "text-foreground"
                  )}
                >
                  ×{qty}
                </span>
              </button>
              <button
                onClick={() => removeItem(s.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Quitar"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}

        {/* Agregar ítem personalizado */}
        {showAdd ? (
          <div className="flex items-center gap-1 pt-1">
            <Input
              autoFocus
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setShowAdd(false); }}
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
              onClick={() => { setShowAdd(false); setNewItem(""); }}
              className="h-7 px-2 rounded hover:bg-muted text-xs text-muted-foreground"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-[11px] text-primary font-medium mt-1 px-2 py-1 rounded hover:bg-muted w-full"
          >
            <Plus size={11} /> Agregar ítem
          </button>
        )}
      </div>

      {/* Completado */}
      {allDone && (
        <div className="px-3 pb-2.5 text-center text-[11px] text-green-600 font-semibold">
          ✓ Todo listo para salir al proyecto
        </div>
      )}
    </div>
  );
}

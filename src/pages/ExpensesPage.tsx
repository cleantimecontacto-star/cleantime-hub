import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { formatCLP, todayISO } from "@/lib/cleantime.ts";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog.tsx";

type Expense = Doc<"expenses">;

type ExpenseForm = { category: string; description: string; amount: string; date: string; quoteId: string };
const emptyForm = (): ExpenseForm => ({ category: "", description: "", amount: "0", date: todayISO(), quoteId: "" });

export default function ExpensesPage() {
  const expenses = useQuery(api.expenses.list);
  const categories = useQuery(api.expenses.listCategories);
  const quotes = useQuery(api.quotes.list);
  const createExpense = useMutation(api.expenses.create);
  const updateExpense = useMutation(api.expenses.update);
  const removeExpense = useMutation(api.expenses.remove);

  const [filterCat, setFilterCat] = useState("Todas");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"expenses"> | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Id<"expenses"> | null>(null);

  const catNames = (categories ?? []).map(c => c.name);

  const filtered = useMemo(() => {
    const list = expenses ?? [];
    if (filterCat === "Todas") return list;
    return list.filter(e => e.category === filterCat);
  }, [expenses, filterCat]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const totalGlobal = (expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const _now = new Date();
  const currentMonth = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,"0")}`; // local month
  const totalMes = (expenses ?? []).filter(e => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);

  const openEdit = (e: Expense) => {
    setEditId(e._id);
    setForm({ category: e.category, description: e.description, amount: String(e.amount), date: e.date, quoteId: e.quoteId ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.category) { toast.error("Selecciona categoría"); return; }
    if (!form.description.trim()) { toast.error("Ingresa descripción"); return; }
    setSaving(true);
    try {
      const quote = form.quoteId ? (quotes ?? []).find(q => q._id === form.quoteId) : undefined;
      const data = {
        category: form.category,
        description: form.description.trim(),
        amount: parseFloat(form.amount) || 0,
        date: form.date || todayISO(),
        quoteId: form.quoteId ? form.quoteId as Id<"quotes"> : undefined,
        quoteName: quote?.number,
      };
      if (editId) {
        await updateExpense({ id: editId, ...data });
        toast.success("Gasto actualizado");
      } else {
        await createExpense(data);
        toast.success("Gasto registrado");
      }
      setShowForm(false);
    } catch { toast.error("Error al guardar"); } finally { setSaving(false); }
  };

  return (
    <AppLayout
      title="Gastos"
      headerRight={
        <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true); }}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
          <Plus size={13} /> Nuevo
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Resumen global */}
        <div className="shrink-0 px-3 pt-3 pb-0">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-card rounded-lg border border-border p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Total acumulado</p>
              <p className="text-sm font-bold text-red-500">{expenses === undefined ? "..." : formatCLP(totalGlobal)}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Este mes</p>
              <p className="text-sm font-bold text-orange-500">{expenses === undefined ? "..." : formatCLP(totalMes)}</p>
            </div>
          </div>
        </div>
        {/* Fixed: form + filter */}
        <div className="shrink-0 p-3 pb-2 space-y-2">
        {showForm && (
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold">{editId ? "Editar" : "Nuevo"} Gasto</p>
              <button onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5 col-span-2">
                <label className="text-[10px] text-muted-foreground">Categoría *</label>
                <Select value={form.category || "none"} onValueChange={v => setForm(f => ({ ...f, category: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {catNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5 col-span-2">
                <label className="text-[10px] text-muted-foreground">Descripción *</label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-7 text-xs" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Monto</label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="h-7 text-xs" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Fecha</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-7 text-xs" />
              </div>
              <div className="space-y-0.5 col-span-2">
                <label className="text-[10px] text-muted-foreground">Cotización asociada (opcional)</label>
                <Select value={form.quoteId || "none"} onValueChange={v => setForm(f => ({ ...f, quoteId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin cotización" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cotización</SelectItem>
                    {(quotes ?? []).map(q => <SelectItem key={q._id} value={q._id}>{q.number} - {q.clientName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-7 text-xs">
                <Check size={12} className="mr-1" /> {saving ? "..." : "Guardar"}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} className="h-7 text-xs px-3">Cancelar</Button>
            </div>
          </div>
        )}

          <div className="flex items-center gap-2">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las categorías</SelectItem>
                {catNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="shrink-0 text-xs font-bold">{formatCLP(total)}</div>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {expenses === undefined && [0,1,2].map(i => <Skeleton key={i} className="h-12" />)}
        {expenses !== undefined && filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No hay gastos</p>
        )}
        {filtered.map(e => (
          <div key={e._id} className="bg-card rounded-lg border border-border p-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{e.category}</span>
                {e.quoteName && <span className="text-[9px] text-blue-600">{e.quoteName}</span>}
              </div>
              <p className="text-xs font-medium mt-0.5 truncate">{e.description}</p>
              <p className="text-[10px] text-muted-foreground">{e.date}</p>
            </div>
            <p className="text-sm font-bold shrink-0 text-red-500">{formatCLP(e.amount)}</p>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(e)} className="p-1 rounded hover:bg-muted"><Pencil size={12} /></button>
              <button
                onClick={() => setDeleteExpenseTarget(e._id)}
                className="p-1 rounded hover:bg-muted text-destructive"
              ><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        </div>
      </div>
      <DeleteConfirmDialog
        open={!!deleteExpenseTarget}
        onClose={() => setDeleteExpenseTarget(null)}
        onConfirm={async () => { if (deleteExpenseTarget) { await removeExpense({ id: deleteExpenseTarget }); toast.success("Gasto eliminado"); } }}
        title="¿Eliminar gasto?"
        description="Esta acción eliminará el gasto permanentemente y no se puede deshacer."
      />
    </AppLayout>
  );
}

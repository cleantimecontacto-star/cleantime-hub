import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import AppLayout from "@/components/AppLayout.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Pencil, Trash2, Plus, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { formatCLP, todayISO } from "@/lib/cleantime.ts";
import { cn } from "@/lib/utils.ts";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog.tsx";

type Worker = Doc<"workers">;
type WorkerJob = Doc<"workerJobs">;

const PAYMENT_TYPE_LABELS: Record<Worker["paymentType"], string> = {
  por_dia: "Por día",
  a_trato: "A trato",
  por_m2: "Por m²",
};

function WorkerCard({ worker, jobs, onEdit, onDelete, onAddJob, onDeleteJob, onEditJob, onTogglePaid, quotes }: {
  worker: Worker;
  jobs: WorkerJob[];
  onEdit: (w: Worker) => void;
  onDelete: (id: Id<"workers">) => void;
  onAddJob: (workerId: Id<"workers">) => void;
  onDeleteJob: (id: Id<"workerJobs">) => void;
  onEditJob: (job: WorkerJob) => void;
  onTogglePaid: (id: Id<"workerJobs">, paid: boolean) => void;
  quotes: Doc<"quotes">[];
}) {
  const [expanded, setExpanded] = useState(false);
  const total = jobs.reduce((s, j) => s + j.amount, 0);
  const paid = jobs.filter(j => j.paid).reduce((s, j) => s + j.amount, 0);
  const pending = total - paid;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold">{worker.name}</p>
            <p className="text-[10px] text-muted-foreground">{PAYMENT_TYPE_LABELS[worker.paymentType]} · {formatCLP(worker.rateAmount)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(worker)} className="p-1 rounded hover:bg-muted"><Pencil size={12} /></button>
            <button onClick={() => onDelete(worker._id)} className="p-1 rounded hover:bg-muted text-destructive"><Trash2 size={12} /></button>
            <button onClick={() => setExpanded(e => !e)} className="p-1 rounded hover:bg-muted">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-[10px]">Acordado: <b>{formatCLP(total)}</b></span>
          <span className="text-[10px] text-green-600">Pagado: <b>{formatCLP(paid)}</b></span>
          <span className="text-[10px] text-orange-500">Por pagar: <b>{formatCLP(pending)}</b></span>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border p-2 space-y-1 bg-muted/30">
          {jobs.map(job => (
            <div key={job._id} className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => onTogglePaid(job._id, !job.paid)}
                className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", job.paid ? "bg-green-500 border-green-500 text-white" : "border-border")}
              >
                {job.paid && <Check size={10} />}
              </button>
              <span className="flex-1 truncate">{job.description}</span>
              <span className="text-muted-foreground">{formatCLP(job.amount)}</span>
              {quotes.find(q => q._id === job.quoteId) && (
                <span className="text-[9px] text-blue-600">{quotes.find(q => q._id === job.quoteId)?.number}</span>
              )}
              <button onClick={() => onEditJob(job)} className="text-muted-foreground hover:text-foreground p-0.5" title="Editar"><Pencil size={11} /></button>
              <button onClick={() => onDeleteJob(job._id)} className="text-destructive p-0.5"><Trash2 size={11} /></button>
            </div>
          ))}
          <button
            onClick={() => onAddJob(worker._id)}
            className="flex items-center gap-1 text-[10px] text-primary font-medium mt-1"
          >
            <Plus size={11} /> Agregar trabajo
          </button>
        </div>
      )}
    </div>
  );
}

type WorkerForm = { name: string; phone: string; paymentType: Worker["paymentType"]; rateAmount: string };
type JobForm = { description: string; amount: string; date: string; quoteId: string; paid: boolean };
const emptyWorkerForm = (): WorkerForm => ({ name: "", phone: "", paymentType: "por_dia", rateAmount: "0" });
const emptyJobForm = (): JobForm => ({ description: "", amount: "0", date: todayISO(), quoteId: "", paid: false });

export default function WorkersPage() {
  const workers = useQuery(api.workers.list);
  const allJobs = useQuery(api.workers.allJobs);
  const quotes = useQuery(api.quotes.list);
  const createWorker = useMutation(api.workers.create);
  const [deleteWorkerTarget, setDeleteWorkerTarget] = useState<Id<"workers"> | null>(null);
  const updateWorker = useMutation(api.workers.update);
  const removeWorker = useMutation(api.workers.remove);
  const createJob = useMutation(api.workers.createJob);
  const updateJob = useMutation(api.workers.updateJob);
  const removeJob = useMutation(api.workers.removeJob);
  const markPaid = useMutation(api.workers.markJobPaid);

  const [search, setSearch] = useState("");
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [editWorkerId, setEditWorkerId] = useState<Id<"workers"> | null>(null);
  const [workerForm, setWorkerForm] = useState<WorkerForm>(emptyWorkerForm());
  const [showJobForm, setShowJobForm] = useState(false);
  const [editJobId, setEditJobId] = useState<Id<"workerJobs"> | null>(null);
  const [jobWorkerId, setJobWorkerId] = useState<Id<"workers"> | null>(null);
  const [jobForm, setJobForm] = useState<JobForm>(emptyJobForm());
  const [saving, setSaving] = useState(false);

  const filtered = (workers ?? []).filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  // Resumen global de todos los trabajadores
  const allJobsList = allJobs ?? [];
  const totalAcordado = allJobsList.reduce((s, j) => s + j.amount, 0);
  const totalPagado = allJobsList.filter(j => j.paid).reduce((s, j) => s + j.amount, 0);
  const totalPendiente = totalAcordado - totalPagado;

  const openAddJob = (workerId: Id<"workers">) => {
    setEditJobId(null);
    setJobWorkerId(workerId);
    setJobForm(emptyJobForm());
    setShowJobForm(true);
  };

  const openEditJob = (job: WorkerJob) => {
    setEditJobId(job._id);
    setJobWorkerId(job.workerId);
    setJobForm({
      description: job.description,
      amount: String(job.amount),
      date: job.date,
      quoteId: job.quoteId ?? "",
      paid: job.paid,
    });
    setShowJobForm(true);
  };

  const handleSaveWorker = async () => {
    if (!workerForm.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const data = {
        name: workerForm.name.trim(),
        phone: workerForm.phone || undefined,
        paymentType: workerForm.paymentType,
        rateAmount: parseFloat(workerForm.rateAmount) || 0,
      };
      if (editWorkerId) {
        await updateWorker({ id: editWorkerId, ...data });
        toast.success("Trabajador actualizado");
      } else {
        await createWorker(data);
        toast.success("Trabajador creado");
      }
      setShowWorkerForm(false);
    } catch { toast.error("Error al guardar"); } finally { setSaving(false); }
  };

  const handleSaveJob = async () => {
    if (!jobWorkerId || !jobForm.description.trim()) { toast.error("Ingresa una descripción"); return; }
    setSaving(true);
    try {
      if (editJobId) {
        await updateJob({
          id: editJobId,
          description: jobForm.description,
          amount: parseFloat(jobForm.amount) || 0,
          date: jobForm.date || todayISO(),
          paid: jobForm.paid,
          quoteId: jobForm.quoteId ? jobForm.quoteId as Id<"quotes"> : undefined,
        });
        toast.success("Trabajo actualizado");
      } else {
        await createJob({
          workerId: jobWorkerId,
          description: jobForm.description,
          amount: parseFloat(jobForm.amount) || 0,
          date: jobForm.date || todayISO(),
          paid: jobForm.paid,
          quoteId: jobForm.quoteId ? jobForm.quoteId as Id<"quotes"> : undefined,
        });
        toast.success("Trabajo agregado");
      }
      setShowJobForm(false);
      setEditJobId(null);
    } catch { toast.error("Error"); } finally { setSaving(false); }
  };

  return (
    <AppLayout
      title="Trabajadores"
      headerRight={
        <button onClick={() => { setEditWorkerId(null); setWorkerForm(emptyWorkerForm()); setShowWorkerForm(true); }}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
          <Plus size={13} /> Nuevo
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Resumen global trabajadores */}
        <div className="shrink-0 px-3 pt-3 pb-0">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-card rounded-lg border border-border p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Acordado</p>
              <p className="text-xs font-bold">{allJobs === undefined ? "..." : formatCLP(totalAcordado)}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Pagado</p>
              <p className="text-xs font-bold text-green-600">{allJobs === undefined ? "..." : formatCLP(totalPagado)}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Por pagar</p>
              <p className="text-xs font-bold text-orange-500">{allJobs === undefined ? "..." : formatCLP(totalPendiente)}</p>
            </div>
          </div>
        </div>
        {/* Fixed: forms + search */}
        <div className="shrink-0 p-3 pb-2 space-y-2">
        {showWorkerForm && (
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold">{editWorkerId ? "Editar" : "Nuevo"} Trabajador</p>
              <button onClick={() => setShowWorkerForm(false)}><X size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Nombre *</label>
                <Input value={workerForm.name} onChange={e => setWorkerForm(f => ({ ...f, name: e.target.value }))} className="h-7 text-xs" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Teléfono</label>
                <Input value={workerForm.phone} onChange={e => setWorkerForm(f => ({ ...f, phone: e.target.value }))} className="h-7 text-xs" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Tipo pago</label>
                <Select value={workerForm.paymentType} onValueChange={v => setWorkerForm(f => ({ ...f, paymentType: v as Worker["paymentType"] }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="por_dia">Por día</SelectItem>
                    <SelectItem value="a_trato">A trato</SelectItem>
                    <SelectItem value="por_m2">Por m²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Tarifa</label>
                <Input type="number" value={workerForm.rateAmount} onChange={e => setWorkerForm(f => ({ ...f, rateAmount: e.target.value }))} className="h-7 text-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveWorker} disabled={saving} className="flex-1 h-7 text-xs">
                <Check size={12} className="mr-1" /> {saving ? "..." : "Guardar"}
              </Button>
              <Button variant="secondary" onClick={() => setShowWorkerForm(false)} className="h-7 text-xs px-3">Cancelar</Button>
            </div>
          </div>
        )}

        {showJobForm && (
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold">{editJobId ? "Editar" : "Agregar"} Trabajo</p>
              <button onClick={() => { setShowJobForm(false); setEditJobId(null); }}><X size={14} /></button>
            </div>
            <div className="space-y-2">
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Descripción *</label>
                <Input value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} className="h-7 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">Monto</label>
                  <Input type="number" value={jobForm.amount} onChange={e => setJobForm(f => ({ ...f, amount: e.target.value }))} className="h-7 text-xs" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">Fecha</label>
                  <Input type="date" value={jobForm.date} onChange={e => setJobForm(f => ({ ...f, date: e.target.value }))} className="h-7 text-xs" />
                </div>
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Cotización asociada (opcional)</label>
                <Select value={jobForm.quoteId || "none"} onValueChange={v => setJobForm(f => ({ ...f, quoteId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin cotización" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cotización</SelectItem>
                    {(quotes ?? []).map(q => <SelectItem key={q._id} value={q._id}>{q.number} - {q.clientName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveJob} disabled={saving} className="flex-1 h-7 text-xs">
                <Check size={12} className="mr-1" /> {saving ? "..." : editJobId ? "Guardar" : "Agregar"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowJobForm(false); setEditJobId(null); }} className="h-7 text-xs px-3">Cancelar</Button>
            </div>
          </div>
        )}

        <Input
          placeholder="Buscar trabajador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-xs"
        />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {workers === undefined && [0,1].map(i => <Skeleton key={i} className="h-14" />)}
        {workers !== undefined && filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No hay trabajadores</p>
        )}
        {filtered.map(w => (
          <WorkerCard
            key={w._id}
            worker={w}
            jobs={(allJobs ?? []).filter(j => j.workerId === w._id)}
            onEdit={wk => { setEditWorkerId(wk._id); setWorkerForm({ name: wk.name, phone: wk.phone ?? "", paymentType: wk.paymentType, rateAmount: String(wk.rateAmount) }); setShowWorkerForm(true); }}
            onDelete={id => setDeleteWorkerTarget(id)}
            onAddJob={openAddJob}
            onEditJob={openEditJob}
            onDeleteJob={async id => { await removeJob({ id }); }}
            onTogglePaid={async (id, paid) => { await markPaid({ id, paid }); }}
            quotes={quotes ?? []}
          />
        ))}
        </div>
      </div>
      <DeleteConfirmDialog
        open={!!deleteWorkerTarget}
        onClose={() => setDeleteWorkerTarget(null)}
        onConfirm={async () => { if (deleteWorkerTarget) { await removeWorker({ id: deleteWorkerTarget }); toast.success("Trabajador eliminado"); } }}
        title="¿Eliminar trabajador?"
        description="Se eliminará el trabajador y todos sus trabajos registrados. Esta acción no se puede deshacer."
      />
    </AppLayout>
  );
}

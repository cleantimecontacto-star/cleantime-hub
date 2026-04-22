import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import AppLayout from "@/components/AppLayout.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Pencil, Trash2, Plus, X, Check, FolderOpen, ChevronDown, ChevronRight, TrendingUp, Archive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { formatCLP } from "@/lib/cleantime.ts";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type Client = Doc<"clients">;
type Project = Doc<"projects">;

type ClientFormState = {
  name: string; rut: string; phone: string; email: string; address: string; city: string;
};
type ProjectFormState = { name: string; address: string; notes: string };

const emptyClientForm = (): ClientFormState => ({ name: "", rut: "", phone: "", email: "", address: "", city: "" });
const emptyProjectForm = (): ProjectFormState => ({ name: "", address: "", notes: "" });

function ProjectProfitability({ projectId }: { projectId: Id<"projects"> }) {
  const data = useQuery(api.projects.profitability, { projectId });

  if (data === undefined) return <Skeleton className="h-16 w-full mt-1" />;

  const { quoteCount, approvedCount, totalCotizado, totalAprobado, workerCosts, expenseCosts, totalGastos, gananciaNeta } = data;

  return (
    <div className="mt-1.5 bg-muted/30 rounded border border-border p-2 space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <TrendingUp size={10} /> Rentabilidad
      </p>
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-card rounded p-1.5 border border-border">
          <p className="text-[9px] text-muted-foreground">Cotizaciones</p>
          <p className="text-xs font-bold">{quoteCount} <span className="text-[9px] font-normal text-green-600">({approvedCount} aprobadas)</span></p>
        </div>
        <div className="bg-card rounded p-1.5 border border-border">
          <p className="text-[9px] text-muted-foreground">Total aprobado</p>
          <p className="text-xs font-bold text-green-600">{formatCLP(totalAprobado)}</p>
        </div>
        <div className="bg-card rounded p-1.5 border border-border">
          <p className="text-[9px] text-muted-foreground">Trabajadores</p>
          <p className="text-xs font-bold text-red-500">{formatCLP(workerCosts)}</p>
        </div>
        <div className="bg-card rounded p-1.5 border border-border">
          <p className="text-[9px] text-muted-foreground">Gastos directos</p>
          <p className="text-xs font-bold text-red-500">{formatCLP(expenseCosts)}</p>
        </div>
      </div>
      <div className={cn(
        "rounded p-1.5 border text-center",
        gananciaNeta >= 0 ? "bg-green-600/10 border-green-600/30" : "bg-red-500/10 border-red-500/30"
      )}>
        <p className="text-[9px] text-muted-foreground">Ganancia neta</p>
        <p className={cn("text-sm font-bold", gananciaNeta >= 0 ? "text-green-600" : "text-red-500")}>
          {formatCLP(gananciaNeta)}
        </p>
        {totalCotizado > 0 && (
          <p className="text-[9px] text-muted-foreground">
            Total cotizado: {formatCLP(totalCotizado)} · Gastos totales: {formatCLP(totalGastos)}
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectsPanel({ client }: { client: Client }) {
  const projects = useQuery(api.projects.listByClient, { clientId: client._id });
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"projects"> | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"projects">; name: string } | null>(null);

  const openCreate = () => { setEditId(null); setForm(emptyProjectForm()); setShowForm(true); };
  const openEdit = (p: Project) => {
    setEditId(p._id);
    setForm({ name: p.name, address: p.address ?? "", notes: p.notes ?? "" });
    setShowForm(true);
  };
  const handleDelete = async (id: Id<"projects">, name: string) => {
    setDeleteTarget({ id, name });
  };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await removeProject({ id: deleteTarget.id });
    toast.success("Proyecto eliminado");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre del proyecto es obligatorio"); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        address: form.address || undefined,
        notes: form.notes || undefined,
      };
      if (editId) {
        await updateProject({ id: editId, ...data });
        toast.success("Proyecto actualizado");
      } else {
        await createProject({ clientId: client._id, ...data });
        toast.success("Proyecto creado");
      }
      setShowForm(false);
    } catch {
      toast.error("Error al guardar proyecto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 border-t border-border pt-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <FolderOpen size={11} /> Proyectos
        </span>
        <button onClick={openCreate} className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
          <Plus size={11} /> Añadir
        </button>
      </div>

      {showForm && (
        <div className="bg-muted/40 rounded p-2 space-y-1.5 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold">{editId ? "Editar" : "Nuevo"} Proyecto</span>
            <button onClick={() => setShowForm(false)}><X size={12} /></button>
          </div>
          <div className="space-y-1">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Nombre *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Torre Central piso 3" className="h-6 text-[11px]" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Dirección del proyecto</label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Av. Principal 123" className="h-6 text-[11px]" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Notas</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas opcionales" className="h-6 text-[11px]" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button onClick={handleSave} disabled={saving} className="flex-1 h-6 text-[11px]">
              <Check size={11} className="mr-1" /> {saving ? "..." : "Guardar"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)} className="h-6 text-[11px] px-2">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {projects === undefined && <Skeleton className="h-6 w-full" />}
      {projects !== undefined && projects.length === 0 && !showForm && (
        <p className="text-[10px] text-muted-foreground italic">Sin proyectos</p>
      )}
      {(projects ?? []).map(p => (
        <div key={p._id} className="bg-muted/30 rounded border border-border px-2 py-1.5 space-y-0.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">{p.name}</p>
              {p.address && <p className="text-[10px] text-muted-foreground truncate">{p.address}</p>}
            </div>
            <div className="flex gap-0.5 shrink-0">
              <button onClick={() => openEdit(p)} className="p-0.5 rounded hover:bg-muted">
                <Pencil size={11} />
              </button>
              <button onClick={() => handleDelete(p._id, p.name)} className="p-0.5 rounded hover:bg-muted text-destructive">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
          <ProjectProfitability projectId={p._id} />
        </div>
      ))}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar proyecto?"
        description={`Vas a eliminar el proyecto "${deleteTarget?.name ?? ""}". Se borrarán todas las cotizaciones, trabajos y gastos asociados. Esta acción no se puede deshacer.`}
        requireWord="ELIMINAR"
      />
    </div>
  );
}

function ClientCard({ client, onEdit, onDelete, onArchive, onUnarchive, isArchived = false }: {
  client: Client;
  onEdit: (c: Client) => void;
  onDelete: (id: Id<"clients">) => void;
  onArchive: (id: Id<"clients">) => void;
  onUnarchive: (id: Id<"clients">) => void;
  isArchived?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("bg-card rounded-lg border border-border p-2", isArchived && "opacity-70")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold truncate">{client.name}</p>
            {isArchived && <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">Archivado</span>}
          </div>
          <div className="flex flex-wrap gap-x-2 mt-0.5">
            {client.rut && <span className="text-[10px] text-muted-foreground">{client.rut}</span>}
            {client.city && <span className="text-[10px] text-muted-foreground">{client.city}</span>}
            {client.phone && <span className="text-[10px] text-muted-foreground">{client.phone}</span>}
          </div>
          {client.address && <p className="text-[10px] text-muted-foreground truncate">{client.address}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          {!isArchived && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded hover:bg-muted"
              title="Ver proyectos"
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
          {!isArchived && (
            <button onClick={() => onEdit(client)} className="p-1 rounded hover:bg-muted" title="Editar">
              <Pencil size={13} />
            </button>
          )}
          {isArchived ? (
            <button onClick={() => onUnarchive(client._id)} className="p-1 rounded hover:bg-muted text-primary text-[10px] font-medium px-1.5" title="Restaurar">
              Restaurar
            </button>
          ) : (
            <button onClick={() => onArchive(client._id)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Archivar">
              <Archive size={13} />
            </button>
          )}
          <button onClick={() => onDelete(client._id)} className="p-1 rounded hover:bg-muted text-destructive" title="Eliminar definitivamente">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {expanded && !isArchived && <ProjectsPanel client={client} />}
    </div>
  );
}

export default function ClientsPage() {
  const clients = useQuery(api.clients.list);
  const archivedClients = useQuery(api.clients.listArchived);
  const createClient = useMutation(api.clients.create);
  const updateClient = useMutation(api.clients.update);
  const removeClient = useMutation(api.clients.remove);
  const archiveClient = useMutation(api.clients.archive);
  const unarchiveClient = useMutation(api.clients.unarchive);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"activos" | "archivados">("activos");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"clients"> | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyClientForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"clients">; name: string } | null>(null);

  const sourceList = tab === "activos" ? (clients ?? []) : (archivedClients ?? []);
  const filtered = sourceList.filter(c => {
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || (c.rut ?? "").includes(s) || (c.city ?? "").toLowerCase().includes(s);
  });

  const openCreate = () => { setEditId(null); setForm(emptyClientForm()); setShowForm(true); };
  const openEdit = (c: Client) => {
    setEditId(c._id);
    setForm({ name: c.name, rut: c.rut ?? "", phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", city: c.city ?? "" });
    setShowForm(true);
  };
  const handleDelete = async (id: Id<"clients">) => {
    const client = sourceList.find(c => c._id === id);
    setDeleteTarget({ id, name: client?.name ?? "" });
  };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await removeClient({ id: deleteTarget.id });
    toast.success("Cliente eliminado");
  };
  const handleArchive = async (id: Id<"clients">) => {
    await archiveClient({ id });
    toast.success("Cliente archivado — puedes restaurarlo en la pestaña Archivados");
  };
  const handleUnarchive = async (id: Id<"clients">) => {
    await unarchiveClient({ id });
    toast.success("Cliente restaurado");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        rut: form.rut || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
      };
      if (editId) {
        await updateClient({ id: editId, ...data });
        toast.success("Cliente actualizado");
      } else {
        await createClient(data);
        toast.success("Cliente creado");
      }
      setShowForm(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const F = (key: keyof ClientFormState, placeholder: string, label: string) => (
    <div className="space-y-0.5">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <Input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="h-7 text-xs"
      />
    </div>
  );

  return (
    <AppLayout
      title="Clientes"
      headerRight={
        tab === "activos" ? (
          <button onClick={openCreate} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            <Plus size={13} /> Nuevo
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="shrink-0 px-3 pt-3 pb-1 flex gap-1">
          <button
            onClick={() => setTab("activos")}
            className={cn("flex-1 py-1.5 rounded text-xs font-medium transition-colors", tab === "activos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
          >
            Activos {clients !== undefined && `(${clients.length})`}
          </button>
          <button
            onClick={() => setTab("archivados")}
            className={cn("flex-1 py-1.5 rounded text-xs font-medium transition-colors", tab === "archivados" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
          >
            Archivados {archivedClients !== undefined && archivedClients.length > 0 && `(${archivedClients.length})`}
          </button>
        </div>

        {/* Fixed: form + search */}
        <div className="shrink-0 p-3 pb-2 space-y-2">
        {showForm && tab === "activos" && (
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">{editId ? "Editar" : "Nuevo"} Cliente</p>
              <button onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {F("name", "Nombre empresa", "Nombre *")}
              {F("rut", "12.345.678-9", "RUT")}
              {F("phone", "+56 9 1234 5678", "Teléfono")}
              {F("email", "email@ejemplo.com", "Email")}
              {F("address", "Dirección", "Dirección")}
              {F("city", "Santiago", "Ciudad")}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-7 text-xs">
                <Check size={12} className="mr-1" /> {saving ? "..." : "Guardar"}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} className="h-7 text-xs px-3">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <Input
          placeholder="Buscar por nombre, RUT o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-xs"
        />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {(tab === "activos" ? clients : archivedClients) === undefined && [0,1,2].map(i => <Skeleton key={i} className="h-14" />)}
        {(tab === "activos" ? clients : archivedClients) !== undefined && filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            {tab === "activos" ? "No hay clientes activos" : "No hay clientes archivados"}
          </p>
        )}
        {filtered.map(c => (
          <ClientCard
            key={c._id}
            client={c}
            onEdit={openEdit}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            isArchived={tab === "archivados"}
          />
        ))}
        </div>
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar cliente?"
        description={`Vas a eliminar a "${deleteTarget?.name ?? ""}" junto con todos sus proyectos, cotizaciones, trabajos y gastos. Esta acción no se puede deshacer.`}
        requireWord="ELIMINAR"
      />
    </AppLayout>
  );
}

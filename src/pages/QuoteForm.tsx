import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout.tsx";
import { todayISO, QUOTE_STATUSES, type QuoteStatus } from "@/lib/cleantime.ts";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { ApproveConfirmDialog } from "@/components/ui/approve-confirm-dialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const DEFAULT_SERVICE_TYPES = ["Limpieza Fina", "Limpieza Gruesa"];
const IVA_RATE = 0.19;

export default function QuoteForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const clients = useQuery(api.clients.list);
  const config = useQuery(api.config.getAll);
  const serviceTypes = useQuery(api.serviceTypes.list);
  const existingQuote = useQuery(api.quotes.get, isEdit ? { id: id as Id<"quotes"> } : "skip");
  const createQuote = useMutation(api.quotes.create);
  const updateQuote = useMutation(api.quotes.update);
  const createProject = useMutation(api.projects.create);

  // Effective service type names: use DB list if configured, else fallback to defaults
  const effectiveServiceTypes =
    serviceTypes && serviceTypes.length > 0
      ? serviceTypes.map(s => s.name)
      : DEFAULT_SERVICE_TYPES;

  const [clientId, setClientId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [serviceType, setServiceType] = useState("Limpieza Fina");
  const [customServiceType, setCustomServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [squareMeters, setSquareMeters] = useState("0");
  const [pricePerM2, setPricePerM2] = useState("1400");
  const [unit, setUnit] = useState("M2");
  const [includesSupplies, setIncludesSupplies] = useState(false);
  const [excessiveDirt, setExcessiveDirt] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("Pendiente");
  const [date, setDate] = useState(todayISO());
  const [terms, setTerms] = useState("Crédito 30 días");
  const [otNumber, setOtNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string>("Sin pagar");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [pendingOtNumber, setPendingOtNumber] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal crear proyecto
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectAddress, setNewProjectAddress] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Refs to avoid re-running load effects
  const svcInitRef = useRef(false);
  const existingQuoteLoadedRef = useRef(false);

  // Load projects for selected client
  const clientProjects = useQuery(
    api.projects.listByClient,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip"
  );

  // Initialize defaults for new quotes — runs once when both config and serviceTypes are ready
  useEffect(() => {
    if (!isEdit && serviceTypes !== undefined && !svcInitRef.current) {
      svcInitRef.current = true;
      if (serviceTypes.length > 0) {
        const first = serviceTypes[0];
        setServiceType(first.name);
        if (first.pricePerM2) setPricePerM2(String(first.pricePerM2));
        else if (config && config["price_fina"]) setPricePerM2(config["price_fina"]);
      } else if (config && config["price_fina"]) {
        setPricePerM2(config["price_fina"]);
      }
    }
  }, [serviceTypes, config, isEdit]);

  // Fallback: if serviceTypes loaded but config wasn't ready yet, set price from config
  useEffect(() => {
    if (!isEdit && svcInitRef.current && config && serviceTypes !== undefined && serviceTypes.length === 0) {
      if (config["price_fina"]) setPricePerM2(config["price_fina"]);
    }
  }, [config, isEdit, serviceTypes]);

  // Load existing quote — runs once when both existingQuote and serviceTypes are ready
  useEffect(() => {
    if (existingQuote && serviceTypes !== undefined && !existingQuoteLoadedRef.current) {
      existingQuoteLoadedRef.current = true;
      setClientId(existingQuote.clientId);
      setProjectId(existingQuote.projectId ?? "");
      setProjectName(existingQuote.projectName ?? "");
      setProjectAddress((existingQuote as any).projectAddress ?? "");
      // Handle custom service types: check against DB list (or defaults if no DB list)
      const knownTypes =
        serviceTypes.length > 0 ? serviceTypes.map(s => s.name) : DEFAULT_SERVICE_TYPES;
      if (knownTypes.includes(existingQuote.serviceType)) {
        setServiceType(existingQuote.serviceType);
        setCustomServiceType("");
      } else {
        setServiceType("Otro");
        setCustomServiceType(existingQuote.serviceType);
      }
      setDescription(existingQuote.description ?? "");
      setSquareMeters(String(existingQuote.squareMeters));
      setPricePerM2(String(existingQuote.pricePerM2));
      setUnit(existingQuote.unit ?? "M2");
      setIncludesSupplies(existingQuote.includesSupplies);
      setExcessiveDirt(existingQuote.excessiveDirt);
      setNotes(existingQuote.notes ?? "");
      setStatus(existingQuote.status);
      setDate(existingQuote.date);
      setTerms(existingQuote.terms ?? "Crédito 30 días");
      setOtNumber(existingQuote.otNumber ?? "");
      setInvoiceNumber(existingQuote.invoiceNumber ?? "");
      const LEGACY: Record<string, string> = { pendiente: "Sin pagar", sin_pagar: "Sin pagar", pagado: "Pagado", parcial: "Parcial" };
      const rawP = existingQuote.paymentStatus ?? "Sin pagar";
      setPaymentStatus(LEGACY[rawP] ?? rawP);
    }
  }, [existingQuote, serviceTypes]);

  // Auto-fill price when user manually changes service type
  useEffect(() => {
    if (!isEdit && svcInitRef.current) {
      if (serviceTypes && serviceTypes.length > 0) {
        const found = serviceTypes.find(s => s.name === serviceType);
        if (found?.pricePerM2) setPricePerM2(String(found.pricePerM2));
      } else if (config) {
        if (serviceType === "Limpieza Fina" && config["price_fina"]) setPricePerM2(config["price_fina"]);
        if (serviceType === "Limpieza Gruesa" && config["price_gruesa"]) setPricePerM2(config["price_gruesa"]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType]);

  // When client changes, reset project selection
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setProjectId("");
    setProjectName("");
    setProjectAddress("");
  };

  // When project is selected, fill in project name and address
  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    if (!newProjectId) {
      setProjectName("");
      setProjectAddress("");
      return;
    }
    const project = (clientProjects ?? []).find(p => p._id === newProjectId);
    if (project) {
      setProjectName(project.name);
      setProjectAddress(project.address ?? "");
    }
  };

  // Crear nuevo proyecto desde el modal
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) { toast.error("Ingresa el nombre del proyecto"); return; }
    setCreatingProject(true);
    try {
      const newId = await createProject({
        clientId: clientId as Id<"clients">,
        name: newProjectName.trim(),
        address: newProjectAddress.trim() || undefined,
      });
      setProjectId(newId as string);
      setProjectName(newProjectName.trim());
      setProjectAddress(newProjectAddress.trim());
      setNewProjectName("");
      setNewProjectAddress("");
      setShowCreateProjectModal(false);
      toast.success("Proyecto creado");
    } catch {
      toast.error("Error al crear proyecto");
    } finally {
      setCreatingProject(false);
    }
  };

  const m2 = parseFloat(squareMeters) || 0;
  const price = parseFloat(pricePerM2) || 0;
  const ivaRate = config ? (parseFloat(config["iva_rate"] ?? "19") / 100) : IVA_RATE;
  const suppliesPctVal = config ? parseFloat(config["supplies_pct"] ?? "15") / 100 : 0.15;
  const excessiveDirtPctVal = config ? parseFloat(config["excessive_dirt_pct"] ?? "20") / 100 : 0.20;
  const surcharge = (includesSupplies ? suppliesPctVal : 0) + (excessiveDirt ? excessiveDirtPctVal : 0);
  const base = m2 * price;
  const subtotal = base * (1 + surcharge);
  const iva = subtotal * ivaRate;
  const total = subtotal + iva;

  const handleSubmit = async () => {
    if (!clientId) { toast.error("Selecciona un cliente"); return; }
    if (serviceType === "Otro" && !customServiceType.trim()) { toast.error("Ingresa el nombre del servicio"); return; }
    if (m2 <= 0) { toast.error("Ingresa los metros cuadrados"); return; }
    const client = (clients ?? []).find(c => c._id === clientId);
    if (!client) { toast.error("Cliente no encontrado"); return; }
    setSaving(true);
    try {
      const finalServiceType = serviceType === "Otro" ? customServiceType.trim() : serviceType;
      const data = {
        clientId: clientId as Id<"clients">,
        clientName: client.name,
        projectId: projectId ? projectId as Id<"projects"> : undefined,
        projectName: projectName.trim() || undefined,
        projectAddress: projectAddress.trim() || undefined,
        serviceType: finalServiceType,
        description: description || undefined,
        squareMeters: m2,
        pricePerM2: price,
        subtotal,
        iva,
        total,
        includesSupplies,
        excessiveDirt,
        suppliesPct: includesSupplies ? suppliesPctVal * 100 : undefined,
        excessiveDirtPct: excessiveDirt ? excessiveDirtPctVal * 100 : undefined,
        notes: notes || undefined,
        status,
        date,
        terms: terms || undefined,
        unit: unit || "M2",
        otNumber: otNumber.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        paymentStatus: paymentStatus || undefined,
      };
      if (isEdit) {
        await updateQuote({ id: id as Id<"quotes">, ...data });
        toast.success("Cotización actualizada");
      } else {
        await createQuote(data);
        toast.success("Cotización creada");
      }
      navigate("/cotizaciones");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const formatN = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

  return (
    <AppLayout title={isEdit ? "Editar Cotización" : "Nueva Cotización"}>
      <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* Client */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Cliente *</label>
          <Select value={clientId} onValueChange={handleClientChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Seleccionar cliente..." />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map(c => (
                <SelectItem key={c._id} value={c._id}>{c.name} {c.rut ? `· ${c.rut}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PROYECTOS UNIFICADOS - solo dropdown, siempre hay cliente */}
        {clientId && (
          <div className="space-y-2">
            <label className="text-xs font-medium">Proyecto <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={projectId || "none"} onValueChange={v => handleProjectChange(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Sin proyecto asignado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proyecto asignado</SelectItem>
                    {(clientProjects ?? []).map(p => (
                      <SelectItem key={p._id} value={p._id}>{p.name}{p.address ? ` · ${p.address}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(true)}
                className="h-8 px-3 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 whitespace-nowrap"
              >
                + Nuevo
              </button>
            </div>
            {clientProjects !== undefined && clientProjects.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">Este cliente no tiene proyectos. Toca "+ Nuevo" para crear uno.</p>
            )}
          </div>
        )}

        {/* N° OT */}
        <div className="space-y-1 w-1/2">
          <label className="text-xs font-medium">N° OT <span className="text-muted-foreground font-normal">(opcional)</span></label>
          <Input
            value={otNumber}
            onChange={e => {
                  const val = e.target.value;
                  if (val.trim() && !otNumber.trim() && status !== "Aprobada" && status !== "Facturada") {
                    setPendingOtNumber(val);
                    setShowApproveDialog(true);
                  }
                  setOtNumber(val);
                }}
            placeholder="Ej: OT-2024-001"
            className="h-8 text-xs"
          />
        </div>

        {/* N° Factura + Estado Pago */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">N° Factura <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <Input
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              placeholder="Ej: FAC-001"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Estado Pago</label>
            <Select value={paymentStatus} onValueChange={v => setPaymentStatus(v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sin pagar">Sin pagar</SelectItem>
                <SelectItem value="Pagado">Pagado</SelectItem>
                <SelectItem value="Parcial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Service type */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Tipo de servicio</label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {effectiveServiceTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          {serviceType === "Otro" && (
            <Input
              value={customServiceType}
              onChange={e => setCustomServiceType(e.target.value)}
              placeholder="Nombre del servicio personalizado..."
              className="h-8 text-xs mt-1"
            />
          )}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Descripción</label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Limpieza espacios comunes..."
            className="h-8 text-xs"
          />
        </div>

        {/* M2, price, unit */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Cantidad</label>
            <Input
              type="number"
              value={squareMeters}
              onChange={e => setSquareMeters(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Unidad</label>
            <div className="flex gap-1">
              <Input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="M2"
                className="h-8 text-xs flex-1 min-w-0"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {["M2", "M3", "Día", "Hora", "Global"].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                    unit === u
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Precio/{unit || "M2"}</label>
            <Input
              type="number"
              value={pricePerM2}
              onChange={e => setPricePerM2(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Calculated totals */}
        <div className="bg-muted rounded-lg p-2 space-y-1.5">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Base ({m2} × {formatN(price)})</p>
              <p className="text-xs font-bold">{formatN(base)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">IVA {config ? (config["iva_rate"] ?? "19") : "19"}%</p>
              <p className="text-xs font-bold">{formatN(iva)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="text-xs font-bold text-primary">{formatN(total)}</p>
            </div>
          </div>
          {surcharge > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5 border-t border-border">
              <p className="text-[10px] text-muted-foreground w-full">Recargos aplicados al subtotal:</p>
              {includesSupplies && (
                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                  Insumos +{Math.round(suppliesPctVal * 100)}% = {formatN(base * suppliesPctVal)}
                </span>
              )}
              {excessiveDirt && (
                <span className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded">
                  Suciedad +{Math.round(excessiveDirtPctVal * 100)}% = {formatN(base * excessiveDirtPctVal)}
                </span>
              )}
              <span className="text-[10px] font-semibold">Subtotal c/recargos: {formatN(subtotal)}</span>
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox
              checked={includesSupplies}
              onCheckedChange={v => setIncludesSupplies(!!v)}
            />
            Insumos incluidos (+{Math.round(suppliesPctVal * 100)}%)
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox
              checked={excessiveDirt}
              onCheckedChange={v => setExcessiveDirt(!!v)}
            />
            Suciedad excesiva (+{Math.round(excessiveDirtPctVal * 100)}%)
          </label>
        </div>

        {/* Status + Date */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Estado</label>
            <Select value={status} onValueChange={v => setStatus(v as QuoteStatus)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Fecha</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Notas internas</label>
          <Input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas opcionales..."
            className="h-8 text-xs"
          />
        </div>

        {/* Terms */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Términos y condiciones</label>
          <Input
            value={terms}
            onChange={e => setTerms(e.target.value)}
            placeholder="Crédito 30 días"
            className="h-8 text-xs"
          />
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full h-9">
          {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear Cotización"}
        </Button>
      </div>
      </div>

      {/* Modal Crear Proyecto */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-4 w-full max-w-sm space-y-3 shadow-xl">
            <h3 className="text-sm font-semibold">Nuevo Proyecto</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium">Nombre *</label>
              <Input
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Ej: Torre Oriente"
                className="h-8 text-xs"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Dirección <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <Input
                value={newProjectAddress}
                onChange={e => setNewProjectAddress(e.target.value)}
                placeholder="Ej: Av. Providencia 1234"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => { setShowCreateProjectModal(false); setNewProjectName(""); setNewProjectAddress(""); }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-8 text-xs"
                onClick={handleCreateProject}
                disabled={creatingProject}
              >
                {creatingProject ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ApproveConfirmDialog
        open={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={() => { if (status !== "Facturada") setStatus("Aprobada"); }}
        otNumber={pendingOtNumber}
      />
    </AppLayout>
  );
}

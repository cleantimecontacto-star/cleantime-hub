import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import AppLayout from "@/components/AppLayout.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Plus, Trash2, Check, Pencil, X, Upload, ImageIcon, KeyRound } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useAuth } from "@/auth/AuthContext.tsx";

export default function ConfigPage() {
  const config = useQuery(api.config.getAll);
  const categories = useQuery(api.expenses.listCategories);
  const serviceTypesList = useQuery(api.serviceTypes.list);
  const setConfig = useMutation(api.config.set);
  const generateLogoUploadUrl = useMutation(api.config.generateLogoUploadUrl);
  const saveLogoStorageId = useMutation(api.config.saveLogoStorageId);
  const createCategory = useMutation(api.expenses.createCategory);
  const updateCategory = useMutation(api.expenses.updateCategory);
  const removeCategory = useMutation(api.expenses.removeCategory);
  const createServiceType = useMutation(api.serviceTypes.create);
  const updateServiceType = useMutation(api.serviceTypes.update);
  const removeServiceType = useMutation(api.serviceTypes.remove);

  const { logout, changeCredentials } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<Id<"expenseCategories"> | null>(null);
  const [deleteSvcId, setDeleteSvcId] = useState<Id<"serviceTypes"> | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyRut, setCompanyRut] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [priceFina, setPriceFina] = useState("1400");
  const [priceGruesa, setPriceGruesa] = useState("1200");
  const [ivaRate, setIvaRate] = useState("19");
  const [suppliesPct, setSuppliesPct] = useState("15");
  const [excessiveDirtPct, setExcessiveDirtPct] = useState("20");
  const [logoUrl, setLogoUrl] = useState("");

  // Credenciales
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  useEffect(() => {
    if (config) {
      setCompanyName(config["company_name"] ?? "");
      setCompanyRut(config["company_rut"] ?? "");
      setCompanyAddress(config["company_address"] ?? "");
      setCompanyPhone(config["company_phone"] ?? "");
      setCompanyEmail(config["company_email"] ?? "");
      setPriceFina(config["price_fina"] ?? "1400");
      setPriceGruesa(config["price_gruesa"] ?? "1200");
      setIvaRate(config["iva_rate"] ?? "19");
      setSuppliesPct(config["supplies_pct"] ?? "15");
      setExcessiveDirtPct(config["excessive_dirt_pct"] ?? "20");
      setLogoUrl(config["logo_url"] ?? "");
    }
  }, [config]);

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    setUploadingLogo(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const uploadUrl = await generateLogoUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json() as { storageId: Id<"_storage"> };
      await saveLogoStorageId({ storageId });
      await setConfig({ key: "logo_base64", value: base64 });
      toast.success("Logo actualizado — también se usará en los PDFs");
    } catch {
      toast.error("Error al subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const [savingCompany, setSavingCompany] = useState(false);
  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      await Promise.all([
        setConfig({ key: "company_name", value: companyName }),
        setConfig({ key: "company_rut", value: companyRut }),
        setConfig({ key: "company_address", value: companyAddress }),
        setConfig({ key: "company_phone", value: companyPhone }),
        setConfig({ key: "company_email", value: companyEmail }),
        setConfig({ key: "price_fina", value: priceFina }),
        setConfig({ key: "price_gruesa", value: priceGruesa }),
        setConfig({ key: "iva_rate", value: ivaRate }),
        setConfig({ key: "supplies_pct", value: suppliesPct }),
        setConfig({ key: "excessive_dirt_pct", value: excessiveDirtPct }),
      ]);
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!newUsername.trim() && !newPassword.trim()) {
      toast.error("Ingresa al menos un campo para cambiar");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingCreds(true);
    try {
      changeCredentials(
        newUsername.trim(),
        newPassword
      );
      toast.success("Credenciales actualizadas correctamente");
      setNewUsername("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Error al actualizar credenciales");
    } finally {
      setSavingCreds(false);
    }
  };

  // Expense categories
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<Id<"expenseCategories"> | null>(null);
  const [editCatName, setEditCatName] = useState("");

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await createCategory({ name: newCatName.trim(), order: (categories ?? []).length });
    setNewCatName("");
    toast.success("Categoría agregada");
  };

  // Service types
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("");
  const [editSvcId, setEditSvcId] = useState<Id<"serviceTypes"> | null>(null);
  const [editSvcName, setEditSvcName] = useState("");
  const [editSvcPrice, setEditSvcPrice] = useState("");

  const handleAddServiceType = async () => {
    if (!newSvcName.trim()) return;
    const price = newSvcPrice.trim() ? parseFloat(newSvcPrice) : undefined;
    await createServiceType({
      name: newSvcName.trim(),
      pricePerM2: price && !isNaN(price) ? price : undefined,
      order: (serviceTypesList ?? []).length,
    });
    setNewSvcName("");
    setNewSvcPrice("");
    toast.success("Servicio agregado");
  };

  return (<>
    <AppLayout title="Configuración">
      <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-3">

        {/* Logo upload */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold">Logo de empresa</p>
          <p className="text-[10px] text-muted-foreground">Se mostrará en las cotizaciones PDF</p>
          <div className="flex items-center gap-3">
            <div className="w-20 h-14 border border-border rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <ImageIcon size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                variant="secondary"
                className="w-full h-8 text-xs"
              >
                <Upload size={13} className="mr-1.5" />
                {uploadingLogo ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Subir logo"}
              </Button>
              {logoUrl && (
                <button
                  onClick={() => { void setConfig({ key: "logo_url", value: "" }); setLogoUrl(""); }}
                  className="w-full text-[10px] text-destructive hover:underline"
                >
                  Quitar logo
                </button>
              )}
              <p className="text-[10px] text-muted-foreground">PNG, JPG o SVG recomendado</p>
            </div>
          </div>
        </div>

        {/* Company data */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold">Datos de la empresa</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["Nombre empresa", companyName, setCompanyName],
              ["RUT", companyRut, setCompanyRut],
              ["Dirección", companyAddress, setCompanyAddress],
              ["Teléfono", companyPhone, setCompanyPhone],
              ["Email", companyEmail, setCompanyEmail],
            ] as [string, string, Dispatch<SetStateAction<string>>][]).map(([label, value, setter]) => (
              <div key={label} className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">{label}</label>
                <Input value={value} onChange={e => setter(e.target.value)} className="h-7 text-xs" />
              </div>
            ))}
          </div>

          <p className="text-xs font-bold pt-1">Precios y tasas por defecto</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Limpieza Fina ($/m²)</label>
              <Input type="number" value={priceFina} onChange={e => setPriceFina(e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Limpieza Gruesa ($/m²)</label>
              <Input type="number" value={priceGruesa} onChange={e => setPriceGruesa(e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-0.5 col-span-2">
              <label className="text-[10px] text-muted-foreground">Tasa IVA (%)</label>
              <Input type="number" value={ivaRate} onChange={e => setIvaRate(e.target.value)} placeholder="19" className="h-7 text-xs" />
              <p className="text-[9px] text-muted-foreground">Actualmente Chile: 19%. Cambia solo si la tasa cambia.</p>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Recargo insumos incluidos (%)</label>
              <Input type="number" value={suppliesPct} onChange={e => setSuppliesPct(e.target.value)} placeholder="15" className="h-7 text-xs" />
              <p className="text-[9px] text-muted-foreground">Se suma al subtotal cuando se marca ✓ Insumos incluidos</p>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Recargo suciedad excesiva (%)</label>
              <Input type="number" value={excessiveDirtPct} onChange={e => setExcessiveDirtPct(e.target.value)} placeholder="20" className="h-7 text-xs" />
              <p className="text-[9px] text-muted-foreground">Se suma al subtotal cuando se marca ✓ Suciedad excesiva</p>
            </div>
          </div>

          <Button onClick={handleSaveCompany} disabled={savingCompany} className="w-full h-8 text-xs">
            <Check size={12} className="mr-1" /> {savingCompany ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>

        {/* Service types */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold">Tipos de servicio</p>
          <p className="text-[10px] text-muted-foreground">Aparecen en el formulario de nueva cotización. El precio se auto-completa al seleccionar.</p>
          <div className="space-y-1">
            {(serviceTypesList ?? []).map(svc => (
              <div key={svc._id} className="flex items-center gap-1.5">
                {editSvcId === svc._id ? (
                  <>
                    <Input
                      value={editSvcName}
                      onChange={e => setEditSvcName(e.target.value)}
                      className="flex-1 h-6 text-xs"
                      placeholder="Nombre del servicio"
                      autoFocus
                    />
                    <Input
                      type="number"
                      value={editSvcPrice}
                      onChange={e => setEditSvcPrice(e.target.value)}
                      className="w-24 h-6 text-xs"
                      placeholder="$/m²"
                    />
                    <button
                      onClick={async () => {
                        const price = editSvcPrice.trim() ? parseFloat(editSvcPrice) : undefined;
                        await updateServiceType({
                          id: svc._id,
                          name: editSvcName,
                          pricePerM2: price && !isNaN(price) ? price : undefined,
                        });
                        setEditSvcId(null);
                        toast.success("Servicio actualizado");
                      }}
                      className="text-green-600 p-0.5 hover:bg-muted rounded"
                    >
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditSvcId(null)} className="p-0.5 hover:bg-muted rounded">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-xs">{svc.name}</span>
                    {svc.pricePerM2 != null && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ${svc.pricePerM2.toLocaleString("es-CL")}/m²
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setEditSvcId(svc._id);
                        setEditSvcName(svc.name);
                        setEditSvcPrice(svc.pricePerM2 != null ? String(svc.pricePerM2) : "");
                      }}
                      className="p-0.5 hover:bg-muted rounded"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => setDeleteSvcId(svc._id)}
                      className="p-0.5 hover:bg-muted rounded text-destructive"
                    >
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {(serviceTypesList ?? []).length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">
                Sin servicios — se usan los predeterminados (Limpieza Fina, Limpieza Gruesa).
              </p>
            )}
          </div>
          <div className="flex gap-1.5">
            <Input
              value={newSvcName}
              onChange={e => setNewSvcName(e.target.value)}
              placeholder="Nombre del servicio..."
              className="flex-1 h-7 text-xs"
              onKeyDown={e => e.key === "Enter" && handleAddServiceType()}
            />
            <Input
              type="number"
              value={newSvcPrice}
              onChange={e => setNewSvcPrice(e.target.value)}
              placeholder="$/m²"
              className="w-24 h-7 text-xs"
            />
            <button
              onClick={handleAddServiceType}
              className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs whitespace-nowrap shrink-0"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>
        </div>

        {/* Expense categories */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold">Categorías de gastos</p>
          <div className="space-y-1">
            {(categories ?? []).map(cat => (
              <div key={cat._id} className="flex items-center gap-1.5">
                {editCatId === cat._id ? (
                  <>
                    <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="flex-1 h-6 text-xs" autoFocus />
                    <button onClick={async () => { await updateCategory({ id: cat._id, name: editCatName }); setEditCatId(null); toast.success("Actualizada"); }} className="text-green-600"><Check size={13} /></button>
                    <button onClick={() => setEditCatId(null)}><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-xs">{cat.name}</span>
                    <button onClick={() => { setEditCatId(cat._id); setEditCatName(cat.name); }} className="p-0.5 hover:bg-muted rounded"><Pencil size={11} /></button>
                    <button onClick={() => setDeleteCatId(cat._id)} className="p-0.5 hover:bg-muted rounded text-destructive"><Trash2 size={11} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Nueva categoría..."
              className="flex-1 h-7 text-xs"
              onKeyDown={e => e.key === "Enter" && handleAddCategory()}
            />
            <button onClick={handleAddCategory} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
              <Plus size={12} /> Agregar
            </button>
          </div>
        </div>

        {/* Cambiar credenciales de acceso */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-bold flex items-center gap-1.5"><KeyRound size={13} /> Cambiar credenciales de acceso</p>
          <p className="text-[10px] text-muted-foreground">Deja en blanco los campos que no quieras cambiar.</p>
          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Nuevo usuario</label>
              <Input
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="Dejar en blanco para no cambiar"
                className="h-7 text-xs"
                autoComplete="username"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Nueva contraseña</label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Dejar en blanco para no cambiar"
                className="h-7 text-xs"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Confirmar contraseña</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="h-7 text-xs"
                autoComplete="new-password"
              />
            </div>
            <Button
              onClick={handleSaveCredentials}
              disabled={savingCreds}
              variant="secondary"
              className="w-full h-8 text-xs"
            >
              <Check size={12} className="mr-1" />
              {savingCreds ? "Guardando..." : "Actualizar credenciales"}
            </Button>
          </div>
        </div>


      </div>
      </div>
    </AppLayout>
      <DeleteConfirmDialog
        open={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={async () => { if (deleteCatId) { await removeCategory({ id: deleteCatId }); toast.success("Categoría eliminada"); } }}
        title="¿Eliminar categoría?"
        description="Se eliminará la categoría de gastos. Esta acción no se puede deshacer."
      />
      <DeleteConfirmDialog
        open={!!deleteSvcId}
        onClose={() => setDeleteSvcId(null)}
        onConfirm={async () => { if (deleteSvcId) { await removeServiceType({ id: deleteSvcId }); toast.success("Servicio eliminado"); } }}
        title="¿Eliminar servicio?"
        description="Se eliminará este tipo de servicio. Esta acción no se puede deshacer."
      />
  </>
  );
}

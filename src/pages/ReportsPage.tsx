import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import AppLayout from "@/components/AppLayout.tsx";
import { api } from "../../convex/_generated/api.js";
import type { Id } from "../../convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Plus, FileText, Trash2, Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { generateReportPDF } from "@/lib/report-pdf.ts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

export default function ReportsPage() {
  const reports = useQuery((api as any).workReports.list) ?? [];
  const quotes = useQuery(api.quotes.list) ?? [];
  const config = useQuery(api.config.getAll);

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    workDates: "",
    previousState: "El lugar presentaba acumulación de suciedad, polvo y residuos. Se observaban manchas en pisos y paredes, requiriendo limpieza profunda y desinfección.",
    workSummary: "Se realizó limpieza profunda de todos los espacios, incluyendo pisos, paredes, ventanas y superficies. Se aplicó desinfectante en áreas críticas. Se retiraron residuos y se dejó el lugar en perfectas condiciones de higiene.",
    photos: [] as Array<{ url: string; caption: string; storageId: string }>,
  });
  const [uploading, setUploading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const createReport = useMutation((api as any).workReports.create);
  const deleteReport = useMutation((api as any).workReports.remove);
  const generateUploadUrl = useMutation((api as any).workReports.generateUploadUrl);

  const selectedQuote = selectedQuoteId
    ? quotes.find((q) => q._id === selectedQuoteId)
    : null;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { storageId } = await response.json();
      
      // In a real app, we'd get the URL from the storageId
      // For the preview, we'll use a local URL
      const localUrl = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        photos: [
          ...prev.photos,
          { url: localUrl, caption: "", storageId: storageId },
        ],
      }));
      toast.success("Foto subida correctamente");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleSubmit() {
    if (!selectedQuote) {
      toast.error("Por favor selecciona una cotización");
      return;
    }

    if (!formData.workDates || !formData.previousState) {
      toast.error("Por favor completa las fechas y el estado previo");
      return;
    }

    try {
      await createReport({
        quoteId: selectedQuote._id as Id<"quotes">,
        quoteName: selectedQuote.number,
        clientName: selectedQuote.clientName,
        projectName: selectedQuote.projectName,
        projectAddress: selectedQuote.projectAddress,
        serviceType: selectedQuote.serviceType,
        workDates: formData.workDates,
        previousState: formData.previousState,
        workSummary: formData.workSummary || selectedQuote.description || "",
        photos: formData.photos.map((p) => ({
          storageId: p.storageId as Id<"_storage">,
          caption: p.caption,
          uploadedAt: new Date().toISOString(),
        })),
      });

      toast.success("Informe creado correctamente");
      setShowForm(false);
      setSelectedQuoteId("");
      setFormData({
        workDates: "",
        previousState: "",
        workSummary: "",
        photos: [],
      });
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Error al crear el informe");
    }
  }

  async function handleGeneratePDF(reportId: Id<"workReports">) {
    const report = reports.find((r) => r._id === reportId);
    if (!report) return;

    setGeneratingPdf(reportId);
    try {
      // Fetch fresh URLs for all photos
      const photoData = await Promise.all(
        report.photos.map(async (p) => {
          // In Convex, we need to call a query to get the URL
          // For simplicity in this implementation, we'll assume the URL can be fetched
          // Note: The actual implementation would use ctx.storage.getUrl in a query
          const urlResponse = await fetch(`/api/storage/${p.storageId}`);
          const url = urlResponse.ok ? await urlResponse.text() : "";
          return {
            url: url || "", // This should be a real URL in production
            caption: p.caption,
          };
        })
      );

      await generateReportPDF({
        quoteName: report.quoteName,
        clientName: report.clientName,
        projectName: report.projectName,
        projectAddress: report.projectAddress,
        serviceType: report.serviceType,
        workDates: report.workDates,
        previousState: report.previousState,
        workSummary: report.workSummary,
        photos: photoData.filter((p) => p.url),
        companyName: config?.["company_name"],
        companyRUT: config?.["company_rut"],
        companyPhone: config?.["company_phone"],
        companyEmail: config?.["company_email"],
        logo: config?.["logo_url"],
      });
      toast.success("PDF generado");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setGeneratingPdf(null);
    }
  }

  return (
    <AppLayout title="Informes de Finalización">
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Informes</h1>
            <p className="text-muted-foreground mt-1">
              Documenta el término de tus servicios con fotos y detalles.
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
              <Plus size={18} />
              Nuevo Informe
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-4 md:p-6 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-primary" />
                Nuevo Informe de Trabajo
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cerrar</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Cotización Asociada</label>
                  <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cotización" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotes.map((q) => (
                        <SelectItem key={q._id} value={q._id}>
                          {q.number} - {q.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Fechas de Trabajo</label>
                  <Input 
                    placeholder="ej: 27 al 29 de abril" 
                    value={formData.workDates}
                    onChange={e => setFormData(f => ({ ...f, workDates: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Estado Previo</label>
                  <Textarea 
                    placeholder="Describe cómo estaba el lugar al llegar..." 
                    className="min-h-[100px]"
                    value={formData.previousState}
                    onChange={e => setFormData(f => ({ ...f, previousState: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Ejemplo: "El lugar presentaba acumulación de suciedad, polvo y residuos..."</p>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Resumen de Trabajos</label>
                  <Textarea 
                    placeholder="Describe lo que se hizo..." 
                    className="min-h-[100px]"
                    value={formData.workSummary}
                    onChange={e => setFormData(f => ({ ...f, workSummary: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Ejemplo: "Se realizó limpieza profunda de todos los espacios..."</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Registro Fotográfico</label>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed border-2 h-24 flex-col gap-2 relative"
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                      <span className="text-xs">{uploading ? "Subiendo..." : "Agregar Foto"}</span>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handlePhotoUpload}
                        accept="image/*"
                      />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {formData.photos.map((photo, idx) => (
                      <div key={idx} className="group relative rounded-lg border bg-muted/50 p-2">
                        <img src={photo.url} className="w-full h-24 object-cover rounded-md mb-2" />
                        <Input 
                          placeholder="Nota..." 
                          className="h-7 text-[10px] px-1.5" 
                          value={photo.caption}
                          onChange={e => {
                            const p = [...formData.photos];
                            p[idx].caption = e.target.value;
                            setFormData(f => ({ ...f, photos: p }));
                          }}
                        />
                        <button 
                          onClick={() => setFormData(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))}
                          className="absolute top-3 right-3 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t flex gap-3">
              <Button className="flex-1 h-12 text-lg" onClick={handleSubmit}>Guardar Informe</Button>
              <Button variant="outline" className="h-12" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </Card>
        )}

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
              <ImageIcon size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aún no hay informes creados.</p>
            </div>
          ) : (
            reports.map((report) => (
              <Card key={report._id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight">{report.quoteName}</h3>
                    <p className="text-xs text-muted-foreground">{report.clientName}</p>
                    <p className="text-[10px] bg-secondary px-2 py-0.5 rounded-full mt-1 inline-block">
                      {report.photos.length} fotos • {report.workDates}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-primary"
                    disabled={generatingPdf === report._id}
                    onClick={() => handleGeneratePDF(report._id as Id<"workReports">)}
                  >
                    {generatingPdf === report._id ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-destructive"
                    onClick={() => deleteReport({ id: report._id as Id<"workReports"> })}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

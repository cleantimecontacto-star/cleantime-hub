import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Trash2, Download } from "lucide-react";
import { generateReportPDF } from "@/lib/report-pdf";

export default function ReportsPage() {
  const navigate = useNavigate();
  const reports = useQuery(api.workReports.list) ?? [];
  const quotes = useQuery(api.quotes.list) ?? [];
  const config = useQuery(api.config.getAll);

  const [selectedQuoteId, setSelectedQuoteId] = useState<Id<"quotes"> | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    workDates: "",
    previousState: "",
    workSummary: "",
    photos: [] as Array<{ url: string; caption: string }>,
  });
  const [uploading, setUploading] = useState(false);

  const createReport = useMutation(api.workReports.create);
  const deleteReport = useMutation(api.workReports.remove);
  const generateUploadUrl = useMutation(api.workReports.generateUploadUrl);
  const getPhotoUrl = useQuery(api.workReports.getPhotoUrl);

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

      if (response.ok) {
        const { storageId } = await response.json();
        const photoUrl = await getPhotoUrl({ storageId });

        setFormData((prev) => ({
          ...prev,
          photos: [
            ...prev.photos,
            { url: photoUrl || "", caption: "" },
          ],
        }));
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedQuote) return;

    try {
      await createReport({
        quoteId: selectedQuote._id,
        quoteName: selectedQuote.number,
        clientName: selectedQuote.clientName,
        projectName: selectedQuote.projectName,
        projectAddress: selectedQuote.projectAddress,
        serviceType: selectedQuote.serviceType,
        workDates: formData.workDates,
        previousState: formData.previousState,
        workSummary: formData.workSummary || selectedQuote.description || "",
        photos: formData.photos.map((p) => ({
          storageId: p.url as Id<"_storage">,
          caption: p.caption,
          uploadedAt: new Date().toISOString(),
        })),
      });

      setShowForm(false);
      setSelectedQuoteId(null);
      setFormData({
        workDates: "",
        previousState: "",
        workSummary: "",
        photos: [],
      });
    } catch (error) {
      console.error("Error creating report:", error);
    }
  }

  async function handleGeneratePDF(reportId: Id<"workReports">) {
    const report = reports.find((r) => r._id === reportId);
    if (!report) return;

    try {
      const photoUrls = await Promise.all(
        report.photos.map(async (p) => ({
          url: await getPhotoUrl({ storageId: p.storageId }),
          caption: p.caption,
        }))
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
        photos: photoUrls.filter((p) => p.url),
        companyName: config?.["company_name"],
        companyRUT: config?.["company_rut"],
        companyPhone: config?.["company_phone"],
        companyEmail: config?.["company_email"],
        logo: config?.["logo_url"],
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  }

  return (
    <AppLayout title="Informes de Finalización">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Informes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea informes de finalización de trabajos con fotos
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2"
            size="lg"
          >
            <Plus size={20} />
            Nuevo Informe
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-bold mb-4">Crear Nuevo Informe</h2>

            {/* Quote Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Seleccionar Cotización
              </label>
              <select
                value={selectedQuoteId || ""}
                onChange={(e) =>
                  setSelectedQuoteId(e.target.value as Id<"quotes">)
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="">-- Selecciona una cotización --</option>
                {quotes.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.number} - {q.clientName} ({q.projectName || "Sin proyecto"})
                  </option>
                ))}
              </select>
            </div>

            {selectedQuote && (
              <>
                {/* Work Dates */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Fechas de Trabajo
                  </label>
                  <input
                    type="text"
                    placeholder="ej: 27, 28 y 29 de abril"
                    value={formData.workDates}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workDates: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>

                {/* Previous State */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Estado Previo a los Trabajos
                  </label>
                  <textarea
                    placeholder="Describe el estado inicial del lugar..."
                    value={formData.previousState}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        previousState: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>

                {/* Work Summary */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Resumen de Trabajos Realizados
                  </label>
                  <textarea
                    placeholder="Describe los trabajos realizados..."
                    value={formData.workSummary}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workSummary: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    defaultValue={selectedQuote.description || ""}
                  />
                </div>

                {/* Photos */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Fotos del Trabajo ({formData.photos.length})
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90"
                  />

                  {/* Photo Previews */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {formData.photos.map((photo, idx) => (
                      <div key={idx} className="space-y-2">
                        <img
                          src={photo.url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-40 object-cover rounded-md border border-border"
                        />
                        <input
                          type="text"
                          placeholder="Descripción de la foto..."
                          value={photo.caption}
                          onChange={(e) => {
                            const newPhotos = [...formData.photos];
                            newPhotos[idx].caption = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              photos: newPhotos,
                            }));
                          }}
                          className="w-full px-2 py-1 text-sm border border-border rounded-md bg-background"
                        />
                        <button
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              photos: prev.photos.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="w-full px-2 py-1 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                  >
                    Guardar Informe
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {/* Reports List */}
        <div className="grid gap-4">
          {reports.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay informes creados aún. Crea uno nuevo para comenzar.
              </p>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report._id} className="p-4 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{report.quoteName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {report.clientName} - {report.projectName || "Sin proyecto"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fotos: {report.photos.length} | Fechas: {report.workDates}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGeneratePDF(report._id)}
                      className="p-2 hover:bg-primary/10 rounded-md transition-colors"
                      title="Descargar PDF"
                    >
                      <Download size={20} className="text-primary" />
                    </button>
                    <button
                      onClick={() => deleteReport({ id: report._id })}
                      className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={20} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

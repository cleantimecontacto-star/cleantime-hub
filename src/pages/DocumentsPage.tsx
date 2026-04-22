import { useState, useRef } from "react";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog.tsx";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import AppLayout from "@/components/AppLayout";
import {
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  Pencil,
  Check,
  X,
  FileText,
  FileImage,
  File,
} from "lucide-react";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <FileImage size={18} className="text-blue-400" />;
  if (fileType === "application/pdf") return <FileText size={18} className="text-red-400" />;
  return <File size={18} className="text-muted-foreground" />;
}

function DownloadButton({ storageId, name }: { storageId: Id<"_storage">; name: string }) {
  const url = useQuery(api.documents.getDownloadUrl, { storageId });
  if (!url) return (
    <button disabled className="p-1.5 text-muted-foreground opacity-40">
      <Download size={16} />
    </button>
  );
  return (
    <a
      href={url}
      download={name}
      target="_blank"
      rel="noopener noreferrer"
      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      title="Descargar"
    >
      <Download size={16} />
    </a>
  );
}

export default function DocumentsPage() {
  const categories = useQuery(api.documents.listCategories) ?? [];
  const [selectedCat, setSelectedCat] = useState<Id<"docCategories"> | null>(null);
  const docs = useQuery(api.documents.listDocuments, selectedCat ? { categoryId: selectedCat } : {}) ?? [];

  const addCategory = useMutation(api.documents.addCategory);
  const renameCategory = useMutation(api.documents.renameCategory);
  const deleteCategory = useMutation(api.documents.deleteCategory);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveDocument = useMutation(api.documents.saveDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<Id<"docCategories"> | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<Id<"docCategories"> | null>(null);
  const [uploadModal, setUploadModal] = useState<{ file: File; name: string; categoryId: Id<"docCategories"> | null } | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<{ id: Id<"documents">; name: string } | null>(null);

  async function handleAddCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const id = await addCategory({ name });
    setNewCatName("");
    setAddingCat(false);
    setSelectedCat(id as Id<"docCategories">);
  }

  async function handleRenameCategory() {
    if (!editingCatId || !editingCatName.trim()) return;
    await renameCategory({ id: editingCatId, name: editingCatName.trim() });
    setEditingCatId(null);
  }

  async function handleDeleteCategory(id: Id<"docCategories">) {
    setDeleteCatTarget(id);
  }
  async function confirmDeleteCategory() {
    if (!deleteCatTarget) return;
    if (selectedCat === deleteCatTarget) setSelectedCat(null);
    await deleteCategory({ id: deleteCatTarget });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadModal({ file: files[0], name: files[0].name, categoryId: selectedCat });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleConfirmUpload() {
    if (!uploadModal || !uploadModal.categoryId) return;
    setUploading(true);
    try {
      const { file, name, categoryId } = uploadModal;
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      await saveDocument({
        name: name.trim() || file.name,
        categoryId,
        storageId,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
      setUploadModal(null);
    } finally {
      setUploading(false);
    }
  }

  const activeCatName = categories.find((c) => c._id === selectedCat)?.name ?? "Todas las categorías";

  return (
    <AppLayout title="Documentos">
      <div className="flex h-full overflow-hidden">
        {/* Sidebar categorías — solo desktop */}
        <aside className="hidden md:flex md:w-48 md:shrink-0 border-r border-border bg-card flex-col overflow-y-auto">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categorías</span>
            <button
              onClick={() => setAddingCat(true)}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Nueva categoría"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* "Todos" */}
          <button
            onClick={() => setSelectedCat(null)}
            className={`flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
              selectedCat === null
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <FolderOpen size={16} />
            <span>Todas</span>
          </button>

          {categories.map((cat) => (
            <div key={cat._id} className="group relative">
              {editingCatId === cat._id ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    autoFocus
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameCategory();
                      if (e.key === "Escape") setEditingCatId(null);
                    }}
                    className="flex-1 text-sm bg-background border border-border rounded px-1 py-0.5 min-w-0"
                  />
                  <button onClick={handleRenameCategory} className="text-green-500 p-0.5"><Check size={13} /></button>
                  <button onClick={() => setEditingCatId(null)} className="text-muted-foreground p-0.5"><X size={13} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedCat(cat._id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    selectedCat === cat._id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <FolderOpen size={16} className="shrink-0" />
                  <span className="truncate flex-1">{cat.name}</span>
                  <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCatId(cat._id);
                        setEditingCatName(cat.name);
                      }}
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                      title="Renombrar"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCatTarget(cat._id);
                      }}
                      className="p-0.5 text-muted-foreground hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                </button>
              )}
            </div>
          ))}

          {/* Nueva categoría inline */}
          {addingCat && (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus
                placeholder="Nombre..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                  if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); }
                }}
                className="flex-1 text-sm bg-background border border-border rounded px-1 py-0.5 min-w-0"
              />
              <button onClick={handleAddCategory} className="text-green-500 p-0.5"><Check size={13} /></button>
              <button onClick={() => { setAddingCat(false); setNewCatName(""); }} className="text-muted-foreground p-0.5"><X size={13} /></button>
            </div>
          )}
        </aside>

        {/* Panel documentos */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filtro móvil — dropdown de categorías (solo mobile) */}
          <div className="md:hidden shrink-0 border-b border-border px-3 py-2">
            <select
              value={selectedCat ?? ""}
              onChange={(e) => setSelectedCat((e.target.value as Id<"docCategories">) || null)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            {/* Botón añadir categoría en móvil */}
            <button
              onClick={() => setAddingCat(true)}
              className="mt-1.5 flex items-center gap-1 text-xs text-primary font-medium"
            >
              <Plus size={13} /> Nueva categoría
            </button>
            {addingCat && (
              <div className="flex items-center gap-2 mt-1.5 border-t border-border pt-1.5">
                <input
                  autoFocus
                  placeholder="Nombre de categoría..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                    if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); }
                  }}
                  className="flex-1 text-sm bg-background border border-border rounded px-2 py-1.5 min-w-0"
                />
                <button onClick={handleAddCategory} className="text-green-500 p-1"><Check size={16} /></button>
                <button onClick={() => { setAddingCat(false); setNewCatName(""); }} className="text-muted-foreground p-1"><X size={16} /></button>
              </div>
            )}
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h2 className="font-semibold text-sm">{activeCatName}</h2>
            <button
              onClick={() => {
                if (!selectedCat) { return; }
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              title="Subir archivo"
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={14} />
              {uploading ? "Subiendo..." : "Subir archivo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* Lista documentos */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedCat && docs.length === 0 && !uploading && (
              <div className="text-center text-muted-foreground py-16 text-sm">
                <Upload size={40} className="mx-auto mb-3 opacity-30" />
                <p>No hay documentos en esta categoría</p>
                <p className="text-xs mt-1">Haz clic en "Subir archivo" para agregar</p>
              </div>
            )}
            {!selectedCat && docs.length === 0 && !uploading && (
              <div className="text-center text-muted-foreground py-16 text-sm">
                <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay documentos</p>
                <p className="text-xs mt-1 opacity-70">Selecciona una categoría y sube archivos</p>
              </div>
            )}
            <div className="space-y-2">
              {docs.map((doc) => {
                const catName = categories.find((c) => c._id === doc.categoryId)?.name;
                return (
                  <div
                    key={doc._id}
                    className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    {fileIcon(doc.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {!selectedCat && catName && <span className="mr-2 text-primary">{catName}</span>}
                        {formatSize(doc.fileSize)} · {doc.uploadedAt.slice(0, 10)}
                      </p>
                    </div>
                    <DownloadButton storageId={doc.storageId} name={doc.name} />
                    <button
                      onClick={() => setDeleteDocTarget({ id: doc._id, name: doc.name })}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Modal subida de archivo */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-5 flex flex-col gap-4">
            <h3 className="font-semibold text-base">Subir archivo</h3>
            <div className="text-xs text-muted-foreground bg-muted rounded px-3 py-2 truncate">{uploadModal.file.name}</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nombre del documento</label>
              <input
                autoFocus
                value={uploadModal.name}
                onChange={(e) => setUploadModal({ ...uploadModal, name: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                placeholder="Nombre del documento..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Crea una categoría primero usando el botón +</p>
              ) : (
                <select
                  value={uploadModal.categoryId ?? ""}
                  onChange={(e) => setUploadModal({ ...uploadModal, categoryId: e.target.value as Id<"docCategories"> || null })}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                >
                  <option value="">Selecciona una categoría...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setUploadModal(null)}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading || !uploadModal.categoryId}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Subiendo..." : "Subir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteCatTarget}
        onClose={() => setDeleteCatTarget(null)}
        onConfirm={confirmDeleteCategory}
        title="¿Eliminar categoría?"
        description="Se eliminarán todos los documentos dentro de esta categoría. Esta acción no se puede deshacer."
      />
      <DeleteConfirmDialog
        open={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={async () => { if (deleteDocTarget) await deleteDocument({ id: deleteDocTarget.id }); }}
        title="¿Eliminar documento?"
        description={`Se eliminará el archivo "${deleteDocTarget?.name ?? ""}". Esta acción no se puede deshacer.`}
      />
    </AppLayout>
  );
}

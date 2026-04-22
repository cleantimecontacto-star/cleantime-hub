import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  /** Si se pasa, el usuario debe escribir esta palabra para confirmar */
  requireWord?: string;
};

export function DeleteConfirmDialog({ open, onClose, onConfirm, title, description, requireWord }: Props) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = requireWord ? typed.trim().toUpperCase() === requireWord.toUpperCase() : true;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setTyped("");
      onClose();
    }
  };

  const handleClose = () => {
    setTyped("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="text-destructive" size={28} />
            </div>
            <DialogTitle className="text-center text-base">{title}</DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {requireWord && (
          <div className="space-y-1.5 px-1">
            <p className="text-xs text-muted-foreground text-center">
              Escribe <span className="font-bold text-destructive">{requireWord}</span> para confirmar
            </p>
            <Input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={requireWord}
              className="text-center text-sm font-mono tracking-widest"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="flex-1"
          >
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

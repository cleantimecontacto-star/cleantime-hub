import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  otNumber: string;
};

export function ApproveConfirmDialog({ open, onClose, onConfirm, otNumber }: Props) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={28} />
            </div>
            <DialogTitle className="text-center text-base">¿Cambiar estado a Aprobada?</DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              Ingresaste el N° OT <span className="font-semibold text-foreground">{otNumber}</span>.<br />
              ¿Deseas marcar esta cotización como <span className="font-semibold text-green-700">Aprobada</span>?
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            No, dejar igual
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Sí, aprobar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

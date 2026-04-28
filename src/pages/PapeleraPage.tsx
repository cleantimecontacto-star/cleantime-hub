import { useMutation } from "convex/react";
import { useQuery } from "@/hooks/use-cached-query";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout.tsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, Trash2, Inbox } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils.ts";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { Id } from "@/convex/_generated/dataModel";

type PapeleraTipo =
  | "cliente"
  | "proyecto"
  | "cotizacion"
  | "trabajador"
  | "trabajo"
  | "gasto"
  | "documento";

const TIPO_LABEL: Record<PapeleraTipo, string> = {
  cliente: "Cliente",
  proyecto: "Proyecto",
  cotizacion: "Cotización",
  trabajador: "Trabajador",
  trabajo: "Trabajo",
  gasto: "Gasto",
  documento: "Documento",
};

const TIPO_COLOR: Record<PapeleraTipo, string> = {
  cliente: "bg-blue-100 text-blue-800",
  proyecto: "bg-cyan-100 text-cyan-800",
  cotizacion: "bg-rose-100 text-rose-800",
  trabajador: "bg-purple-100 text-purple-800",
  trabajo: "bg-indigo-100 text-indigo-800",
  gasto: "bg-amber-100 text-amber-800",
  documento: "bg-green-100 text-green-800",
};

function formatFecha(ts: number): string {
  try {
    return new Date(ts).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

function parsePid(pid: string): { tipo: PapeleraTipo; id: string } {
  const idx = pid.indexOf(":");
  return {
    tipo: pid.slice(0, idx) as PapeleraTipo,
    id: pid.slice(idx + 1),
  };
}

export default function PapeleraPage() {
  // Cambiamos a la nueva función renombrada para forzar la actualización del servidor
  const items = useQuery(api.papelera.getDeletedItems);

  const restoreClient = useMutation(api.papelera.restoreClient);
  const restoreProject = useMutation(api.papelera.restoreProject);
  const restoreQuote = useMutation(api.papelera.restoreQuote);
  const restoreWorker = useMutation(api.papelera.restoreWorker);
  const restoreJob = useMutation(api.papelera.restoreJob);
  const restoreExpense = useMutation(api.papelera.restoreExpense);
  const restoreDocument = useMutation(api.papelera.restoreDocument);

  const purgeClient = useMutation(api.papelera.purgeClient);
  const purgeProject = useMutation(api.papelera.purgeProject);
  const purgeQuote = useMutation(api.papelera.purgeQuote);
  const purgeWorker = useMutation(api.papelera.purgeWorker);
  const purgeJob = useMutation(api.papelera.purgeJob);
  const purgeExpense = useMutation(api.papelera.purgeExpense);
  const purgeDocument = useMutation(api.papelera.purgeDocument);

  const empty = useMutation(api.papelera.empty);

  const handleRestaurar = async (pid: string, resumen: string) => {
    const { tipo, id } = parsePid(pid);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyId = id as any;
      switch (tipo) {
        case "cliente":
          await restoreClient({ id: anyId as Id<"clients"> });
          break;
        case "proyecto":
          await restoreProject({ id: anyId as Id<"projects"> });
          break;
        case "cotizacion":
          await restoreQuote({ id: anyId as Id<"quotes"> });
          break;
        case "trabajador":
          await restoreWorker({ id: anyId as Id<"workers"> });
          break;
        case "trabajo":
          await restoreJob({ id: anyId as Id<"workerJobs"> });
          break;
        case "gasto":
          await restoreExpense({ id: anyId as Id<"expenses"> });
          break;
        case "documento":
          await restoreDocument({ id: anyId as Id<"documents"> });
          break;
      }
      toast.success("Restaurado", { description: resumen });
    } catch (e) {
      toast.error("No se pudo restaurar");
      console.error(e);
    }
  };

  const handleEliminar = async (pid: string) => {
    const { tipo, id } = parsePid(pid);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyId = id as any;
      switch (tipo) {
        case "cliente":
          await purgeClient({ id: anyId as Id<"clients"> });
          break;
        case "proyecto":
          await purgeProject({ id: anyId as Id<"projects"> });
          break;
        case "cotizacion":
          await purgeQuote({ id: anyId as Id<"quotes"> });
          break;
        case "trabajador":
          await purgeWorker({ id: anyId as Id<"workers"> });
          break;
        case "trabajo":
          await purgeJob({ id: anyId as Id<"workerJobs"> });
          break;
        case "gasto":
          await purgeExpense({ id: anyId as Id<"expenses"> });
          break;
        case "documento":
          await purgeDocument({ id: anyId as Id<"documents"> });
          break;
      }
      toast.success("Eliminado definitivamente");
    } catch (e) {
      toast.error("No se pudo eliminar");
      console.error(e);
    }
  };

  const handleVaciar = async () => {
    try {
      await empty({});
      toast.success("Papelera vaciada");
    } catch (e) {
      toast.error("No se pudo vaciar la papelera");
      console.error(e);
    }
  };

  const list = items ?? [];

  return (
    <AppLayout title="Papelera">
      <div className="container mx-auto p-3 max-w-5xl space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Papelera de reciclaje
            </h2>
            <p className="text-xs text-muted-foreground">
              Restaura elementos eliminados o bórralos definitivamente.
            </p>
          </div>
          {list.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> Vaciar papelera
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Vaciar papelera?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminarán definitivamente los {list.length} elementos
                    de la papelera. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleVaciar}>
                    Vaciar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {items === undefined ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Cargando…
            </CardContent>
          </Card>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Inbox className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">La papelera está vacía</p>
              <p className="text-sm">
                Los elementos que elimines aparecerán aquí para que puedas
                restaurarlos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[70vh]">
                <ul className="divide-y">
                  {list.map((it: any) => (
                    <li
                      key={it.pid}
                      className="p-3 flex items-center gap-3 flex-wrap"
                    >
                      <Badge
                        variant="secondary"
                        className={cn(TIPO_COLOR[it.tipo as PapeleraTipo])}
                      >
                        {TIPO_LABEL[it.tipo as PapeleraTipo] || it.tipo}
                      </Badge>
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-medium break-words text-sm">
                          {it.resumen || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Eliminado el {formatFecha(it.fecha)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestaurar(it.pid, it.resumen)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar definitivamente?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {it.resumen} se eliminará para siempre. Esta
                                acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleEliminar(it.pid)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

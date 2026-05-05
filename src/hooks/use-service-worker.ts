import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useServiceWorker() {
  const toastShown = useRef(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const showUpdateToast = (waiting: ServiceWorker | null) => {
      // Si ya se mostró el toast o no hay worker esperando, no hacer nada
      if (toastShown.current || !waiting) return;
      
      toastShown.current = true;
      toast("✨ Nueva versión disponible", {
        description: "Actualizá para cargar la última versión.",
        duration: Infinity,
        action: {
          label: "Actualizar",
          onClick: () => {
            waiting.postMessage({ type: "SKIP_WAITING" });
          },
        },
        onDismiss: () => {
          // Permitir que se vuelva a mostrar si se cierra manualmente y hay un nuevo intento
          toastShown.current = false;
        },
        onAutoClose: () => {
          toastShown.current = false;
        }
      });
    };

    const handleControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // 1. Verificar si ya hay un worker esperando al cargar
        if (registration.waiting) {
          showUpdateToast(registration.waiting);
        }

        // 2. Escuchar por nuevos workers que se instalen
        const onUpdateFound = () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          const onStateChange = () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateToast(newWorker);
            }
          };

          newWorker.addEventListener("statechange", onStateChange);
        };

        registration.addEventListener("updatefound", onUpdateFound);
      })
      .catch((err) => console.log("Service Worker registration failed:", err));

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);
}

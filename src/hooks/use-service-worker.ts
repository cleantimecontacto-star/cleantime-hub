import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useServiceWorker() {
  const toastShown = useRef(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const showUpdateToast = (waiting: ServiceWorker | null) => {
      if (toastShown.current || !waiting) return;
      toastShown.current = true;
      toast("✨ Nueva versión disponible", {
        description: "Actualizá para cargar la última versión.",
        duration: Infinity,
        action: {
          label: "Actualizar",
          onClick: () => waiting.postMessage({ type: "SKIP_WAITING" }),
        },
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting) {
          showUpdateToast(registration.waiting);
          return;
        }
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateToast(registration.waiting ?? newWorker);
            }
          });
        });
      })
      .catch((err) => console.log("Service Worker registration failed:", err));
  }, []);
}

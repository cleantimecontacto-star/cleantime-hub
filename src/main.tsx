import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initSyncStatus } from "./lib/syncStatus.ts";

initSyncStatus();

createRoot(document.getElementById("root")!).render(<App />);

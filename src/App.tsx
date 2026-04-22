import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import QuoteForm from "./pages/QuoteForm.tsx";
import QuotesList from "./pages/QuotesList.tsx";
import ClientsPage from "./pages/ClientsPage.tsx";
import WorkersPage from "./pages/WorkersPage.tsx";
import ExpensesPage from "./pages/ExpensesPage.tsx";
import ExportPage from "./pages/ExportPage.tsx";
import ConfigPage from "./pages/ConfigPage.tsx";
import ChangeStatusPage from "./pages/ChangeStatusPage.tsx";
import DocumentsPage from "./pages/DocumentsPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import { useAuth } from "./auth/AuthContext.tsx";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";

// RRHH pages
import LiquidacionPage from "./pages/rrhh/LiquidacionPage.tsx";
import HistorialPage from "./pages/rrhh/HistorialPage.tsx";
import PatronalPage from "./pages/rrhh/PatronalPage.tsx";
import TrabajadoresRRHH from "./pages/rrhh/TrabajadoresPage.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Ruta raíz: muestra landing si no autenticado, dashboard si autenticado */
function HomeRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LandingPage />;
}

export default function App() {
  useServiceWorker();
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          {/* Pública - landing / dashboard según sesión */}
          <Route path="/" element={<HomeRoute />} />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Operaciones */}
          <Route path="/cotizaciones" element={<ProtectedRoute><QuotesList /></ProtectedRoute>} />
          <Route path="/cotizaciones/nueva" element={<ProtectedRoute><QuoteForm /></ProtectedRoute>} />
          <Route path="/cotizaciones/:id" element={<ProtectedRoute><QuoteForm /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
          <Route path="/trabajadores" element={<ProtectedRoute><WorkersPage /></ProtectedRoute>} />
          <Route path="/gastos" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
          <Route path="/exportar" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
          <Route path="/config" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
          <Route path="/cambio-estado" element={<ProtectedRoute><ChangeStatusPage /></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />

          {/* RRHH */}
          <Route path="/rrhh/liquidacion" element={<ProtectedRoute><LiquidacionPage /></ProtectedRoute>} />
          <Route path="/rrhh/historial" element={<ProtectedRoute><HistorialPage /></ProtectedRoute>} />
          <Route path="/rrhh/patronal" element={<ProtectedRoute><PatronalPage /></ProtectedRoute>} />
          <Route path="/rrhh/trabajadores" element={<ProtectedRoute><TrabajadoresRRHH /></ProtectedRoute>} />
          <Route path="/rrhh" element={<ProtectedRoute><Navigate to="/rrhh/liquidacion" replace /></ProtectedRoute>} />

          {/* Auth callback */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}

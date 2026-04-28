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
import PapeleraPage from "./pages/PapeleraPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import { useAuth } from "./auth/AuthContext.tsx";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";
import { ErrorBoundary } from "./ErrorBoundary.tsx";

// RRHH pages
import LiquidacionPage from "./pages/rrhh/LiquidacionPage.tsx";
import HistorialPage from "./pages/rrhh/HistorialPage.tsx";
import PatronalPage from "./pages/rrhh/PatronalPage.tsx";
import TrabajadoresRRHH from "./pages/rrhh/TrabajadoresPage.tsx";

function ProtectedRoute({ children, name }: { children: React.ReactNode; name: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <ErrorBoundary name={name}>
      {children}
    </ErrorBoundary>
  );
}

/** Ruta raíz: redirige al login si no autenticado, muestra dashboard si autenticado */
function HomeRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <ErrorBoundary name="Dashboard">
      <Dashboard />
    </ErrorBoundary>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  useServiceWorker();
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          {/* Raíz: dashboard si autenticado, login si no */}
          <Route path="/" element={<HomeRoute />} />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Operaciones */}
          <Route path="/cotizaciones" element={<ProtectedRoute name="Lista de Cotizaciones"><QuotesList /></ProtectedRoute>} />
          <Route path="/cotizaciones/nueva" element={<ProtectedRoute name="Formulario de Cotización"><QuoteForm /></ProtectedRoute>} />
          <Route path="/cotizaciones/:id" element={<ProtectedRoute name="Editar Cotización"><QuoteForm /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute name="Gestión de Clientes"><ClientsPage /></ProtectedRoute>} />
          <Route path="/trabajadores" element={<ProtectedRoute name="Gestión de Trabajadores"><WorkersPage /></ProtectedRoute>} />
          <Route path="/gastos" element={<ProtectedRoute name="Gestión de Gastos"><ExpensesPage /></ProtectedRoute>} />
          <Route path="/exportar" element={<ProtectedRoute name="Exportación de Datos"><ExportPage /></ProtectedRoute>} />
          <Route path="/config" element={<ProtectedRoute name="Configuración"><ConfigPage /></ProtectedRoute>} />
          <Route path="/cambio-estado" element={<ProtectedRoute name="Cambio de Estado"><ChangeStatusPage /></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute name="Documentos de Empresa"><DocumentsPage /></ProtectedRoute>} />
          <Route path="/papelera" element={<ProtectedRoute name="Papelera de Reciclaje"><PapeleraPage /></ProtectedRoute>} />

          {/* RRHH */}
          <Route path="/rrhh/liquidacion" element={<ProtectedRoute name="Liquidación de Sueldos"><LiquidacionPage /></ProtectedRoute>} />
          <Route path="/rrhh/historial" element={<ProtectedRoute name="Historial de RRHH"><HistorialPage /></ProtectedRoute>} />
          <Route path="/rrhh/patronal" element={<ProtectedRoute name="Aporte Patronal"><PatronalPage /></ProtectedRoute>} />
          <Route path="/rrhh/trabajadores" element={<ProtectedRoute name="Trabajadores RRHH"><TrabajadoresRRHH /></ProtectedRoute>} />
          <Route path="/rrhh" element={<ProtectedRoute name="RRHH"><Navigate to="/rrhh/liquidacion" replace /></ProtectedRoute>} />

          {/* Auth callback */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}

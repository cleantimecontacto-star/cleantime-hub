import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const config = useQuery(api.config.getAll);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem("ct_locked_until");
    return stored ? parseInt(stored) : null;
  });

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const [lockCountdown, setLockCountdown] = useState(0);

  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil! - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        localStorage.removeItem("ct_locked_until");
        clearInterval(interval);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    setLockCountdown(Math.ceil((lockedUntil! - Date.now()) / 1000));
    return () => clearInterval(interval);
  }, [isLocked, lockedUntil]);

  const logoBase64 = config?.["logo_base64"] ?? "";
  const logoUrl = config?.["logo_url"] ?? "";
  const companyName = config?.["company_name"] ?? "Cleantime";

  // Si ya hay sesión activa, ir directo al inicio
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400)); // delay para dificultar timing attacks
    const ok = login(username.trim(), password);
    if (ok) {
      setAttempts(0);
      localStorage.removeItem("ct_locked_until");
      navigate("/", { replace: true });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        const until = Date.now() + 5 * 60 * 1000; // bloqueo 5 minutos
        setLockedUntil(until);
        localStorage.setItem("ct_locked_until", String(until));
        setError("Demasiados intentos fallidos. Bloqueado por 5 minutos.");
      } else {
        setError(`Credenciales incorrectas. Intento ${newAttempts} de 5.`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6 border border-slate-200 dark:border-slate-700">

          {/* Logo / Nombre empresa */}
          <div className="flex flex-col items-center gap-2 mb-2">
            {(logoBase64 || logoUrl) ? (
              <img
                src={logoBase64 || logoUrl}
                alt="Logo"
                className="h-16 object-contain"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
              {companyName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Acceso privado
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Usuario
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                autoFocus
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isLocked && (
              <p className="text-sm text-red-500 text-center font-medium">
                Acceso bloqueado. Intenta de nuevo en {lockCountdown}s.
              </p>
            )}

            {error && !isLocked && (
              <p className="text-sm text-red-500 text-center font-medium">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || isLocked}
            >
              {loading ? "Verificando..." : isLocked ? `Bloqueado (${lockCountdown}s)` : "Ingresar"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Sesión activa por 30 días
        </p>
      </div>
    </div>
  );
}

// Format Chilean peso
export function formatCLP(amount: number): string {
  return "$" + Math.round(amount).toLocaleString("es-CL");
}

// Format date DD-MM-YYYY (parse directly to avoid UTC offset issues)
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

// Today as YYYY-MM-DD in local timezone
export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type QuoteStatus = "Pendiente" | "Aprobada" | "Rechazada" | "Facturada";

export const STATUS_COLORS: Record<QuoteStatus, string> = {
  Pendiente: "bg-yellow-500",
  Aprobada: "bg-green-500",
  Rechazada: "bg-red-500",
  Facturada: "bg-blue-600",
};

export const STATUS_TEXT_COLORS: Record<QuoteStatus, string> = {
  Pendiente: "text-yellow-600",
  Aprobada: "text-green-600",
  Rechazada: "text-red-600",
  Facturada: "text-blue-600",
};

export const STATUS_BADGE_COLORS: Record<QuoteStatus, string> = {
  Pendiente: "bg-yellow-100 text-yellow-700",
  Aprobada: "bg-green-100 text-green-700",
  Rechazada: "bg-red-100 text-red-700",
  Facturada: "bg-blue-100 text-blue-700",
};

export const QUOTE_STATUSES: QuoteStatus[] = ["Pendiente", "Aprobada", "Rechazada", "Facturada"];

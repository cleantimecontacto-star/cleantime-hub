import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import logoEmpresa from "../assets/logo-empresa.png?inline";

type Quote = Doc<"quotes">;
type Client = Doc<"clients">;

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

function fmtDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export async function generateQuotePDF(
  quote: Quote,
  client: Client | null,
  config: Record<string, string>
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const companyName = config["company_name"] ?? "Cleantime Spa";
  const companyAddress = config["company_address"] ?? "";
  const companyRut = config["company_rut"] ?? "";
  const companyPhone = config["company_phone"] ?? "";
  const companyEmail = config["company_email"] ?? "";

  const pageW = 210;
  const margin = 15;

  // Logo: prefer config logo_base64 (uploaded by user), fallback to build-time asset
  const logoSource = (config["logo_base64"] && config["logo_base64"].length > 100)
    ? config["logo_base64"]
    : logoEmpresa;
  try {
    const format = logoSource.startsWith("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(logoSource, format, margin, 10, 35, 18);
  } catch {
    // skip if fails
  }

  // "Cotizacion" title top-right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Cotización", pageW - margin, 18, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(quote.number, pageW - margin, 25, { align: "right" });

  // Status
  const statusColors: Record<string, [number, number, number]> = {
    Pendiente: [245, 158, 11],
    Aprobada: [34, 197, 94],
    Rechazada: [239, 68, 68],
    Facturada: [59, 130, 246],
  };
  const sc = statusColors[quote.status] ?? [150, 150, 150];
  doc.setFontSize(9);
  doc.setTextColor(sc[0], sc[1], sc[2]);
  doc.text(quote.status, pageW - margin, 31, { align: "right" });

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, 36, pageW - margin, 36);

  // Issuer / Client
  const col2X = pageW / 2 + 5;
  const y = 43;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Datos del emisor", margin, y);
  doc.text("Datos del cliente", col2X, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);

  const issuerLines = [companyName, companyAddress, "Chile", companyRut, companyPhone, companyEmail].filter(Boolean);
  const clientLines = [client?.name ?? quote.clientName, client?.address ?? "", client?.rut ?? "", client?.phone ?? "", client?.email ?? ""].filter(Boolean);

  issuerLines.forEach((line, i) => { doc.text(line, margin, y + 6 + i * 5); });
  clientLines.forEach((line, i) => { doc.text(line, col2X, y + 6 + i * 5); });

  // Date + Proyecto + N° OT
  const dateY = 95;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Fecha", pageW - margin - 30, dateY);
  doc.setFont("helvetica", "normal");
  doc.text(fmtDate(quote.date), pageW - margin, dateY, { align: "right" });

  // Proyecto y N° OT (lado izquierdo, bajo datos de cliente)
  let extraY = dateY;
  if (quote.projectName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Proyecto:", margin, extraY);
    doc.setFont("helvetica", "normal");
    doc.text(quote.projectName, margin + 20, extraY);
    extraY += 6;
  }
  if ((quote as any).projectAddress) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Dirección:", margin, extraY);
    doc.setFont("helvetica", "normal");
    doc.text((quote as any).projectAddress, margin + 22, extraY);
    extraY += 6;
  }
  if (quote.otNumber) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("N° OT:", margin, extraY);
    doc.setFont("helvetica", "normal");
    doc.text(quote.otNumber, margin + 16, extraY);
    extraY += 6;
  }
  if (quote.invoiceNumber) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("N° Factura:", margin, extraY);
    doc.setFont("helvetica", "normal");
    doc.text(quote.invoiceNumber, margin + 26, extraY);
  }

  // Table
  const description = quote.description ?? quote.serviceType;
  const unit = quote.unit ?? "M2";

  autoTable(doc, {
    startY: 102,
    margin: { left: margin, right: margin },
    head: [["Artículo", "Uds.", "Precio", "Impuestos", "Total"]],
    body: [
      [
        { content: `${quote.serviceType}\n${description}`, styles: { fontStyle: "bold" } },
        `${quote.squareMeters}\n${unit}`,
        fmt(quote.pricePerM2),
        "Iva (19%)",
        fmt(quote.total),
      ],
    ],
    foot: [
      [{ content: "", colSpan: 3 }, "Subtotal", fmt(quote.subtotal)],
      [{ content: "", colSpan: 3 }, "Iva (19%)", fmt(quote.iva)],
      [{ content: "", colSpan: 3 }, { content: "Total", styles: { fontStyle: "bold" } }, { content: fmt(quote.total), styles: { fontStyle: "bold" } }],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 100, 200], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    footStyles: { fontSize: 9, textColor: [50, 50, 50], fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: "right" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  // Terms
  const tableResult = doc as unknown as { lastAutoTable: { finalY: number } };
  const finalY = tableResult.lastAutoTable.finalY + 10;
  if (quote.terms) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text("Términos y condiciones", margin, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(quote.terms, margin, finalY + 6);
  }

  const ts = Date.now();
  doc.save(`${quote.number.replace("/", "_")}_${ts}.pdf`);
}

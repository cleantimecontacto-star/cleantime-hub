import jsPDF from "jspdf";

interface Photo {
  url: string;
  caption: string;
  storageId?: string;
}

interface ReportData {
  quoteName: string;
  clientName: string;
  projectName?: string;
  projectAddress?: string;
  serviceType: string;
  workDates: string;
  previousState: string;
  workSummary: string;
  photos: Photo[];
  companyName?: string;
  companyRUT?: string;
  companyPhone?: string;
  companyEmail?: string;
  logo?: string;
}

export async function generateReportPDF(data: ReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Color scheme
  const primaryColor = [33, 150, 243]; // Blue
  const textColor = [33, 33, 33]; // Dark gray

  // Helper function to add page if needed
  function checkPageBreak(spaceNeeded: number) {
    if (yPos + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  }

  // Helper to set text color
  function setTextColor(color: number[]) {
    doc.setTextColor(color[0], color[1], color[2]);
  }

  // 1. Header with logo and company info
  if (data.logo) {
    try {
      doc.addImage(data.logo, "PNG", margin, yPos, 30, 30);
    } catch (e) {
      // Logo failed
    }
  }

  setTextColor(primaryColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INFORME DE FINALIZACIÓN", margin + 35, yPos + 8);

  setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.companyName || ""}`, margin + 35, yPos + 16);
  if (data.companyRUT) doc.text(`RUT: ${data.companyRUT}`, margin + 35, yPos + 21);

  yPos += 40;

  // 2. Quote and Client Info
  checkPageBreak(20);
  setTextColor(primaryColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMACIÓN GENERAL", margin, yPos);

  yPos += 8;
  setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoLines = [
    `Cotización: ${data.quoteName}`,
    `Cliente: ${data.clientName}`,
    `Proyecto: ${data.projectName || "N/A"}`,
    `Dirección: ${data.projectAddress || "N/A"}`,
    `Tipo de Servicio: ${data.serviceType}`,
    `Fechas de Trabajo: ${data.workDates}`,
  ];

  infoLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });

  // 3. Previous State
  yPos += 5;
  checkPageBreak(30);
  setTextColor(primaryColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ESTADO PREVIO A LOS TRABAJOS", margin, yPos);

  yPos += 8;
  setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const prevStateLines = doc.splitTextToSize(data.previousState, contentWidth - 5);
  doc.text(prevStateLines, margin + 2, yPos);
  yPos += prevStateLines.length * 5 + 5;

  // 4. Work Summary
  checkPageBreak(30);
  setTextColor(primaryColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN DE TRABAJOS REALIZADOS", margin, yPos);

  yPos += 8;
  setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const workSummaryLines = doc.splitTextToSize(data.workSummary, contentWidth - 5);
  doc.text(workSummaryLines, margin + 2, yPos);
  yPos += workSummaryLines.length * 5 + 10;

  // 5. Photos (2 per row)
  if (data.photos && data.photos.length > 0) {
    const validPhotos = data.photos.filter((p) => p.url && p.url.trim());
    
    if (validPhotos.length > 0) {
      checkPageBreak(30);
      setTextColor(primaryColor);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("REGISTRO FOTOGRÁFICO", margin, yPos);

      yPos += 10;

      const photoWidth = (contentWidth - 5) / 2;
      const photoHeight = 60;

      for (let i = 0; i < validPhotos.length; i += 2) {
        checkPageBreak(photoHeight + 25);

        // First photo (left)
        const photo1 = validPhotos[i];
        try {
          if (photo1.url) {
            doc.addImage(photo1.url, "JPEG", margin, yPos, photoWidth - 2, photoHeight);
          }
        } catch (e) {
          doc.setDrawColor(200);
          doc.rect(margin, yPos, photoWidth - 2, photoHeight);
          doc.setFontSize(8);
          setTextColor([150, 150, 150]);
          doc.text("Foto no disponible", margin + 2, yPos + photoHeight / 2);
        }

        // Second photo (right) if exists
        if (i + 1 < validPhotos.length) {
          const photo2 = validPhotos[i + 1];
          try {
            if (photo2.url) {
              doc.addImage(photo2.url, "JPEG", margin + photoWidth + 2, yPos, photoWidth - 2, photoHeight);
            }
          } catch (e) {
            doc.setDrawColor(200);
            doc.rect(margin + photoWidth + 2, yPos, photoWidth - 2, photoHeight);
            doc.setFontSize(8);
            setTextColor([150, 150, 150]);
            doc.text("Foto no disponible", margin + photoWidth + 4, yPos + photoHeight / 2);
          }
        }

        yPos += photoHeight + 5;

        // Captions
        setTextColor(textColor);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");

        const caption1Lines = doc.splitTextToSize(photo1.caption, photoWidth - 3);
        doc.text(caption1Lines, margin + 1, yPos);

        if (i + 1 < validPhotos.length) {
          const photo2 = validPhotos[i + 1];
          const caption2Lines = doc.splitTextToSize(photo2.caption, photoWidth - 3);
          doc.text(caption2Lines, margin + photoWidth + 3, yPos);
        }

        const maxCaptionLines = Math.max(
          caption1Lines.length,
          i + 1 < validPhotos.length ? doc.splitTextToSize(validPhotos[i + 1].caption, photoWidth - 3).length : 0
        );
        
        yPos += maxCaptionLines * 3.5 + 5;
      }
    }
  }

  // 6. Footer
  setTextColor([150, 150, 150]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-CL")} a las ${new Date().toLocaleTimeString("es-CL")}`,
    margin,
    pageHeight - 10
  );

  // Save PDF
  doc.save(`Informe-${data.quoteName}.pdf`);
}

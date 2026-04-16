import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { getFeatureFlag } from "./flags";

interface PDFOptions {
  title: string;
  subtitle?: string;
  fileName: string;
  head: string[][];
  body: any[][];
  showSignature?: boolean;
}

/**
 * Centralized Enterprise PDF Generator
 * Handles multi-page layouts, branding, and dynamic page numbering.
 */
export function generatePDF({
  title,
  subtitle,
  fileName,
  head,
  body,
  showSignature = true
}: PDFOptions) {
  if (getFeatureFlag("DISABLE_PDF")) {
    console.warn("PDF generation is currently disabled via feature flag.");
    return;
  }

  const doc = new jsPDF() as any;
  const dateStr = format(new Date(), "PPP p");
  const secondaryColor = [153, 27, 27] as [number, number, number]; // Burgundy
  const mutedColor = [120, 120, 120] as [number, number, number];
  const blackColor = [0, 0, 0] as [number, number, number];

  // Global Page Event for footer and numbering
  const totalPagesExp = "{total_pages_count_string}";

  autoTable(doc, {
    startY: 50,
    head: head,
    body: body,
    headStyles: { fillColor: secondaryColor, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { top: 50, bottom: 20 },
    
    didParseCell: (data) => {
      // Check for custom highlighting flag on the row
      const rowRaw = data.row.raw as any;
      if (rowRaw && rowRaw._isHighlighted) {
        data.cell.styles.fillColor = secondaryColor;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        
        // If it's a category header, we might want it slightly larger
        if (data.column.index === 0) {
          data.cell.styles.fontSize = 9;
        }
      } else {
        // Automatically color code IN and OUT status everywhere
        const cellValue = data.cell.text[0];
        if (cellValue === "IN") {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald 500
          data.cell.styles.fontStyle = 'bold';
        } else if (cellValue === "OUT") {
          data.cell.styles.textColor = [220, 38, 38]; // Red 600
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    
    didDrawPage: (data) => {
      // Header on every page
      doc.setFontSize(22);
      doc.setTextColor(...secondaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("ROYAL KARAHI", 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(title, 14, 30);

      if (subtitle) {
        doc.setFontSize(9);
        doc.setTextColor(...mutedColor);
        doc.text(subtitle, 14, 38);
      }

      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.text(`Generated on: ${dateStr}`, 14, 44);

      // Footer - Page numbers
      let str = "Page " + doc.internal.getNumberOfPages();
      if (typeof doc.putTotalPages === "function") {
        str = str + " of " + totalPagesExp;
      }
      doc.setFontSize(9);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  // Final branding on the last page only
  if (showSignature) {
    const lastPage = doc.internal.getNumberOfPages();
    doc.setPage(lastPage);
    
    const pageSize = doc.internal.pageSize;
    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
    const centerX = pageWidth / 2;
    const bottomY = pageHeight - 10;
    
    const text1 = "(Designed and Manged by ";
    const text2 = "BABAR CHEEMA";
    const text3 = " )";
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    const width1 = doc.getTextWidth(text1);
    const width2 = doc.getTextWidth(text2);
    const width3 = doc.getTextWidth(text3);
    const totalWidth = width1 + width2 + width3;
    
    let startX = centerX - (totalWidth / 2);
    doc.setTextColor(...mutedColor);
    doc.text(text1, startX, bottomY);
    startX += width1;
    doc.setTextColor(...blackColor); // Bold Black
    doc.text(text2, startX, bottomY);
    startX += width2;
    doc.setTextColor(...mutedColor);
    doc.text(text3, startX, bottomY);
  }

  // Replace total pages placeholder
  if (typeof doc.putTotalPages === "function") {
    doc.putTotalPages(totalPagesExp);
  }

  doc.save(fileName);
}

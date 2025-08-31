// PDF generation utilities with @react-pdf/renderer implementation
import React from "react";

export interface PDFData {
  data: any[];
  selectedMonth: number | null;
  selectedYear: number | null;
}

export async function generateCashControlPDF({
  data,
  selectedMonth,
  selectedYear,
}: PDFData): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // Import PDF renderer and component dynamically
    const { pdf } = await import("@react-pdf/renderer");
    const { default: PDFCashControl } = await import("@/lib/pdf/pdf-cash-control");

    // Generate PDF
    const pdfElement = React.createElement(PDFCashControl, {
      data,
      selectedMonth,
      selectedYear,
    });
    
    console.log("PDF Element créé, génération du blob...");
    const blob = await pdf(pdfElement as React.ReactElement).toBlob();
    console.log("Blob généré avec succès, taille:", blob.size);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    const monthName = selectedMonth !== null ? monthNames[selectedMonth] : "Tous";
    const year = selectedYear || new Date().getFullYear();
    
    link.download = `Controle_Caisse_${monthName}_${year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log("PDF téléchargé avec succès");
  } catch (error) {
    console.error("Erreur détaillée lors de la génération du PDF:", error);
    
    // Ajouter plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    
    throw new Error(`Erreur PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export function formatCurrencyForPDF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function formatDateForPDF(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
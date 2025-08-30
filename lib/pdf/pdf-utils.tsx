import { StyleSheet } from "@react-pdf/renderer";

// Styles PDF réutilisables pour les rapports
export const pdfStyles = StyleSheet.create({
  // Page principale
  page: {
    border: "1px solid rgba(0, 0, 0, 0.3)",
  },

  // En-tête
  header: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Corps du document
  body: {
    margin: "auto",
    padding: 20,
    minWidth: 600,
    maxWidth: 600,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    gap: 30,
  },

  // Vue du corps avec bordure
  bodyView: {
    border: "1px solid rgba(0, 0, 0, 0.1)",
    borderColor: "rgba(1, 1, 1, 1)",
  },

  // En-tête du corps
  bodyHeader: {
    height: 30,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Dernière ligne avec fond
  lastRow: {
    backgroundColor: "rgba(1, 1, 1, 0.05)",
  },

  // Pied de page
  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  // Titre principal
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  // Sous-titre
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  // Texte normal
  text: {
    fontSize: 12,
    lineHeight: 1.5,
  },

  // Texte petit
  smallText: {
    fontSize: 10,
    color: "#666",
  },

  // Conteneur flex
  flexContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Cellule de tableau
  tableCell: {
    border: "1px solid #ccc",
    padding: 8,
    textAlign: "center",
  },

  // En-tête de tableau
  tableHeader: {
    backgroundColor: "#f5f5f5",
    fontWeight: "bold",
  },

  // Ligne de tableau
  tableRow: {
    display: "flex",
    flexDirection: "row",
  },

  // Conteneur de logo
  logoContainer: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
});

// Utilitaires pour les PDFs
export const pdfUtils = {
  // Formatage des dates
  formatDate: {
    ddmmyyyy: (dateStr: string): string => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${day}/${month}/${year}`;
    },

    mmddyyyy: (dateStr: string): string => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${month}/${day}/${year}`;
    },

    readable: (dateStr: string): string => {
      const d = new Date(dateStr);
      const monthNames = [
        "janvier",
        "février",
        "mars",
        "avril",
        "mai",
        "juin",
        "juillet",
        "août",
        "septembre",
        "octobre",
        "novembre",
        "décembre",
      ];
      return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    },
  },

  // Formatage des montants
  formatCurrency: (amount: number | string, currency = "€"): string => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return `0,00 ${currency}`;

    return (
      num.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ` ${currency}`
    );
  },

  // Noms des mois
  getMonthName: (month: number | null): string => {
    const months = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];

    if (month === null || month < 0 || month > 11) {
      return "Mois inconnu";
    }

    return months[month];
  },

  // Calculs pour les tableaux
  calculateTotal: (items: Array<{ value: number }>): number => {
    return items.reduce((sum, item) => sum + (item.value || 0), 0);
  },

  // Génération de titre de document
  generateDocumentTitle: (type: string, date: string, id?: string): string => {
    const formattedDate = pdfUtils.formatDate.ddmmyyyy(date);
    const idPart = id ? ` - ${id}` : "";
    return `${type} - ${formattedDate}${idPart}`;
  },

  // Traitement des taux de TVA
  processTaxRates: (taxData: any): Array<{ rate: string; amount: number }> => {
    if (!taxData || typeof taxData !== "object") return [];

    const rates = ["20", "10", "5.5", "0"];
    return rates
      .map((rate) => ({
        rate: `${rate}%`,
        amount: taxData[rate] || 0,
      }))
      .filter((item) => item.amount > 0);
  },

  // Validation des données avant génération PDF
  validatePDFData: (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data) {
      errors.push("Aucune donnée fournie");
      return { isValid: false, errors };
    }

    if (!data.date && !data.from) {
      errors.push("Date manquante");
    }

    if (data.items && !Array.isArray(data.items)) {
      errors.push("Les éléments doivent être un tableau");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Types utilitaires
export type DateFormat = "ddmmyyyy" | "mmddyyyy" | "readable";
export type PDFValidationResult = ReturnType<typeof pdfUtils.validatePDFData>;
export type TaxRateItem = { rate: string; amount: number };
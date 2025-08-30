"use client";

import { Image, Text, View } from "@react-pdf/renderer";
import { pdfStyles, pdfUtils } from "./pdf-utils";

// Props pour les composants PDF
export type PDFHeaderProps = {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  date?: string;
};

export type PDFFooterProps = {
  text: string;
  showDate?: boolean;
};

export type PDFTableProps = {
  headers: string[];
  data: any[][];
  totalsRow?: any[];
  columnWidths?: string[];
};

// En-tête PDF réutilisable
export function PDFHeader({ title, subtitle, logoUrl, date }: PDFHeaderProps) {
  return (
    <View style={pdfStyles.header}>
      {logoUrl && (
        <View style={pdfStyles.logoContainer}>
          <Image src={logoUrl} style={{ width: "100%", height: "100%" }} />
        </View>
      )}
      <Text style={pdfStyles.title}>{title}</Text>
      {subtitle && <Text style={pdfStyles.subtitle}>{subtitle}</Text>}
      {date && (
        <Text style={pdfStyles.smallText}>
          Généré le {pdfUtils.formatDate.readable(date)}
        </Text>
      )}
    </View>
  );
}

// Pied de page PDF
export function PDFFooter({ text, showDate = true }: PDFFooterProps) {
  return (
    <View style={pdfStyles.footer}>
      <Text style={pdfStyles.smallText}>
        {text}
        {showDate &&
          ` - ${pdfUtils.formatDate.readable(new Date().toISOString())}`}
      </Text>
    </View>
  );
}

// Tableau PDF réutilisable
export function PDFTable({
  headers,
  data,
  totalsRow,
  columnWidths,
}: PDFTableProps) {
  const defaultWidth = `${100 / headers.length}%`;

  return (
    <View style={pdfStyles.bodyView}>
      {/* En-tête du tableau */}
      <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
        {headers.map((header, index) => (
          <Text
            key={index}
            style={[
              pdfStyles.tableCell,
              { width: columnWidths?.[index] || defaultWidth },
            ]}
          >
            {header}
          </Text>
        ))}
      </View>

      {/* Lignes de données */}
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={pdfStyles.tableRow}>
          {row.map((cell, cellIndex) => (
            <Text
              key={cellIndex}
              style={[
                pdfStyles.tableCell,
                { width: columnWidths?.[cellIndex] || defaultWidth },
              ]}
            >
              {typeof cell === "number"
                ? pdfUtils.formatCurrency(cell)
                : String(cell)}
            </Text>
          ))}
        </View>
      ))}

      {/* Ligne de totaux */}
      {totalsRow && (
        <View style={[pdfStyles.tableRow, pdfStyles.lastRow]}>
          {totalsRow.map((total, index) => (
            <Text
              key={index}
              style={[
                pdfStyles.tableCell,
                {
                  width: columnWidths?.[index] || defaultWidth,
                  fontWeight: "bold",
                },
              ]}
            >
              {typeof total === "number"
                ? pdfUtils.formatCurrency(total)
                : String(total)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// Section d'informations générales
export function PDFInfoSection({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; value: string | number }>;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={pdfStyles.subtitle}>{title}</Text>
      {data.map((item, index) => (
        <View key={index} style={pdfStyles.flexContainer}>
          <Text style={pdfStyles.text}>{item.label}:</Text>
          <Text style={[pdfStyles.text, { fontWeight: "bold" }]}>
            {typeof item.value === "number"
              ? pdfUtils.formatCurrency(item.value)
              : item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Résumé financier
export function PDFFinancialSummary({
  totals,
}: {
  totals: Record<string, number>;
}) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={pdfStyles.subtitle}>Résumé Financier</Text>

      <View style={pdfStyles.flexContainer}>
        <Text style={pdfStyles.text}>Total TTC:</Text>
        <Text
          style={[pdfStyles.text, { fontWeight: "bold", color: "#059669" }]}
        >
          {pdfUtils.formatCurrency(totals.TTC || 0)}
        </Text>
      </View>

      <View style={pdfStyles.flexContainer}>
        <Text style={pdfStyles.text}>Total HT:</Text>
        <Text style={[pdfStyles.text, { fontWeight: "bold" }]}>
          {pdfUtils.formatCurrency(totals.HT || 0)}
        </Text>
      </View>

      <View style={pdfStyles.flexContainer}>
        <Text style={pdfStyles.text}>Total TVA:</Text>
        <Text style={[pdfStyles.text, { fontWeight: "bold" }]}>
          {pdfUtils.formatCurrency(totals.TVA || 0)}
        </Text>
      </View>
    </View>
  );
}
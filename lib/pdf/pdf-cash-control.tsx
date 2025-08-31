"use client";

import RowTabTurnover from "@/components/dashboard/pdf/row-tab-turnover";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";

const styles = StyleSheet.create({
  page: {
    border: "1px solid rgba(0, 0, 0, 0.3)",
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
  },
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
  bodyView: {
    border: "1px solid rgba(0, 0, 0, 0.1)",
    borderColor: "rgba(1, 1, 1, 1)",
  },
  bodyHeader: {
    height: 50, // Hauteur normale pour la première page
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)", // Bordure fine et gris très clair
  },

  // Style spécialisé pour les pages détaillées avec TVA multi-lignes
  tvaBodyHeader: {
    height: 120, // Hauteur raisonnable pour les détails TVA
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)", // Bordure fine et gris très clair
  },

  // Style spécialisé pour les pages détaillées avec moins de colonnes
  detailBodyHeader: {
    height: 80,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)", // Bordure fine et gris très clair
  },
  lastRow: {
    backgroundColor: "rgba(1, 1, 1, 0.05)",
  },

  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    borderTop: "1px solid #000",
  },
});

function getMonthName(month: number | null): string {
  const months = [
    "JANVIER",
    "FÉVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOÛT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DÉCEMBRE",
  ];
  return month !== null && month >= 0 && month < 12 ? months[month] : "";
}

function formatDateDDMMYY(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = String(d.getFullYear()).slice(-2); // Prendre les 2 derniers chiffres
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function formatDateDDMMYYYY(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function formatCurrencyOrEmpty(value: number): string {
  if (!value || value === 0) return "";
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function formatCurrencyOrSpace(value: number): string {
  if (!value || value === 0) return " "; // Espace pour préserver la cellule
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function formatTVADetails(
  data: { [key: string]: number } | undefined,
  prefix: string,
): string {
  if (!data) return " ";
  const rates = ["5,5", "10", "20"];
  const lines = rates.map((rate) => {
    const value = data?.[rate];
    if (!value || value === 0) return `${prefix} ${rate}% : 0,00 €`; // Espace pour préserver la ligne
    return `${prefix} ${rate}% : ${formatCurrencyOrSpace(value)}`;
  });

  return lines.join("\n"); // Retourne toujours 3 lignes (certaines peuvent être des espaces)
}

function formatB2BDetails(
  data: { label: string; value: number }[] | undefined,
): string {
  if (!data || !Array.isArray(data) || data.length === 0) return " ";

  const lines = data.map((item) => {
    if (!item.value || item.value === 0) return " ";
    return `${item.label || "Sans libellé"}: ${formatCurrencyOrEmpty(item.value)}`;
  });

  // Filtrer les lignes vides et s'assurer qu'on a au moins quelque chose
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");
  if (nonEmptyLines.length === 0) return " ";

  // S'assurer qu'on a au moins 3 lignes pour maintenir la cohérence
  while (nonEmptyLines.length < 3) {
    nonEmptyLines.push(" ");
  }

  return nonEmptyLines.join("\n");
}

function formatDepensesDetails(
  data: { label: string; value: number }[] | undefined,
): string {
  if (!data || !Array.isArray(data) || data.length === 0) return " ";

  const lines = data.map((item) => {
    if (!item.value || item.value === 0) return " ";
    return `${item.label || "Sans libellé"}: ${formatCurrencyOrEmpty(item.value)}`;
  });

  // Filtrer les lignes vides et s'assurer qu'on a au moins quelque chose
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");
  if (nonEmptyLines.length === 0) return " ";

  // S'assurer qu'on a au moins 3 lignes pour maintenir la cohérence
  while (nonEmptyLines.length < 3) {
    nonEmptyLines.push(" ");
  }

  return nonEmptyLines.join("\n");
}

type RowData = {
  _id: string;
  date: string;
  TTC: number;
  HT?: number;
  TVA?: number;
  "ca-ht"?: { [key: string]: number };
  "ca-tva"?: { [key: string]: number };
  "ca-ttc"?: { [key: string]: number };
  prestaB2B?: { label: string; value: number }[];
  depenses?: { label: string; value: number }[];
  cbClassique?: number | string;
  cbSansContact?: number | string;
  virement?: number | string;
  especes?: number | string;
  [key: string]: any;
};

interface PDFCashControlProps {
  data: RowData[];
  selectedMonth: number | null;
  selectedYear: number | null;
}

export default function PDFCashControl({
  data,
  selectedMonth,
  selectedYear,
}: PDFCashControlProps) {
  const columns = useMemo(
    () => [
      {
        // 0
        accessorKey: "libellé",
        header: "Libellé",
      },
      {
        // 1
        accessorKey: "montant",
        header: "Montant",
      },
      {
        // 2
        accessorKey: "TVA55",
        header: "Dont TVA 5,5%",
      },
      {
        // 3
        accessorKey: "TVA10",
        header: "Dont TVA 10%",
      },
      {
        // 4
        accessorKey: "TVA20",
        header: "Dont TVA 20%",
      },
      {
        // 5
        accessorKey: "total",
        header: "Total",
      },
      {
        // 6
        accessorKey: "date",
        header: "Date",
      },
      {
        // 7
        accessorKey: "TTC",
        header: "Total TTC",
      },
      {
        // 8
        accessorKey: "HT",
        header: "Total HT",
      },
      {
        // 9
        accessorKey: "TVA",
        header: "Taxe",
      },
      {
        // 10
        accessorKey: "prestaB2B",
        header: "Factures B2B",
      },
      {
        // 11
        accessorKey: "depenses",
        header: "Dépenses caisse",
      },
      {
        // 12
        accessorKey: "cbClassique",
        header: "Cb classique",
      },
      {
        // 13
        accessorKey: "cbSansContact",
        header: "Cb sans contact",
      },
      {
        // 14
        accessorKey: "virement",
        header: "Virement",
      },
      {
        // 15
        accessorKey: "especes",
        header: "Espèces",
      },
      // Add more columns as needed
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Document pageMode="fullScreen">
      <Page style={styles.page} size="A4">
        <View style={styles.header} fixed>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 5 }}>
            COWORKING PLATFORM
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Journal de bord
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "" }}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>
        <View style={styles.body} wrap={false}>
          <View>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", marginBottom: 20 }}
            >
              Récapitulatif du chiffre d'affaires
            </Text>
            <View style={styles.bodyView}>
              <View
                style={{
                  ...styles.bodyHeader,
                  borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(1, 1, 1, 0.05)",
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <RowTabTurnover
                    key={headerGroup.id}
                    firstCell={
                      typeof headerGroup.headers[0].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[0].column.columnDef.header(
                            headerGroup.headers[0].getContext(),
                          )
                        : headerGroup.headers[0].column.columnDef.header
                    }
                    secCell={
                      typeof headerGroup.headers[8].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[8].column.columnDef.header(
                            headerGroup.headers[8].getContext(),
                          )
                        : headerGroup.headers[8].column.columnDef.header
                    }
                    thirdCell={
                      typeof headerGroup.headers[9].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[9].column.columnDef.header(
                            headerGroup.headers[9].getContext(),
                          )
                        : headerGroup.headers[9].column.columnDef.header
                    }
                    fourthCell={
                      typeof headerGroup.headers[7].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[7].column.columnDef.header(
                            headerGroup.headers[7].getContext(),
                          )
                        : headerGroup.headers[7].column.columnDef.header
                    }
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "column",
                  fontSize: 10,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.slice(2, 6).map((header, idx) => (
                    <View
                      style={{
                        ...styles.bodyHeader,
                        ...(idx === 3 ? styles.lastRow : {}),
                      }}
                      key={header.id || idx}
                    >
                      <RowTabTurnover
                        firstCell={
                          typeof header.column.columnDef.header === "function"
                            ? header.column.columnDef.header(
                                header.getContext(),
                              )
                            : header.column.columnDef.header
                        }
                        secCell={data.reduce(
                          (
                            sum: number,
                            row: { [x: string]: { [x: string]: any } },
                          ) => {
                            return header.id === "total"
                              ? sum +
                                  Number(
                                    (row["ca-ht"]?.["5,5"] || 0) +
                                      (row["ca-ht"]?.["10"] || 0) +
                                      (row["ca-ht"]?.["20"] || 0),
                                  )
                              : sum +
                                  Number(
                                    row["ca-ht"]?.[
                                      header.id === "TVA55"
                                        ? "5,5"
                                        : header.id === "TVA10"
                                          ? "10"
                                          : "20"
                                    ] || 0,
                                  );
                          },
                          0,
                        )}
                        thirdCell={data.reduce(
                          (
                            sum: number,
                            row: { [x: string]: { [x: string]: any } },
                          ) => {
                            return header.id === "total"
                              ? sum +
                                  Number(
                                    (row["ca-tva"]?.["5,5"] || 0) +
                                      (row["ca-tva"]?.["10"] || 0) +
                                      (row["ca-tva"]?.["20"] || 0),
                                  )
                              : sum +
                                  Number(
                                    row["ca-tva"]?.[
                                      header.id === "TVA55"
                                        ? "5,5"
                                        : header.id === "TVA10"
                                          ? "10"
                                          : "20"
                                    ] || 0,
                                  );
                          },
                          0,
                        )}
                        fourthCell={data.reduce(
                          (
                            sum: number,
                            row: { [x: string]: { [x: string]: any } },
                          ) => {
                            return header.id === "total"
                              ? sum +
                                  Number(
                                    (row["ca-ttc"]?.["5,5"] || 0) +
                                      (row["ca-ttc"]?.["10"] || 0) +
                                      (row["ca-ttc"]?.["20"] || 0),
                                  )
                              : sum +
                                  Number(
                                    row["ca-ttc"]?.[
                                      header.id === "TVA55"
                                        ? "5,5"
                                        : header.id === "TVA10"
                                          ? "10"
                                          : "20"
                                    ] || 0,
                                  );
                          },
                          0,
                        )}
                      />
                    </View>
                  )),
                )}
              </View>
            </View>
          </View>
          <View>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", marginBottom: 20 }}
            >
              Récapitulatif des règlements factures B2B /dépenses caisses
            </Text>
            <View style={styles.bodyView}>
              <View
                style={{
                  ...styles.bodyHeader,
                  borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(1, 1, 1, 0.05)",
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <RowTabTurnover
                    key={headerGroup.id}
                    firstCell={
                      typeof headerGroup.headers[0].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[0].column.columnDef.header(
                            headerGroup.headers[0].getContext(),
                          )
                        : headerGroup.headers[0].column.columnDef.header
                    }
                    secCell={
                      typeof headerGroup.headers[1].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[1].column.columnDef.header(
                            headerGroup.headers[1].getContext(),
                          )
                        : headerGroup.headers[1].column.columnDef.header
                    }
                    thirdCell={""}
                    fourthCell={""}
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "column",
                  fontSize: 10,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.slice(10, 12).map((header, idx) => (
                    <View style={styles.bodyHeader} key={header.id || idx}>
                      <RowTabTurnover
                        firstCell={
                          typeof header.column.columnDef.header === "function"
                            ? header.column.columnDef.header(
                                header.getContext(),
                              )
                            : header.column.columnDef.header
                        }
                        secCell={
                          data.reduce(
                            (
                              acc: { [x: string]: any },
                              row: { [x: string]: any },
                            ) => {
                              if (Array.isArray(row[header.id])) {
                                acc[header.id] += row[header.id].reduce(
                                  (s: number, p: any) =>
                                    s + (Number(p.value) || 0),
                                  0,
                                );
                              } else {
                                acc[header.id] += row[header.id] || 0;
                              }

                              return acc;
                            },
                            { [header.id]: 0 },
                          )[header.id]
                        }
                        thirdCell={""}
                        fourthCell={""}
                      />
                    </View>
                  )),
                )}
              </View>
            </View>
          </View>
          <View>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", marginBottom: 20 }}
            >
              Récapitulatif des modes de paiement
            </Text>
            <View style={styles.bodyView}>
              <View
                style={{
                  ...styles.bodyHeader,
                  borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(1, 1, 1, 0.05)",
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <RowTabTurnover
                    key={headerGroup.id}
                    firstCell={
                      typeof headerGroup.headers[0].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[0].column.columnDef.header(
                            headerGroup.headers[0].getContext(),
                          )
                        : headerGroup.headers[0].column.columnDef.header
                    }
                    secCell={
                      typeof headerGroup.headers[1].column.columnDef
                        .header === "function"
                        ? headerGroup.headers[1].column.columnDef.header(
                            headerGroup.headers[1].getContext(),
                          )
                        : headerGroup.headers[1].column.columnDef.header
                    }
                    thirdCell={""}
                    fourthCell={""}
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "column",
                  fontSize: 10,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.slice(12, 16).map((header, idx) => (
                    <View style={styles.bodyHeader} key={header.id || idx}>
                      <RowTabTurnover
                        firstCell={
                          typeof header.column.columnDef.header === "function"
                            ? header.column.columnDef.header(
                                header.getContext(),
                              )
                            : header.column.columnDef.header
                        }
                        secCell={
                          data.reduce(
                            (
                              acc: { [x: string]: any },
                              row: { [x: string]: any },
                            ) => {
                              if (Array.isArray(row[header.id])) {
                                acc[header.id] += row[header.id].reduce(
                                  (s: number, p: any) =>
                                    s + (Number(p.value) || 0),
                                  0,
                                );
                              } else {
                                acc[header.id] += row[header.id] || 0;
                              }

                              return acc;
                            },
                            { [header.id]: 0 },
                          )[header.id]
                        }
                        thirdCell={""}
                        fourthCell={""}
                      />
                    </View>
                  )),
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={styles.footer} fixed>
          <Text style={{ fontSize: 10 }}>
            Page 1/5 - Généré le: {new Date().toLocaleDateString()} à{" "}
            {new Date().toLocaleTimeString()} par Coworking Platform
          </Text>
        </View>
      </Page>

      {/* Page 2: Récapitulatif journalier - CA et TVA (Partie 1 - 15 premières lignes) */}
      <Page style={styles.page} size="A4">
        <View style={{ ...styles.header, height: 80 }} fixed>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
            Récapitulatif journalier - Chiffre d'affaires et TVA (1/2)
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "" }}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>

        <View style={styles.body} wrap={false}>
          <View>
            <View style={styles.bodyView}>
              <View
                style={{
                  ...styles.detailBodyHeader,
                  borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(3, 1, 1, 0.05)",
                  height: 60,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <RowTabTurnover
                    key={headerGroup.id}
                    firstCell="Date"
                    secCell="Total TTC"
                    thirdCell="Total HT"
                    fourthCell="Détail HT par taux"
                    fifthCell="Détail TVA par taux"
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "column",
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >
                {table.getRowModel().rows.length > 0 ? (
                  table
                    .getRowModel()
                    .rows.slice(0, 15)
                    .map((row) => (
                      <View
                        style={{
                          ...styles.tvaBodyHeader,
                        }}
                        key={row.id}
                      >
                        <RowTabTurnover
                          firstCell={
                            formatDateDDMMYY(row.getValue("date")) || "N/A"
                          }
                          secCell={row.getValue("TTC") || " "}
                          thirdCell={row.getValue("HT") || " "}
                          fourthCell={formatTVADetails(
                            row.original["ca-ht"],
                            "HT",
                          )}
                          fifthCell={formatTVADetails(
                            row.original["ca-tva"],
                            "TVA",
                          )}
                        />
                      </View>
                    ))
                ) : (
                  <Text>Aucune donnée disponible</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ fontSize: 10 }}>
            Page 2/5 - Généré le: {new Date().toLocaleDateString()} à{" "}
            {new Date().toLocaleTimeString()} par Coworking Platform
          </Text>
        </View>
      </Page>

      {/* Page 3: Récapitulatif journalier - CA et TVA (Partie 2 - lignes 16+) */}
      <Page style={styles.page} size="A4">
        <View style={{ ...styles.header, height: 80 }} fixed>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
            Récapitulatif journalier - Chiffre d'affaires et TVA (2/2)
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "" }}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>

        <View style={styles.body} wrap={false}>
          <View>
            <View style={styles.bodyView}>
              <View
                style={{
                  ...styles.detailBodyHeader,
                  borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(3, 1, 1, 0.05)",
                  height: 60,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <RowTabTurnover
                    key={headerGroup.id}
                    firstCell="Date"
                    secCell="Total TTC"
                    thirdCell="Total HT"
                    fourthCell="Détail HT par taux"
                    fifthCell="Détail TVA par taux"
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "column",
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >
                {table.getRowModel().rows.length > 15 ? (
                  table
                    .getRowModel()
                    .rows.slice(15)
                    .map((row) => (
                      <View
                        style={{
                          ...styles.tvaBodyHeader,
                        }}
                        key={row.id}
                      >
                        <RowTabTurnover
                          firstCell={
                            formatDateDDMMYY(row.getValue("date")) || "N/A"
                          }
                          secCell={row.getValue("TTC") || " "}
                          thirdCell={row.getValue("HT") || " "}
                          fourthCell={formatTVADetails(
                            row.original["ca-ht"],
                            "HT",
                          )}
                          fifthCell={formatTVADetails(
                            row.original["ca-tva"],
                            "TVA",
                          )}
                        />
                      </View>
                    ))
                ) : (
                  <Text>Aucune donnée supplémentaire disponible</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ fontSize: 10 }}>
            Page 3/5 - Généré le: {new Date().toLocaleDateString()} à{" "}
            {new Date().toLocaleTimeString()} par Coworking Platform
          </Text>
        </View>
      </Page>

      {/* Page 4: Récapitulatif journalier - Factures B2B et Dépenses */}
      <Page style={styles.page} size="A4">
        <View style={{ ...styles.header, height: 100 }} fixed>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
            Récapitulatif journalier - Factures B2B et Dépenses
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "" }}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>

        <View style={styles.body} wrap={false}>
          <View>
            <View style={styles.bodyView}>
              <View
                style={{
                  ...styles.detailBodyHeader,
                  borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(3, 1, 1, 0.05)",
                  height: 60,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <RowTabTurnover
                    key={headerGroup.id}
                    firstCell="Date"
                    secCell="Total TTC"
                    thirdCell="Détail B2B"
                    fourthCell="Détail Dépenses"
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "column",
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <View
                      style={{
                        ...styles.tvaBodyHeader,
                      }}
                      key={row.id}
                    >
                      <RowTabTurnover
                        firstCell={
                          formatDateDDMMYY(row.getValue("date")) || "N/A"
                        }
                        secCell={row.getValue("TTC") || " "}
                        thirdCell={formatB2BDetails(row.original.prestaB2B)}
                        fourthCell={formatDepensesDetails(
                          row.original.depenses,
                        )}
                      />
                    </View>
                  ))
                ) : (
                  <Text>Aucune donnée disponible</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ fontSize: 10 }}>
            Page 4/5 - Généré le: {new Date().toLocaleDateString()} à{" "}
            {new Date().toLocaleTimeString()} par Coworking Platform
          </Text>
        </View>
      </Page>

      {/* Page 5: Récapitulatif journalier - Modes de paiement */}
      <Page style={styles.page} size="A4">
        <View style={{ ...styles.header, height: 100 }} fixed>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
            Récapitulatif journalier - Modes de paiement
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "" }}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>

        <View style={styles.body} wrap={false}>
          <View>
            <View style={styles.bodyView}>
              <View
                style={{
                  ...styles.detailBodyHeader,
                  borderBottom: "0.5px solid rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(3, 1, 1, 0.05)",
                  height: 60,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <RowTabTurnover
                    key={headerGroup.id}
                    firstCell="Date"
                    secCell="CB Classique"
                    thirdCell="CB Sans contact"
                    fourthCell="Virement"
                    fifthCell="Espèces"
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "column",
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <View
                      style={{
                        ...styles.detailBodyHeader,
                      }}
                      key={row.id}
                    >
                      <RowTabTurnover
                        firstCell={
                          formatDateDDMMYY(row.getValue("date")) || "N/A"
                        }
                        secCell={formatCurrencyOrSpace(
                          Number(row.getValue("cbClassique")),
                        )}
                        thirdCell={formatCurrencyOrSpace(
                          Number(row.getValue("cbSansContact")),
                        )}
                        fourthCell={formatCurrencyOrSpace(
                          Number(row.getValue("virement")),
                        )}
                        fifthCell={formatCurrencyOrSpace(
                          Number(row.getValue("especes")),
                        )}
                      />
                    </View>
                  ))
                ) : (
                  <Text>Aucune donnée disponible</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ fontSize: 10 }}>
            Page 5/5 - Généré le: {new Date().toLocaleDateString()} à{" "}
            {new Date().toLocaleTimeString()} par Coworking Platform
          </Text>
        </View>
      </Page>
    </Document>
  );
}
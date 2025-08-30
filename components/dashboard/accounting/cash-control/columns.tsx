"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

export type Payment = {
  _id: string;
  id: number;
  date: string;
  TTC: number;
  HT: number;
  TVA: number;
  "ca-ht": number | { 20: number; 10: number; "5,5": number; 0: number };
  "ca-tva": number | { 20: number; 10: number; "5,5": number; 0: number };
  prestaB2B: Array<{ label: string; value: number }>;
  depenses: Array<{ label: string; value: number }>;
  virement: number;
  cbClassique: number;
  cbSansContact: number;
  especes: number;
  total: number;
};

const AmountFormatter = new Intl.NumberFormat("fr", {
  style: "currency",
  currency: "eur",
});

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.date;
      if (!date) return "";
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return <div className="text-center">{`${day}-${month}-${year}`}</div>;
    },
  },
  {
    accessorKey: "TTC",
    header: "Total TTC",
    cell: ({ row }) => {
      const ttc = row.original.TTC;
      if (ttc === null || ttc === undefined || isNaN(ttc)) return "";
      return <div className="text-center">{AmountFormatter.format(ttc)}</div>;
    },
  },
  {
    accessorKey: "prestaB2B",
    header: "Presta B2B",
    cell: ({ row }) => {
      const prestaB2B = row.original.prestaB2B;
      if (Array.isArray(prestaB2B) && prestaB2B.length > 0) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.2rem",
            }}
          >
            {prestaB2B
              .filter(
                (d: any) =>
                  d.label && d.value !== undefined && d.value !== null,
              )
              .map((d: any, idx: number) => (
                <div className="flex min-w-24 gap-1" key={idx}>
                  <span
                    style={{
                      minWidth: 50,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    {d.label} :
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {AmountFormatter.format(d.value)}
                  </span>
                </div>
              ))}
          </div>
        );
      }
      return prestaB2B === null || prestaB2B === undefined ? "" : prestaB2B;
    },
  },

  {
    accessorKey: "depenses",
    header: "Dépenses",
    cell: ({ row }) => {
      const depenses = row.original.depenses;
      if (Array.isArray(depenses) && depenses.length > 0) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.2rem",
            }}
          >
            {depenses
              .filter(
                (d: any) =>
                  d.label && d.value !== undefined && d.value !== null,
              )
              .map((d: any, idx: number) => (
                <div className="flex min-w-24 gap-1" key={idx}>
                  <span
                    style={{
                      minWidth: 50,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    {d.label} :
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {AmountFormatter.format(d.value)}
                  </span>
                </div>
              ))}
          </div>
        );
      }
      return depenses === null || depenses === undefined ? "" : depenses;
    },
  },

  {
    accessorKey: "virement",
    header: "Virement",
    cell: ({ row }) => {
      const virement = row.original.virement;

      return virement === null || virement === undefined || virement === 0 ? (
        ""
      ) : (
        <div className="text-center">{AmountFormatter.format(virement)}</div>
      );
    },
  },
  {
    accessorKey: "cbClassique",
    header: "CB classique",
    cell: ({ row }) => {
      const cbClassique = row.original.cbClassique;

      return cbClassique === null ||
        cbClassique === undefined ||
        cbClassique === 0 ? (
        ""
      ) : (
        <div className="text-center">{AmountFormatter.format(cbClassique)}</div>
      );
    },
  },
  {
    accessorKey: "cbSansContact",
    header: "CB sans contact",
    cell: ({ row }) => {
      const cbSansContact = row.original.cbSansContact;
      if (
        cbSansContact === null ||
        cbSansContact === undefined ||
        isNaN(cbSansContact) ||
        cbSansContact === 0
      )
        return "";
      return (
        <div className="text-center">
          {AmountFormatter.format(cbSansContact)}
        </div>
      );
    },
  },

  {
    accessorKey: "especes",
    header: "Espèces",
    cell: ({ row }) => {
      const especes = row.original.especes;
      if (
        especes === null ||
        especes === undefined ||
        isNaN(especes) ||
        especes === 0
      )
        return "";
      return (
        <div className="text-center">{AmountFormatter.format(especes)}</div>
      );
    },
  },
  {
    accessorKey: "difference",
    header: "Différence",
    cell: ({ row }) => {
      const ttc = Number(row.original.TTC) * 100 || 0;
      const depenses = row.original.depenses || 0;
      const prestaB2B = row.original.prestaB2B || 0;
      const especes = Number(row.original.especes) * 100 || 0;
      const virement = Number(row.original.virement) * 100 || 0;
      const cbSansContact = Number(row.original.cbSansContact) * 100 || 0;
      const cbClassique = Number(row.original.cbClassique) * 100 || 0;

      let totalDepenses = 0;
      if (Array.isArray(depenses)) {
        totalDepenses = depenses.reduce(
          (acc, d) => acc + (Number(d.value) * 100 || 0),
          0,
        );
      } else if (!isNaN(depenses)) {
        totalDepenses = Number(depenses) * 100 || 0;
      }

      let totalPrestaB2B = 0;
      if (Array.isArray(prestaB2B)) {
        totalPrestaB2B = prestaB2B.reduce(
          (acc, d) => acc + (Number(d.value) * 100 || 0),
          0,
        );
      } else if (!isNaN(prestaB2B)) {
        totalPrestaB2B = Number(prestaB2B) * 100 || 0;
      }

      const totalSaisie =
        totalDepenses +
        especes +
        cbSansContact +
        cbClassique +
        virement -
        totalPrestaB2B;
      if (isNaN(totalSaisie)) return "";

      const difference = totalSaisie - ttc;
      if (isNaN(difference)) return "";

      if (Math.abs(difference) <= 1e-6 || Math.abs(totalSaisie) <= 1e-6) {
        return "";
      }

      return (
        <div
          className={`text-center font-bold ${difference < 0 ? "text-red-600" : "text-green-600"}`}
        >
          {AmountFormatter.format(difference / 100)}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    accessorFn: (row) => row._id,
    cell: (cell: any) => {
      const { row, openForm, onDelete } = cell;
      const handleOpenFormWithDate = () => {
        if (typeof openForm === "function") {
          openForm({ ...row.original, date: row.original.date });
        }
      };
      const isEmpty =
        (!row.original.especes || row.original.especes === 0) &&
        (!row.original.depenses || row.original.prestaB2B.length === 0) &&
        (!row.original.depenses || row.original.depenses.length === 0) &&
        (!row.original.cbClassique || row.original.cbClassique === 0) &&
        (!row.original.cbSansContact || row.original.cbSansContact === 0);
      if (isEmpty) {
        return (
          <div className="text-center">
            <Button
              onClick={handleOpenFormWithDate}
              variant="outline"
              className="border-green-400 text-green-600 hover:bg-green-50"
            >
              Saisir
            </Button>
          </div>
        );
      }
      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleOpenFormWithDate}>
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete && onDelete(row.original)}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
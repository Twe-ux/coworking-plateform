"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { FormCashControl } from "./form-cash-control";

interface DataTableProps<TData, TValue> {
  columns: any;
  data: TData[];
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  formStatus: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingRow: any;
  onDelete?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  form,
  setForm,
  formStatus,
  onSubmit,
  onDelete,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [open, setOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<any | null>(null);

  const handleOpenForm = (row: any) => {
    setSelectedRow(row);
    let dateStr = row.date || new Date().toISOString().slice(0, 10);
    if (isNaN(new Date(dateStr).getTime())) {
      dateStr = new Date().toISOString().slice(0, 10);
    }

    const formId = row._id ? row._id : "";

    setForm((prev: any) => ({
      ...prev,
      _id: formId,
      date: dateStr,
      prestaB2B:
        Array.isArray(row.prestaB2B) && row.prestaB2B.length > 0
          ? row.prestaB2B
          : [{ label: "", value: "" }],
      depenses:
        Array.isArray(row.depenses) && row.depenses.length > 0
          ? row.depenses
          : [{ label: "", value: "" }],
      virement: row.virement ?? "",
      especes: row.especes ?? "",
      cbClassique: row.cbClassique ?? "",
      cbSansContact: row.cbSansContact ?? "",
    }));
    setOpen(true);
  };

  const handleDeleteRow = (row: any) => {
    const deleteId = row._id || row.date;
    if (!deleteId) {
      alert("Impossible de supprimer : identifiant manquant");
      return;
    }
    if (onDelete) onDelete({ ...row, _id: deleteId });
  };

  React.useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("cash-modal-close", close);
    return () => window.removeEventListener("cash-modal-close", close);
  }, []);

  function formatDateDDMMYYYY(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  }

  const totals = React.useMemo(() => {
    return data.reduce(
      (acc, row: any) => {
        acc.TTC += Number(row.TTC) || 0;
        acc.HT += Number(row.HT) || 0;
        acc.TVA += Number(row.TVA) || 0;
        if (Array.isArray(row.prestaB2B)) {
          acc.prestaB2B += row.prestaB2B.reduce(
            (s: number, p: any) => s + (Number(p.value) || 0),
            0,
          );
        } else {
          acc.prestaB2B += row.prestaB2B || 0;
        }
        if (Array.isArray(row.depenses)) {
          acc.depenses += row.depenses.reduce(
            (s: number, d: any) => s + (Number(d.value) || 0),
            0,
          );
        } else {
          acc.depenses += row.depenses || 0;
        }
        acc.virement += Number(row.virement) || 0;
        acc.cbClassique += Number(row.cbClassique) || 0;
        acc.cbSansContact += Number(row.cbSansContact) || 0;
        acc.especes += Number(row.especes) || 0;
        const ttc = Number(acc.TTC) * 100 || 0;
        const add =
          (Number(acc.depenses) * 100 || 0) +
          (Number(acc.virement) * 100 || 0) +
          (Number(acc.cbClassique) * 100 || 0) +
          (Number(acc.cbSansContact) * 100 || 0) +
          (Number(acc.especes) * 100 || 0) -
          (Number(acc.prestaB2B) * 100 || 0);
        const difference = Math.round(add) - Math.round(ttc);
        acc.difference = difference / 100 || 0;

        return acc;
      },
      {
        TTC: 0,
        HT: 0,
        TVA: 0,
        prestaB2B: 0,
        depenses: 0,
        cbClassique: 0,
        cbSansContact: 0,
        virement: 0,
        especes: 0,
        difference: 0,
      },
    );
  }, [data]);

  return (
    <div
      className="rounded-md border-2"
      style={{ height: "84dvh", display: "flex", flexDirection: "column" }}
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>
            {selectedRow?._id ? "Modifier" : "Ajouter"} les données
            {selectedRow?.date
              ? ` du ${formatDateDDMMYYYY(selectedRow.date)}  `
              : ""}
          </DialogTitle>
          <FormCashControl
            form={form}
            setForm={setForm}
            formStatus={formStatus}
            onSubmit={onSubmit}
            editingRow={selectedRow}
          />
        </DialogContent>
      </Dialog>
      <div
        className="bg-gray-200"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Table
          className="bg-white"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <TableHeader
            className="bg-gray-200"
            style={{ position: "sticky", top: 0, zIndex: 2 }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                style={{
                  display: "table",
                  width: "100%",
                  tableLayout: "fixed",
                }}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className="text-center"
                      key={header.id}
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            style={{
              display: "block",
              overflowY: "auto",
              maxHeight: "calc(100% - 50px)",
              minHeight: 0,
              width: "100%",
            }}
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const r = row.original as any;
                let totalDepenses = 0;
                if (Array.isArray(r.depenses)) {
                  totalDepenses = r.depenses.reduce(
                    (acc: number, d: any) => acc + (Number(d.value) * 100 || 0),
                    0,
                  );
                } else if (!isNaN(r.depenses)) {
                  totalDepenses = Number(r.depenses) * 100 || 0;
                }
                let totalPrestaB2B = 0;
                if (Array.isArray(r.prestaB2B)) {
                  totalPrestaB2B = r.prestaB2B.reduce(
                    (acc: number, d: any) => acc + (Number(d.value) * 100 || 0),
                    0,
                  );
                } else if (!isNaN(r.prestaB2B)) {
                  totalPrestaB2B = Number(r.prestaB2B) * 100 || 0;
                }
                const virement = Number(r.virement) * 100 || 0;
                const especes = Number(r.especes) * 100 || 0;
                const cbSansContact = Number(r.cbSansContact) * 100 || 0;
                const cbClassique = Number(r.cbClassique) * 100 || 0;

                const totalSaisie =
                  Math.round(totalDepenses) +
                  Math.round(virement) +
                  Math.round(especes) +
                  Math.round(cbSansContact) +
                  Math.round(cbClassique) -
                  Math.round(totalPrestaB2B);

                const ttc = Number(r.TTC) * 100 || 0;
                const bgColor =
                  Math.round(ttc) === Math.round(totalSaisie) &&
                  Math.round(ttc) !== 0
                    ? "#d1fae5" // vert clair
                    : Math.round(ttc) !== 0 && Math.round(totalSaisie) !== 0
                      ? "#fee2e2" // rouge clair
                      : undefined;

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    style={{
                      display: "table",
                      width: "100%",
                      tableLayout: "fixed",
                      background: bgColor,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cell.column.id === "actions"
                          ? flexRender(cell.column.columnDef.cell, {
                              ...cell.getContext(),
                              openForm: (rowData: any) =>
                                handleOpenForm(rowData),
                              onDelete: (rowData: any) =>
                                handleDeleteRow(rowData),
                            })
                          : flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow
                style={{
                  display: "table",
                  width: "100%",
                  height: "100%",
                  tableLayout: "fixed",
                }}
              >
                <TableCell
                  colSpan={columns.length}
                  className="h-[90dvh] text-center"
                >
                  Chargement des données...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <tfoot
            className="bg-gray-200"
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 2,
            }}
          >
            <TableRow
              className="font-semibold"
              style={{ display: "table", width: "100%", tableLayout: "fixed" }}
            >
              {table.getAllLeafColumns().map((col, idx) => {
                switch (col.id) {
                  case "date":
                    return (
                      <TableCell key={col.id} className="text-center">
                        Total
                      </TableCell>
                    );
                  case "TTC":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.TTC.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "HT":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.HT.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "TVA":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.TVA.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "prestaB2B":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.prestaB2B.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "depenses":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.depenses.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "virement":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.virement.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "cbClassique":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.cbClassique.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "cbSansContact":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.cbSansContact.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "especes":
                    return (
                      <TableCell key={col.id} className="text-center">
                        {totals.especes.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  case "difference":
                    return totals.difference === 0 ? (
                      <TableCell
                        key={col.id}
                        className="text-center font-bold text-gray-800"
                      >
                        {totals.difference.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    ) : totals.difference < 0 ? (
                      <TableCell
                        key={col.id}
                        className="text-center font-bold text-red-600"
                      >
                        {totals.difference.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    ) : (
                      <TableCell
                        key={col.id}
                        className="text-center font-bold text-green-600"
                      >
                        {totals.difference.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    );
                  default:
                    return (
                      <TableCell
                        key={col.id}
                        className="text-center"
                      ></TableCell>
                    );
                }
              })}
            </TableRow>
          </tfoot>
        </Table>
      </div>
    </div>
  );
}
"use client"

import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

/** Export an array of flat objects to an .xlsx file. */
export function exportToExcel<T extends Record<string, unknown>>(
  rows: T[],
  fileName: string,
  sheetName = "Sheet1"
) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

/** Export an array of flat objects to a .csv file. */
export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  fileName: string
) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  triggerDownload(blob, `${fileName}.csv`)
}

/** Export tabular data to a PDF using the given column headers. */
export function exportToPdf(
  headers: string[],
  rows: (string | number)[][],
  fileName: string,
  title: string
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text(title, 40, 40)
  autoTable(doc, {
    startY: 56,
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 58, 138] },
    margin: { left: 40, right: 40 },
  })
  doc.save(`${fileName}.pdf`)
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

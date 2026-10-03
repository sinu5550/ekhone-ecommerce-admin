"use client";

import React, { useState } from "react";
import { Download, Printer, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function ExportButtons({
    data = [],
    fileName = "accounting-report",
    sheetName = "Report",
    columns = [],
    onCustomPrint,
    onExportPdf,
    showPdf = false,
    pdfButtonText = "Download PDF",
    showPrint = true,
    showExcel = true,
}) {
    const [exporting, setExporting] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);

    const handleExportExcel = () => {
        try {
            setExporting(true);
            if (!data || data.length === 0) {
                toast.error("No data available to export");
                return;
            }

            let exportData = data;
            if (columns.length > 0) {
                exportData = data.map((row) => {
                    const mapped = {};
                    columns.forEach((col) => {
                        mapped[col.label || col.key] =
                            typeof col.accessor === "function"
                                ? col.accessor(row)
                                : row[col.key] ?? "";
                    });
                    return mapped;
                });
            }

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);

            const timestamp = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `${fileName}-${timestamp}.xlsx`);
            toast.success("Excel downloaded successfully!");
        } catch (error) {
            console.error("Export Excel error:", error);
            toast.error("Failed to export Excel file");
        } finally {
            setExporting(false);
        }
    };

    const handleExportPdf = async () => {
        if (!onExportPdf) return;
        try {
            setExportingPdf(true);
            await onExportPdf();
            toast.success("PDF generated successfully!");
        } catch (error) {
            console.error("Export PDF error:", error);
            toast.error("Failed to export PDF file");
        } finally {
            setExportingPdf(false);
        }
    };

    const handlePrint = () => {
        if (onCustomPrint) {
            onCustomPrint();
        } else {
            window.print();
        }
    };

    return (
        <div className="flex items-center gap-2">
            {showPdf && onExportPdf && (
                <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer transition-all duration-200 shadow-xs hover:shadow disabled:opacity-50"
                >
                    {exportingPdf ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <Download size={14} />
                            {pdfButtonText}
                        </>
                    )}
                </button>
            )}

            {showExcel && (
                <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-secound hover:bg-secound text-secound hover:text-white rounded text-xs font-medium cursor-pointer transition-all duration-300 hover:shadow-xs disabled:opacity-50"
                >
                    {exporting ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download size={14} />
                            Export Excel
                        </>
                    )}
                </button>
            )}

            {showPrint && (
                <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-xs font-medium cursor-pointer transition-all duration-200"
                >
                    <Printer size={14} />
                    Print
                </button>
            )}
        </div>
    );
}

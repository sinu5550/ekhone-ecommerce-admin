"use client";

import { useState } from "react";
import { CheckCircle2, Printer, FileText, Plus, X, ArrowRight, Loader2 } from "lucide-react";
import { clientPDFGenerator, getInvoiceNumber } from "@/lib/invoicePDF";
import toast from "react-hot-toast";

const POSReceiptModal = ({
    isOpen,
    order,
    onClose,
    onNewSale,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen || !order) return null;

    const invoiceNumber = getInvoiceNumber(order);

    const handleDownload = async (format = "pos") => {
        setIsGenerating(true);
        const toastId = toast.loading(format === "pos" ? "Generating POS Receipt..." : "Generating Invoice...");
        try {
            let pdfBlob;
            let fileName = "";
            if (format === "pos") {
                pdfBlob = await clientPDFGenerator.generatePOSReceipt(order);
                fileName = `POS-Receipt-${invoiceNumber}.pdf`;
            } else {
                pdfBlob = await clientPDFGenerator.generateInvoice(order);
                fileName = `Invoice-${invoiceNumber}.pdf`;
            }

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Downloaded successfully", { id: toastId });
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF receipt", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden flex flex-col">
                {/* Success Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 p-1 rounded text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>

                    <div className="w-16 h-16 bg-white/20 rounded flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <CheckCircle2 size={38} className="text-white stroke-[2.5]" />
                    </div>

                    <h2 className="text-xl font-extrabold tracking-tight">Sale Completed!</h2>
                    <p className="text-xs text-white/90 mt-1">
                        Order <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded">{order.orderNumber || invoiceNumber}</span>
                    </p>
                </div>

                {/* Receipt Details Summary */}
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded p-4 border border-gray-200/70 space-y-2.5 text-xs">
                        <div className="flex justify-between text-gray-500">
                            <span>Customer:</span>
                            <span className="font-bold text-gray-900">
                                {order.customer?.fullName || "Walk-in Customer"}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Date & Time:</span>
                            <span className="font-medium text-gray-800">
                                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Payment Method:</span>
                            <span className="font-semibold text-gray-800 uppercase">
                                {order.paymentMethod || "Cash"}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Items Count:</span>
                            <span className="font-semibold text-gray-800">
                                {order.items?.length || 0} product(s)
                            </span>
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                            <span className="font-bold text-gray-700">Total Paid:</span>
                            <span className="text-base font-extrabold text-secound">
                                ৳{(parseFloat(order.paidAmount) || parseFloat(order.grandTotal) || 0).toLocaleString()}
                            </span>
                        </div>

                        {parseFloat(order.dueAmount) > 0 && (
                            <div className="flex justify-between text-amber-700 font-bold">
                                <span>Due Balance:</span>
                                <span>৳{parseFloat(order.dueAmount).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Print Actions */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={() => handleDownload("pos")}
                            disabled={isGenerating}
                            className="py-2.5 px-3 rounded border border-secound text-secound hover:bg-secound/10 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                            <span>POS Slip</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDownload("invoice")}
                            disabled={isGenerating}
                            className="py-2.5 px-3 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <FileText size={15} />
                            <span>Full Invoice</span>
                        </button>
                    </div>

                    {/* Next Sale Button */}
                    <button
                        type="button"
                        onClick={onNewSale}
                        className="w-full py-3 px-4 bg-secound hover:bg-secound-hover text-white font-bold text-sm rounded shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Start Next Sale</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSReceiptModal;
